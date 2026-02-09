import { NextRequest } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

/**
 * Extracts the Firebase ID Token from the request headers or cookies.
 * Prioritizes 'Authorization: Bearer <token>' header, falls back to 'token' cookie.
 * 
 * @param request - NextRequest object
 * @returns The JWT string if found, otherwise null
 */
export function getTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get("Authorization")
    console.log("Auth Utils: Auth Header:", authHeader ? `${authHeader.substring(0, 15)}...` : "NONE") // DEBUG

    if (!authHeader?.startsWith("Bearer ")) {
        // Try to get from cookies as fallback
        const token = request.cookies.get("token")?.value
        console.log("Auth Utils: Cookie Token:", token ? "YES" : "NO") // DEBUG
        return token || null
    }
    return authHeader.split("Bearer ")[1]
}

/**
 * Verify Firebase ID token using Admin SDK
 */
export async function verifyIdToken(token: string): Promise<{
    uid: string
    email?: string
    name?: string
} | null> {
    try {
        const decoded = await adminAuth.verifyIdToken(token)
        return {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name,
        }
    } catch (error) {
        console.error("Token verification failed:", error)
        return null
    }
}
