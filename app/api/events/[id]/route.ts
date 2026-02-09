import { NextRequest, NextResponse } from "next/server"

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
    const params = await props.params;
    // Update event logic
    return NextResponse.json({ message: "Update Endpoint Ready" })
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    // Delete event logic
    return NextResponse.json({ message: "Delete Endpoint Ready" })
}
