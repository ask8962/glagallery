"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Check, X, UserPlus, Inbox } from "lucide-react"
import { auth } from "@/lib/firebase"

interface JoinRequest {
    id: string
    userId: string
    userName: string
    userEmail: string
    userPhoto?: string
    message?: string
    createdAt: string
}

interface JoinRequestsListProps {
    clubId: string
}

export function JoinRequestsList({ clubId }: JoinRequestsListProps) {
    const [requests, setRequests] = useState<JoinRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchRequests()
    }, [clubId])

    const fetchRequests = async () => {
        try {
            const token = await auth.currentUser?.getIdToken()
            const res = await fetch(`/api/clubs/${clubId}/join-request`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            setRequests(data.requests || [])
        } catch (error) {
            console.error("Failed to fetch requests:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (requestId: string, action: "approve" | "reject") => {
        setProcessingId(requestId)
        try {
            const token = await auth.currentUser?.getIdToken()
            const res = await fetch(`/api/clubs/${clubId}/join-request`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ requestId, action }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to process request")
            }

            toast.success(data.message)
            setRequests(prev => prev.filter(r => r.id !== requestId))
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setProcessingId(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-8">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No pending join requests</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <UserPlus className="h-5 w-5" />
                <h3 className="font-semibold">Join Requests</h3>
                <Badge variant="secondary">{requests.length}</Badge>
            </div>

            {requests.map((request) => (
                <Card key={request.id}>
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={request.userPhoto} />
                                <AvatarFallback>
                                    {request.userName?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{request.userName}</p>
                                <p className="text-sm text-muted-foreground">
                                    {request.userEmail}
                                </p>
                                {request.message && (
                                    <p className="text-sm text-muted-foreground mt-1 italic">
                                        "{request.message}"
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground mr-2">
                                {formatDate(request.createdAt)}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(request.id, "reject")}
                                disabled={processingId === request.id}
                            >
                                {processingId === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <X className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handleAction(request.id, "approve")}
                                disabled={processingId === request.id}
                            >
                                {processingId === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Approve
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
