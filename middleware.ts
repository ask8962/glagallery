import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Next.js Edge Middleware for API route protection.
 *
 * Protects:
 * - /api/admin/* endpoints → returns 401 if no Authorization header
 *
 * NOTE: /admin/* PAGE protection is handled client-side by AuthContext.
 * Firebase client SDK stores auth tokens in IndexedDB (not cookies),
 * so we cannot check auth state in edge middleware for page routes.
 * Full token verification happens in API route handlers via verifyAdminAccess().
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // --- Protect /api/admin/* endpoints ---
    if (pathname.startsWith("/api/admin")) {
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            )
        }
        return NextResponse.next()
    }

    return NextResponse.next()
}

/**
 * Matcher — only run middleware on /api/admin routes.
 */
export const config = {
    matcher: ["/api/admin/:path*"],
}
