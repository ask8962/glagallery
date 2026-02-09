"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { getFirebase } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { EventTicket } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Ticket, Calendar, QrCode } from "lucide-react"
import Link from "next/link"

export default function MyTicketsPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [tickets, setTickets] = useState<(EventTicket & { id: string })[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/events/my-tickets")
        } else if (user) {
            fetchTickets()
        }
    }, [user, authLoading])

    const fetchTickets = async () => {
        try {
            const { db } = getFirebase()
            const ticketsRef = collection(db, "tickets")
            const q = query(
                ticketsRef,
                where("userId", "==", user!.uid),
                orderBy("bookedAt", "desc")
            )
            const snapshot = await getDocs(q)

            const fetchedTickets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as (EventTicket & { id: string })[]

            setTickets(fetchedTickets)
        } catch (error) {
            console.error("Failed to fetch tickets:", error)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Ticket className="h-8 w-8 text-primary" />
                    My Tickets
                </h1>
                <p className="text-muted-foreground mt-2">
                    View and manage your event registrations
                </p>
            </div>

            {tickets.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Tickets Yet</h3>
                        <p className="text-muted-foreground mt-2">
                            Register for events to see your tickets here!
                        </p>
                        <Link href="/events">
                            <Button className="mt-4">Browse Events</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <Card key={ticket.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">{ticket.eventTitle}</CardTitle>
                                <Badge variant={ticket.status === "valid" ? "default" : "secondary"}>
                                    {ticket.status}
                                </Badge>
                            </CardHeader>
                            <CardContent className="pt-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <QrCode className="h-4 w-4" />
                                        Ticket Code: <strong>{ticket.ticketCode}</strong>
                                    </p>
                                </div>
                                <Link href={`/events/my-tickets/${ticket.id}`}>
                                    <Button variant="outline" size="sm">View Ticket</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
