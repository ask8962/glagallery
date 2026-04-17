"use client"

import { useState, useEffect } from "react"
import { Event } from "@/lib/types"
import { EventGrid } from "@/components/events/event-grid"
import { EventFilter } from "@/components/events/event-filter"
import { EventCalendar } from "@/components/events/event-calendar"
import { Button } from "@/components/ui/button"
import { Plus, LayoutGrid, Calendar, Ticket } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"

type ViewMode = "grid" | "calendar"

export default function EventsPage() {
    const { user } = useAuth()
    const { organization } = useOrganization()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [viewMode, setViewMode] = useState<ViewMode>("grid")

    useEffect(() => {
        fetchEvents()
    }, [selectedCategory, organization])

    const fetchEvents = async () => {
        if (!organization?.id) return; // Wait until organization context is loaded
        
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (selectedCategory !== "all") params.append("category", selectedCategory)
            params.append("orgId", organization.id)

            const res = await fetch(`/api/events?${params.toString()}`)
            const data = await res.json()

            if (data.events) {
                setEvents(data.events)
            }
        } catch (error) {
            console.error("Failed to fetch events:", error)
        } finally {
            setLoading(false)
        }
    }

    // Client-side search filtering
    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venueName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">
            {/* Background Decoration */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8 pb-6 border-b">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">Campus Events.</h1>
                    <p className="text-lg text-muted-foreground">
                        Discover workshops, hackathons, and activities at GLA University.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center border rounded-lg p-1 bg-muted/30">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className="gap-1"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Grid
                        </Button>
                        <Button
                            variant={viewMode === "calendar" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("calendar")}
                            className="gap-1"
                        >
                            <Calendar className="h-4 w-4" />
                            Calendar
                        </Button>
                    </div>

                    {/* Create Button */}
                    {user && (
                        <>
                            <Link href="/events/my-tickets">
                                <Button variant="outline" className="gap-2">
                                    <Ticket className="h-4 w-4" />
                                    My Tickets
                                </Button>
                            </Link>
                            <Link href="/events/create">
                                <Button className="gap-2 shadow-lg hover:shadow-primary/25 transition-all">
                                    <Plus className="h-4 w-4" />
                                    Host an Event
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Filters (only for grid view) */}
            {viewMode === "grid" && (
                <EventFilter
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                />
            )}

            {/* Content */}
            {viewMode === "grid" ? (
                <EventGrid events={filteredEvents} loading={loading} />
            ) : (
                <EventCalendar events={filteredEvents} />
            )}
        </div>
    )
}

