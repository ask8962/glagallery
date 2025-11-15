"use client"

import { CreateEventForm } from "@/components/events/create-event-form"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function CreateEventPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login?redirect=/events/create")
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="container max-w-2xl mx-auto py-12 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Host an Event</h1>
                <p className="text-muted-foreground mt-2">
                    Fill in the details below to create a new event. Once published, it will appear on the Events feed.
                </p>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <CreateEventForm />
            </div>
        </div>
    )
}
