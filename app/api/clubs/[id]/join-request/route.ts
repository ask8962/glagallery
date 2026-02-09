import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"
import { FieldValue } from "firebase-admin/firestore"
import { z } from "zod"

const joinRequestSchema = z.object({
    message: z.string().max(500).optional(),
})

// POST - Request to join a club
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clubId } = await params

        // 1. Authenticate
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // 2. Check if club exists
        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()
        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const clubData = clubDoc.data()

        // 3. Check if already a member
        if (clubData?.members?.includes(decoded.uid)) {
            return NextResponse.json({ error: "You are already a member" }, { status: 400 })
        }

        // 4. Check for existing pending request
        const existingRequest = await adminDb
            .collection("clubJoinRequests")
            .where("clubId", "==", clubId)
            .where("userId", "==", decoded.uid)
            .where("status", "==", "pending")
            .limit(1)
            .get()

        if (!existingRequest.empty) {
            return NextResponse.json({ error: "You already have a pending request" }, { status: 409 })
        }

        // 5. Validate body
        const body = await request.json().catch(() => ({}))
        const validation = joinRequestSchema.safeParse(body)
        const message = validation.success ? validation.data.message : undefined

        // 6. Create join request
        const requestRef = adminDb.collection("clubJoinRequests").doc()
        await requestRef.set({
            clubId,
            clubName: clubData?.name || "Unknown Club",
            userId: decoded.uid,
            userName: decoded.name || "User",
            userEmail: decoded.email || "",
            userPhoto: null, // Photo will be fetched from user profile if needed
            message,
            status: "pending",
            createdAt: FieldValue.serverTimestamp(),
        })

        return NextResponse.json({
            success: true,
            requestId: requestRef.id,
            message: "Join request sent! The club admins will review it.",
        })

    } catch (error: any) {
        console.error("Join Request Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET - Get pending requests (admins only) or user's own request status
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clubId } = await params
        const { searchParams } = new URL(request.url)
        const checkStatus = searchParams.get("checkStatus") === "true"

        // 1. Authenticate
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // If checkStatus=true, check user's own request status
        if (checkStatus) {
            const userRequest = await adminDb
                .collection("clubJoinRequests")
                .where("clubId", "==", clubId)
                .where("userId", "==", decoded.uid)
                .orderBy("createdAt", "desc")
                .limit(1)
                .get()

            if (userRequest.empty) {
                return NextResponse.json({ status: null })
            }

            const reqData = userRequest.docs[0].data()
            return NextResponse.json({
                status: reqData.status,
                requestId: userRequest.docs[0].id,
            })
        }

        // Otherwise, return all pending requests (admins only)
        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()
        const clubData = clubDoc.data()
        const isAdmin = clubData?.presidentUid === decoded.uid ||
            clubData?.admins?.includes(decoded.uid)

        if (!isAdmin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const requestsSnapshot = await adminDb
            .collection("clubJoinRequests")
            .where("clubId", "==", clubId)
            .where("status", "==", "pending")
            .orderBy("createdAt", "desc")
            .get()

        const requests = requestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        }))

        return NextResponse.json({ requests })

    } catch (error: any) {
        console.error("Get Join Requests Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH - Approve or reject a request
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clubId } = await params
        const body = await request.json()
        const { requestId, action } = body

        if (!requestId || !["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 })
        }

        // 1. Authenticate
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // 2. Verify admin
        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()
        const clubData = clubDoc.data()
        const isAdmin = clubData?.presidentUid === decoded.uid ||
            clubData?.admins?.includes(decoded.uid)

        if (!isAdmin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        // 3. Get the request
        const requestDoc = await adminDb.collection("clubJoinRequests").doc(requestId).get()
        if (!requestDoc.exists) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 })
        }

        const requestData = requestDoc.data()
        if (requestData?.clubId !== clubId) {
            return NextResponse.json({ error: "Request doesn't belong to this club" }, { status: 400 })
        }

        // 4. Update request status
        await requestDoc.ref.update({
            status: action === "approve" ? "approved" : "rejected",
            reviewedAt: FieldValue.serverTimestamp(),
            reviewedBy: decoded.uid,
        })

        // 5. If approved, add user to club members
        if (action === "approve") {
            await adminDb.collection("clubs").doc(clubId).update({
                members: FieldValue.arrayUnion(requestData?.userId),
            })
        }

        return NextResponse.json({
            success: true,
            message: action === "approve"
                ? "Member added to club!"
                : "Request rejected",
        })

    } catch (error: any) {
        console.error("Process Join Request Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
