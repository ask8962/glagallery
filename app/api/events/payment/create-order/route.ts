import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"
import Razorpay from "razorpay"
import { nanoid } from "nanoid"

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate User
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // 2. Parse Body
        const { eventId, ticketsCount = 1 } = await request.json()

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
        }

        // 3. Fetch Event Details
        const eventRef = adminDb.collection("events").doc(eventId)
        const eventDoc = await eventRef.get()

        if (!eventDoc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 })
        }

        const eventData = eventDoc.data()
        if (!eventData) {
            return NextResponse.json({ error: "Event data missing" }, { status: 500 })
        }

        // 4. Validate: Must be a paid event
        if (eventData.isFree) {
            return NextResponse.json({ error: "This is a free event. Use RSVP instead." }, { status: 400 })
        }

        // 5. Check Capacity
        const currentRegistered = eventData.registeredCount || 0
        const remainingCapacity = eventData.capacity - currentRegistered

        if (remainingCapacity < ticketsCount) {
            return NextResponse.json({ error: "Not enough capacity" }, { status: 400 })
        }

        // 6. Check for duplicate registration
        const existingTicket = await adminDb.collection("tickets")
            .where("eventId", "==", eventId)
            .where("userId", "==", decoded.uid)
            .limit(1)
            .get()

        if (!existingTicket.empty) {
            return NextResponse.json({ error: "You are already registered for this event" }, { status: 409 })
        }

        // 7. Check No-Show restriction
        const userDoc = await adminDb.collection("users").doc(decoded.uid).get()
        const userData = userDoc.data()

        if (userData?.eventRestricted) {
            return NextResponse.json({
                error: "You are restricted from paid events due to repeated no-shows."
            }, { status: 403 })
        }

        // 8. Calculate Amount (price is in INR, Razorpay needs paise)
        const amountInPaise = Math.round((eventData.price || 0) * ticketsCount * 100)

        if (amountInPaise <= 0) {
            return NextResponse.json({ error: "Invalid price" }, { status: 400 })
        }

        // 9. Create Razorpay Order
        const receipt = `evt_${nanoid(12)}`
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt,
            notes: {
                eventId,
                userId: decoded.uid,
                eventTitle: eventData.title,
                ticketsCount: String(ticketsCount),
            }
        })

        // 10. Save transaction record (pending)
        await adminDb.collection("transactions").doc(order.id).set({
            id: order.id,
            orderId: order.id,
            eventId,
            userId: decoded.uid,
            amount: amountInPaise,
            currency: "INR",
            status: "created",
            receipt,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: amountInPaise,
            currency: "INR",
            eventTitle: eventData.title,
        })

    } catch (error: any) {
        console.error("Create Order Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to create payment order" },
            { status: 500 }
        )
    }
}
