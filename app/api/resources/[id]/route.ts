import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params
        const id = params.id
        if (!id) return NextResponse.json({ error: "Missing resource ID" }, { status: 400 })

        const doc = await adminDb.collection("academicResources").doc(id).get()
        if (!doc.exists) return NextResponse.json({ error: "Resource not found" }, { status: 404 })

        return NextResponse.json({
            id: doc.id,
            ...doc.data()
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
