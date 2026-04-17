import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdminAccess } from "@/lib/server-auth"
import { Event } from "@/lib/types"
import { eventSchema } from "@/lib/validations/events"
import { Timestamp } from "firebase-admin/firestore"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")
        const orgId = searchParams.get("orgId")
        const limitCount = Number(searchParams.get("limit")) || 20

        if (!orgId) {
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
        }

        const eventsRef = adminDb.collection("events")
        let query = eventsRef.where("status", "==", "published")
                             .where("organizationId", "==", orgId)

        // Apply category filter if present
        if (category && category !== "all") {
            query = query.where("category", "==", category)
        }

        // Apply ordering and limit
        // Note: This requires a Firestore composite index.
        // If index is missing, this will throw an error with a link to create it.
        query = query.orderBy("startDate", "asc").limit(limitCount)

        const snapshot = await query.get()

        const events = snapshot.docs.map((doc: any) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                // Serialize Firestore Timestamps to ISO strings
                startDate: data.startDate?.toDate().toISOString() || data.startDate,
                endDate: data.endDate?.toDate().toISOString() || data.endDate,
                registrationDeadline: data.registrationDeadline?.toDate().toISOString() || null,
                createdAt: data.createdAt?.toDate().toISOString() || null,
                updatedAt: data.updatedAt?.toDate().toISOString() || null,
            }
        }) as Event[]

        // Convert Timestamp objects to serializable dates/strings if needed for client
        // But Event type expects Timestamp or similar, so we leave it.
        // Next.js returning JSON might need simple serializable values.
        // Let's rely on JSON.stringify handling usually or helper. 
        // Actually, Client SDK timestamps have .toDate(), Admin SDK has .toDate().
        // When sent over JSON, they become strings or objects. 
        // Let's safe-guard the return logic in case of serialization issues.

        return NextResponse.json({
            events,
            count: events.length
        })

    } catch (error: any) {
        console.error("API Error /events:", error)
        return NextResponse.json(
            { error: error.message || "Failed to fetch events" },
            { status: 500 }
        )
    }
}



// POST - Create new event (Admin only)
export async function POST(request: NextRequest) {
    try {
        // 1. Verify Admin Access
        const authCheck = await verifyAdminAccess(request)
        if (!authCheck.authorized || !authCheck.user) {
            return NextResponse.json({ error: authCheck.error }, { status: 403 })
        }

        // 2. Parse Body

        // 2. Parse Body
        const body = await request.json()

        // 3. Validate
        const validation = eventSchema.safeParse(body)
        if (!validation.success) {
            console.error("Validation Error:", validation.error.flatten())
            return NextResponse.json({ error: "Invalid event data", details: validation.error.flatten() }, { status: 400 })
        }

        const data = validation.data

        // 4. Transform Dates to Timestamps
        // Firestore prefers Timestamps. Since we use Admin SDK, we use admin.firestore.Timestamp
        const eventData = {
            ...data,
            organizationId: authCheck.user.organizationId || "org_gla_university_001", // Fallback for transition
            startDate: Timestamp.fromDate(new Date(data.startDate)),
            endDate: Timestamp.fromDate(new Date(data.endDate)),
            registrationDeadline: data.registrationDeadline ? Timestamp.fromDate(new Date(data.registrationDeadline)) : null,

            // Club hosting (optional - if created by a club)
            hostedByClubId: body.hostedByClubId || null,
            hostedByClubName: body.hostedByClubName || null,

            // Metadata
            status: "published", // Can be 'draft' later
            registeredCount: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),

            // Search helpers
            slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        }

        // 5. Save to Firestore (Admin SDK)
        const docRef = await adminDb.collection("events").add(eventData)

        return NextResponse.json({
            success: true,
            eventId: docRef.id,
            message: "Event published successfully"
        })

    } catch (error: any) {
        console.error("Create Event Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to create event" },
            { status: 500 }
        )
    }
}
