import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getUserFromRequest } from "@/lib/jwt-auth"

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if admin
        const userDoc = await adminDb.collection("users").doc(user.userId).get()
        const userData = userDoc.data()
        if (userData?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const { id } = params
        if (!id) {
            return NextResponse.json({ error: "Reward ID required" }, { status: 400 })
        }

        await adminDb.collection("rewards").doc(id).delete()

        return NextResponse.json({ success: true, message: "Reward deleted successfully" })
    } catch (error) {
        console.error("Error deleting reward:", error)
        return NextResponse.json(
            { error: "Failed to delete reward" },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if admin
        const userDoc = await adminDb.collection("users").doc(user.userId).get()
        const userData = userDoc.data()
        if (userData?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const { id } = params
        if (!id) {
            return NextResponse.json({ error: "Reward ID required" }, { status: 400 })
        }

        const body = await request.json()
        const { name, description, imageURL, category, pointsCost, stock, isActive } = body

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (imageURL !== undefined) updateData.imageURL = imageURL
        if (category !== undefined) updateData.category = category
        if (pointsCost !== undefined) updateData.pointsCost = Number(pointsCost)
        if (stock !== undefined) updateData.stock = stock === null || stock === "" ? null : Number(stock)
        if (isActive !== undefined) updateData.isActive = isActive

        await adminDb.collection("rewards").doc(id).update(updateData)

        return NextResponse.json({ success: true, message: "Reward updated successfully" })
    } catch (error) {
        console.error("Error updating reward:", error)
        return NextResponse.json(
            { error: "Failed to update reward" },
            { status: 500 }
        )
    }
}
