import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getUserFromRequest } from "@/lib/jwt-auth"

// GET - Fetch point transaction history for authenticated user
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = Math.min(Number(searchParams.get("limit")) || 50, 100)

        const snapshot = await adminDb
            .collection("point_transactions")
            .where("userId", "==", user.userId)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get()

        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        // Also get current balance
        const userDoc = await adminDb.collection("users").doc(user.userId).get()
        const userData = userDoc.data()
        const currentBalance = userData?.points || 0

        return NextResponse.json({
            transactions,
            currentBalance
        })
    } catch (error) {
        console.error("Error fetching point history:", error)
        return NextResponse.json(
            { error: "Failed to fetch point history" },
            { status: 500 }
        )
    }
}
