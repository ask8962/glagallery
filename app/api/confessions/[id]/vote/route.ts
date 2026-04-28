import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// POST: Upvote or downvote a confession
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { userId, voteType } = body

        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        if (!["up", "down"].includes(voteType)) {
            return NextResponse.json({ error: "Invalid vote type" }, { status: 400 })
        }

        const confessionRef = adminDb.collection("confessions").doc(id)
        const confessionDoc = await confessionRef.get()

        if (!confessionDoc.exists) {
            return NextResponse.json({ error: "Confession not found" }, { status: 404 })
        }

        // Check for existing vote
        const voteId = `${id}_${userId}`
        const voteRef = adminDb.collection("confession_votes").doc(voteId)
        const existingVote = await voteRef.get()

        const batch = adminDb.batch()

        if (existingVote.exists) {
            const existingData = existingVote.data()!
            if (existingData.voteType === voteType) {
                // Same vote — remove it (toggle off)
                batch.delete(voteRef)
                if (voteType === "up") {
                    batch.update(confessionRef, {
                        upvotes: (confessionDoc.data()!.upvotes || 1) - 1,
                    })
                } else {
                    batch.update(confessionRef, {
                        downvotes: (confessionDoc.data()!.downvotes || 1) - 1,
                    })
                }
                await batch.commit()
                return NextResponse.json({ action: "removed", voteType: null })
            } else {
                // Opposite vote — switch
                batch.update(voteRef, {
                    voteType,
                    createdAt: new Date().toISOString(),
                })
                if (voteType === "up") {
                    batch.update(confessionRef, {
                        upvotes: (confessionDoc.data()!.upvotes || 0) + 1,
                        downvotes: Math.max((confessionDoc.data()!.downvotes || 1) - 1, 0),
                    })
                } else {
                    batch.update(confessionRef, {
                        downvotes: (confessionDoc.data()!.downvotes || 0) + 1,
                        upvotes: Math.max((confessionDoc.data()!.upvotes || 1) - 1, 0),
                    })
                }
                await batch.commit()
                return NextResponse.json({ action: "switched", voteType })
            }
        } else {
            // New vote
            batch.set(voteRef, {
                odcId: id,
                odcType: "confession",
                odcUid: userId,
                voteType,
                createdAt: new Date().toISOString(),
            })
            if (voteType === "up") {
                batch.update(confessionRef, {
                    upvotes: (confessionDoc.data()!.upvotes || 0) + 1,
                })
            } else {
                batch.update(confessionRef, {
                    downvotes: (confessionDoc.data()!.downvotes || 0) + 1,
                })
            }
            await batch.commit()
            return NextResponse.json({ action: "voted", voteType })
        }
    } catch (error: any) {
        console.error("Vote error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
