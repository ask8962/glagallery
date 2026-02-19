/**
 * POST /api/campaign/claim
 *
 * Secure reward claim endpoint.
 * - Verifies Firebase ID token (server-side)
 * - Rate limits by UID + IP
 * - Generates reward amount on server only (₹30–₹50)
 * - Enforces one-claim-per-UID via Firestore doc ID
 * - Anti-fraud: flags rapid multi-account claims from same IP
 * - Writes audit logs for every attempt
 */

import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken, checkServerRateLimit, getClientIP } from "@/lib/server-auth"
import { Timestamp } from "firebase-admin/firestore"

// ── Constants (server-only, never exposed to client) ──────────────
const REWARD_MIN = 30
const REWARD_MAX = 50
const FRAUD_IP_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const FRAUD_IP_THRESHOLD = 3 // max unique UIDs per IP per window

// ── Helpers ───────────────────────────────────────────────────────

/** Generate a cryptographically-adequate random integer in [min, max] */
function generateRewardAmount(): number {
    // Use crypto for better randomness than Math.random
    if (typeof globalThis.crypto !== "undefined") {
        const array = new Uint32Array(1)
        globalThis.crypto.getRandomValues(array)
        return REWARD_MIN + (array[0] % (REWARD_MAX - REWARD_MIN + 1))
    }
    return Math.floor(Math.random() * (REWARD_MAX - REWARD_MIN + 1)) + REWARD_MIN
}

/** Log an audit event to reward_audit_logs */
async function writeAuditLog(
    action: string,
    uid: string,
    ip: string,
    userAgent: string,
    details: Record<string, unknown> = {}
) {
    try {
        await adminDb.collection("reward_audit_logs").add({
            action,
            uid,
            ip,
            userAgent,
            details,
            createdAt: Timestamp.now(),
        })
    } catch (err) {
        console.error("Failed to write audit log:", err)
    }
}

// ── POST Handler ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const ip = getClientIP(request)
    const userAgent = request.headers.get("user-agent") || "unknown"

    try {
        // 1. ── Verify Firebase Auth Token ──────────────────────────────
        const auth = await verifyAuthToken(request)
        if (!auth.authenticated || !auth.user) {
            await writeAuditLog("claim_attempt", "unknown", ip, userAgent, {
                error: "Authentication failed",
            })
            return NextResponse.json(
                { error: "Authentication required. Please sign in." },
                { status: 401 }
            )
        }

        const { uid, email } = auth.user

        // 2. ── Rate Limit (UID-based) ─────────────────────────────────
        const uidLimit = await checkServerRateLimit(uid, "CAMPAIGN_CLAIM")
        if (!uidLimit.allowed) {
            await writeAuditLog("claim_attempt", uid, ip, userAgent, {
                error: "Rate limit exceeded (UID)",
                remaining: uidLimit.remaining,
            })
            return NextResponse.json(
                { error: "Too many attempts. Please try again later." },
                { status: 429 }
            )
        }

        // 3. ── Rate Limit (IP-based) ──────────────────────────────────
        const ipLimit = await checkServerRateLimit(`ip:${ip}`, "CAMPAIGN_CLAIM")
        if (!ipLimit.allowed) {
            await writeAuditLog("claim_attempt", uid, ip, userAgent, {
                error: "Rate limit exceeded (IP)",
            })
            return NextResponse.json(
                { error: "Too many attempts from your network. Please try again later." },
                { status: 429 }
            )
        }

        // 4. ── Parse Body ─────────────────────────────────────────────
        let body: { consent?: boolean; referrerUid?: string }
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                { error: "Invalid request body." },
                { status: 400 }
            )
        }

        if (!body.consent) {
            return NextResponse.json(
                { error: "You must accept the Terms & Privacy Policy to claim." },
                { status: 400 }
            )
        }

        // 5. ── Check if Already Claimed ───────────────────────────────
        const claimRef = adminDb.collection("campaign_claims").doc(uid)
        const existingClaim = await claimRef.get()

        if (existingClaim.exists) {
            const data = existingClaim.data()
            return NextResponse.json(
                {
                    error: "You have already claimed your reward.",
                    alreadyClaimed: true,
                    amount: data?.rewardAmount,
                    status: data?.status,
                },
                { status: 409 }
            )
        }

        // 6. ── Anti-Fraud: IP Velocity Check ──────────────────────────
        let flagged = false
        try {
            const oneHourAgo = Timestamp.fromMillis(Date.now() - FRAUD_IP_WINDOW_MS)
            const recentFromIP = await adminDb
                .collection("campaign_claims")
                .where("ipAddress", "==", ip)
                .where("claimedAt", ">=", oneHourAgo)
                .get()

            if (recentFromIP.size >= FRAUD_IP_THRESHOLD) {
                flagged = true
                await writeAuditLog("fraud_flag", uid, ip, userAgent, {
                    reason: "Multiple accounts claiming from same IP",
                    recentClaimsFromIP: recentFromIP.size,
                })
            }
        } catch (err) {
            // Non-blocking — don't fail the claim for anti-fraud query errors
            console.error("Anti-fraud check error:", err)
        }

        // 7. ── Generate Reward (SERVER-ONLY) ──────────────────────────
        const rewardAmount = generateRewardAmount()

        // 8. ── Process Referral ───────────────────────────────────────
        let referrerUid: string | null = null
        if (body.referrerUid && body.referrerUid !== uid) {
            // Validate referrer exists and has already claimed
            const referrerDoc = await adminDb
                .collection("campaign_claims")
                .doc(body.referrerUid)
                .get()

            if (referrerDoc.exists) {
                referrerUid = body.referrerUid

                // Credit referrer with ₹10 bonus (update existing doc)
                const referrerData = referrerDoc.data()
                const currentBonus = referrerData?.referralBonus || 0
                await adminDb
                    .collection("campaign_claims")
                    .doc(body.referrerUid)
                    .update({
                        referralBonus: currentBonus + 10,
                    })

                await writeAuditLog("referral_credit", body.referrerUid, ip, userAgent, {
                    refereeUid: uid,
                    bonusAmount: 10,
                })
            }
        }

        // 9. ── Write Claim Document ───────────────────────────────────
        await claimRef.set({
            uid,
            email: email || "",
            displayName: auth.user.name || auth.user.email || "",
            rewardAmount,
            referrerUid: referrerUid || null,
            referralBonus: 0,
            ipAddress: ip,
            userAgent,
            consentGiven: true,
            status: flagged ? "flagged" : "claimed",
            claimedAt: Timestamp.now(),
        })

        // 10. ── Write Success Audit Log ───────────────────────────────
        await writeAuditLog("claim_success", uid, ip, userAgent, {
            rewardAmount,
            status: flagged ? "flagged" : "claimed",
            referrerUid: referrerUid || "none",
        })

        return NextResponse.json({
            success: true,
            amount: rewardAmount,
            status: flagged ? "flagged" : "claimed",
            message: flagged
                ? "Your reward is under review and will be processed shortly."
                : `Congratulations! You've earned ₹${rewardAmount}!`,
        })
    } catch (error: any) {
        console.error("Campaign claim error:", error)
        await writeAuditLog("claim_attempt", "error", ip, userAgent, {
            error: error.message,
        })
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}
