import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import type { UserProfile } from "@/lib/types"
import { APP_CONFIG, getAdminEmails, isAdminEmail } from "@/lib/config"
import { getClientIP, checkServerRateLimit } from "@/lib/server-auth"

// SMTP configuration
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587")
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SMTP_FROM_EMAIL = APP_CONFIG.EMAIL_FROM_ADDRESS
const SMTP_FROM_NAME = APP_CONFIG.EMAIL_FROM_NAME

interface BroadcastRequest {
    subject: string
    body: string
    adminEmail: string
    userIds?: string[] // Optional: if provided, only send to these users
    customEmails?: string[] // Optional: external email addresses not in the system
}

// Replace placeholders in text
function replacePlaceholders(text: any, user: UserProfile): string {
    const str = typeof text === 'string' ? text : String(text);
    return str
        .replace(/\[Name\]/gi, user.name || "User")
        .replace(/\[Email\]/gi, user.email || "")
        .replace(/\[Points\]/gi, String(user.points || 0))
        .replace(/\[Level\]/gi, String(user.level || 1));
}



// Generate HTML email template
function generateBroadcastHTML(subject: string, body: string): string {
    // Basic markdown-like handling for newlines
    const formattedBody = body
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      color: #18181b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f4f5;
      padding: 40px 0;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 12px;
      border: 1px solid #e4e4e7;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #09090b 0%, #27272a 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .header span {
      color: #3b82f6;
    }
    .content {
      padding: 40px;
    }
    .subject {
      color: #09090b;
      margin: 0 0 24px 0;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: -0.025em;
    }
    .body-text {
      color: #3f3f46;
      font-size: 16px;
      line-height: 1.6;
      margin: 0;
    }
    .body-text p {
      margin-top: 0;
      margin-bottom: 16px;
    }
    .cta-container {
      padding: 0 40px 40px 40px;
      text-align: left;
    }
    .button {
      display: inline-block;
      background-color: #09090b;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
    }
    .footer {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px 20px;
      text-align: center;
      color: #71717a;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer a {
      color: #52525b;
      text-decoration: underline;
    }
    @media screen and (max-width: 600px) {
      .main { border-radius: 0; border: none; }
      .wrapper { padding: 0; }
      .content, .header, .cta-container { padding: 30px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" cellpadding="0" cellspacing="0" align="center">
      <!-- Header -->
      <tr>
        <td class="header">
          <h1>Campus<span>Hub</span></h1>
        </td>
      </tr>
      
      <!-- Content -->
      <tr>
        <td class="content">
          <h2 class="subject">${subject}</h2>
          <div class="body-text">
            <p>${formattedBody}</p>
          </div>
        </td>
      </tr>
      
      <!-- CTA -->
      <tr>
        <td class="cta-container">
          <a href="https://campushub.pro" class="button">
            Open CampusHub &rarr;
          </a>
        </td>
      </tr>
    </table>
    
    <!-- Footer -->
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} CampusHub. The ultimate campus operating system.</p>
      <p>You received this email because you are a registered user of CampusHub.</p>
      <p>
        <a href="https://campushub.pro">Visit Platform</a> &nbsp;&bull;&nbsp; 
        <a href="mailto:admin@campushub.pro">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

// Send single email
async function sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
        console.error("SMTP not configured")
        return false
    }

    try {
        const nodemailer = await import("nodemailer")
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASSWORD,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
        })

        await transporter.sendMail({
            from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
            to,
            subject,
            html: htmlBody,
        })

        return true
    } catch (error: any) {
        console.error(`Failed to send email to ${to}:`, error.message)
        return false
    }
}

