"use client"

import { EventTicket } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from "qrcode.react"
import { Calendar, MapPin, User } from "lucide-react"

interface TicketCardProps {
    ticket: EventTicket & { id: string }
}

export function TicketCard({ ticket }: TicketCardProps) {
    // QR Code data - contains ticket ID and code for verification
    const qrData = JSON.stringify({
        ticketId: ticket.id,
        code: ticket.ticketCode,
        eventId: ticket.eventId,
    })

    return (
        <Card className="max-w-md mx-auto overflow-hidden bg-gradient-to-br from-primary/5 to-background border-2">
            {/* Ticket Header */}
            <div className="bg-primary text-primary-foreground p-4 text-center">
                <h2 className="text-xl font-bold">CampusHub Events</h2>
                <p className="text-sm opacity-90">Entry Pass</p>
            </div>

            {/* Ticket Body */}
            <CardContent className="p-6 space-y-6">
                {/* Event Title */}
                <div className="text-center">
                    <h3 className="text-2xl font-bold">{ticket.eventTitle}</h3>
                    <Badge variant={ticket.status === "valid" ? "default" : "secondary"} className="mt-2">
                        {ticket.status.toUpperCase()}
                    </Badge>
                </div>

                {/* QR Code */}
                <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG
                        value={qrData}
                        size={180}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                {/* Ticket Code */}
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Ticket Code</p>
                    <p className="text-2xl font-mono font-bold tracking-widest">{ticket.ticketCode}</p>
                </div>

                {/* Attendee Info */}
                <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Attendee:</span>
                        <span className="font-medium">{ticket.userName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Booked:</span>
                        <span className="font-medium">
                            {ticket.bookedAt?.toDate ? ticket.bookedAt.toDate().toLocaleDateString() : "N/A"}
                        </span>
                    </div>
                </div>

                {/* Perforated Edge Effect */}
                <div className="border-t-2 border-dashed"></div>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground">
                    <p>Present this QR code at the venue entrance</p>
                    <p>This ticket is non-transferable</p>
                    <p className="mt-4 font-semibold text-primary/80">Powered by CampusHub</p>
                </div>
            </CardContent>
        </Card>
    )
}
