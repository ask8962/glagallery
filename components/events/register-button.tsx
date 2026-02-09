"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Event } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { isRegistrationOpen } from "@/lib/events-util"
import { Loader2, Ticket, CheckCircle, XCircle, LogIn } from "lucide-react"
import { ReliabilityBadge } from "@/components/events/reliability-badge"
import { WaitlistButton } from "@/components/events/waitlist-button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface RegisterButtonProps {
    event: Event
    isRegistered?: boolean
    onSuccess?: () => void
}

export function RegisterButton({ event, isRegistered = false, onSuccess }: RegisterButtonProps) {
    const { user } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const canRegister = isRegistrationOpen(event)
    const isSoldOut = event.registeredCount >= event.capacity

    const handleRegister = async () => {
        if (!user) {
            router.push(`/login?redirect=/events/${event.id}`)
            return
        }

        setLoading(true)
        try {
            const token = await user.getIdToken()
            const res = await fetch("/api/events/rsvp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventId: event.id,
                    ticketsCount: 1,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                // Handle 409 Conflict (already registered)
                if (res.status === 409) {
                    toast.info("You're already registered for this event!", {
                        action: {
                            label: "View Tickets",
                            onClick: () => router.push("/events/my-tickets")
                        }
                    })
                    onSuccess?.() // Still update UI state
                    return
                }
                throw new Error(data.error || "Registration failed")
            }

            toast.success("You're registered!", {
                description: "Your ticket has been generated.",
                action: {
                    label: "View Ticket",
                    onClick: () => router.push("/events/my-tickets")
                }
            })
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Already Registered
    if (isRegistered) {
        return (
            <Button disabled className="w-full gap-2" size="lg">
                <CheckCircle className="h-5 w-5" />
                Already Registered
            </Button>
        )
    }

    // Sold Out - Show Waitlist Option
    if (isSoldOut) {
        return (
            <div className="space-y-2">
                <Button disabled variant="outline" className="w-full gap-2" size="lg">
                    <XCircle className="h-5 w-5" />
                    Sold Out
                </Button>
                <WaitlistButton eventId={event.id} />
            </div>
        )
    }

    // Registration Closed
    if (!canRegister) {
        return (
            <Button disabled variant="outline" className="w-full gap-2" size="lg">
                Registration Closed
            </Button>
        )
    }

    // Not logged in
    if (!user) {
        return (
            <Button onClick={handleRegister} className="w-full gap-2" size="lg">
                <LogIn className="h-5 w-5" />
                Login to Register
            </Button>
        )
    }

    // Can Register
    return (
        <div className="space-y-3 w-full">
            {user && (
                <div className="flex justify-center">
                    <ReliabilityBadge
                        eventStats={user.eventStats}
                        reliabilityScore={user.reliabilityScore}
                    />
                </div>
            )}
            <Button onClick={handleRegister} disabled={loading} className="w-full gap-2" size="lg">
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Ticket className="h-5 w-5" />
                )}
                {loading ? "Registering..." : "Register Now"}
            </Button>
        </div>
    )
}
