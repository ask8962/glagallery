import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { moderateContent, getModerationAction } from "@/lib/content-moderation"
import { getClientIP, checkServerRateLimit } from "@/lib/server-auth"
import type { Confession, ConfessionCategory } from "@/lib/types"

// GET: Paginated confessions feed
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category") as ConfessionCategory | null
        const cursor = searchParams.get("cursor") // last doc ID for pagination
        const limitCount = Math.min(parseInt(searchParams.get("limit") || "15"), 30)

        let query = adminDb
            .collection("confessions")
            .where("status", "in", ["active", "pending_review"]) // lenient: show both
            .orderBy("createdAt", "desc")
            .limit(limitCount)

        if (category) {
            query = adminDb
                .collection("confessions")
                .where("status", "in", ["active", "pending_review"])
                .where("category", "==", category)
                .orderBy("createdAt", "desc")
                .limit(limitCount)
        }

        if (cursor) {
            const cursorDoc = await adminDb.collection("confessions").doc(cursor).get()
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc)
            }
        }

        const snapshot = await query.get()
        const confessions: Partial<Confession>[] = []

        snapshot.forEach((doc) => {
            const data = doc.data()
            // STRIP author identity — never expose to frontend
            confessions.push({
                id: doc.id,
                body: data.body,
                category: data.category,
                anonymousAlias: data.anonymousAlias,
                upvotes: data.upvotes || 0,
                downvotes: data.downvotes || 0,
                replyCount: data.replyCount || 0,
                viewCount: data.viewCount || 0,
                status: data.status,
                reportCount: data.reportCount || 0,
                pollOptions: data.pollOptions
                    ? data.pollOptions.map((opt: any) => ({
                          id: opt.id,
                          text: opt.text,
                          votes: opt.votes || 0,
                          // Strip voterUids from client response
                      }))
                    : undefined,
                pollExpiresAt: data.pollExpiresAt,
                createdAt: data.createdAt,
                organizationId: data.organizationId,
            })
        })

        const nextCursor =
            snapshot.docs.length === limitCount
                ? snapshot.docs[snapshot.docs.length - 1].id
                : null

        return NextResponse.json({
            confessions,
            nextCursor,
            hasMore: nextCursor !== null,
        })
    } catch (error: any) {
        console.error("Confessions GET error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Create a new confession
export async function POST(request: NextRequest) {
    try {
        // Rate limit: 5 posts per hour per IP
        const clientIp = getClientIP(request)
        const rateLimitCheck = await checkServerRateLimit(clientIp, "CONFESSION", 60 * 60 * 1000)

        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { error: "You're posting too fast. Try again later." },
                { status: 429 }
            )
        }

        const body = await request.json()
        const {
            text,
            category,
            authorUid,
            authorEmail,
            organizationId,
            pollOptions,
        } = body

        // Validate
        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Post cannot be empty" }, { status: 400 })
        }
        if (text.length > 1000) {
            return NextResponse.json(
                { error: "Post cannot exceed 1000 characters" },
                { status: 400 }
            )
        }
        if (!authorUid || !authorEmail) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const validCategories: ConfessionCategory[] = [
            "confession", "meme", "poll", "hot_take", "marketplace", "question",
        ]
        const selectedCategory = validCategories.includes(category) ? category : "confession"

        // Content moderation (lenient mode — flag but don't block)
        const modResult = moderateContent(text, { strictMode: false })
        const modAction = getModerationAction(modResult)

        // Generate anonymous alias
        const aliasNumber = Math.floor(1000 + Math.random() * 9000)
        const anonymousAlias = `Anonymous #${aliasNumber}`

        // Build confession document
        const confessionData: Omit<Confession, "id"> = {
            body: modResult.sanitizedText || text.trim(),
            category: selectedCategory,
            authorUid,
            authorEmail,
            anonymousAlias,
            upvotes: 0,
            downvotes: 0,
            replyCount: 0,
            viewCount: 0,
            status: modAction === "reject" ? "removed" : "active", // lenient: even "review" posts stay visible
            moderationScore: modResult.score,
            moderationFlags: modResult.reasons,
            reportCount: 0,
            reportedBy: [],
            organizationId: organizationId || "",
            createdAt: new Date().toISOString(),
        }

        // Add poll options if category is poll
        if (selectedCategory === "poll" && pollOptions && Array.isArray(pollOptions)) {
            confessionData.pollOptions = pollOptions
                .slice(0, 6) // Max 6 options
                .map((opt: string, i: number) => ({
                    id: `opt_${i}`,
                    text: opt.trim().substring(0, 100),
                    votes: 0,
                    voterUids: [],
                }))
            // Polls expire in 24 hours
            confessionData.pollExpiresAt = new Date(
                Date.now() + 24 * 60 * 60 * 1000
            ).toISOString()
        }

        const docRef = await adminDb.collection("confessions").add(confessionData)

        return NextResponse.json({
            success: true,
            id: docRef.id,
            anonymousAlias,
            moderation: {
                action: modAction,
                flagged: modResult.flagged,
            },
        })
    } catch (error: any) {
        console.error("Confessions POST error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
