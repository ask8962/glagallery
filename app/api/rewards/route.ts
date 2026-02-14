import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdminAccess } from "@/lib/server-auth"
import { Timestamp } from "firebase-admin/firestore"

// GET - Fetch all active rewards
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const organizationId = url.searchParams.get("organizationId")

        if (!organizationId) {
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
        }

        const rewardsRef = adminDb.collection("rewards")
        const snapshot = await rewardsRef
            .where("organizationId", "==", organizationId)
            .where("isActive", "==", true)
            .orderBy("pointsCost", "asc")
            .get()

        const rewards = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return NextResponse.json({ rewards })
    } catch (error) {
        console.error("Error fetching rewards:", error)
        return NextResponse.json(
            { error: "Failed to fetch rewards" },
            { status: 500 }
        )
    }
}

// POST - Create new reward (Admin only)
export async function POST(request: NextRequest) {
    try {
        const authCheck = await verifyAdminAccess(request)
        if (!authCheck.authorized) {
            return NextResponse.json({ error: authCheck.error }, { status: 403 })
        }

        const body = await request.json()
        const { name, description, imageURL, category, pointsCost, stock, organizationId } = body

        if (!name || !description || !category || !pointsCost || !organizationId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const rewardData = {
            name,
            description,
            imageURL: imageURL || "/placeholder-reward.png",
            category,
            pointsCost: Number(pointsCost),
            stock: stock !== null ? Number(stock) : null,
            organizationId,
            isActive: true,
            createdAt: Timestamp.now()
        }

        const docRef = await adminDb.collection("rewards").add(rewardData)

        return NextResponse.json({
            success: true,
            id: docRef.id,
            message: "Reward created successfully"
        })
    } catch (error) {
        console.error("Error creating reward:", error)
        return NextResponse.json(
            { error: "Failed to create reward" },
            { status: 500 }
        )
    }
}
