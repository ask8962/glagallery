import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"
import { FieldValue, Timestamp } from "firebase-admin/firestore"
import { nanoid } from "nanoid"
import crypto from "crypto"

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
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            eventId,
            ticketsCount = 1,
        } = await request.json()

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !eventId) {
            return NextResponse.json({ error: "Missing payment verification data" }, { status: 400 })
        }

        // 3. Verify Razorpay Signature (CRITICAL for security)
        const secret = process.env.RAZORPAY_KEY_SECRET!
        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex")

        if (expectedSignature !== razorpay_signature) {
            console.error("❌ Payment signature mismatch!")

            // Update transaction as failed
            await adminDb.collection("transactions").doc(razorpay_order_id).update({
                status: "failed",
                updatedAt: new Date().toISOString(),
            })

            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
        }

        // 4. Signature is valid — Process the ticket in a transaction
        const eventRef = adminDb.collection("events").doc(eventId)

        const result = await adminDb.runTransaction(async (transaction) => {
            // Re-read event for consistency
            const eventSnapshot = await transaction.get(eventRef)
            const eventData = eventSnapshot.data()

            if (!eventData) throw new Error("Event data missing")

            // Check capacity
            const currentRegistered = eventData.registeredCount || 0
            const remainingCapacity = eventData.capacity - currentRegistered

            if (remainingCapacity < ticketsCount) {
                throw new Error("NOT_ENOUGH_CAPACITY")
            }

            // Check duplicate
            const existingTicket = await adminDb.collection("tickets")
                .where("eventId", "==", eventId)
                .where("userId", "==", decoded.uid)
                .limit(1)
                .get()

            if (!existingTicket.empty) {
                throw new Error("ALREADY_REGISTERED")
            }

            // Generate tickets
            const ticketIds: string[] = []
            for (let i = 0; i < ticketsCount; i++) {
                const ticketCode = `TKT-${nanoid(10).toUpperCase()}`
                const ticketRef = adminDb.collection("tickets").doc()
                const ticketData = {
                    id: ticketRef.id,
                    eventId,
                    eventTitle: eventData.title || "Untitled Event",
                    userId: decoded.uid,
                    userName: decoded.name || decoded.email || "Unknown",
                    userEmail: decoded.email || "",
                    ticketCode,
                    status: "valid",
                    bookedAt: Timestamp.now(),
                    transactionId: razorpay_order_id,
                }

                transaction.create(ticketRef, ticketData)
                ticketIds.push(ticketRef.id)
            }

            // Increment registered count
            transaction.update(eventRef, {
                registeredCount: FieldValue.increment(ticketsCount),
            })

            return { ticketIds }
        })

        // 5. Update transaction as successful
        await adminDb.collection("transactions").doc(razorpay_order_id).update({
            status: "successful",
            paymentId: razorpay_payment_id,
            updatedAt: new Date().toISOString(),
        })

        console.log("✅ Payment verified & ticket created:", {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            eventId,
            userId: decoded.uid,
            ticketIds: result.ticketIds,
        })

        return NextResponse.json({
            success: true,
            message: "Payment verified. Ticket generated!",
            ticketIds: result.ticketIds,
        })

    } catch (error: any) {
        console.error("Payment Verify Error:", error)

        if (error.message === "NOT_ENOUGH_CAPACITY") {
            return NextResponse.json({ error: "Event is full. Payment will be refunded." }, { status: 400 })
        }
        if (error.message === "ALREADY_REGISTERED") {
            return NextResponse.json({ error: "You are already registered for this event" }, { status: 409 })
        }

        return NextResponse.json(
            { error: error.message || "Payment verification failed" },
            { status: 500 }
        )
    }
}
