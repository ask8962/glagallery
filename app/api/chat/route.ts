import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { callWithFallback, type ChatMessage } from "@/lib/ai-providers"
import { SYSTEM_PROMPT, MAX_CONTEXT_MESSAGES } from "@/lib/system-prompt"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

// ──────────────────────────────────────────────
//  Helper: Fetch real campus data for context
// ──────────────────────────────────────────────
async function getCampusContext(): Promise<string> {
    try {
        const now = new Date()

        // Fetch active events
        const eventsSnapshot = await adminDb.collection("events")
            .where("status", "==", "published")
            .orderBy("startDate", "desc")
            .limit(5)
            .get()

        const events = eventsSnapshot.docs.map(doc => {
            const data = doc.data()
            const dateStr = data.startDate ? new Date(data.startDate).toLocaleDateString() : 'TBA'
            const desc = data.shortDescription || (data.description ? data.description.substring(0, 100) + '...' : '')
            return `- **${data.title}** (${dateStr} at ${data.venueName || 'Campus'}): ${desc} (${data.category || 'Event'})`
        }).join("\n")

        // Fetch active/verified clubs
        // Note: Club status is "active", verification.status is "verified"
        const clubsSnapshot = await adminDb.collection("clubs")
            .where("status", "==", "active")
            // Optional: .where("verification.status", "==", "verified")
            .limit(10)
            .get()

        const clubs = clubsSnapshot.docs.map(doc => {
            const data = doc.data()
            const memberCount = data.members?.length || 0
            const teamDesc = data.team && data.team.length > 0
                ? "Leaders: " + data.team.map((t: any) => t.name).join(", ")
                : ""
            const desc = data.description ? data.description.substring(0, 150) + "..." : ""
            return `- **${data.name}** (${data.category || 'Club'}) - ${memberCount} members. ${teamDesc} | About: ${desc}`
        }).join("\n")

        // Fetch active hackathons
        const hackathonsSnapshot = await adminDb.collection("hackathons")
            .where("status", "in", ["upcoming", "ongoing", "registration"])
            .limit(3)
            .get()

        const hackathons = hackathonsSnapshot.docs.map(doc => {
            const data = doc.data()
            const dateStr = data.startDate ? new Date(data.startDate).toLocaleDateString() : 'TBA'
            const desc = data.shortDescription || ""
            return `- **${data.title}** (Status: ${data.status}) - Starts: ${dateStr}. ${desc}`
        }).join("\n")

        return `
## CURRENT REAL-TIME CAMPUS DATA
Use this exact data to answer user questions about current events, clubs, and hackathons. DO NOT make up events.

**UPCOMING/LATEST EVENTS:**
${events || "No upcoming events listed right now."}

**ACTIVE CLUBS:**
${clubs || "No active clubs listed right now."}

**ACTIVE HACKATHONS:**
${hackathons || "No active hackathons right now."}
`
    } catch (error) {
        console.error("Failed to fetch campus context:", error)
        return "\n## Note: Real-time campus data is currently unavailable. Provide general information instead.\n"
    }
}

// ──────────────────────────────────────────────
//  Rate limiter (8 messages/hour per user)
// ──────────────────────────────────────────────

let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
    if (!ratelimit) {
        ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(50, "1 h"),
            analytics: true,
            prefix: "glabot",
        })
    }
    return ratelimit
}

// ──────────────────────────────────────────────
//  Auth helper — extract UID from Firebase token
// ──────────────────────────────────────────────

async function getUserIdFromRequest(request: Request): Promise<string | null> {
    try {
        const authHeader = request.headers.get("authorization")
        if (!authHeader?.startsWith("Bearer ")) return null
        const token = authHeader.slice(7)
        const decoded = await adminAuth.verifyIdToken(token)
        return decoded.uid
    } catch {
        return null
    }
}

// ──────────────────────────────────────────────
//  POST /api/chat
// ──────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        // 1. Parse request
        const body = await request.json()
        const { messages } = body as { messages?: ChatMessage[] }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "Messages array is required" },
                { status: 400 }
            )
        }

        // 2. Auth check (optional but used for rate limiting)
        const userId = await getUserIdFromRequest(request)
        const rateLimitId = userId || "anonymous"

        // 3. Rate limiting
        const rl = getRatelimit()
        if (rl) {
            try {
                const { success, limit, remaining, reset } = await rl.limit(rateLimitId)
                if (!success) {
                    const resetMinutes = Math.ceil((reset - Date.now()) / 60000)
                    return NextResponse.json(
                        {
                            error: `You've reached the message limit. Please try again in ~${resetMinutes} minute${resetMinutes === 1 ? "" : "s"}.`,
                            limit,
                            remaining: 0,
                            resetIn: resetMinutes,
                        },
                        { status: 429 }
                    )
                }
            } catch (rlError) {
                console.warn("[Chat API] Rate limit check failed (bypassing):", rlError)
                // Proceed without rate limiting if Upstash is unreachable
            }
        }

        // 4. Trim to last N messages for context efficiency
        const trimmedMessages = messages.slice(-MAX_CONTEXT_MESSAGES)

        // 5. Build dynamic system prompt with real campus data
        const campusContext = await getCampusContext()
        const dynamicPrompt = `${SYSTEM_PROMPT}\n\n${campusContext}`

        // 6. Call AI with fallback
        const response = await callWithFallback(dynamicPrompt, trimmedMessages, rateLimitId)

        return NextResponse.json({
            content: response.content,
            provider: response.provider,
        })
    } catch (error) {
        console.error("[Chat API] Error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
