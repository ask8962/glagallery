"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface ProfileUserPageProps {
    params: { userId: string }
}

export default function ProfileUserPage({ params }: ProfileUserPageProps) {
    const router = useRouter()
    const { userId } = params

    // Redirect to main profile page with user query param
    useEffect(() => {
        router.replace(`/profile?user=${userId}`)
    }, [router, userId])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
    )
}
