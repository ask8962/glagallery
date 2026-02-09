/**
 * JWT-based Authentication System
 *
 * Replaces insecure header-based auth with proper JWT tokens
 * Production-ready authentication with secure session management
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose"

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required. Set it in .env.local or your deployment environment.")
}
const JWT_ISSUER = "gla-gallery"
const JWT_AUDIENCE = "gla-gallery-api"

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET)

export interface TokenPayload extends JWTPayload {
  userId: string
  email: string
  role: "user" | "moderator" | "admin"
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(
  userId: string,
  email: string,
  role: "user" | "moderator" | "admin",
): Promise<string> {
  const token = await new SignJWT({
    userId,
    email,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime("7d") // 7 days
    .setIssuedAt()
    .sign(secret)

  return token
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    // 1. Try verifying as Firebase ID Token first (RS256)
    try {
      const { getAuth } = await import("firebase-admin/auth")
      const { getApps, cert, initializeApp } = await import("firebase-admin/app")

      // Ensure firebase-admin is initialized (it might be already, but safely check)
      // We import dynamically to avoid circular deps if needed, or just use the global admin instance
      // Better: use the existing adminDb/auth from lib/firebase-admin if possible, 
      // but here we are in lib/jwt-auth.ts. 
      // Let's rely on the fact that firebase-admin should be initialized.

      // Actually, let's just use the verified claims
      const auth = getAuth()
      const decodedToken = await auth.verifyIdToken(token)

      return {
        userId: decodedToken.uid,
        email: decodedToken.email || "",
        role: (decodedToken.role as "user" | "moderator" | "admin") || "user",
        ...decodedToken
      }
    } catch (firebaseError: any) {
      // console.log("Not a Firebase token:", firebaseError.message)
      // Fallthrough to custom JWT check
    }

    // 2. Try verifying as Custom JWT (HS256)
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })

    return payload as TokenPayload
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null

  // Format: "Bearer <token>"
  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null
  }

  return parts[1]
}

/**
 * Get user from request (for API routes)
 */
export async function getUserFromRequest(request: Request): Promise<TokenPayload | null> {
  const authHeader = request.headers.get("Authorization")
  const token = extractTokenFromHeader(authHeader)

  if (!token) return null

  return verifyToken(token)
}
