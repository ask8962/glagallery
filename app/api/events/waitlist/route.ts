"use server"

import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"
import { FieldValue } from "firebase-admin/firestore"

// POST: Join waitlist for an event
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuthToken(request)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { eventId } = await request.json()

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
        }

        const eventRef = adminDb.collection("events").doc(eventId)
        const eventDoc = await eventRef.get()

        if (!eventDoc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 })
        }

        const event = eventDoc.data()!
        const userId = authResult.user.uid

        // Check if already on waitlist
        if (event.waitlist?.includes(userId)) {
            return NextResponse.json({ error: "Already on waitlist" }, { status: 409 })
        }

        // Check if already registered
        const existingTicket = await adminDb
            .collection("tickets")
            .where("eventId", "==", eventId)
            .where("userId", "==", userId)
            .limit(1)
            .get()

        if (!existingTicket.empty) {
            return NextResponse.json({ error: "Already registered for this event" }, { status: 409 })
        }

        // Add to waitlist
        await eventRef.update({
            waitlist: FieldValue.arrayUnion(userId)
        })

        // Get updated position
        const updatedEvent = await eventRef.get()
        const waitlistPosition = (updatedEvent.data()?.waitlist || []).indexOf(userId) + 1

        return NextResponse.json({
            success: true,
            message: "Added to waitlist",
            position: waitlistPosition
        })

    } catch (error: any) {
        console.error("Waitlist join error:", error)
        return NextResponse.json({ error: error.message || "Failed to join waitlist" }, { status: 500 })
    }
}

// DELETE: Leave waitlist
export async function DELETE(request: NextRequest) {
    try {
        const authResult = await verifyAuthToken(request)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get("eventId")

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
        }

        const eventRef = adminDb.collection("events").doc(eventId)
        const userId = authResult.user.uid

        await eventRef.update({
            waitlist: FieldValue.arrayRemove(userId)
        })

        return NextResponse.json({ success: true, message: "Removed from waitlist" })

    } catch (error: any) {
        console.error("Waitlist leave error:", error)
        return NextResponse.json({ error: error.message || "Failed to leave waitlist" }, { status: 500 })
    }
}

// GET: Check waitlist status for current user
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyAuthToken(request)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get("eventId")

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
        }

        const eventDoc = await adminDb.collection("events").doc(eventId).get()

        if (!eventDoc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 })
        }

        const event = eventDoc.data()!
        const userId = authResult.user.uid
        const waitlist = event.waitlist || []
        const isOnWaitlist = waitlist.includes(userId)
        const position = isOnWaitlist ? waitlist.indexOf(userId) + 1 : null

        return NextResponse.json({
            isOnWaitlist,
            position,
            totalWaiting: waitlist.length
        })

    } catch (error: any) {
        console.error("Waitlist status error:", error)
        return NextResponse.json({ error: error.message || "Failed to get waitlist status" }, { status: 500 })
    }
}
