"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { CreateEventForm } from "@/components/events/create-event-form"
import { Event } from "@/lib/types"
import { Loader2 } from "lucide-react"

export default function EditEventPage() {
    const params = useParams()
    const router = useRouter()
    const eventId = params.id as string
    const { user, profile } = useAuth()
    
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!eventId || !user) return

        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${eventId}`)
                if (!res.ok) throw new Error("Failed to fetch event")
                const data = await res.json()
                setEvent(data)
                
                // Security check
                if (profile?.role !== "admin" && data.organizerId !== user.uid) {
                    router.push(`/events/${eventId}`)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchEvent()
    }, [eventId, user, profile, router])

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <h1 className="text-2xl font-bold">Event Not Found</h1>
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto px-4 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Edit Event: {event.title}</h1>
                <p className="text-muted-foreground mt-2">Update the details of your event below.</p>
            </div>
            
            <CreateEventForm initialData={event} />
        </div>
    )
}
