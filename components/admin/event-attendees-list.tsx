"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Download, Loader2, User, Ticket } from "lucide-react"
import { getFirebase } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore"
import { EventTicket } from "@/lib/types" // Assuming EventTicket is exported
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

interface EventAttendeesListProps {
    eventId: string
    eventTitle: string
}

type Attendee = EventTicket & {
    id: string
    reliabilityScore?: number
}

export function EventAttendeesList({ eventId, eventTitle }: EventAttendeesListProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [attendees, setAttendees] = useState<Attendee[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (open) {
            fetchAttendees()
        }
    }, [open, eventId])

    const fetchAttendees = async () => {
        setLoading(true)
        try {
            const { db } = getFirebase()
            const ticketsRef = collection(db, "tickets")
            const q = query(
                ticketsRef,
                where("eventId", "==", eventId),
                orderBy("bookedAt", "desc")
            )

            const snapshot = await getDocs(q)
            const tickets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as EventTicket[]

            // Fetch reliability scores for each user (optional optimization: batch fetch or store in ticket)
            // For now, we'll fetch explicitly to be accurate
            const attendeesWithScores = await Promise.all(tickets.map(async (ticket) => {
                try {
                    const userRef = doc(db, "users", ticket.userId)
                    const userSnap = await getDoc(userRef)
                    const userData = userSnap.data()
                    return {
                        ...ticket,
                        reliabilityScore: userData?.reliabilityScore
                    }
                } catch {
                    return ticket
                }
            })) as Attendee[]

            setAttendees(attendeesWithScores)
        } catch (error) {
            console.error("Error fetching attendees:", error)
            toast.error("Failed to load attendees")
        } finally {
            setLoading(false)
        }
    }

    const filteredAttendees = attendees.filter(attendee =>
        attendee.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleExport = () => {
        const headers = ["Ticket Code", "Name", "Email", "Status", "Booked At", "Used At"]
        const csvContent = [
            headers.join(","),
            ...filteredAttendees.map(a => [
                a.ticketCode,
                `"${a.userName}"`,
                a.userEmail,
                a.status,
                a.bookedAt?.toDate?.()?.toISOString() || "",
                a.usedAt?.toDate?.()?.toISOString() || ""
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attendees.csv`
        link.click()
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "valid": return <Badge variant="outline" className="border-green-500 text-green-500">Valid</Badge>
            case "used": return <Badge variant="default" className="bg-green-500">Checked In</Badge>
            case "noshow": return <Badge variant="destructive">No Show</Badge>
            case "cancelled": return <Badge variant="secondary">Cancelled</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Users className="h-4 w-4" />
                    View Attendees
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Attendees: {eventTitle}</span>
                        <Badge variant="secondary" className="mr-8">
                            {attendees.length} Registered
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 py-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or ticket code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button variant="outline" onClick={handleExport} disabled={attendees.length === 0}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                <div className="flex-1 overflow-auto border rounded-md">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredAttendees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Users className="h-12 w-12 mb-2 opacity-20" />
                            <p>No attendees found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Attendee</TableHead>
                                    <TableHead>Ticket Code</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reliability</TableHead>
                                    <TableHead className="text-right">Booked At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAttendees.map((attendee) => (
                                    <TableRow key={attendee.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{attendee.userName}</span>
                                                <span className="text-xs text-muted-foreground">{attendee.userEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {attendee.ticketCode}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(attendee.status)}
                                        </TableCell>
                                        <TableCell>
                                            {attendee.reliabilityScore !== undefined ? (
                                                <span className={`text-xs font-medium ${attendee.reliabilityScore >= 90 ? "text-green-500" :
                                                        attendee.reliabilityScore < 50 ? "text-red-500" : "text-yellow-500"
                                                    }`}>
                                                    {attendee.reliabilityScore}%
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {attendee.bookedAt?.toDate?.()?.toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
