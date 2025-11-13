import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { ticketId, ticketCode } = body

        if (!ticketId && !ticketCode) {
            return NextResponse.json(
                { error: "Ticket ID or Code is required" },
                { status: 400 }
            )
        }

        let ticketDoc
        let ticketRef

        // Find ticket by ID or Code
        if (ticketId) {
            ticketRef = adminDb.collection("tickets").doc(ticketId)
            ticketDoc = await ticketRef.get()
        } else {
            // Search by code
            const snapshot = await adminDb
                .collection("tickets")
                .where("ticketCode", "==", ticketCode)
                .limit(1)
                .get()

            if (snapshot.empty) {
                return NextResponse.json(
                    { valid: false, error: "Ticket not found" },
                    { status: 404 }
                )
            }

            ticketDoc = snapshot.docs[0]
            ticketRef = ticketDoc.ref
        }

        if (!ticketDoc.exists) {
            return NextResponse.json(
                { valid: false, error: "Ticket not found" },
                { status: 404 }
            )
        }

        const ticketData = ticketDoc.data()!

        // Check if already used
        if (ticketData.status === "used") {
            return NextResponse.json({
                valid: false,
                error: "Ticket already used",
                usedAt: ticketData.usedAt?.toDate?.() || ticketData.usedAt,
                ticketCode: ticketData.ticketCode,
                eventTitle: ticketData.eventTitle,
                userName: ticketData.userName,
            })
        }

        // Check if cancelled or expired
        if (ticketData.status === "cancelled" || ticketData.status === "expired") {
            return NextResponse.json({
                valid: false,
                error: `Ticket is ${ticketData.status}`,
                ticketCode: ticketData.ticketCode,
            })
        }

        // Mark ticket as used
        await ticketRef.update({
            status: "used",
            usedAt: FieldValue.serverTimestamp(),
        })

        // Update user's attended count (No-Show Penalty System)
        const userRef = adminDb.collection("users").doc(ticketData.userId)
        await userRef.update({
            "eventStats.attended": FieldValue.increment(1)
        })

        return NextResponse.json({
            valid: true,
            message: "Ticket verified successfully!",
            ticketCode: ticketData.ticketCode,
            eventTitle: ticketData.eventTitle,
            userName: ticketData.userName,
            userEmail: ticketData.userEmail,
        })

    } catch (error: any) {
        console.error("Verify Ticket Error:", error)
        return NextResponse.json(
            { valid: false, error: error.message || "Verification failed" },
            { status: 500 }
        )
    }
}
