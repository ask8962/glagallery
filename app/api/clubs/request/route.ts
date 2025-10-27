import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"
import { clubRequestSchema } from "@/lib/validations/clubs"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate User
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // 2. Validate GLA Email
        if (!decoded.email?.endsWith("@gla.ac.in")) {
            return NextResponse.json({ error: "Only GLA email addresses are allowed" }, { status: 403 })
        }

        // 3. Check for existing pending request from this user
        const existingRequest = await adminDb.collection("club_requests")
            .where("requesterUid", "==", decoded.uid)
            .where("status", "==", "pending")
            .limit(1)
            .get()

        if (!existingRequest.empty) {
            return NextResponse.json({
                error: "You already have a pending club request. Please wait for admin review.",
                existingRequest: true
            }, { status: 409 })
        }

        // 4. Validate Body
        const body = await request.json()
        const validation = clubRequestSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
        }

        const { clubName, category, vision, proposedLogoURL } = validation.data

        // 5. Check if club name already exists
        const existingClub = await adminDb.collection("clubs")
            .where("name", "==", clubName)
            .limit(1)
            .get()

        if (!existingClub.empty) {
            return NextResponse.json({
                error: "A club with this name already exists",
                clubExists: true
            }, { status: 409 })
        }

        // 6. Create Club Request
        const clubRequest = {
            requesterUid: decoded.uid,
            requesterName: decoded.name || "GLA Student",
            requesterEmail: decoded.email,
            clubName,
            category,
            vision,
            proposedLogoURL: proposedLogoURL || null,
            status: "pending",
            submittedAt: FieldValue.serverTimestamp(),
        }

        const docRef = await adminDb.collection("club_requests").add(clubRequest)

        return NextResponse.json({
            success: true,
            requestId: docRef.id,
            message: "Your club request has been submitted for review!"
        })

    } catch (error: any) {
        console.error("Club Request Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to submit club request" },
            { status: 500 }
        )
    }
}

// GET: Check user's existing request status
export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // Get user's club requests
        const requests = await adminDb.collection("club_requests")
            .where("requesterUid", "==", decoded.uid)
            .orderBy("submittedAt", "desc")
            .limit(5)
            .get()

        const userRequests = requests.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return NextResponse.json({ requests: userRequests })

    } catch (error: any) {
        console.error("Get Club Request Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
