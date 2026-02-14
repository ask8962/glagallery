import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getUserFromRequest } from "@/lib/jwt-auth"
import { Timestamp, FieldValue } from "firebase-admin/firestore"

// GET - Fetch redemption history
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const isAdmin = searchParams.get("admin") === "true"

        // Check if admin
        const userDoc = await adminDb.collection("users").doc(user.uid as string).get()
        const userData = userDoc.data()
        const isUserAdmin = userData?.role === "admin"

        let query = adminDb.collection("redemptions").orderBy("createdAt", "desc")

        // Non-admins can only see their own redemptions
        if (!isAdmin || !isUserAdmin) {
            query = adminDb.collection("redemptions")
                .where("userId", "==", user.uid)
                .orderBy("createdAt", "desc")
        }

        const snapshot = await query.limit(100).get()
        const redemptions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return NextResponse.json({ redemptions })
    } catch (error) {
        console.error("Error fetching redemptions:", error)
        return NextResponse.json(
            { error: "Failed to fetch redemptions" },
            { status: 500 }
        )
    }
}

// PATCH - Update redemption status (Admin only)
export async function PATCH(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if admin
        const userDoc = await adminDb.collection("users").doc(user.uid as string).get()
        const userData = userDoc.data()
        if (userData?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const body = await request.json()
        const { redemptionId, status } = body

        if (!redemptionId || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const validStatuses = ["pending", "processing", "fulfilled", "cancelled"]
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        // Fetch redemption data for email and refund logic
        const redemptionDoc = await adminDb.collection("redemptions").doc(redemptionId).get()
        const redemptionData = redemptionDoc.data()

        if (!redemptionData) {
            return NextResponse.json({ error: "Redemption not found" }, { status: 404 })
        }

        const updateData: Record<string, unknown> = { status }
        if (status === "fulfilled") {
            updateData.fulfilledAt = Timestamp.now()
        }

        // If cancelled, refund points
        if (status === "cancelled" && redemptionData.status !== "cancelled") {
            await adminDb.collection("users").doc(redemptionData.userId).update({
                points: FieldValue.increment(redemptionData.pointsCost)
            })

            // Log the refund transaction (fire-and-forget)
            const { logPointTransaction } = await import("@/lib/points")
            logPointTransaction(
                redemptionData.userId,
                redemptionData.pointsCost,
                "refund",
                `Refund: ${redemptionData.rewardName}`,
                redemptionId
            )
        }

        await adminDb.collection("redemptions").doc(redemptionId).update(updateData)

        // Send email notification for fulfilled or cancelled statuses
        if (status === "fulfilled" || status === "cancelled") {
            // Fire-and-forget email (don't block the response)
            (async () => {
                try {
                    const SMTP_HOST = process.env.SMTP_HOST
                    const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587")
                    const SMTP_USER = process.env.SMTP_USER
                    const SMTP_PASSWORD = process.env.SMTP_PASSWORD

                    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
                        console.warn("SMTP not configured, skipping redemption email")
                        return
                    }

                    const nodemailer = await import("nodemailer")
                    const transporter = nodemailer.createTransport({
                        host: SMTP_HOST,
                        port: SMTP_PORT,
                        secure: SMTP_PORT === 465,
                        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
                        connectionTimeout: 10000,
                        greetingTimeout: 10000,
                    })

                    const subject = status === "fulfilled"
                        ? "🎁 Your Reward is Ready!"
                        : "❌ Reward Redemption Cancelled"

                    const htmlBody = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: ${status === "fulfilled" ? "#22c55e" : "#ef4444"};">${subject}</h2>
                            <p>Hi ${redemptionData.userName || "there"},</p>
                            <p>${status === "fulfilled"
                            ? `Great news! Your redemption for <strong>"${redemptionData.rewardName}"</strong> has been fulfilled. Please visit the rewards desk or check your inbox for further instructions.`
                            : `Your redemption for <strong>"${redemptionData.rewardName}"</strong> has been cancelled. Your <strong>${redemptionData.pointsCost.toLocaleString()} points</strong> have been refunded to your account.`
                        }</p>
                            <p style="margin-top: 20px;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/rewards/history" 
                                   style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                    View Redemption History
                                </a>
                            </p>
                            <p style="color: #666; font-size: 12px; margin-top: 30px;">— GLA Gallery Team</p>
                        </div>
                    `

                    await transporter.sendMail({
                        from: `"GLA Gallery" <${process.env.SMTP_USER}>`,
                        to: redemptionData.userEmail,
                        subject,
                        html: htmlBody,
                    })

                    console.log(`Redemption email sent to ${redemptionData.userEmail} for status: ${status}`)
                } catch (emailError) {
                    console.error("Failed to send redemption email:", emailError)
                }
            })()
        }

        return NextResponse.json({ success: true, message: `Status updated to ${status}` })
    } catch (error) {
        console.error("Error updating redemption:", error)
        return NextResponse.json(
            { error: "Failed to update redemption" },
            { status: 500 }
        )
    }
}

