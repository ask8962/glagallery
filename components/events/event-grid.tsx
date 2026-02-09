import { Event } from "@/lib/types"
import { EventCard } from "./event-card"
import { CalendarX } from "lucide-react"
import { EventsSkeleton } from "@/components/skeletons/events-skeleton"
import { EmptyState } from "@/components/empty-state"

interface EventGridProps {
    events: Event[]
    loading?: boolean
}

export function EventGrid({ events, loading = false }: EventGridProps) {
    if (loading) {
        return <EventsSkeleton />
    }

    if (events.length === 0) {
        return (
            <EmptyState
                icon={CalendarX}
                title="No events found"
                description="We couldn't find any events matching your criteria. Try adjusting your filters or check back later."
                action={{
                    label: "Host an Event",
                    href: "/events/create"
                }}
            />
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    )
}

