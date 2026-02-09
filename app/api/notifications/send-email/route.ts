import { type NextRequest, NextResponse } from "next/server"
import { getFirebase } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import type { EmailLog } from "@/lib/types"
import { generateEmailHTML, generateEmailText, getEmailSubject } from "@/lib/email-templates"
import { APP_CONFIG, buildAppURL } from "@/lib/config"
import { getClientIP, checkServerRateLimit } from "@/lib/server-auth"

// SMTP configuration (set in Vercel environment variables)
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587")
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SMTP_FROM_EMAIL = APP_CONFIG.EMAIL_FROM_ADDRESS
const SMTP_FROM_NAME = APP_CONFIG.EMAIL_FROM_NAME

interface EmailRequest {
  notificationId: string
  userId: string
  userEmail: string
  type: string
  title: string
  message: string
  link?: string
}

// Send email via SMTP
async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
): Promise<{ success: boolean; error?: string }> {
  // Check for missing configuration
  const missingVars: string[] = []
  if (!SMTP_HOST) missingVars.push("SMTP_HOST")
  if (!SMTP_USER) missingVars.push("SMTP_USER")
  if (!SMTP_PASSWORD) missingVars.push("SMTP_PASSWORD")

  if (missingVars.length > 0) {
    const errorMsg = `SMTP configuration missing. Please set these environment variables: ${missingVars.join(", ")}. For local development, create a .env.local file.`
    console.error("SMTP Config Error:", errorMsg)
    return {
      success: false,
      error: errorMsg,
    }
  }

  try {
    const nodemailer = await import("nodemailer")

    // Create transporter with better error handling
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

    // Verify connection first
    await transporter.verify()

    // Send email
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    })

    console.log("Email sent successfully:", info.messageId)
    return { success: true }
  } catch (error: any) {
    console.error("SMTP Error Details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message,
    })

    let errorMessage = error.message || "Failed to send email"

    if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Please check your SMTP_USER and SMTP_PASSWORD."
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      errorMessage = `Connection failed. Please check SMTP_HOST (${SMTP_HOST}) and SMTP_PORT (${SMTP_PORT}).`
    } else if (error.code === "EENVELOPE") {
      errorMessage = "Invalid recipient email address."
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}



export async function POST(request: NextRequest) {
  try {
    // Note: This API is called internally by the app when creating notifications.
    // We validate the request has required fields and use IP for rate limiting.

    // Rate limit by IP address
    const clientIp = getClientIP(request)
    const rateLimitCheck = checkServerRateLimit(clientIp, "COMMENT", 60 * 60 * 1000) // Using COMMENT limit (50/hr)

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: rateLimitCheck.error,
          remaining: rateLimitCheck.remaining,
          resetAt: rateLimitCheck.resetAt,
        },
        { status: 429 },
      )
    }

    const body: EmailRequest = await request.json()
    const { notificationId, userId, userEmail, type, title, message, link } = body

    // Validate required fields
    if (!notificationId || !userId || !userEmail || !type) {
      return NextResponse.json(
        { error: "Missing required fields: notificationId, userId, userEmail, type" },
        { status: 400 }
      )
    }

    console.log("Email API called:", { notificationId, userId, type, userEmail })

    // Validate email is provided
    if (!userEmail || !userEmail.includes("@")) {
      const error = "Invalid user email provided"
      console.error("Email API Error:", error, userEmail)
      return NextResponse.json({ error }, { status: 400 })
    }

    console.log("Sending email to:", userEmail)

    const absoluteLink = link ? (link.startsWith("http") ? link : buildAppURL(link)) : undefined

    // Generate email content with template
    const emailSubject = getEmailSubject(type as any, title)
    const emailHTML = generateEmailHTML({
      title,
      message,
      link: absoluteLink,
      type: type as any,
      metadata: {},
    })
    const emailText = generateEmailText({
      title,
      message,
      link: absoluteLink,
      type: type as any,
    })

    // Send email
    const result = await sendEmail(userEmail, emailSubject, emailHTML, emailText)

    // Log email delivery
    try {
      const { db } = getFirebase()
      const emailLogsRef = collection(db, "email_logs")
      const logEntry: Omit<EmailLog, "id"> = {
        userId,
        email: userEmail,
        notificationId,
        notificationType: type as any,
        status: result.success ? "sent" : "failed",
        error: result.error || null,
        sentAt: result.success ? serverTimestamp() : null,
        createdAt: serverTimestamp(),
      }
      await addDoc(emailLogsRef, logEntry)
    } catch (logError: any) {
      console.warn("Failed to log email delivery to Firestore:", logError.message)
    }

    if (!result.success) {
      console.error("Email sending failed:", result.error)
      return NextResponse.json(
        {
          error: result.error || "Failed to send email",
          details: "Check email_logs collection in Firestore for more details",
        },
        { status: 500 },
      )
    }

    console.log("Email sent successfully to:", userEmail)
    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      email: userEmail,
    })
  } catch (error: any) {
    console.error("Error in send-email API:", {
      message: error.message,
      stack: error.stack,
      error,
    })
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: "Check server logs for more information",
      },
      { status: 500 },
    )
  }
}
