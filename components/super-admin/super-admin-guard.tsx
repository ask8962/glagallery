"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ShieldAlert, Loader2 } from "lucide-react"
import { isSuperAdminEmail } from "@/lib/config"

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        if (!loading) {
            if (profile?.role === "super_admin" || isSuperAdminEmail(profile?.email || "")) {
                setIsAuthorized(true)
            } else {
                setIsAuthorized(false)
                router.push("/")
            }
        }
    }, [profile, loading, router])

    if (loading || isAuthorized === null) {
        return (
            <div className="flex bg-background h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!isAuthorized) {
        return (
            <div className="flex flex-col bg-background h-screen w-full items-center justify-center gap-4">
                <ShieldAlert className="h-16 w-16 text-destructive" />
                <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
                <p className="text-muted-foreground">You do not have Super Admin privileges.</p>
            </div>
        )
    }

    return <>{children}</>
}
