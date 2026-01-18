"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, UserPlus, Clock, Check } from "lucide-react"
import { auth } from "@/lib/firebase"

interface JoinRequestButtonProps {
    clubId: string
    isMember: boolean
    isAdmin: boolean
}

export function JoinRequestButton({ clubId, isMember, isAdmin }: JoinRequestButtonProps) {
    const [status, setStatus] = useState<"none" | "pending" | "approved" | "rejected" | "member">("none")
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (isMember || isAdmin) {
            setStatus("member")
            setLoading(false)
            return
        }
        checkRequestStatus()
    }, [clubId, isMember, isAdmin])

    const checkRequestStatus = async () => {
        try {
            const token = await auth.currentUser?.getIdToken()
            if (!token) {
                setLoading(false)
                return
            }

            const res = await fetch(`/api/clubs/${clubId}/join-request?checkStatus=true`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()

            if (data.status) {
                setStatus(data.status)
            } else {
                setStatus("none")
            }
        } catch (error) {
            console.error("Failed to check request status:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleJoinRequest = async () => {
        setSubmitting(true)
        try {
            const token = await auth.currentUser?.getIdToken()
            if (!token) {
                toast.error("Please sign in to request membership")
                return
            }

            const res = await fetch(`/api/clubs/${clubId}/join-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to send request")
            }

            toast.success("Join request sent!")
            setStatus("pending")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <Button variant="outline" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        )
    }

    if (status === "member") {
        return (
            <Button variant="outline" disabled className="gap-2">
                <Check className="h-4 w-4" />
                Member
            </Button>
        )
    }

    if (status === "pending") {
        return (
            <Button variant="outline" disabled className="gap-2">
                <Clock className="h-4 w-4" />
                Request Pending
            </Button>
        )
    }

    if (status === "rejected") {
        return (
            <Button variant="outline" disabled className="gap-2 text-destructive">
                Request Declined
            </Button>
        )
    }

    return (
        <Button onClick={handleJoinRequest} disabled={submitting} className="gap-2">
            {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <>
                    <UserPlus className="h-4 w-4" />
                    Request to Join
                </>
            )}
        </Button>
    )
}
