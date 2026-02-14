import { NextRequest, NextResponse } from "next/server"

import { verifyAdminAccess } from "@/lib/server-auth"
import { eventSchema } from "@/lib/validations/events"
import { Timestamp } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import { Event } from "@/lib/types"

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const id = params.id
        const docRef = adminDb.collection("events").doc(id)
        const docSnap = await docRef.get()

        if (!docSnap.exists) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            )
        }

        const eventData = docSnap.data()

        // Convert Timestamps to serializable/Dates for the client
        const event = {
            id: docSnap.id,
            ...eventData,
            startDate: eventData?.startDate?.toDate().toISOString() || eventData?.startDate,
            endDate: eventData?.endDate?.toDate().toISOString() || eventData?.endDate,
            registrationDeadline: eventData?.registrationDeadline?.toDate().toISOString() || null,
            createdAt: eventData?.createdAt?.toDate().toISOString() || null,
            updatedAt: eventData?.updatedAt?.toDate().toISOString() || null,
        }

        return NextResponse.json(event)

    } catch (error: any) {
        console.error("Fetch Event Error:", error)
        return NextResponse.json(
            { error: "Failed to fetch event" },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = params.id
        
        // 1. Verify Authentication
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        
        const token = authHeader.replace("Bearer ", "")
        let user;
        try {
            const { verifyIdToken } = await import("@/lib/auth-utils")
            user = await verifyIdToken(token)
        } catch(e) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // 2. Fetch Existing Event to check ownership/permissions
        const docRef = adminDb.collection("events").doc(id)
        const docSnap = await docRef.get()
        
        if (!docSnap.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 })
        }
        
        const existingEvent = docSnap.data()
        
        // Check if admin or organizer
        const authCheck = await verifyAdminAccess(request)
        const isAdmin = authCheck.authorized === true
        
        if (!isAdmin && existingEvent?.organizerId !== user.uid) {
            return NextResponse.json({ error: "Permission Denied: Not the organizer" }, { status: 403 })
        }

        // 3. Parse and Validate Request
        const body = await request.json()
        const validation = eventSchema.safeParse(body)
        
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid data", details: validation.error.flatten() }, { status: 400 })
        }
        
        const data = validation.data
        
        // 4. Update Event Document
        const updateData = {
            ...data,
            startDate: Timestamp.fromDate(new Date(data.startDate)),
            endDate: Timestamp.fromDate(new Date(data.endDate)),
            registrationDeadline: data.registrationDeadline ? Timestamp.fromDate(new Date(data.registrationDeadline)) : null,
            allowedDomains: data.allowedDomainsText?.trim() 
                ? data.allowedDomainsText.split(',').map((d: string) => d.trim().toLowerCase()) 
                : [],
            updatedAt: Timestamp.now(),
        }
        
        await docRef.update(updateData)
        
        return NextResponse.json({ success: true, message: "Event updated successfully", eventId: id })

    } catch(err: any) {
        console.error("PUT Event Error:", err)
        return NextResponse.json({ error: err.message || "Failed to update event" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    // Delete event logic
    return NextResponse.json({ message: "Delete Endpoint Ready" })
}
