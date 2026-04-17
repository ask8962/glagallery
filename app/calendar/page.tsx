"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar as CalendarIcon, Clock, BookOpen } from "lucide-react"
import { motion } from "framer-motion"
import type { AcademicEventType, AcademicEvent } from "@/lib/types"

const EVENT_TYPES: { value: AcademicEventType; label: string; color: string }[] = [
    { value: "exam", label: "Examination", color: "bg-red-100 text-red-700" },
    { value: "holiday", label: "Holiday", color: "bg-green-100 text-green-700" },
    { value: "semester_start", label: "Semester Start", color: "bg-blue-100 text-blue-700" },
    { value: "semester_end", label: "Semester End", color: "bg-blue-100 text-blue-700" },
    { value: "registration", label: "Registration", color: "bg-purple-100 text-purple-700" },
    { value: "convocation", label: "Convocation", color: "bg-yellow-100 text-yellow-700" },
    { value: "placement", label: "Placement", color: "bg-orange-100 text-orange-700" },
    { value: "cultural_fest", label: "Cultural Fest", color: "bg-pink-100 text-pink-700" },
    { value: "sports_week", label: "Sports Week", color: "bg-cyan-100 text-cyan-700" },
    { value: "workshop", label: "Workshop", color: "bg-indigo-100 text-indigo-700" },
    { value: "other", label: "Other", color: "bg-gray-100 text-gray-700" },
]

export default function AcademicCalendarPage() {
    const { user } = useAuth()
    const { organization } = useOrganization()
    const [events, setEvents] = useState<AcademicEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || !organization?.id) return

        const fetchEvents = async () => {
            try {
                const token = await user.getIdToken()
                const res = await fetch(`/api/academic-calendar?limit=100&organizationId=${organization.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })

                if (res.ok) {
                    const data = await res.json()
                    setEvents(data.events)
                }
            } catch (error) {
                console.error("Failed to load academic calendar:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchEvents()
    }, [user, organization?.id])

    const getTypeConfig = (type: string) => {
        return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1]
    }

    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start)
        const endDate = new Date(end)
        
        if (startDate.toDateString() === endDate.toDateString()) {
            return startDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        }
        
        return `${startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
    }

    if (!user) {
        return (
            <main className="container mx-auto max-w-4xl py-20 text-center px-4">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4">Authentication Required</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Please sign in to view the academic calendar.</p>
            </main>
        )
    }

    if (loading) {
        return (
            <main className="container mx-auto max-w-4xl py-20 flex justify-center px-4">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </main>
        )
    }

    return (
        <main className="container mx-auto max-w-5xl w-full py-8 md:py-12 px-4 sm:px-6 lg:px-8 space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="h-1 w-10 sm:w-12 bg-accent" />
                  <span className="text-xs sm:text-sm font-medium text-accent">Dates & Milestones</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight break-words">Academic Calendar</h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto px-2">
                    Stay up-to-date with important university dates, examinations, holidays, and extracurricular schedules.
                </p>
            </motion.div>

            {events.length === 0 ? (
                <div className="text-center py-20 border rounded-xl bg-card/50">
                    <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-medium">No Upcoming Events</h3>
                    <p className="text-muted-foreground mt-2">The academic calendar is currently empty.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event, index) => {
                        const typeConfig = getTypeConfig(event.type)
                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="h-full hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <Badge className={`${typeConfig.color} mb-2 shadow-none font-normal text-xs`}>
                                                {typeConfig.label}
                                            </Badge>
                                        </div>
                                        <CardTitle className="leading-tight text-base sm:text-lg break-words">{event.title}</CardTitle>
                                        {event.description && (
                                            <CardDescription className="line-clamp-2 mt-2 text-xs sm:text-sm">
                                                {event.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground gap-2 break-normal">
                                            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                                            <span>{formatDateRange(event.startDate, event.endDate)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </main>
    )
}
