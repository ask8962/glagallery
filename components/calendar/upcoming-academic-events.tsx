"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Calendar,
    GraduationCap,
    PartyPopper,
    Trophy,
    Briefcase,
    BookOpen,
    ChevronRight
} from "lucide-react"
import Link from "next/link"
import type { AcademicEvent } from "@/lib/types"

const EVENT_ICONS: Record<string, any> = {
    exam: BookOpen,
    holiday: PartyPopper,
    semester_start: Calendar,
    semester_end: Calendar,
    registration: GraduationCap,
    convocation: GraduationCap,
    placement: Briefcase,
    cultural_fest: PartyPopper,
    sports_week: Trophy,
    workshop: BookOpen,
    other: Calendar,
}

const EVENT_COLORS: Record<string, string> = {
    exam: "text-red-500 bg-red-50",
    holiday: "text-green-500 bg-green-50",
    semester_start: "text-blue-500 bg-blue-50",
    semester_end: "text-blue-500 bg-blue-50",
    registration: "text-purple-500 bg-purple-50",
    convocation: "text-yellow-600 bg-yellow-50",
    placement: "text-orange-500 bg-orange-50",
    cultural_fest: "text-pink-500 bg-pink-50",
    sports_week: "text-cyan-500 bg-cyan-50",
    workshop: "text-indigo-500 bg-indigo-50",
    other: "text-gray-500 bg-gray-50",
}

export function UpcomingAcademicEvents({ limit = 5 }: { limit?: number }) {
    const { user } = useAuth()
    const [events, setEvents] = useState<AcademicEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEvents()
    }, [user])

    const fetchEvents = async () => {
        if (!user) return

        try {
            const token = await user.getIdToken()
            const today = new Date().toISOString()
            const res = await fetch(
                `/api/academic-calendar?startDate=${today}&limit=${limit}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (res.ok) {
                const data = await res.json()
                setEvents(data.events)
            }
        } catch (error) {
            console.error("Error fetching academic events:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        })
    }

    const getDaysUntil = (dateStr: string) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const eventDate = new Date(dateStr)
        eventDate.setHours(0, 0, 0, 0)
        const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (diff === 0) return "Today"
        if (diff === 1) return "Tomorrow"
        if (diff < 7) return `${diff} days`
        if (diff < 30) return `${Math.floor(diff / 7)} weeks`
        return `${Math.floor(diff / 30)} months`
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-accent" />
                        Academic Calendar
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-3/4 mb-2" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    if (events.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-accent" />
                        Academic Calendar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No upcoming academic events
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-accent" />
                        Academic Calendar
                    </CardTitle>
                    <Link
                        href="/calendar"
                        className="text-sm text-accent hover:underline flex items-center gap-1"
                    >
                        View all
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {events.map((event) => {
                    const Icon = EVENT_ICONS[event.type] || Calendar
                    const colorClass = EVENT_COLORS[event.type] || EVENT_COLORS.other

                    return (
                        <div
                            key={event.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{event.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDate(event.startDate)}
                                    {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                                </p>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0">
                                {getDaysUntil(event.startDate)}
                            </Badge>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
