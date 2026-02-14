import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// GET: List all active clubs
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")
        const orgId = searchParams.get("orgId")
        const limit = parseInt(searchParams.get("limit") || "20", 10)

        if (!orgId) {
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
        }

        let query: any = adminDb.collection("clubs").where("status", "==", "active")

        if (orgId !== "ALL") {
            query = query.where("organizationId", "==", orgId)
        }

        if (category && category !== "all") {
            query = query.where("category", "==", category)
        }

        query = query.orderBy("name", "asc").limit(limit)

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
