import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue, Timestamp } from "firebase-admin/firestore"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"
import { rsvpSchema } from "@/lib/validations/events"
import { nanoid } from "nanoid"
import { EventTicket } from "@/lib/types"

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate User
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // 2. Validate Body
        const body = await request.json()
        const validation = rsvpSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
        }

        const { eventId, ticketsCount } = validation.data

        // 3. Get Event & Check Capacity
        const eventRef = adminDb.collection("events").doc(eventId)
        const eventDoc = await eventRef.get()

        if (!eventDoc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 })
        }

        const eventData = eventDoc.data()
        if (!eventData) {
            return NextResponse.json({ error: "Event data missing" }, { status: 500 })
        }

        // 4. CHECK USER RESTRICTIONS (No-Show Penalty System)
        // For paid events, check if user is restricted due to no-shows
        if (!eventData.isFree) {
            const userDoc = await adminDb.collection("users").doc(decoded.uid).get()
            const userData = userDoc.data()

            if (userData?.eventRestricted) {
                return NextResponse.json({
                    error: "You are restricted from registering for paid events due to repeated no-shows. Please contact support.",
                    restricted: true,
                    reliabilityScore: userData.reliabilityScore || 0
                }, { status: 403 })
            }
        }

        // 5. PREVENT DUPLICATE REGISTRATION
        const existingTicketQuery = await adminDb.collection("tickets")
            .where("eventId", "==", eventId)
            .where("userId", "==", decoded.uid)
            .limit(1)
            .get()

        if (!existingTicketQuery.empty) {
            return NextResponse.json({
                error: "You are already registered for this event",
                alreadyRegistered: true
            }, { status: 409 }) // 409 Conflict
        }

        // 6. USE TRANSACTION TO PREVENT RACE CONDITION
        // This ensures atomic: capacity check + ticket creation + count increment
        const result = await adminDb.runTransaction(async (transaction) => {
            // Re-read event inside transaction for consistency
            const eventSnapshot = await transaction.get(eventRef)
            const eventDataTx = eventSnapshot.data()

            if (!eventDataTx) {
                throw new Error("Event data missing")
            }

            // Check capacity inside transaction
            const currentRegistered = eventDataTx.registeredCount || 0
            const remainingCapacity = eventDataTx.capacity - currentRegistered

            if (remainingCapacity < ticketsCount) {
                throw new Error("NOT_ENOUGH_CAPACITY")
            }

            // Check for duplicate registration inside transaction
            const existingTicketQueryTx = await adminDb.collection("tickets")
                .where("eventId", "==", eventId)
                .where("userId", "==", decoded.uid)
                .limit(1)
                .get()

            if (!existingTicketQueryTx.empty) {
                throw new Error("ALREADY_REGISTERED")
            }

            // Generate Ticket
            const ticketCode = `GLA-${nanoid(8).toUpperCase()}`

            const ticket: Omit<EventTicket, "id"> = {
                eventId,
                eventTitle: eventDataTx.title,
                userId: decoded.uid,
                userName: decoded.name || "User",
                userEmail: decoded.email || "",
                ticketCode,
                status: "valid",
                bookedAt: Timestamp.now(),
            }

            // Create ticket document
            const ticketRef = adminDb.collection("tickets").doc()
            transaction.set(ticketRef, ticket)

            // Update event registration count
            transaction.update(eventRef, {
                registeredCount: FieldValue.increment(ticketsCount)
            })

            // Update user's event stats
            const userRef = adminDb.collection("users").doc(decoded.uid)
            transaction.update(userRef, {
                "eventStats.registered": FieldValue.increment(1)
            })

            return { ticketId: ticketRef.id, ticketCode }
        })

        // Fire-and-forget: send ticket confirmation email
        try {
            const eventData = (await eventRef.get()).data()
            const startDate = eventData?.startDate?.toDate?.() || eventData?.startDate
            const eventDateStr = startDate ? new Date(startDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : undefined
            const eventTimeStr = startDate ? new Date(startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : undefined

            const emailPayload = {
                notificationId: `ticket-${result.ticketId}`,
                userId: decoded.uid,
                userEmail: decoded.email || "",
                type: "event_ticket",
                title: `Ticket Confirmed: ${eventData?.title || "Event"}`,
                message: `Your ticket for ${eventData?.title || "the event"} has been confirmed! Your ticket code is ${result.ticketCode}. ${eventDateStr ? `Date: ${eventDateStr}.` : ""} ${eventTimeStr ? `Time: ${eventTimeStr}.` : ""} ${eventData?.venue || eventData?.location ? `Venue: ${eventData?.venue || eventData?.location}.` : ""}`,
                link: "/events/my-tickets",
            }

            // Use the same origin as the current request (works in both dev & prod)
            const origin = request.nextUrl.origin
            console.log("📧 Sending ticket email to:", decoded.email, "via:", origin)

            fetch(`${origin}/api/notifications/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(emailPayload),
            })
                .then(res => console.log("📧 Ticket email API response:", res.status))
                .catch((err: any) => console.error("❌ Failed to send ticket email:", err.message))

        } catch (emailError: any) {
            console.error("Error preparing ticket email:", emailError.message)
        }

        return NextResponse.json({
            success: true,
            ticketId: result.ticketId,
            ticketCode: result.ticketCode,
            message: "Registration successful!"
        })

    } catch (error: any) {
        console.error("RSVP Error:", error)

        // Handle specific transaction errors with proper status codes
        if (error.message === "NOT_ENOUGH_CAPACITY") {
            return NextResponse.json({ error: "Not enough tickets available" }, { status: 400 })
        }
        if (error.message === "ALREADY_REGISTERED") {
            return NextResponse.json({
                error: "You are already registered for this event",
                alreadyRegistered: true
            }, { status: 409 })
        }

        return NextResponse.json(
            { error: error.message || "Failed to process RSVP" },
            { status: 500 }
        )
    }
}
