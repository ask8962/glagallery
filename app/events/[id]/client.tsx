"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Event } from "@/lib/types"
import { EventHero } from "@/components/events/event-hero"
import { EventInfo } from "@/components/events/event-info"
import { RegisterButton } from "@/components/events/register-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Edit } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function EventDetailClient() {
    const params = useParams()
    const eventId = params.id as string
    const { user, profile } = useAuth()

    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [isRegistered, setIsRegistered] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (eventId) {
            fetchEvent()
        }
    }, [eventId])

    // Check if user is already registered for this event
    useEffect(() => {
        const checkRegistration = async () => {
            if (!user || !eventId) return
            try {
                const { db } = getFirebase()
                const ticketsRef = collection(db, "tickets")
                const q = query(
                    ticketsRef,
                    where("eventId", "==", eventId),
                    where("userId", "==", user.uid),
                    limit(1)
                )
                const snapshot = await getDocs(q)
                setIsRegistered(!snapshot.empty)
            } catch (err) {
                console.error("Failed to check registration:", err)
            }
        }
        checkRegistration()
    }, [user, eventId])

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}`)
            if (!res.ok) throw new Error("Event not found")
            const data = await res.json()
            setEvent(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold">Event Not Found</h1>
                <p className="text-muted-foreground mt-2">{error || "The event you're looking for doesn't exist."}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-12">
            {/* Hero Section */}
            <EventHero event={event} />

            {/* Main Content */}
            <div className="container max-w-6xl mx-auto px-4 mt-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Event Info (Takes 2 cols) */}
                    <div className="lg:col-span-2">
                        <EventInfo event={event} />
                    </div>

                    {/* Right Column - Registration Card (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            {user && profile?.role === "admin" && (
                                <Link href={`/events/${eventId}/edit`}>
                                    <Button className="w-full" variant="outline">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Event
                                    </Button>
                                </Link>
                            )}
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg">Register for this Event</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold">
                                            {event.isFree ? "Free" : `₹${event.price}`}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {event.capacity - event.registeredCount} spots remaining
                                        </p>
                                    </div>
                                    <RegisterButton
                                        event={event}
                                        isRegistered={isRegistered}
                                        onSuccess={() => {
                                            setIsRegistered(true)
                                            fetchEvent()
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
