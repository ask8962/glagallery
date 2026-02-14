import { adminDb, adminAuth } from "@/lib/firebase-admin"
import { isAdminEmail } from "@/lib/config"
import { verifyAdminAccess } from "@/lib/server-auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const authCheck = await verifyAdminAccess(req)
        if (!authCheck.authorized || !authCheck.user) {
            return NextResponse.json({ error: authCheck.error }, { status: 403 })
        }

        // Use authCheck.user instead of decodedToken
        // The original code checked role OR email. verifyAdminAccess checks email.
        // Let's stick to verifyAdminAccess as the single source of truth.

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
                verifiedBy: authCheck.user.uid,
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
