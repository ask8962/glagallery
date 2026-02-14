"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock, Users, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"

interface NoShowReportProps {
    eventId: string
    eventTitle: string
    eventEndDate: Date | string
    noShowsProcessed?: boolean
    noShowCount?: number
    onProcess?: () => void
}

export function NoShowReport({
    eventId,
    eventTitle,
    eventEndDate,
    noShowsProcessed = false,
    noShowCount = 0,
    onProcess
}: NoShowReportProps) {
    const { user } = useAuth()
    const [processing, setProcessing] = useState(false)
    const [result, setResult] = useState<{
        processed: number
        usersRestricted: number
    } | null>(null)

    const endDate = eventEndDate instanceof Date ? eventEndDate : new Date(eventEndDate)
    const hasEnded = new Date() > endDate
    const isProcessed = noShowsProcessed || result !== null

    const handleProcessNoShows = async () => {
        if (!user) {
            toast.error("You must be logged in")
            return
        }

        setProcessing(true)
        try {
            const token = await user.getIdToken()
            const res = await fetch("/api/events/process-noshows", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ eventId })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to process no-shows")
            }

            setResult({
                processed: data.processed,
                usersRestricted: data.usersRestricted
            })

            toast.success(`Processed ${data.processed} no-shows`)
            onProcess?.()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setProcessing(false)
        }
    }

    return (
        <Card className="border-dashed">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">{eventTitle}</CardTitle>
                        <CardDescription>
                            Ended: {endDate.toLocaleDateString()}
                        </CardDescription>
                    </div>
                    {isProcessed ? (
                        <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Processed
                        </Badge>
                    ) : !hasEnded ? (
                        <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Ongoing
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Pending
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isProcessed ? (
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <span>{result?.processed ?? noShowCount} no-shows</span>
                        </div>
                        {(result?.usersRestricted ?? 0) > 0 && (
                            <div className="flex items-center gap-2 text-destructive">
                                <Users className="h-4 w-4" />
                                <span>{result?.usersRestricted} users restricted</span>
                            </div>
                        )}
                    </div>
                ) : hasEnded ? (
                    <Button
                        onClick={handleProcessNoShows}
                        disabled={processing}
                        variant="destructive"
                        className="w-full gap-2"
                    >
                        {processing ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <AlertTriangle className="h-4 w-4" />
                                Process No-Shows
                            </>
                        )}
                    </Button>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No-shows can be processed after the event ends.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
