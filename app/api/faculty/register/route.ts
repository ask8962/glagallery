import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"

// POST: Faculty submits registration request
export async function POST(req: NextRequest) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { uid, email } = authResult.user

        // Verify GLA email
        if (!email?.endsWith("@gla.ac.in")) {
            return NextResponse.json({ error: "Must use GLA email" }, { status: 403 })
        }

        const body = await req.json()
        const {
            department,
            designation,
            employeeId,
            cabinNumber,
            officeHours,
            subjects,
            researchAreas
        } = body

        // Validate required fields
        if (!department || !designation) {
            return NextResponse.json(
                { error: "Department and designation are required" },
                { status: 400 }
            )
        }

        // Check if request already exists
        const existingRequest = await adminDb
            .collection("faculty_requests")
            .where("uid", "==", uid)
            .where("status", "==", "pending")
            .get()

        if (!existingRequest.empty) {
            return NextResponse.json(
                { error: "You already have a pending registration request" },
                { status: 400 }
            )
        }

        // Create faculty registration request
        const requestRef = adminDb.collection("faculty_requests").doc()
        await requestRef.set({
            id: requestRef.id,
            uid,
            email,
            department,
            designation,
            employeeId: employeeId || null,
            cabinNumber: cabinNumber || null,
            officeHours: officeHours || null,
            subjects: subjects || [],
            researchAreas: researchAreas || [],
            status: "pending",
            submittedAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null,
        })

        return NextResponse.json({
            success: true,
            message: "Registration request submitted successfully",
            requestId: requestRef.id
        })
    } catch (error) {
        console.error("Faculty registration error:", error)
        return NextResponse.json(
            { error: "Failed to submit registration" },
            { status: 500 }
        )
    }
}

// GET: Check current user's faculty registration status
export async function GET(req: NextRequest) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { uid } = authResult.user

        // Get user's latest request
        const requestsSnap = await adminDb
            .collection("faculty_requests")
            .where("uid", "==", uid)
            .orderBy("submittedAt", "desc")
            .limit(1)
            .get()

        if (requestsSnap.empty) {
            return NextResponse.json({ hasRequest: false, request: null })
        }

        const request = requestsSnap.docs[0].data()
        return NextResponse.json({ hasRequest: true, request })
    } catch (error) {
        console.error("Error fetching faculty status:", error)
        return NextResponse.json(
            { error: "Failed to fetch status" },
            { status: 500 }
        )
    }
}
