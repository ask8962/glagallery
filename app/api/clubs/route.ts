import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// GET: List all active clubs
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")
        const limit = parseInt(searchParams.get("limit") || "20", 10)

        let query = adminDb.collection("clubs")
            .where("status", "==", "active")
            .orderBy("name", "asc")
            .limit(limit)

        if (category && category !== "all") {
            query = adminDb.collection("clubs")
                .where("status", "==", "active")
                .where("category", "==", category)
                .orderBy("name", "asc")
                .limit(limit)
        }

        const snapshot = await query.get()

        const clubs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return NextResponse.json({ clubs })

    } catch (error: any) {
        console.error("List Clubs Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
