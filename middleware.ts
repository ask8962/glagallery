/**
 * Next.js Middleware for Route Protection
 * 
 * Protects /admin routes with server-side authentication checks.
 * Runs on the Edge runtime for fast authentication validation.
 */

import { NextResponse, type NextRequest } from "next/server"

// Admin email whitelist - in production, use Firebase Custom Claims
const ADMIN_EMAILS = [
    "anukalp.gupta_cs23@gla.ac.in",
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Protect /admin routes
    if (pathname.startsWith("/admin")) {
        // Get session cookie
        const sessionCookie = request.cookies.get("__session")?.value

        if (!sessionCookie) {
            // Redirect to home if no session
            return NextResponse.redirect(new URL("/", request.url))
        }

        // Verify session with Firebase Admin (via API route to avoid edge runtime issues)
        try {
            const verifyUrl = new URL("/api/auth/verify-session", request.url)
            const response = await fetch(verifyUrl.toString(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": `__session=${sessionCookie}`
                },
                body: JSON.stringify({ checkAdmin: true })
            })

            if (!response.ok) {
                return NextResponse.redirect(new URL("/", request.url))
            }

            const data = await response.json()
            if (!data.isAdmin) {
                // User is authenticated but not admin
                return NextResponse.redirect(new URL("/", request.url))
            }
        } catch (error) {
            console.error("Middleware auth error:", error)
            return NextResponse.redirect(new URL("/", request.url))
        }
    }

    // Continue with the request
    return NextResponse.next()
}

export const config = {
    matcher: [
        "/admin/:path*",
    ]
}
