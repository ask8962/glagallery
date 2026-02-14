"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { Loader2, Clock, X, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface WaitlistButtonProps {
    eventId: string
    onStatusChange?: () => void
}

export function WaitlistButton({ eventId, onStatusChange }: WaitlistButtonProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{
        isOnWaitlist: boolean
        position: number | null
        totalWaiting: number
    } | null>(null)

    useEffect(() => {
        if (user && eventId) {
            fetchWaitlistStatus()
        }
    }, [user, eventId])

    const fetchWaitlistStatus = async () => {
        try {
            const token = await user?.getIdToken()
            const res = await fetch(`/api/events/waitlist?eventId=${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setStatus(data)
            }
        } catch (error) {
            console.error("Failed to fetch waitlist status:", error)
        }
    }

    const handleJoinWaitlist = async () => {
        if (!user) {
            toast.error("Please sign in to join the waitlist")
            return
        }

        setLoading(true)
        try {
            const token = await user.getIdToken()
            const res = await fetch("/api/events/waitlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ eventId })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to join waitlist")
            }

            toast.success(`You're on the waitlist!`, {
                description: `Position #${data.position}`
            })
            fetchWaitlistStatus()
            onStatusChange?.()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLeaveWaitlist = async () => {
        if (!user) return

        setLoading(true)
        try {
            const token = await user.getIdToken()
            const res = await fetch(`/api/events/waitlist?eventId=${eventId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to leave waitlist")
            }

            toast.success("Removed from waitlist")
            fetchWaitlistStatus()
            onStatusChange?.()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <Button variant="outline" className="w-full gap-2" size="lg" disabled>
                <Clock className="h-5 w-5" />
                Sign in to Join Waitlist
            </Button>
        )
    }

    // Already on waitlist
    if (status?.isOnWaitlist) {
        return (
            <div className="space-y-2">
                <Button
                    variant="outline"
                    className="w-full gap-2 border-amber-500 text-amber-500 hover:bg-amber-500/10"
                    size="lg"
                    disabled
                >
                    <CheckCircle className="h-5 w-5" />
                    On Waitlist - Position #{status.position}
                </Button>
                <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-destructive"
                    size="sm"
                    onClick={handleLeaveWaitlist}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                    Leave Waitlist
                </Button>
            </div>
        )
    }

    // Can join waitlist
    return (
        <Button
            onClick={handleJoinWaitlist}
            disabled={loading}
            variant="outline"
            className="w-full gap-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
            size="lg"
        >
            {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <Clock className="h-5 w-5" />
            )}
            {loading ? "Joining..." : "Join Waitlist"}
        </Button>
    )
}
