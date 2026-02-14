import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"

// GET: Get single academic event
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const eventDoc = await adminDb.collection("academic_calendar").doc(id).get()

        if (!eventDoc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 })
        }

        return NextResponse.json({ event: { id: eventDoc.id, ...eventDoc.data() } })
    } catch (error) {
        console.error("Error fetching event:", error)
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
    }
}

// PATCH: Update academic event
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params
        const eventRef = adminDb.collection("academic_calendar").doc(id)
        const eventDoc = await eventRef.get()

        if (!eventDoc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 })
        }

        const body = await req.json()
        const allowedFields = [
            "title", "description", "type", "startDate", "endDate",
            "allDay", "recurring", "affectedDepartments", "color"
        ]

        const updates: Record<string, any> = { updatedAt: new Date().toISOString() }

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field]
            }
        }

        await eventRef.update(updates)

        return NextResponse.json({ success: true, message: "Event updated" })
    } catch (error) {
        console.error("Error updating event:", error)
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
    }
}

// DELETE: Delete academic event
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const adminUid = authResult.user.uid

        // Verify admin role
        const adminDoc = await adminDb.collection("users").doc(adminUid).get()
        const adminData = adminDoc.data()

        if (!adminData || !["admin", "super_admin"].includes(adminData.role)) {
            return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
        }

        const { id } = await params
        const eventRef = adminDb.collection("academic_calendar").doc(id)
        const eventDoc = await eventRef.get()

        if (!eventDoc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 })
        }

        await eventRef.delete()

        return NextResponse.json({ success: true, message: "Event deleted" })
    } catch (error) {
        console.error("Error deleting event:", error)
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
    }
}