// Send broadcast
export async function POST(request: NextRequest) {
    try {
        // Rate limit - allow only 10 broadcasts per hour
        const clientIp = getClientIP(request)
        const rateLimitCheck = await checkServerRateLimit(clientIp, "UPLOAD", 60 * 60 * 1000)

        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            )
        }

        const body: BroadcastRequest = await request.json()
        const { subject, body: messageBody, adminEmail, userIds, customEmails } = body
        console.log("Broadcast request received from:", adminEmail)

        // Validate admin - check centralized config OR check Firestore for admin role
        let isAdmin = false

        if (adminEmail) {
            const normalizedEmail = adminEmail.toLowerCase().trim()

            // Check centralized config list first
            if (isAdminEmail(normalizedEmail)) {
                console.log("Admin found in config list")
                isAdmin = true
            } else {
                console.log("Checking Firestore (Admin SDK) for role...")
                // Check Firestore for admin role using Admin SDK (bypasses rules)
                try {
                    const usersRef = adminDb.collection("users")
                    const query = usersRef.where("email", "==", normalizedEmail).limit(1)
                    const userSnap = await query.get()

                    if (!userSnap.empty) {
                        const userData = userSnap.docs[0].data()
                        if (userData.role === "admin") {
                            console.log("Admin role confirmed in Firestore")
                            isAdmin = true
                        } else {
                            console.log("User found but role is:", userData.role)
                        }
                    } else {
                        console.log("User not found in Firestore")
                    }
                } catch (e: unknown) {
                    console.error("Error checking Firestore admin status:", e)
                }
            }
        }

        if (!isAdmin) {
            console.log("Admin check failed for email:", adminEmail)
            return NextResponse.json(
                { error: `Unauthorized. Email '${adminEmail}' is not an admin.` },
                { status: 403 }
            )
        }

        // Validate fields
        if (!subject || !messageBody) {
            return NextResponse.json(
                { error: "Subject and body are required" },
                { status: 400 }
            )
        }

        // Fetch all users using Admin SDK
        const usersSnap = await adminDb.collection("users").get()
        let users: UserProfile[] = []
        usersSnap.forEach((doc) => {
            users.push({ uid: doc.id, ...doc.data() } as UserProfile)
        })

        // Filter by selected user IDs if provided. 
        // If no userIds are provided, we don't default to everyone for safety.
        if (userIds && userIds.length > 0) {
            const userIdSet = new Set(userIds)
            users = users.filter(u => userIdSet.has(u.uid))
        } else {
            // No specific users selected, so clear the list
            users = []
        }

        // Prepare list of external emails
        const externalEmails = (body as any).customEmails?.filter((e: string) => e && e.includes('@')) || []
        const allRecipients: (UserProfile | { email: string })[] = []
        // Add internal users' full objects
        users.forEach(u => {
            if (u.email) allRecipients.push(u)
        })
        // Add external emails (no personalization)
        externalEmails.forEach((e: string) => allRecipients.push({ email: e } as any))


        console.log(`Broadcasting email to ${allRecipients.length} total recipients (${users.length} users + ${externalEmails.length} external)`)

        if (allRecipients.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No recipients selected to send broadcast",
                stats: { total: 0, sent: 0, failed: 0 },
            })
        }


        // Initialize Nodemailer ONCE
        const nodemailer = await import("nodemailer")

        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
            throw new Error("SMTP configuration missing on server")
        }

        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASSWORD,
            },
            connectionTimeout: 20000, // Increased timeout
            greetingTimeout: 20000,
            pool: true, // Use pooled connections for better performance
            maxConnections: 5,
            maxMessages: 100,
        })

        // Verify connection
        try {
            await transporter.verify()
            console.log("SMTP connection verified")
        } catch (verifyError) {
            console.error("SMTP verify failed:", verifyError)
            throw new Error("Failed to connect to email server")
        }

        let successCount = 0
        let failCount = 0

        // Send emails in batches of 5 (respect pool size)
        const BATCH_SIZE = 5
        for (let i = 0; i < allRecipients.length; i += BATCH_SIZE) {
            const batch = allRecipients.slice(i, i + BATCH_SIZE)
            const promises = batch.map(async (recipient) => {
                if (!recipient.email) return false
                try {
                    // For internal users use placeholders, external keep original subject/body
                    let personalizedSubject = subject
                    let personalizedBody = messageBody
                    // If this recipient is a full UserProfile, apply placeholders
                    if ((recipient as any).uid) {
                        const user = recipient as UserProfile
                        personalizedSubject = replacePlaceholders(subject, user)
                        personalizedBody = replacePlaceholders(messageBody, user)
                    }
                    const html = generateBroadcastHTML(personalizedSubject, personalizedBody)
                    await transporter.sendMail({
                        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
                        to: recipient.email,
                        subject: personalizedSubject,
                        html: html,
                    })
                    return true
                } catch (err) {
                    console.error(`Failed to send to ${recipient.email}:`, err)
                    return false
                }
            })

            const results = await Promise.all(promises)
            successCount += results.filter(Boolean).length
            failCount += results.filter(r => !r).length

            if (i + BATCH_SIZE < allRecipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }


        // Determine absolute success status
        // If at least one email sent, we consider it a partial success at minimum
        // If NO emails sent and we had users, it's a failure

        console.log(`Broadcast complete: ${successCount} sent, ${failCount} failed`)

        // Log broadcast using Admin SDK
        try {
            await adminDb.collection("broadcast_logs").add({
                subject,
                body: messageBody,
                adminEmail,
                totalUsers: users.length,
                successCount,
                failCount,
                createdAt: new Date(),
            })
        } catch (logError) {
            console.warn("Failed to log broadcast:", logError)
        }

        return NextResponse.json({
            success: true,
            message: `Broadcast complete. Sent: ${successCount}, Failed: ${failCount}`,
            stats: {
                total: allRecipients.length,
                sent: successCount,
                failed: failCount,
            },
        })
    } catch (error: any) {
        console.error("Broadcast error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to send broadcast" },
            { status: 500 }
        )
    }
}
