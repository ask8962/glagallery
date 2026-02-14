import { Event } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatEventDate } from "@/lib/events-util"
import { Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

interface UpcomingEventsProps {
    events: Event[]
    limit?: number
}

export function UpcomingEvents({ events, limit = 5 }: UpcomingEventsProps) {
    // Filter to only upcoming events and sort by date
    const upcomingEvents = events
        .filter(event => {
            const eventDate = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)
            return eventDate > new Date()
        })
        .slice(0, limit)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming Events
                </CardTitle>
                <Link href="/events">
                    <Button variant="ghost" size="sm" className="gap-1">
                        View All <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {upcomingEvents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No upcoming events</p>
                ) : (
                    <div className="space-y-3">
                        {upcomingEvents.map(event => (
                            <Link key={event.id} href={`/events/${event.id}`} className="block">
                                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                                        <span className="text-xs font-medium text-primary">
                                            {formatEventDate(event.startDate).split(" ")[0]}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{event.title}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {event.venueName || event.venueType}
                                        </p>
                                    </div>
                                    <Badge variant={event.isFree ? "secondary" : "default"}>
                                        {event.isFree ? "Free" : `₹${event.price}`}
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
