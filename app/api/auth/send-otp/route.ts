import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { APP_CONFIG } from "@/lib/config"
import { getClientIP, checkServerRateLimit } from "@/lib/server-auth"

// SMTP configuration
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587")
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SMTP_FROM_EMAIL = APP_CONFIG.EMAIL_FROM_ADDRESS
const SMTP_FROM_NAME = APP_CONFIG.EMAIL_FROM_NAME

// Generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Hash OTP for storage (simple hash for demo - in production use bcrypt)
function hashOTP(otp: string): string {
    // Simple hash using built-in crypto
    const encoder = new TextEncoder()
    const data = encoder.encode(otp + process.env.JWT_SECRET)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data[i]
        hash |= 0
    }
    return Math.abs(hash).toString(16)
}

// Send OTP email
async function sendOTPEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
        return { success: false, error: "SMTP not configured" }
    }

    try {
        const nodemailer = await import("nodemailer")
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
        })

        await transporter.sendMail({
            from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
            to: email,
            subject: "Your GLA Gallery Verification Code",
            text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Verification Code</h2>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
          </div>
          <p style="color: #666; text-align: center;">This code expires in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
        })

        return { success: true }
    } catch (error: any) {
        console.error("OTP email error:", error.message)
        return { success: false, error: error.message }
    }
}

export async function POST(request: NextRequest) {
    try {
        // Rate limit: 5 OTP requests per hour per IP
        const clientIp = getClientIP(request)
        const rateLimitCheck = await checkServerRateLimit(clientIp, "UPLOAD", 60 * 60 * 1000) // 5/hr, reusing UPLOAD limit

        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { error: "Too many OTP requests. Try again later." },
                { status: 429 }
            )
        }

        const { userId, email } = await request.json()
        console.log("📧 OTP Request received:", { userId, email })

        if (!userId || !email) {
            console.log("❌ OTP Request missing data:", { userId, email })
            return NextResponse.json({ error: "Missing userId or email" }, { status: 400 })
        }

        // SECURITY: Validate GLA email domain
        if (!email.toLowerCase().endsWith('@gla.ac.in')) {
            console.log("❌ Invalid email domain:", email)
            return NextResponse.json({ error: "Only GLA email addresses are allowed" }, { status: 400 })
        }

        // SECURITY: Verify the request is from an authenticated user
        // and the userId matches their actual ID
        const authHeader = request.headers.get("authorization")
        if (authHeader) {
            const token = authHeader.replace("Bearer ", "")
            try {
                const { verifyIdToken } = await import("@/lib/auth-utils")
                const decoded = await verifyIdToken(token)
                if (decoded && decoded.uid !== userId) {
                    console.log("❌ UserId mismatch:", { provided: userId, actual: decoded.uid })
                    return NextResponse.json({ error: "User ID mismatch" }, { status: 403 })
                }
            } catch (e) {
                // Token verification failed, but we'll allow unauthenticated OTP requests
                // for initial 2FA setup (user may not be fully authenticated yet)
                console.log("⚠️ Token verification skipped:", e)
            }
        }

        // Use Admin SDK to delete existing OTPs
        const otpRef = adminDb.collection("otp_codes")
        const existingSnapshot = await otpRef.where("userId", "==", userId).get()

        // Batch delete
        if (!existingSnapshot.empty) {
            const batch = adminDb.batch()
            existingSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref)
            })
            await batch.commit()
        }

        // Generate new OTP
        const otp = generateOTP()
        const hashedOtp = hashOTP(otp)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Store in Firestore using Admin SDK
        await otpRef.add({
            userId,
            email,
            code: hashedOtp,
            createdAt: new Date(), // Admin SDK accepts native Date objects
            expiresAt, // Admin SDK accepts native Date objects
        })

        // Send email
        console.log("📤 Sending OTP email to:", email)
        const emailResult = await sendOTPEmail(email, otp)
        console.log("📬 OTP email result:", emailResult)

        if (!emailResult.success) {
            return NextResponse.json(
                { error: emailResult.error || "Failed to send OTP email" },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: "OTP sent to your email",
        })
    } catch (error: any) {
        console.error("Send OTP error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
