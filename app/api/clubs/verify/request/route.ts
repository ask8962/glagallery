import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"

// POST: Club admin submits verification request
export async function POST(req: NextRequest) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { uid } = authResult.user
        const body = await req.json()
        const {
            clubId,
            registrationNumber,
            advisorUid,
            documentURLs
        } = body

        if (!clubId || !registrationNumber) {
            return NextResponse.json(
                { error: "Club ID and registration number required" },
                { status: 400 }
            )
        }

        // Get the club
        const clubRef = adminDb.collection("clubs").doc(clubId)
        const clubDoc = await clubRef.get()

        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const clubData = clubDoc.data()!

        // Check if user is club admin or president
        if (clubData.presidentUid !== uid && !clubData.admins?.includes(uid)) {
            return NextResponse.json(
                { error: "Only club admins can request verification" },
                { status: 403 }
            )
        }

        // Check if already verified or pending
        if (clubData.verification?.status === "verified") {
            return NextResponse.json(
                { error: "Club is already verified" },
                { status: 400 }
            )
        }

        if (clubData.verification?.status === "pending") {
            return NextResponse.json(
                { error: "Verification request already pending" },
                { status: 400 }
            )
        }

        // Verify advisor exists and is faculty (if provided)
        if (advisorUid) {
            const advisorDoc = await adminDb.collection("users").doc(advisorUid).get()
            const advisorData = advisorDoc.data()

            if (!advisorData || !["faculty", "club_advisor", "department_head", "dean"].includes(advisorData.role)) {
                return NextResponse.json(
                    { error: "Invalid faculty advisor" },
                    { status: 400 }
                )
            }
        }

        // Update club with verification request
        await clubRef.update({
            verification: {
                status: "pending",
                registrationNumber,
                advisorUid: advisorUid || null,
                documents: documentURLs || [],
                submittedAt: new Date().toISOString(),
                verifiedAt: null,
                verifiedBy: null,
                rejectionReason: null,
            },
            updatedAt: new Date().toISOString(),
        })

        return NextResponse.json({
            success: true,
            message: "Verification request submitted successfully"
        })
    } catch (error) {
        console.error("Club verification request error:", error)
        return NextResponse.json(
            { error: "Failed to submit request" },
            { status: 500 }
        )
    }
}

// GET: Check club verification status
export async function GET(req: NextRequest) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const clubId = searchParams.get("clubId")

        if (!clubId) {
            return NextResponse.json({ error: "Club ID required" }, { status: 400 })
        }

        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()

        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const clubData = clubDoc.data()!
        const verification = clubData.verification || { status: "unverified" }

        return NextResponse.json({ verification })
    } catch (error) {
        console.error("Error fetching verification status:", error)
        return NextResponse.json(
            { error: "Failed to fetch status" },
            { status: 500 }
        )
    }
}
