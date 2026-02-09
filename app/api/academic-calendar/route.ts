import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"

// GET: Fetch academic calendar events
export async function GET(req: NextRequest) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")
        const type = searchParams.get("type")
        const limit = parseInt(searchParams.get("limit") || "50")

        let query = adminDb.collection("academic_calendar").orderBy("startDate", "asc")

        // Filter by date range if provided
        if (startDate) {
            query = query.where("startDate", ">=", startDate)
        }
        if (endDate) {
            query = query.where("startDate", "<=", endDate)
        }

        const eventsSnap = await query.limit(limit).get()

        let events = eventsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }))

        // Filter by type client-side (Firestore doesn't support multiple inequality filters)
        if (type) {
            events = events.filter((e: any) => e.type === type)
        }

        return NextResponse.json({ events })
    } catch (error) {
        console.error("Error fetching academic events:", error)
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        )
    }
}

// POST: Create academic event (admin only)
export async function POST(req: NextRequest) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const adminUid = authResult.user.uid

        // Verify admin role
        const adminDoc = await adminDb.collection("users").doc(adminUid).get()
        const adminData = adminDoc.data()

        if (!adminData || !["admin", "super_admin", "dean", "department_head"].includes(adminData.role)) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const body = await req.json()
        const {
            title,
            description,
            type,
            startDate,
            endDate,
            allDay = true,
            recurring,
            affectedDepartments,
            color
        } = body

        if (!title || !type || !startDate || !endDate) {
            return NextResponse.json(
                { error: "Title, type, startDate, and endDate are required" },
                { status: 400 }
            )
        }

        const validTypes = [
            "exam", "holiday", "semester_start", "semester_end",
            "registration", "convocation", "placement", "cultural_fest",
            "sports_week", "workshop", "other"
        ]

        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: "Invalid event type" },
                { status: 400 }
            )
        }

        const eventRef = adminDb.collection("academic_calendar").doc()
        await eventRef.set({
            id: eventRef.id,
            title,
            description: description || null,
            type,
            startDate,
            endDate,
            allDay,
            recurring: recurring || null,
            affectedDepartments: affectedDepartments || [],
            color: color || null,
            createdBy: adminUid,
            createdAt: new Date().toISOString(),
            updatedAt: null,
        })

        return NextResponse.json({
            success: true,
            eventId: eventRef.id,
            message: "Academic event created"
        })
    } catch (error) {
        console.error("Error creating academic event:", error)
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
        )
    }
}
