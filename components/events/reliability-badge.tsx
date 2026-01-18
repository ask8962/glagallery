"use client"

import { Badge } from "@/components/ui/badge"
import {
    getReliabilityBadge,
    getReliabilityColor,
    calculateReliabilityScore,
    type EventStats
} from "@/lib/noshow-utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ShieldCheck, ShieldAlert, ShieldQuestion, Shield } from "lucide-react"

interface ReliabilityBadgeProps {
    eventStats?: EventStats
    reliabilityScore?: number
    showTooltip?: boolean
    size?: "sm" | "md" | "lg"
}

export function ReliabilityBadge({
    eventStats,
    reliabilityScore,
    showTooltip = true,
    size = "md"
}: ReliabilityBadgeProps) {
    const score = reliabilityScore ?? calculateReliabilityScore(eventStats)
    const badge = getReliabilityBadge(score, eventStats?.registered || 0)
    const colorClass = getReliabilityColor(badge)

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-2.5 py-0.5",
        lg: "text-base px-3 py-1"
    }

    const iconSize = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5"
    }

    const Icon = {
        "Excellent": ShieldCheck,
        "Good": ShieldCheck,
        "Fair": ShieldAlert,
        "Poor": ShieldAlert,
        "New": ShieldQuestion
    }[badge]

    const BadgeContent = (
        <Badge
            variant="outline"
            className={`${colorClass} ${sizeClasses[size]} gap-1 font-medium border`}
        >
            <Icon className={iconSize[size]} />
            {badge}
        </Badge>
    )

    if (!showTooltip) {
        return BadgeContent
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {BadgeContent}
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                        <p className="font-semibold">Reliability Score: {score}%</p>
                        {eventStats && (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                                <p>Events Registered: {eventStats.registered}</p>
                                <p>Events Attended: {eventStats.attended}</p>
                                <p>No-Shows: {eventStats.noShows}</p>
                            </div>
                        )}
                        {badge === "New" && (
                            <p className="text-xs">New user - no event history yet</p>
                        )}
                        {badge === "Poor" && (
                            <p className="text-xs text-destructive">
                                Low score may restrict paid event registration
                            </p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
