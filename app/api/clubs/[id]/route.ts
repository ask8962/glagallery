import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"

interface RouteContext {
    params: Promise<{ id: string }>
}

// GET: Get club by ID
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params

        const clubDoc = await adminDb.collection("clubs").doc(id).get()

        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const clubData = clubDoc.data()

        // Don't return inactive clubs to non-admins
        if (clubData?.status === "inactive") {
            const token = getTokenFromRequest(request)
            if (token) {
                const decoded = await verifyIdToken(token)
                // Allow if user is club admin
                if (decoded && clubData.admins?.includes(decoded.uid)) {
                    return NextResponse.json({ id: clubDoc.id, ...clubData })
                }
            }
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        return NextResponse.json({ club: { id: clubDoc.id, ...clubData } })

    } catch (error: any) {
        console.error("Get Club Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH: Update club (Club admins only)
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params

        // 1. Authenticate
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // 2. Get Club and verify permissions
        const clubRef = adminDb.collection("clubs").doc(id)
        const clubDoc = await clubRef.get()

        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const clubData = clubDoc.data()!

        // Check if user is club admin
        if (clubData.presidentUid !== decoded.uid && !clubData.admins?.includes(decoded.uid)) {
            return NextResponse.json({ error: "You don't have permission to edit this club" }, { status: 403 })
        }

        // 3. Parse and validate updates
        const body = await request.json()
        const allowedFields = ["name", "description", "logoURL", "coverImageURL", "email", "socialLinks", "category"]

        const updates: Record<string, any> = {}
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field]
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
        }

        updates.updatedAt = new Date()

        await clubRef.update(updates)

        return NextResponse.json({
            success: true,
            message: "Club updated successfully"
        })

    } catch (error: any) {
        console.error("Update Club Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
