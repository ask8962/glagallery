import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { callWithFallback, type ChatMessage } from "@/lib/ai-providers"
import { SYSTEM_PROMPT, MAX_CONTEXT_MESSAGES } from "@/lib/system-prompt"
import { adminAuth } from "@/lib/firebase-admin"

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
            const { success, limit, remaining, reset } = await rl.limit(rateLimitId)
            if (!success) {
                const resetMinutes = Math.ceil((reset - Date.now()) / 60000)
                return NextResponse.json(
                    {
                        error: `You've reached the limit of 8 messages per hour. Please try again in ~${resetMinutes} minute${resetMinutes === 1 ? "" : "s"}.`,
                        limit,
                        remaining: 0,
                        resetIn: resetMinutes,
                    },
                    { status: 429 }
                )
            }
        }

        // 4. Trim to last N messages for context efficiency
        const trimmedMessages = messages.slice(-MAX_CONTEXT_MESSAGES)

        // 5. Call AI with fallback
        const response = await callWithFallback(SYSTEM_PROMPT, trimmedMessages, rateLimitId)

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
