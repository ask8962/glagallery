"use client"

import { Clock, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ScheduleItem {
    time: string
    title: string
    description?: string
    speaker?: string
}

interface HackathonScheduleProps {
    schedule: ScheduleItem[]
    className?: string
}

export function HackathonSchedule({ schedule, className = "" }: HackathonScheduleProps) {
    if (!schedule || schedule.length === 0) {
        return null
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Event Schedule
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />

                    <div className="space-y-6">
                        {schedule.map((item, index) => (
                            <div key={index} className="relative pl-8">
                                {/* Timeline dot */}
                                <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-sm" />

                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                                            {item.time}
                                        </span>
                                        <h4 className="font-semibold">{item.title}</h4>
                                    </div>

                                    {item.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {item.description}
                                        </p>
                                    )}

                                    {item.speaker && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            <span>{item.speaker}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
