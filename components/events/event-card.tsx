import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Event } from "@/lib/types"
import { formatEventDate } from "@/lib/events-util"
import { Calendar, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface EventCardProps {
    event: Event
}

export function EventCard({ event }: EventCardProps) {
    const isEventEnded = event.endDate
        ? new Date(event.endDate) < new Date()
        : new Date(event.startDate) < new Date()

    return (
        <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full ${isEventEnded ? "opacity-80 grayscale-[0.3]" : ""}`}>
            <div className="relative h-48 w-full">
                <Image
                    src={event.bannerURL || "/placeholder-event.jpg"}
                    alt={event.title}
                    fill
                    className="object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                    {isEventEnded ? (
                        <Badge variant="destructive" className="bg-red-500/80 backdrop-blur-sm">
                            Ended
                        </Badge>
                    ) : (
                        <Badge variant={event.isFree ? "secondary" : "default"}>
                            {event.isFree ? "Free" : `₹${event.price}`}
                        </Badge>
                    )}
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                        {event.category}
                    </Badge>
                </div>
            </div>

            <CardHeader className="p-4">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                            {event.shortDescription}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 flex-1 space-y-2">
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatEventDate(event.startDate)}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.venueName || event.venueType}</span>
                </div>
            </CardContent>

            <CardFooter className="p-4 border-t bg-muted/20">
                <Link href={`/events/${event.id}`} className="w-full">
                    <Button
                        variant={isEventEnded ? "secondary" : "default"}
                        className="w-full"
                        disabled={false} // Keep clickable to view memories/details
                    >
                        {isEventEnded ? "Event Ended" : "View Details"}
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
