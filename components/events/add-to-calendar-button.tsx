"use client"

import { Button } from "@/components/ui/button"
import { CalendarPlus } from "lucide-react"

interface AddToCalendarButtonProps {
    eventId: string
    eventTitle: string
    variant?: "default" | "outline" | "secondary" | "ghost"
    size?: "default" | "sm" | "lg" | "icon"
    className?: string
}

export function AddToCalendarButton({
    eventId,
    eventTitle,
    variant = "outline",
    size = "default",
    className = ""
}: AddToCalendarButtonProps) {
    const handleDownload = () => {
        // Trigger download via API
        const link = document.createElement("a")
        link.href = `/api/events/calendar?eventId=${eventId}`
        link.download = `${eventTitle.replace(/\s+/g, "_")}.ics`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Button
            variant={variant}
            size={size}
            className={`gap-2 ${className}`}
            onClick={handleDownload}
        >
            <CalendarPlus className="h-4 w-4" />
            Add to Calendar
        </Button>
    )
}
