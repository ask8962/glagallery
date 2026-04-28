import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// POST: Report a confession
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { userId, reason } = body

        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const confessionRef = adminDb.collection("confessions").doc(id)
        const confessionDoc = await confessionRef.get()

        if (!confessionDoc.exists) {
            return NextResponse.json({ error: "Confession not found" }, { status: 404 })
        }

        const data = confessionDoc.data()!
        const reportedBy: string[] = data.reportedBy || []

        // Check if already reported by this user
        if (reportedBy.includes(userId)) {
            return NextResponse.json({ error: "You've already reported this post" }, { status: 400 })
        }

        const newReportCount = (data.reportCount || 0) + 1
        const updatedReportedBy = [...reportedBy, userId]

        const updateData: any = {
            reportCount: newReportCount,
            reportedBy: updatedReportedBy,
        }

        // Auto-hide if 5+ reports (lenient: hide, don't remove)
        if (newReportCount >= 5) {
            updateData.status = "hidden"
            updateData.moderationFlags = [
                ...(data.moderationFlags || []),
                `Auto-hidden: ${newReportCount} reports`,
            ]
        }

        await confessionRef.update(updateData)

        return NextResponse.json({
            success: true,
            reportCount: newReportCount,
            autoHidden: newReportCount >= 5,
        })
    } catch (error: any) {
        console.error("Report error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
