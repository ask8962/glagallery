import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"
import { getAdminEmails } from "@/lib/config"
import { FieldValue } from "firebase-admin/firestore"

interface RouteContext {
    params: Promise<{ id: string }>
}

// POST: Add a member with a role
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { id: clubId } = await context.params

        // 1. Authenticate
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // 2. Get Club and verify permissions
        const clubRef = adminDb.collection("clubs").doc(clubId)
        const clubDoc = await clubRef.get()

        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const clubData = clubDoc.data()!
        const adminEmails = getAdminEmails()
        const isAdmin = decoded.email && adminEmails.includes(decoded.email.toLowerCase())

        // Only president or super admin can manage members
        if (clubData.presidentUid !== decoded.uid && !isAdmin) {
            return NextResponse.json({ error: "Only the club president can manage members" }, { status: 403 })
        }

        // 3. Parse body
        const body = await request.json()
        const { memberUid, memberName, memberEmail, role } = body

        if (!memberUid || !role) {
            return NextResponse.json({ error: "Member UID and role are required" }, { status: 400 })
        }

        // Validate role
        const validRoles = ["Vice President", "Secretary", "Treasurer", "Event Coordinator", "Technical Lead", "Marketing Head", "Member", "Advisor"]
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 })
        }

        // 4. Add to team array
        const teamMember = {
            uid: memberUid,
            name: memberName,
            email: memberEmail,
            role,
            addedAt: new Date().toISOString(),
            addedBy: decoded.uid
        }

        // Check if already in team
        const existingTeam = clubData.team || []
        const existingIndex = existingTeam.findIndex((m: any) => m.uid === memberUid)

        if (existingIndex >= 0) {
            // Update existing member's role
            existingTeam[existingIndex] = { ...existingTeam[existingIndex], ...teamMember }
            await clubRef.update({
                team: existingTeam,
                members: FieldValue.arrayUnion(memberUid),
                admins: role !== "Member" ? FieldValue.arrayUnion(memberUid) : clubData.admins,
                updatedAt: new Date()
            })
        } else {
            // Add new member
            await clubRef.update({
                team: FieldValue.arrayUnion(teamMember),
                members: FieldValue.arrayUnion(memberUid),
                admins: role !== "Member" ? FieldValue.arrayUnion(memberUid) : clubData.admins,
                updatedAt: new Date()
            })
        }

        return NextResponse.json({
            success: true,
            message: `${memberName} added as ${role}`
        })

    } catch (error: any) {
        console.error("Add Member Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE: Remove a member
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { id: clubId } = await context.params

        // 1. Authenticate
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // 2. Get Club and verify permissions
        const clubRef = adminDb.collection("clubs").doc(clubId)
        const clubDoc = await clubRef.get()

        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const clubData = clubDoc.data()!
        const adminEmails = getAdminEmails()
        const isAdmin = decoded.email && adminEmails.includes(decoded.email.toLowerCase())

        if (clubData.presidentUid !== decoded.uid && !isAdmin) {
            return NextResponse.json({ error: "Only the club president can manage members" }, { status: 403 })
        }

        // 3. Parse body
        const body = await request.json()
        const { memberUid } = body

        if (!memberUid) {
            return NextResponse.json({ error: "Member UID is required" }, { status: 400 })
        }

        // Can't remove president
        if (memberUid === clubData.presidentUid) {
            return NextResponse.json({ error: "Cannot remove the club president" }, { status: 400 })
        }

        // 4. Remove from team and arrays
        const existingTeam = clubData.team || []
        const updatedTeam = existingTeam.filter((m: any) => m.uid !== memberUid)

        await clubRef.update({
            team: updatedTeam,
            members: FieldValue.arrayRemove(memberUid),
            admins: FieldValue.arrayRemove(memberUid),
            updatedAt: new Date()
        })

        return NextResponse.json({
            success: true,
            message: "Member removed"
        })

    } catch (error: any) {
        console.error("Remove Member Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET: Get club team
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id: clubId } = await context.params

        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()

        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const clubData = clubDoc.data()!

        return NextResponse.json({
            team: clubData.team || [],
            presidentUid: clubData.presidentUid
        })

    } catch (error: any) {
        console.error("Get Team Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
