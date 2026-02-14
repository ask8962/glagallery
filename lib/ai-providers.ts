import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import OpenAI from "openai"
import { Redis } from "@upstash/redis"
import crypto from "crypto"

// ──────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────

export type ChatMessage = {
    role: "user" | "assistant"
    content: string
}

export type AIResponse = {
    content: string
    provider: string
}

type ProviderName = "Claude" | "Gemini" | "Groq"

type CircuitState = {
    failures: number
    lastFailure: number
    skippedUntil: number
}

// ──────────────────────────────────────────────
//  Configuration
// ──────────────────────────────────────────────

const TEMPERATURE = 0.3
const MAX_TOKENS = 1024
const CACHE_TTL_SECONDS = 86400 // 24 hours
const CIRCUIT_BREAKER_THRESHOLD = 2
const CIRCUIT_BREAKER_WINDOW_MS = 5 * 60 * 1000   // 5 min
const CIRCUIT_BREAKER_COOLDOWN_MS = 15 * 60 * 1000 // 15 min

// Circuit breaker state (in-memory per instance)
const circuitBreakers: Record<ProviderName, CircuitState> = {
    Claude: { failures: 0, lastFailure: 0, skippedUntil: 0 },
    Gemini: { failures: 0, lastFailure: 0, skippedUntil: 0 },
    Groq: { failures: 0, lastFailure: 0, skippedUntil: 0 },
}

// ──────────────────────────────────────────────
//  Provider initialization (lazy)
// ──────────────────────────────────────────────

let anthropicClient: Anthropic | null = null
let geminiClient: GoogleGenerativeAI | null = null
let groqClient: OpenAI | null = null
let redis: Redis | null = null

function getAnthropicClient(): Anthropic | null {
    if (!process.env.ANTHROPIC_API_KEY) return null
    if (!anthropicClient) {
        anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }
    return anthropicClient
}

function getGeminiClient(): GoogleGenerativeAI | null {
    if (!process.env.GOOGLE_GENERATIVE_AI_KEY) return null
    if (!geminiClient) {
        geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY)
    }
    return geminiClient
}

function getGroqClient(): OpenAI | null {
    const isEnabled = process.env.ENABLE_GROQ_FALLBACK === "true" || process.env.ENABLE_GROK_FALLBACK === "true"
    console.log("[Groq Debug] Enabled:", isEnabled, "Key present:", !!process.env.GROQ_API_KEY)

    if (!isEnabled) return null
    if (!process.env.GROQ_API_KEY) return null
    if (!groqClient) {
        groqClient = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        })
    }
    return groqClient
}

function getRedis(): Redis | null {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
    if (!redis) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
    }
    return redis
}

// ──────────────────────────────────────────────
//  Caching
// ──────────────────────────────────────────────

function hashCacheKey(userId: string, messages: ChatMessage[]): string {
    const payload = JSON.stringify({ userId, messages })
    return `chat:${crypto.createHash("sha256").update(payload).digest("hex")}`
}

async function getCachedResponse(userId: string, messages: ChatMessage[]): Promise<AIResponse | null> {
    const r = getRedis()
    if (!r) return null
    try {
        const key = hashCacheKey(userId, messages)
        const cached = await r.get<AIResponse>(key)
        return cached || null
    } catch {
        return null
    }
}

async function setCachedResponse(userId: string, messages: ChatMessage[], response: AIResponse): Promise<void> {
    const r = getRedis()
    if (!r) return
    try {
        const key = hashCacheKey(userId, messages)
        await r.set(key, response, { ex: CACHE_TTL_SECONDS })
    } catch {
        // Silently fail — cache is best-effort
    }
}

// ──────────────────────────────────────────────
//  Circuit breaker
// ──────────────────────────────────────────────

function isCircuitOpen(provider: ProviderName): boolean {
    const state = circuitBreakers[provider]
    if (Date.now() < state.skippedUntil) return true
    // Reset if outside window
    if (Date.now() - state.lastFailure > CIRCUIT_BREAKER_WINDOW_MS) {
        state.failures = 0
    }
    return false
}

function recordFailure(provider: ProviderName): void {
    const state = circuitBreakers[provider]
    state.failures++
    state.lastFailure = Date.now()
    if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
        state.skippedUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS
        console.warn(`[AI] Circuit breaker OPEN for ${provider} — skipping for 15 min`)
    }
}

function recordSuccess(provider: ProviderName): void {
    circuitBreakers[provider] = { failures: 0, lastFailure: 0, skippedUntil: 0 }
}

// ──────────────────────────────────────────────
//  Individual provider calls
// ──────────────────────────────────────────────

