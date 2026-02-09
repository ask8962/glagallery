import { adminDb, adminAuth } from "@/lib/firebase-admin"

import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization")
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.split("Bearer ")[1]
        const decodedToken = await adminAuth.verifyIdToken(token)

        // Check if admin
        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get()
        const userData = userDoc.data()

        // In production, checking email is safer or strict role check
        if (userData?.role !== "admin" && userData?.email !== "anukalp.gupta_cs23@gla.ac.in") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { name, category, description, presidentUid, email } = body

        if (!name || !presidentUid) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        // Create club
        const clubRef = adminDb.collection("clubs").doc()
        const clubData = {
            id: clubRef.id,
            name,
            category,
            description,
            presidentUid,
            email: email || "",
            status: "active",
            members: [presidentUid],
            admins: [presidentUid],
            createdAt: new Date(),
            updatedAt: new Date(),
            verification: {
                status: "verified",
                verifiedBy: decodedToken.uid,
                verifiedAt: new Date()
            }
        }

        await clubRef.set(clubData)

        // Update president's role if needed? 
        // Usually we don't change global role, but maybe add club_role?
        // For now, simple club creation.

        return NextResponse.json({ success: true, clubId: clubRef.id })
    } catch (error) {
        console.error("Error creating club:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
