import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"

// GET - Fetch analytics data for a club
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clubId } = await params

        // 1. Authenticate
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // 2. Check if user is club admin
        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()
        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const clubData = clubDoc.data()
        const isAdmin = clubData?.presidentUid === decoded.uid ||
            clubData?.admins?.includes(decoded.uid)

        if (!isAdmin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        // 3. Gather analytics data
        const memberCount = clubData?.members?.length || 0
        const teamCount = clubData?.team?.length || 0

        // 4. Get events hosted by this club
        const eventsSnapshot = await adminDb
            .collection("events")
            .where("hostedByClubId", "==", clubId)
            .orderBy("createdAt", "desc")
            .limit(10)
            .get()

        const events = eventsSnapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                title: data.title,
                registeredCount: data.registeredCount || 0,
                capacity: data.capacity || 0,
                startDate: data.startDate?.toDate?.()?.toISOString() || null,
            }
        })

        const totalEvents = eventsSnapshot.size
        const totalRSVPs = events.reduce((sum, e) => sum + e.registeredCount, 0)

        // 5. Get announcement count
        const announcementsSnapshot = await adminDb
            .collection("clubs")
            .doc(clubId)
            .collection("announcements")
            .get()

        const announcementCount = announcementsSnapshot.size

        // 6. Calculate fill rate
        const avgFillRate = events.length > 0
            ? Math.round(events.reduce((sum, e) =>
                sum + (e.capacity > 0 ? (e.registeredCount / e.capacity) * 100 : 0), 0
            ) / events.length)
            : 0

        return NextResponse.json({
            overview: {
                memberCount,
                teamCount,
                totalEvents,
                totalRSVPs,
                announcementCount,
                avgFillRate,
            },
            recentEvents: events,
            clubName: clubData?.name,
        })

    } catch (error: any) {
        console.error("Club Analytics Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
