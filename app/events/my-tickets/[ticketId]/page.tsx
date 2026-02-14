"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { EventTicket } from "@/lib/types"
import { TicketCard } from "@/components/events/ticket-card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Download, Share2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function TicketViewPage() {
    const params = useParams()
    const ticketId = params.ticketId as string
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()

    const [ticket, setTicket] = useState<(EventTicket & { id: string }) | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login")
        } else if (user && ticketId) {
            fetchTicket()
        }
    }, [user, authLoading, ticketId])

    const fetchTicket = async () => {
        try {
            const { db } = getFirebase()
            const ticketRef = doc(db, "tickets", ticketId)
            const ticketDoc = await getDoc(ticketRef)

            if (!ticketDoc.exists()) {
                toast.error("Ticket not found")
                router.push("/events/my-tickets")
                return
            }

            const ticketData = {
                id: ticketDoc.id,
                ...ticketDoc.data()
            } as EventTicket & { id: string }

            // Verify ownership
            if (ticketData.userId !== user!.uid) {
                toast.error("Unauthorized access")
                router.push("/events/my-tickets")
                return
            }

            setTicket(ticketData)
        } catch (error) {
            console.error("Failed to fetch ticket:", error)
            toast.error("Failed to load ticket")
        } finally {
            setLoading(false)
        }
    }

    const handleShare = async () => {
        if (!ticket) return

        try {
            await navigator.share({
                title: `Ticket for ${ticket.eventTitle}`,
                text: `My ticket code: ${ticket.ticketCode}`,
                url: window.location.href,
            })
        } catch {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(ticket.ticketCode)
            toast.success("Ticket code copied!")
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!ticket) return null

    return (
        <div className="container max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/events/my-tickets">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Tickets
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Ticket Display */}
            <TicketCard ticket={ticket} />

            {/* Actions */}
            <div className="mt-8 text-center">
                <Link href={`/events/${ticket.eventId}`}>
                    <Button variant="outline">View Event Details</Button>
                </Link>
            </div>
        </div>
    )
}
