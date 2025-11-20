import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue, Timestamp } from "firebase-admin/firestore"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"
import { calculateReliabilityScore, shouldRestrictUser } from "@/lib/noshow-utils"

/**
 * Process No-Shows API
 * POST /api/events/process-noshows
 * 
 * Admin-only endpoint that:
 * 1. Finds all "valid" tickets for a completed event (users who didn't check in)
 * 2. Marks them as "noshow"
 * 3. Updates each user's eventStats
 * 4. Recalculates reliability scores
 * 5. Restricts users who exceed the threshold
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate & verify admin
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // Check if user is admin (simple email check for now)
        const userDoc = await adminDb.collection("users").doc(decoded.uid).get()
        const userData = userDoc.data()
        if (!userData || userData.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        // 2. Get event ID from body
        const body = await request.json()
        const { eventId } = body

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
        }

        // 3. Get the event to verify it exists and has ended
        const eventDoc = await adminDb.collection("events").doc(eventId).get()
        if (!eventDoc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 })
        }

        const eventData = eventDoc.data()!
        const eventEndDate = eventData.endDate?.toDate?.() || new Date(eventData.endDate)

        if (new Date() < eventEndDate) {
            return NextResponse.json({
                error: "Event has not ended yet. Process no-shows after the event ends.",
                endDate: eventEndDate.toISOString()
            }, { status: 400 })
        }

        // 4. Find all "valid" tickets (users who registered but didn't check in)
        const ticketsSnapshot = await adminDb.collection("tickets")
            .where("eventId", "==", eventId)
            .where("status", "==", "valid")
            .get()

        if (ticketsSnapshot.empty) {
            return NextResponse.json({
                message: "No no-shows to process",
                processed: 0
            })
        }

        // 5. Process each no-show
        const batch = adminDb.batch()
        const processedUsers: string[] = []
        const restrictedUsers: string[] = []

        for (const ticketDoc of ticketsSnapshot.docs) {
            const ticketData = ticketDoc.data()
            const userId = ticketData.userId

            // Mark ticket as noshow
            batch.update(ticketDoc.ref, {
                status: "noshow",
                markedNoShowAt: FieldValue.serverTimestamp()
            })

            // Update user's eventStats
            const userRef = adminDb.collection("users").doc(userId)
            const userSnap = await userRef.get()

            if (userSnap.exists) {
                const user = userSnap.data()!
                const currentStats = user.eventStats || {
                    registered: 0,
                    attended: 0,
                    noShows: 0
                }

                const newStats = {
                    ...currentStats,
                    noShows: (currentStats.noShows || 0) + 1,
                    lastNoShowAt: Timestamp.now()
                }

                const newScore = calculateReliabilityScore(newStats)
                const shouldRestrict = shouldRestrictUser(newStats)

                batch.update(userRef, {
                    eventStats: newStats,
                    reliabilityScore: newScore,
                    eventRestricted: shouldRestrict
                })

                processedUsers.push(userId)
                if (shouldRestrict) {
                    restrictedUsers.push(userId)
                }
            }
        }

        // 6. Mark event as processed
        batch.update(eventDoc.ref, {
            noShowsProcessed: true,
            noShowsProcessedAt: FieldValue.serverTimestamp(),
            noShowCount: ticketsSnapshot.size
        })

        // 7. Commit all changes
        await batch.commit()

        return NextResponse.json({
            success: true,
            message: `Processed ${ticketsSnapshot.size} no-shows`,
            processed: ticketsSnapshot.size,
            usersAffected: processedUsers.length,
            usersRestricted: restrictedUsers.length,
            restrictedUserIds: restrictedUsers
        })

    } catch (error: any) {
        console.error("Process No-Shows Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to process no-shows" },
            { status: 500 }
        )
    }
}
