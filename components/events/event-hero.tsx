import { Event } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { formatEventDate } from "@/lib/events-util"
import { Calendar, MapPin, Users } from "lucide-react"
import Image from "next/image"

interface EventHeroProps {
    event: Event
}

export function EventHero({ event }: EventHeroProps) {
    return (
        <div className="relative">
            {/* Banner Image */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <Image
                    src={event.bannerURL || "/glacampus.jpg"}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="container max-w-4xl mx-auto">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant={event.isFree ? "secondary" : "default"} className="text-sm">
                            {event.isFree ? "Free Entry" : `₹${event.price}`}
                        </Badge>
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm capitalize">
                            {event.category}
                        </Badge>
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm capitalize">
                            {event.venueType}
                        </Badge>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground drop-shadow-lg">
                        {event.title}
                    </h1>

                    {/* Quick Info */}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{formatEventDate(event.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            <span>{event.venueName || event.venueType}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>{event.registeredCount}/{event.capacity} Registered</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
