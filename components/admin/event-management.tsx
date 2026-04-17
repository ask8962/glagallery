"use client"

import { useEffect, useState } from "react"
import { getFirebase } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore"
import type { Event } from "@/lib/types"
import { NoShowReport } from "@/components/admin/noshow-report"
import { EventAttendeesList } from "@/components/admin/event-attendees-list"
import { useOrganization } from "@/context/organization-context"

export function EventManagement() {
    const { db } = getFirebase()
    const { organization } = useOrganization()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!organization?.id) return;

        const q = query(
            collection(db, "events"), 
            where("organizationId", "==", organization.id),
            orderBy("endDate", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: Event[] = []
                snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
                setEvents(list)
                setLoading(false)
            },
            (error) => {
                console.error("Error loading events:", error)
                setLoading(false)
            }
        )

        return () => unsub()
    }, [db])

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Loading events...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-primary">Event Management</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                    return (
                        <div key={event.id} className="space-y-4">
                            <NoShowReport
                                eventId={event.id}
                                eventTitle={event.title}
                                eventEndDate={event.endDate?.toDate ? event.endDate.toDate() : new Date(event.endDate)}
                                noShowsProcessed={event.noShowsProcessed}
                                noShowCount={event.noShowCount}
                            />

                            <div className="flex justify-end">
                                <EventAttendeesList
                                    eventId={event.id}
                                    eventTitle={event.title}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
            {events.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No events found.</p>
            )}
        </div>
    )
}
