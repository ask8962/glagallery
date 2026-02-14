/**
 * GET /api/campaign/status
 *
 * Returns the current user's campaign claim status.
 * - Verifies Firebase ID token
 * - Reads campaign_claims/{uid}
 * - Returns claimed state, amount, and status
 */

import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
    try {
        // 1. ── Verify Firebase Auth Token ──────────────────────────────
        const auth = await verifyAuthToken(request)
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 }
            )
        }

        const { uid } = auth.user

        // 2. ── Read Claim Document ─────────────────────────────────────
        const claimDoc = await adminDb.collection("campaign_claims").doc(uid).get()

        if (!claimDoc.exists) {
            return NextResponse.json({
                claimed: false,
            })
        }

        const data = claimDoc.data()

        return NextResponse.json({
            claimed: true,
            amount: data?.rewardAmount,
            status: data?.status,
            claimedAt: data?.claimedAt?.toDate?.()?.toISOString() || null,
            referralBonus: data?.referralBonus || 0,
        })
    } catch (error: any) {
        console.error("Campaign status error:", error)
        return NextResponse.json(
            { error: "Failed to check claim status." },
            { status: 500 }
        )
    }
}
