"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"

// Routes that don't require 2FA verification
const EXEMPT_ROUTES = ["/verify-2fa", "/api"]

export function TwoFAGuard({ children }: { children: React.ReactNode }) {
    const { user, needs2FA, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Don't redirect while loading
        if (loading) return

        // Only redirect if user is logged in, needs 2FA, and not on exempt route
        if (user && needs2FA) {
            const isExempt = EXEMPT_ROUTES.some(route => pathname.startsWith(route))
            if (!isExempt) {
                console.log("🔐 2FA required, redirecting to /verify-2fa")
                router.push("/verify-2fa")
            }
        }
    }, [user, needs2FA, loading, pathname, router])

    return <>{children}</>
}
