import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"
import { FieldValue } from "firebase-admin/firestore"
import { z } from "zod"
import { notifyClubAnnouncement } from "@/lib/club-notifications"

const announcementSchema = z.object({
    title: z.string().min(3).max(200),
    content: z.string().min(10).max(5000),
    isPinned: z.boolean().optional().default(false),
})

// GET - Fetch announcements for a club
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clubId } = await params

        const announcementsRef = adminDb
            .collection("clubs")
            .doc(clubId)
            .collection("announcements")
            .orderBy("createdAt", "desc")
            .limit(20)

        const snapshot = await announcementsRef.get()

        const announcements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        }))

        return NextResponse.json({ announcements })
    } catch (error: any) {
        console.error("Get Announcements Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Create announcement (admins only)
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

        // 2. Check if user is club admin
        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()
        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const clubData = clubDoc.data()
        const isAdmin = clubData?.presidentUid === decoded.uid ||
            clubData?.admins?.includes(decoded.uid)

        if (!isAdmin) {
            return NextResponse.json({ error: "Only club admins can post announcements" }, { status: 403 })
        }

        // 3. Validate body
        const body = await request.json()
        const validation = announcementSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
        }

        const { title, content, isPinned } = validation.data

        // 4. Create announcement
        const announcementRef = adminDb
            .collection("clubs")
            .doc(clubId)
            .collection("announcements")
            .doc()

        await announcementRef.set({
            title,
            content,
            isPinned,
            authorUid: decoded.uid,
            authorName: decoded.name || "Admin",
            authorEmail: decoded.email,
            createdAt: FieldValue.serverTimestamp(),
        })

        // 5. Notify club members (fire and forget)
        notifyClubAnnouncement(clubId, clubData?.name || "Club", title).catch(console.error)

        return NextResponse.json({
            success: true,
            announcementId: announcementRef.id,
            message: "Announcement posted!"
        })

    } catch (error: any) {
        console.error("Create Announcement Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE - Remove announcement
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clubId } = await params
        const { searchParams } = new URL(request.url)
        const announcementId = searchParams.get("announcementId")

        if (!announcementId) {
            return NextResponse.json({ error: "Announcement ID required" }, { status: 400 })
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

        // 2. Check if user is club admin
        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()
        const clubData = clubDoc.data()
        const isAdmin = clubData?.presidentUid === decoded.uid ||
            clubData?.admins?.includes(decoded.uid)

        if (!isAdmin) {
            return NextResponse.json({ error: "Only club admins can delete announcements" }, { status: 403 })
        }

        // 3. Delete announcement
        await adminDb
            .collection("clubs")
            .doc(clubId)
            .collection("announcements")
            .doc(announcementId)
            .delete()

        return NextResponse.json({ success: true, message: "Announcement deleted" })

    } catch (error: any) {
        console.error("Delete Announcement Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
