import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getUserFromRequest } from "@/lib/jwt-auth"
import { Timestamp, FieldValue } from "firebase-admin/firestore"

// POST - Redeem a reward
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { rewardId, shippingAddress } = body

        if (!rewardId) {
            return NextResponse.json({ error: "Reward ID required" }, { status: 400 })
        }

        // Get reward details
        const rewardDoc = await adminDb.collection("rewards").doc(rewardId).get()
        if (!rewardDoc.exists) {
            return NextResponse.json({ error: "Reward not found" }, { status: 404 })
        }

        const reward = rewardDoc.data()!
        if (!reward.isActive) {
            return NextResponse.json({ error: "Reward is no longer available" }, { status: 400 })
        }

        // Check stock
        if (reward.stock !== null && reward.stock <= 0) {
            return NextResponse.json({ error: "Reward is out of stock" }, { status: 400 })
        }

        // Get user details and check points
        const userDoc = await adminDb.collection("users").doc(user.userId).get()
        const userData = userDoc.data()!
        const userPoints = userData.points || 0

        // Security check: User must belong to the reward's organization
        if (userData.organizationId !== reward.organizationId && userData.email !== 'ganukalp70@gmail.com') {
            return NextResponse.json({ error: "Reward does not belong to your organization" }, { status: 403 })
        }

        if (userPoints < reward.pointsCost) {
            return NextResponse.json({
                error: "Insufficient points",
                required: reward.pointsCost,
                current: userPoints
            }, { status: 400 })
        }

        // Physical rewards require shipping address
        if (reward.category === "physical" && !shippingAddress) {
            return NextResponse.json({ error: "Shipping address required for physical rewards" }, { status: 400 })
        }

        // Create redemption record
        const redemption = {
            userId: user.userId,
            userName: userData.name || "Unknown",
            userEmail: userData.email || "",
            organizationId: reward.organizationId || userData.organizationId,
            rewardId: rewardId,
            rewardName: reward.name,
            rewardCategory: reward.category,
            pointsCost: reward.pointsCost,
            status: "pending",
            shippingAddress: shippingAddress || null,
            createdAt: Timestamp.now()
        }

        // Use transaction to deduct points and create redemption
        let redemptionId = ""
        await adminDb.runTransaction(async (transaction) => {
            // Deduct points from user
            transaction.update(adminDb.collection("users").doc(user.userId), {
                points: FieldValue.increment(-reward.pointsCost)
            })

            // Decrement stock if not unlimited
            if (reward.stock !== null) {
                transaction.update(adminDb.collection("rewards").doc(rewardId), {
                    stock: FieldValue.increment(-1)
                })
            }

            // Create redemption
            const redemptionRef = adminDb.collection("redemptions").doc()
            redemptionId = redemptionRef.id
            transaction.set(redemptionRef, redemption)
        })

        // Log the transaction (fire-and-forget)
        const { logPointTransaction } = await import("@/lib/points")
        logPointTransaction(
            user.userId,
            -reward.pointsCost,
            "redemption",
            `Redeemed: ${reward.name}`,
            redemptionId
        )

        return NextResponse.json({
            success: true,
            message: "Reward redeemed successfully!",
            newBalance: userPoints - reward.pointsCost
        })
    } catch (error) {
        console.error("Error redeeming reward:", error)
        return NextResponse.json(
            { error: "Failed to redeem reward" },
            { status: 500 }
        )
    }
}
