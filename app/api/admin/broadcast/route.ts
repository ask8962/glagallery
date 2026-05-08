import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import type { UserProfile } from "@/lib/types"
import { APP_CONFIG, getAdminEmails, isAdminEmail } from "@/lib/config"
import { getClientIP, checkServerRateLimit } from "@/lib/server-auth"
import { Resend } from "resend"

// Resend configuration
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = APP_CONFIG.EMAIL_FROM_ADDRESS || "team@campushub.pro"
const FROM_NAME = APP_CONFIG.EMAIL_FROM_NAME || "CampusHub"

interface BroadcastRequest {
    subject: string
    body: string
    adminEmail: string
    userIds?: string[]
    customEmails?: string[]
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
      padding: 40px 20px;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      max-width: 600px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%);
      padding: 36px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .header span {
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .header p {
      color: #71717a;
      margin: 8px 0 0;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .content {
      padding: 40px;
    }
    .subject-line {
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
      line-height: 1.7;
      margin: 0;
    }
    .body-text p {
      margin-top: 0;
      margin-bottom: 16px;
    }
    .cta-section {
      padding: 0 40px 40px 40px;
      text-align: left;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #09090b, #27272a);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: -0.01em;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e4e4e7, transparent);
      margin: 0 40px;
    }
    .footer {
      padding: 32px 40px;
      text-align: center;
    }
    .footer p {
      color: #a1a1aa;
      font-size: 13px;
      line-height: 1.6;
      margin: 4px 0;
    }
    .footer a {
      color: #71717a;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" cellpadding="0" cellspacing="0" align="center" width="100%">
      <tr>
        <td class="header">
          <h1>Campus<span>Hub</span></h1>
          <p>The Campus Operating System</p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <h2 class="subject-line">${subject}</h2>
          <div class="body-text">
            <p>${formattedBody}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td class="cta-section">
          <a href="https://campushub.pro" class="cta-button">Open CampusHub &rarr;</a>
        </td>
      </tr>
      <tr>
        <td><div class="divider"></div></td>
      </tr>
      <tr>
        <td class="footer">
          <p>&copy; ${new Date().getFullYear()} CampusHub. The ultimate campus operating system.</p>
          <p>You received this email because you are a registered member of CampusHub.</p>
          <p>
            <a href="https://campushub.pro">Visit CampusHub</a> &bull;
            <a href="mailto:team@campushub.pro">Contact Support</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`
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

        // Validate admin
        let isAdmin = false

        if (adminEmail) {
            const normalizedEmail = adminEmail.toLowerCase().trim()

            if (isAdminEmail(normalizedEmail)) {
                console.log("Admin found in config list")
                isAdmin = true
            } else {
                try {
                    const usersRef = adminDb.collection("users")
                    const snapshot = await usersRef.where("email", "==", normalizedEmail).limit(1).get()

                    if (!snapshot.empty) {
                        const userData = snapshot.docs[0].data()
                        if (userData.role === "admin" || userData.role === "super_admin") {
                            console.log("Admin found in Firestore with role:", userData.role)
                            isAdmin = true
                        }
                    }
                } catch (dbError) {
                    console.error("Failed to check admin status in Firestore:", dbError)
                }
            }
        }

        if (!isAdmin) {
            console.warn("Unauthorized broadcast attempt by:", adminEmail)
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
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

        // Fetch users using Admin SDK
        const usersSnap = await adminDb.collection("users").get()
        let users: UserProfile[] = []
        usersSnap.forEach((doc) => {
            users.push({ uid: doc.id, ...doc.data() } as UserProfile)
        })

        // Filter by selected user IDs if provided
        if (userIds && userIds.length > 0) {
            const userIdSet = new Set(userIds)
            users = users.filter(u => userIdSet.has(u.uid))
        } else {
            users = []
        }

        // Prepare list of external emails
        const externalEmails = customEmails?.filter((e: string) => e && e.includes('@')) || []

        // Build all recipient entries
        interface Recipient {
            email: string;
            personalizedSubject: string;
            personalizedBody: string;
        }

        const allRecipients: Recipient[] = []

        // Internal users with personalization
        users.forEach(u => {
            if (u.email) {
                allRecipients.push({
                    email: u.email,
                    personalizedSubject: replacePlaceholders(subject, u),
                    personalizedBody: replacePlaceholders(messageBody, u),
                })
            }
        })

        // External emails (no personalization)
        externalEmails.forEach((e: string) => {
            allRecipients.push({
                email: e,
                personalizedSubject: subject,
                personalizedBody: messageBody,
            })
        })

        console.log(`Broadcasting email to ${allRecipients.length} total recipients (${users.length} users + ${externalEmails.length} external)`)

        if (allRecipients.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No recipients selected to send broadcast",
                stats: { total: 0, sent: 0, failed: 0 },
            })
        }

        let successCount = 0
        let failCount = 0

        // Send emails in batches of 10
        const BATCH_SIZE = 10
        for (let i = 0; i < allRecipients.length; i += BATCH_SIZE) {
            const batch = allRecipients.slice(i, i + BATCH_SIZE)
            const promises = batch.map(async (recipient) => {
                try {
                    const html = generateBroadcastHTML(recipient.personalizedSubject, recipient.personalizedBody)
                    const { error } = await resend.emails.send({
                        from: `${FROM_NAME} <${FROM_EMAIL}>`,
                        to: [recipient.email],
                        subject: recipient.personalizedSubject,
                        html: html,
                    })

                    if (error) {
                        console.error(`Resend error for ${recipient.email}:`, error)
                        return false
                    }
                    return true
                } catch (err) {
                    console.error(`Failed to send to ${recipient.email}:`, err)
                    return false
                }
            })

            const results = await Promise.all(promises)
            successCount += results.filter(Boolean).length
            failCount += results.filter(r => !r).length

            // Small delay between batches
            if (i + BATCH_SIZE < allRecipients.length) {
                await new Promise(resolve => setTimeout(resolve, 500))
            }
        }

        console.log(`Broadcast complete: ${successCount} sent, ${failCount} failed`)

        // Log broadcast
        try {
            await adminDb.collection("broadcast_logs").add({
                subject,
                body: messageBody,
                adminEmail,
                totalUsers: users.length,
                successCount,
                failCount,
                provider: "resend",
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
