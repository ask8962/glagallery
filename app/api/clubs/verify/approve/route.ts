import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"

// POST: Admin approves or rejects club verification
export async function POST(req: NextRequest) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const adminUid = authResult.user.uid

        // Verify admin role
        const adminDoc = await adminDb.collection("users").doc(adminUid).get()
        const adminData = adminDoc.data()

        if (!adminData || !["admin", "super_admin", "dean"].includes(adminData.role)) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const body = await req.json()
        const { clubId, action, rejectionReason } = body

        if (!clubId || !["approve", "reject"].includes(action)) {
            return NextResponse.json(
                { error: "clubId and action (approve/reject) required" },
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

        if (clubData.verification?.status !== "pending") {
            return NextResponse.json(
                { error: "No pending verification request" },
                { status: 400 }
            )
        }

        if (action === "approve") {
            await clubRef.update({
                "verification.status": "verified",
                "verification.verifiedAt": new Date().toISOString(),
                "verification.verifiedBy": adminUid,
                updatedAt: new Date().toISOString(),
            })

            // If there's an advisor, update their advisedClubs
            if (clubData.verification.advisorUid) {
                const advisorRef = adminDb.collection("users").doc(clubData.verification.advisorUid)
                const advisorDoc = await advisorRef.get()
                const advisorData = advisorDoc.data()

                if (advisorData?.facultyProfile) {
                    const currentClubs = advisorData.facultyProfile.advisedClubs || []
                    if (!currentClubs.includes(clubId)) {
                        await advisorRef.update({
                            "facultyProfile.advisedClubs": [...currentClubs, clubId],
                            role: "club_advisor", // Promote to club_advisor role
                        })
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: "Club verified successfully"
            })
        } else {
            if (!rejectionReason) {
                return NextResponse.json(
                    { error: "Rejection reason required" },
                    { status: 400 }
                )
            }

            await clubRef.update({
                "verification.status": "rejected",
                "verification.verifiedAt": new Date().toISOString(),
                "verification.verifiedBy": adminUid,
                "verification.rejectionReason": rejectionReason,
                updatedAt: new Date().toISOString(),
            })

            return NextResponse.json({
                success: true,
                message: "Verification rejected"
            })
        }
    } catch (error) {
        console.error("Club verification action error:", error)
        return NextResponse.json(
            { error: "Failed to process verification" },
            { status: 500 }
        )
    }
}

// GET: List all pending club verifications (admin only)
export async function GET(req: NextRequest) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const adminUid = authResult.user.uid

        // Verify admin role
        const adminDoc = await adminDb.collection("users").doc(adminUid).get()
        const adminData = adminDoc.data()

        if (!adminData || !["admin", "super_admin", "dean"].includes(adminData.role)) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status") || "pending"

        const clubsSnap = await adminDb
            .collection("clubs")
            .where("verification.status", "==", status)
            .limit(50)
            .get()

        const clubs = clubsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }))

        return NextResponse.json({ clubs })
    } catch (error) {
        console.error("Error fetching pending verifications:", error)
        return NextResponse.json(
            { error: "Failed to fetch verifications" },
            { status: 500 }
        )
    }
}
