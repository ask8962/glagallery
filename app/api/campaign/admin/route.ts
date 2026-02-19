import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"
import { isAdminEmail } from "@/lib/config"

export const dynamic = "force-dynamic"

// GET: Fetch all claims (Admin only)
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuthToken(request)
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isAdminEmail(auth.user.email || "")) {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 })
        }

        const snapshot = await adminDb
            .collection("campaign_claims")
            .orderBy("claimedAt", "desc")
            .limit(100)
            .get()

        const claims = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
            claimedAt: doc.data().claimedAt?.toDate?.()?.toISOString() || null,
        }))

        const totalClaims = claims.length
        const totalAmount = claims.reduce((sum, c: any) => sum + (c.rewardAmount || 0), 0)
        const flaggedClaims = claims.filter((c: any) => c.status === "flagged").length

        return NextResponse.json({
            claims,
            stats: {
                totalClaims,
                totalAmount,
                flaggedClaims,
            },
        })
    } catch (error: any) {
        console.error("Admin claims fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch claims" },
            { status: 500 }
        )
    }
}

// PATCH: Update claim status (Admin only) - Supports multipart for file upload
export async function PATCH(request: NextRequest) {
    try {
        const auth = await verifyAuthToken(request)
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isAdminEmail(auth.user.email || "")) {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 })
        }

        // Check content type to distinguish between JSON updates and File uploads
        const contentType = request.headers.get("content-type") || ""

        let uid, status, notes, fileBuffer, fileName, userEmail

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData()
            uid = formData.get("uid") as string
            status = formData.get("status") as string
            notes = formData.get("notes") as string
            userEmail = formData.get("email") as string

            const file = formData.get("paymentProof") as File
            if (file) {
                const arrayBuffer = await file.arrayBuffer()
                fileBuffer = Buffer.from(arrayBuffer)
                fileName = file.name
            }
        } else {
            const body = await request.json()
            uid = body.uid
            status = body.status
            notes = body.notes
            userEmail = body.userEmail // Should be passed from client for email sending
        }

        if (!uid || !status) {
            return NextResponse.json({ error: "Missing uid or status" }, { status: 400 })
        }

        // Update Firestore
        await adminDb.collection("campaign_claims").doc(uid).update({
            status,
            adminNotes: notes || null,
            updatedAt: new Date(),
            updatedBy: auth.user.email,
            // In a real app, you'd upload the file to storage and save URL here.
            // For this requirement, we just email it.
        })

        // Send Email if "paid" and text/file is present
        if (status === "paid" && userEmail) {
            // Fire-and-forget email
            (async () => {
                try {
                    const SMTP_HOST = process.env.SMTP_HOST
                    const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587")
                    const SMTP_USER = process.env.SMTP_USER
                    const SMTP_PASSWORD = process.env.SMTP_PASSWORD

                    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
                        console.warn("SMTP not configured, skipping payment email")
                        return
                    }

                    const nodemailer = await import("nodemailer")
                    const transporter = nodemailer.createTransport({
                        host: SMTP_HOST,
                        port: SMTP_PORT,
                        secure: SMTP_PORT === 465,
                        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
                    })

                    const attachments = []
                    if (fileBuffer && fileName) {
                        attachments.push({
                            filename: fileName,
                            content: fileBuffer
                        })
                    }

                    await transporter.sendMail({
                        from: `"GLA Gallery Support" <${process.env.SMTP_USER}>`,
                        to: userEmail,
                        subject: "💰 Payment Successful - GLA Gallery Details",
                        html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #16a34a;">Payment Processed Successfully!</h2>
                            <p>Great news! Your reward claim has been verified and the payment has been processed.</p>
                            <p><strong>Status:</strong> Paid ✅</p>
                            ${notes ? `<p><strong>Note from Admin:</strong> ${notes}</p>` : ""}
                            ${fileBuffer ? `<p>Please find the payment proof attached to this email.</p>` : ""}
                            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
                            <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
                        </div>
                    `,
                        attachments
                    })
                    console.log(`Payment email sent to ${userEmail}`)
                } catch (err) {
                    console.error("Failed to send payment email:", err)
                }
            })()
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Admin claim update error:", error)
        return NextResponse.json(
            { error: "Failed to update claim" },
            { status: 500 }
        )
    }
}
