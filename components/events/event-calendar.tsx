"use client"

import { Event } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface EventCalendarProps {
    events: Event[]
}

export function EventCalendar({ events }: EventCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Pad beginning to start on Sunday
    const startDay = getDay(monthStart)
    const paddedDays = [...Array(startDay).fill(null), ...days]

    const getEventsForDay = (day: Date | null) => {
        if (!day) return []
        return events.filter(event => {
            const eventDate = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)
            return isSameDay(eventDate, day)
        })
    }

    return (
        <Card>
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="font-semibold text-lg">
                        {format(currentMonth, "MMMM yyyy")}
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {paddedDays.map((day, i) => {
                        const dayEvents = getEventsForDay(day)
                        const isToday = day && isSameDay(day, new Date())

                        return (
                            <div
                                key={i}
                                className={`min-h-[80px] p-1 border rounded-md ${!day ? "bg-muted/30" : "bg-background"
                                    } ${isToday ? "ring-2 ring-primary" : ""}`}
                            >
                                {day && (
                                    <>
                                        <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                                            {format(day, "d")}
                                        </div>
                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 2).map(event => (
                                                <Link key={event.id} href={`/events/${event.id}`}>
                                                    <Badge
                                                        variant="secondary"
                                                        className="w-full text-xs truncate cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                                    >
                                                        {event.title}
                                                    </Badge>
                                                </Link>
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <span className="text-xs text-muted-foreground">
                                                    +{dayEvents.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
