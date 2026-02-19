import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"
import { isAdminEmail } from "@/lib/config"

export const dynamic = "force-dynamic"

// GET: Fetch all claims (Admin only)
export async function GET(request: NextRequest) {
    try {
        // 1. Verify Auth & Admin Status
        const auth = await verifyAuthToken(request)
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isAdminEmail(auth.user.email)) {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 })
        }

        // 2. Fetch Claims
        const snapshot = await adminDb
            .collection("campaign_claims")
            .orderBy("claimedAt", "desc")
            .limit(100) // Pagination can be added later if needed
            .get()

        const claims = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
            claimedAt: doc.data().claimedAt?.toDate?.()?.toISOString() || null,
        }))

        // 3. Calculate Stats
        const totalClaims = claims.length
        const totalAmount = claims.reduce((sum, c: any) => sum + (c.rewardAmount || 0), 0)
        const flaggedClaims = claims.filter((c: any) => c.status === "flagged").length

        return NextResponse.json({
            claims,
            stats: {
                totalClaims,
                totalAmount,
                flaggedClaims,
            },
        })
    } catch (error: any) {
        console.error("Admin claims fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch claims" },
            { status: 500 }
        )
    }
}

// PATCH: Update claim status (Admin only)
export async function PATCH(request: NextRequest) {
    try {
        const auth = await verifyAuthToken(request)
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isAdminEmail(auth.user.email)) {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 })
        }

        const { uid, status, notes } = await request.json()

        if (!uid || !status) {
            return NextResponse.json({ error: "Missing uid or status" }, { status: 400 })
        }

        await adminDb.collection("campaign_claims").doc(uid).update({
            status,
            adminNotes: notes || null,
            updatedAt: new Date(),
            updatedBy: auth.user.email,
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Admin claim update error:", error)
        return NextResponse.json(
            { error: "Failed to update claim" },
            { status: 500 }
        )
    }
}