async function callClaude(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
    const client = getAnthropicClient()
    if (!client) throw new Error("Claude not configured")

    const response = await client.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: systemPrompt,
        messages: messages.map(m => ({
            role: m.role,
            content: m.content,
        })),
    })

    const textBlock = response.content.find(b => b.type === "text")
    return textBlock?.text || ""
}

async function callGemini(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
    const client = getGeminiClient()
    if (!client) throw new Error("Gemini not configured")

    const model = client.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt,
        generationConfig: {
            temperature: TEMPERATURE,
            maxOutputTokens: MAX_TOKENS,
        },
    })

    // Build conversation history
    const history = messages.slice(0, -1).map(m => ({
        role: m.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1]?.content || ""
    const result = await chat.sendMessage(lastMessage)
    return result.response.text()
}

async function callGroq(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
    const client = getGroqClient()
    if (!client) throw new Error("Groq not configured")

    const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        messages: [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
        ],
    })

    return response.choices[0]?.message?.content || ""
}

// ──────────────────────────────────────────────
//  Soft failure detection
// ──────────────────────────────────────────────

function isSoftFailure(response: string): boolean {
    if (!response || response.trim().length < 10) return true
    const lowered = response.toLowerCase()
    const softFailPhrases = [
        "i don't know",
        "i cannot help",
        "i'm unable to",
        "as an ai language model",
        "i apologize but i cannot",
    ]
    return softFailPhrases.some(phrase => lowered.includes(phrase) && response.length < 50)
}

// ──────────────────────────────────────────────
//  Main fallback engine
// ──────────────────────────────────────────────

type ProviderEntry = {
    name: ProviderName
    call: (systemPrompt: string, messages: ChatMessage[]) => Promise<string>
}

export async function callWithFallback(
    systemPrompt: string,
    messages: ChatMessage[],
    userId: string
): Promise<AIResponse> {
    // 1. Check cache first
    const cached = await getCachedResponse(userId, messages)
    if (cached) {
        console.log("[AI] Cache hit")
        return { ...cached, provider: `${cached.provider} (cached)` }
    }

    // 2. Build provider chain (only configured providers)
    const providers: ProviderEntry[] = []

    if (getAnthropicClient()) providers.push({ name: "Claude", call: callClaude })
    if (getGeminiClient()) providers.push({ name: "Gemini", call: callGemini })
    if (getGroqClient()) providers.push({ name: "Groq", call: callGroq })

    if (providers.length === 0) {
        return {
            content: "No AI providers are configured. Please add API keys to .env.local (ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_KEY, or GROQ_API_KEY).",
            provider: "System",
        }
    }

    const fallbackLog: string[] = []

    // 3. Try each provider with fallback
    for (const provider of providers) {
        if (isCircuitOpen(provider.name)) {
            fallbackLog.push(`${provider.name}: circuit open, skipped`)
            continue
        }

        try {
            const response = await provider.call(systemPrompt, messages)

            if (isSoftFailure(response)) {
                fallbackLog.push(`${provider.name}: soft failure (empty/unhelpful)`)
                recordFailure(provider.name)
                continue
            }

            // Success!
            recordSuccess(provider.name)
            const result: AIResponse = { content: response, provider: provider.name }

            // Cache the response
            await setCachedResponse(userId, messages, result)

            if (fallbackLog.length > 0) {
                console.warn(`[AI] Fallback log: ${fallbackLog.join(" → ")} → ${provider.name} ✓`)
            }

            return result
        } catch (error: any) {
            const status = error?.status || error?.statusCode || 0
            const message = error?.message || "Unknown error"

            fallbackLog.push(`${provider.name}: ${status || "error"} - ${message.slice(0, 80)}`)
            recordFailure(provider.name)

            // For 429 (rate limit) — immediate fallback, no retry
            if (status === 429) {
                console.warn(`[AI] ${provider.name} rate limited (429) — falling back`)
                continue
            }

            // For server errors — one retry with backoff
            if (status >= 500 || !status) {
                try {
                    await new Promise(r => setTimeout(r, 2000)) // 2s backoff
                    const retryResponse = await provider.call(systemPrompt, messages)
                    if (!isSoftFailure(retryResponse)) {
                        recordSuccess(provider.name)
                        const result: AIResponse = { content: retryResponse, provider: provider.name }
                        await setCachedResponse(userId, messages, result)
                        return result
                    }
                } catch {
                    // Retry failed — move to next provider
                }
            }
        }
    }

    // All providers failed
    console.error(`[AI] All providers failed: ${fallbackLog.join(" → ")}`)
    return {
        content: "I'm having trouble connecting right now. Please try again in a few minutes. 🔄",
        provider: "Fallback",
    }
}
