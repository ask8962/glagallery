import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { isSuperAdminEmail, isAdminEmail } from "@/lib/config"

// GET: Admin-only — fetch confessions WITH author identity
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status") // active, hidden, removed, pending_review
        const reportedOnly = searchParams.get("reported") === "true"
        const limitCount = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

        let query = adminDb.collection("confessions").orderBy("createdAt", "desc").limit(limitCount)

        if (status) {
            query = adminDb
                .collection("confessions")
                .where("status", "==", status)
                .orderBy("createdAt", "desc")
                .limit(limitCount)
        }

        const snapshot = await query.get()
        const confessions: any[] = []

        snapshot.forEach((doc) => {
            const data = doc.data()

            // Filter reported only if requested
            if (reportedOnly && (!data.reportCount || data.reportCount === 0)) return

            // Admin view: include FULL data including author identity
            confessions.push({
                id: doc.id,
                ...data,
            })
        })

        return NextResponse.json({ confessions })
    } catch (error: any) {
        console.error("Admin confessions GET error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH: Admin actions on a confession
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { confessionId, action, adminEmail, reason } = body

        if (!confessionId || !action || !adminEmail) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Verify admin
        if (!isSuperAdminEmail(adminEmail) && !isAdminEmail(adminEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const confessionRef = adminDb.collection("confessions").doc(confessionId)
        const confessionDoc = await confessionRef.get()

        if (!confessionDoc.exists) {
            return NextResponse.json({ error: "Confession not found" }, { status: 404 })
        }

        switch (action) {
            case "approve":
                await confessionRef.update({ status: "active", updatedAt: new Date().toISOString() })
                break

            case "hide":
                await confessionRef.update({
                    status: "hidden",
                    updatedAt: new Date().toISOString(),
                })
                break

            case "remove":
                await confessionRef.update({
                    status: "removed",
                    removedBy: adminEmail,
                    removedReason: reason || "Removed by admin",
                    updatedAt: new Date().toISOString(),
                })
                break

            case "reveal_identity":
                // Log identity reveal for audit
                await confessionRef.update({
                    identityRevealedBy: adminEmail,
                    identityRevealedAt: new Date().toISOString(),
                })
                const data = confessionDoc.data()!
                return NextResponse.json({
                    success: true,
                    identity: {
                        authorUid: data.authorUid,
                        authorEmail: data.authorEmail,
                    },
                })

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        return NextResponse.json({ success: true, action })
    } catch (error: any) {
        console.error("Admin confession PATCH error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
