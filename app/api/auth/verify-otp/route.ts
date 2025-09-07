import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { cookies } from "next/headers"
import { getClientIP, checkServerRateLimit } from "@/lib/server-auth"
import { logFailedAuth, logRateLimitExceeded, logSecurityEvent } from "@/lib/security-logging"

// Hash OTP for comparison (must match send-otp route)
function hashOTP(otp: string): string {
    const encoder = new TextEncoder()
    const data = encoder.encode(otp + process.env.JWT_SECRET)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data[i]
        hash |= 0
    }
    return Math.abs(hash).toString(16)
}

export async function POST(request: NextRequest) {
    try {
        // Rate limit: 10 verification attempts per hour per IP
        const clientIp = getClientIP(request)
        const rateLimitCheck = await checkServerRateLimit(clientIp, "LIKE", 60 * 60 * 1000) // 100/hr

        if (!rateLimitCheck.allowed) {
            // Log rate limit exceeded
            logRateLimitExceeded("verify-otp", clientIp)
            return NextResponse.json(
                { error: "Too many verification attempts." },
                { status: 429 }
            )
        }

        const { userId, code } = await request.json()

        if (!userId || !code) {
            console.log("❌ Verify OTP missing data:", { userId, code: code ? "****" : "missing" })
            return NextResponse.json({ error: "Missing userId or code" }, { status: 400 })
        }

        // Find OTP in Firestore using Admin SDK
        const otpRef = adminDb.collection("otp_codes")
        const snapshot = await otpRef.where("userId", "==", userId).get()

        if (snapshot.empty) {
            logFailedAuth("No OTP found", clientIp)
            return NextResponse.json({ error: "No OTP found. Please request a new code." }, { status: 400 })
        }

        const otpDoc = snapshot.docs[0]
        const otpData = otpDoc.data()

        // Check expiration - Admin SDK returns Timestamp objects or Date objects depending on config
        // Safe to convert to Date
        const expiresAt = otpData.expiresAt.toDate ? otpData.expiresAt.toDate() : new Date(otpData.expiresAt)

        if (expiresAt < new Date()) {
            // Delete expired OTP
            await otpDoc.ref.delete()
            logFailedAuth("OTP expired", clientIp, otpData.email)
            return NextResponse.json({ error: "OTP expired. Please request a new code." }, { status: 400 })
        }

        // Verify OTP
        const hashedInput = hashOTP(code)
        if (hashedInput !== otpData.code) {
            // Log failed attempt
            logFailedAuth("Invalid OTP code", clientIp, otpData.email)
            return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 })
        }

        // Delete used OTP
        await otpDoc.ref.delete()

        // Set 2FA verified cookie (24 hour expiry)
        const cookieStore = await cookies()
        cookieStore.set("2fa_verified", userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60, // 24 hours
            path: "/",
        })

        // Log successful 2FA
        logSecurityEvent("login_success", "info", "2FA verification successful", {
            userId,
            ipAddress: clientIp
        })

        console.log("✅ 2FA Verified for user:", userId)

        return NextResponse.json({
            success: true,
            message: "2FA verification successful",
        })
    } catch (error: any) {
        console.error("Verify OTP error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

