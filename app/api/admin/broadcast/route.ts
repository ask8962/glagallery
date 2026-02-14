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
}

// Replace placeholders in text
function replacePlaceholders(text: string, user: UserProfile): string {
    return text
        .replace(/\[Name\]/gi, user.name || "User")
        .replace(/\[Email\]/gi, user.email || "")
        .replace(/\[Points\]/gi, String(user.points || 0))
        .replace(/\[Level\]/gi, String(user.level || 1))
}

// Generate HTML email template
function generateBroadcastHTML(subject: string, body: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffd700; margin: 0; font-size: 24px;">GLA University Gallery</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 22px;">${subject}</h2>
              <div style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${body.replace(/\n/g, "<br>")}
              </div>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <a href="https://glagallery.vercel.app" style="display: inline-block; background-color: #ffd700; color: #1a1a2e; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                Visit GLA Gallery
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; color: #888; font-size: 12px;">
              <p style="margin: 0 0 10px 0;">GLA University, Mathura</p>
              <p style="margin: 0;">You're receiving this because you're a registered GLA Gallery user.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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

export async function POST(request: NextRequest) {
    try {
        // Rate limit - allow only 1 broadcast per hour
        const clientIp = getClientIP(request)
        const rateLimitCheck = await checkServerRateLimit(clientIp, "UPLOAD", 60 * 60 * 1000)

        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Only 1 broadcast per hour allowed." },
                { status: 429 }
            )
        }

        const body: BroadcastRequest = await request.json()
        const { subject, body: messageBody, adminEmail, userIds } = body

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

        // Filter by selected user IDs if provided
        if (userIds && userIds.length > 0) {
            const userIdSet = new Set(userIds)
            users = users.filter(u => userIdSet.has(u.uid))
        }

        console.log(`Broadcasting email to ${users.length} users...`)

        let successCount = 0
        let failCount = 0

        // Send emails in batches of 10 to avoid overwhelming SMTP
        // Send emails sequentially to avoid overwhelming SMTP and connection timeouts
        // Note: Sequential sending is slower but much more reliable for free SMTP services like Gmail
        for (const user of users) {
            if (!user.email) {
                failCount++
                continue
            }

            // Replace placeholders for this user
            const personalizedSubject = replacePlaceholders(subject, user)
            const personalizedBody = replacePlaceholders(messageBody, user)
            const html = generateBroadcastHTML(personalizedSubject, personalizedBody)

            const success = await sendEmail(user.email, personalizedSubject, html)
            if (success) {
                successCount++
            } else {
                failCount++
            }

            // Small delay between emails to be gentle on the SMTP server
            await new Promise((resolve) => setTimeout(resolve, 500))
        }

        // Log broadcast using Admin SDK
        try {
            await adminDb.collection("broadcast_logs").add({
                subject,
                body: messageBody,
                adminEmail,
                totalUsers: users.length,
                successCount,
                failCount,
                createdAt: new Date(), // Admin SDK uses native Date or Timestamp
            })
        } catch (logError) {
            console.warn("Failed to log broadcast:", logError)
        }

        console.log(`Broadcast complete: ${successCount} sent, ${failCount} failed`)

        return NextResponse.json({
            success: true,
            message: "Broadcast sent successfully",
            stats: {
                total: users.length,
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
