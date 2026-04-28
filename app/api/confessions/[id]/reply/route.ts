import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { moderateContent } from "@/lib/content-moderation"
import { getClientIP, checkServerRateLimit } from "@/lib/server-auth"

// POST: Add an anonymous reply to a confession
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const clientIp = getClientIP(request)
        const rateLimitCheck = await checkServerRateLimit(clientIp, "REPLY", 60 * 60 * 1000)

        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { error: "You're replying too fast. Try again later." },
                { status: 429 }
            )
        }

        const body = await request.json()
        const { text, authorUid, authorEmail } = body

        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 })
        }
        if (text.length > 500) {
            return NextResponse.json({ error: "Reply cannot exceed 500 characters" }, { status: 400 })
        }
        if (!authorUid || !authorEmail) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        // Check confession exists
        const confessionRef = adminDb.collection("confessions").doc(id)
        const confessionDoc = await confessionRef.get()
        if (!confessionDoc.exists) {
            return NextResponse.json({ error: "Confession not found" }, { status: 404 })
        }

        // Moderate
        const modResult = moderateContent(text, { strictMode: false })

        const aliasNumber = Math.floor(1000 + Math.random() * 9000)
        const anonymousAlias = `Anonymous #${aliasNumber}`

        const replyData = {
            confessionId: id,
            body: modResult.sanitizedText || text.trim(),
            authorUid,
            authorEmail,
            anonymousAlias,
            upvotes: 0,
            downvotes: 0,
            status: "active",
            createdAt: new Date().toISOString(),
        }

        const replyRef = await confessionRef.collection("replies").add(replyData)

        // Increment reply count on parent
        await confessionRef.update({
            replyCount: (confessionDoc.data()!.replyCount || 0) + 1,
        })

        return NextResponse.json({
            success: true,
            id: replyRef.id,
            anonymousAlias,
        })
    } catch (error: any) {
        console.error("Reply error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET: Fetch replies for a confession
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const confessionRef = adminDb.collection("confessions").doc(id)
        const repliesSnap = await confessionRef
            .collection("replies")
            .where("status", "==", "active")
            .orderBy("createdAt", "asc")
            .limit(50)
            .get()

        const replies: any[] = []
        repliesSnap.forEach((doc) => {
            const data = doc.data()
            replies.push({
                id: doc.id,
                confessionId: id,
                body: data.body,
                anonymousAlias: data.anonymousAlias,
                upvotes: data.upvotes || 0,
                downvotes: data.downvotes || 0,
                createdAt: data.createdAt,
            })
        })

        return NextResponse.json({ replies })
    } catch (error: any) {
        console.error("Get replies error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
