/**
 * Server-side Admin Authentication & Authorization
 *
 * This module provides server-side admin verification for API routes.
 * NEVER trust client-side admin checks alone - always verify on server.
 */

import { isAdminEmail, APP_CONFIG } from "./config"
import { getUserFromRequest, type TokenPayload } from "./jwt-auth"
import { Redis } from "@upstash/redis"
import { adminAuth } from "@/lib/firebase-admin"
import { DecodedIdToken } from "firebase-admin/auth"

export interface AuthResult {
  authenticated: boolean
  user?: DecodedIdToken
  error?: string
}

/**
 * Verify Firebase Auth token from Authorization header
 */
export async function verifyAuthToken(request: Request): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { authenticated: false, error: "Missing or invalid authorization header" }
    }

    const token = authHeader.replace("Bearer ", "")

    if (!token) {
      return { authenticated: false, error: "Token not provided" }
    }

    const decodedToken = await adminAuth.verifyIdToken(token)

    return {
      authenticated: true,
      user: decodedToken
    }

  } catch (error: any) {
    console.error("Token verification error:", error.message)
    return {
      authenticated: false,
      error: error.message || "Invalid token"
    }
  }
}

/**
 * Verify if a request is from an admin user using JWT token
 */
export async function verifyAdminAccess(request: Request): Promise<{
  authorized: boolean
  error?: string
  user?: TokenPayload
}> {
  const user = await getUserFromRequest(request)

  if (!user) {
    return {
      authorized: false,
      error: "Authentication required. Please provide a valid JWT token.",
    }
  }

  // Ensure organizationId is fetched from the database for security (in case claims are absent/stale)
  if (!user.organizationId) {
    try {
      const userDoc = await adminDb.collection("users").doc(user.userId).get()
      if (userDoc.exists) {
        user.organizationId = userDoc.data()?.organizationId
        user.role = userDoc.data()?.role || "user"
      }
    } catch (e) {
      console.warn("Failed to fetch user org details:", e)
    }
  }

  if (user.role !== "admin" && user.role !== "super_admin" && !isAdminEmail(user.email)) {
    return {
      authorized: false,
      error: "Access denied. Admin privileges required.",
    }
  }

  return { authorized: true, user }
}

/**
 * Verify if a request is from a valid GLA user using JWT token
 */
export async function verifyGLAUser(request: Request): Promise<{
  authorized: boolean
  error?: string
  user?: TokenPayload
}> {
  const user = await getUserFromRequest(request)

  if (!user) {
    return {
      authorized: false,
      error: "Authentication required. Please provide a valid JWT token.",
    }
  }

  if (!user.email.toLowerCase().endsWith("@gla.ac.in")) {
    return {
      authorized: false,
      error: "Access denied. Only GLA University emails are allowed.",
    }
  }

  return { authorized: true, user }
}

/**
 * Server-side rate limiting
 * Uses Redis if configured (production), falls back to in-memory Map (development)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Initialize Redis if credentials exist
let redis: Redis | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = Redis.fromEnv()
    console.log("⚡ Rate limiting using Upstash Redis")
  } catch (err) {
    console.warn("Retrying rate limit setup (Redis init failed)", err)
  }
}

/**
 * Get IP address from request
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  return "unknown"
}

export async function checkServerRateLimit(
  identifier: string,
  action: keyof typeof APP_CONFIG.RATE_LIMITS,
  windowMs: number = 60 * 60 * 1000, // 1 hour default
): Promise<{
  allowed: boolean
  remaining: number
  resetAt: number
  error?: string
}> {
  const limit = APP_CONFIG.RATE_LIMITS[action]
  const key = `ratelimit:${action}:${identifier}`
  const now = Date.now()

  // 1. Use Redis if available
  if (redis) {
    try {
      // Simple Fixed Window using INCR + EXPIRE
      // Note: Use a window key based on time or just standard fixed window from first request

      // Using efficient pipeline: INCR, TTL
      const [count, ttl] = await redis
        .pipeline()
        .incr(key)
        .ttl(key)
        .exec() as [number, number]

      // If key didn't exist (ttl = -1 or -2), set expiry
      if (ttl === -1 || ttl === -2) {
        await redis.expire(key, Math.ceil(windowMs / 1000))
      }

      const resetTime = now + (ttl > 0 ? ttl * 1000 : windowMs)

      if (count > limit) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: resetTime,
          error: `Rate limit exceeded. Try again after ${new Date(resetTime).toLocaleTimeString()}`,
        }
      }

      return { allowed: true, remaining: limit - count, resetAt: resetTime }
    } catch (err) {
      console.error("Redis rate limit error, falling back to memory:", err)
      // Fallback to memory on Redis failure
    }
  }

  // 2. Fallback: In-Memory Map
  // (Logic matches previous implementation)
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    // Create new entry
    const resetAt = now + windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      error: `Rate limit exceeded. Try again after ${new Date(entry.resetAt).toLocaleTimeString()}`,
    }
  }

  entry.count++
  rateLimitStore.set(key, entry)
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Clean up expired rate limit entries (call periodically for memory store)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up every 5 minutes (only needed for memory store)
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}
