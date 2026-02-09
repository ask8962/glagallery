import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"

// POST: Admin approves or rejects faculty registration
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
        const { requestId, action, rejectionReason } = body

        if (!requestId || !["approve", "reject"].includes(action)) {
            return NextResponse.json(
                { error: "requestId and action (approve/reject) required" },
                { status: 400 }
            )
        }

        // Get the request
        const requestRef = adminDb.collection("faculty_requests").doc(requestId)
        const requestDoc = await requestRef.get()

        if (!requestDoc.exists) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 })
        }

        const requestData = requestDoc.data()!

        if (requestData.status !== "pending") {
            return NextResponse.json(
                { error: "Request already processed" },
                { status: 400 }
            )
        }

        if (action === "approve") {
            // Update request status
            await requestRef.update({
                status: "approved",
                reviewedAt: new Date().toISOString(),
                reviewedBy: adminUid,
            })

            // Update user profile to faculty role
            const userRef = adminDb.collection("users").doc(requestData.uid)
            await userRef.update({
                role: "faculty",
                facultyProfile: {
                    department: requestData.department,
                    designation: requestData.designation,
                    employeeId: requestData.employeeId,
                    cabinNumber: requestData.cabinNumber,
                    officeHours: requestData.officeHours,
                    subjects: requestData.subjects || [],
                    researchAreas: requestData.researchAreas || [],
                    advisedClubs: [],
                    publications: 0,
                    isVerified: true,
                    verifiedAt: new Date().toISOString(),
                }
            })

            return NextResponse.json({
                success: true,
                message: "Faculty registration approved"
            })
        } else {
            // Reject
            if (!rejectionReason) {
                return NextResponse.json(
                    { error: "Rejection reason required" },
                    { status: 400 }
                )
            }

            await requestRef.update({
                status: "rejected",
                reviewedAt: new Date().toISOString(),
                reviewedBy: adminUid,
                rejectionReason,
            })

            return NextResponse.json({
                success: true,
                message: "Faculty registration rejected"
            })
        }
    } catch (error) {
        console.error("Faculty verification error:", error)
        return NextResponse.json(
            { error: "Failed to process verification" },
            { status: 500 }
        )
    }
}

// GET: List all pending faculty requests (admin only)
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

        const requestsSnap = await adminDb
            .collection("faculty_requests")
            .where("status", "==", status)
            .orderBy("submittedAt", "desc")
            .limit(50)
            .get()

        const requests = requestsSnap.docs.map(doc => doc.data())

        // Enrich with user info
        const enrichedRequests = await Promise.all(
            requests.map(async (req) => {
                const userDoc = await adminDb.collection("users").doc(req.uid).get()
                const userData = userDoc.data()
                return {
                    ...req,
                    userName: userData?.name || "Unknown",
                    userPhoto: userData?.photoURL || null,
                }
            })
        )

        return NextResponse.json({ requests: enrichedRequests })
    } catch (error) {
        console.error("Error fetching faculty requests:", error)
        return NextResponse.json(
            { error: "Failed to fetch requests" },
            { status: 500 }
        )
    }
}
