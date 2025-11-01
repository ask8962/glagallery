import { BadgeCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type VerifiedBadgeProps = {
    size?: "sm" | "md" | "lg"
    showText?: boolean
    className?: string
}

export function VerifiedBadge({
    size = "md",
    showText = true,
    className
}: VerifiedBadgeProps) {
    const iconSizes = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
    }

    if (!showText) {
        return (
            <BadgeCheck
                className={cn(
                    iconSizes[size],
                    "text-blue-500",
                    className
                )}
            />
        )
    }

    return (
        <Badge
            className={cn(
                "bg-blue-500 text-white gap-1 hover:bg-blue-600",
                size === "sm" && "text-xs py-0 px-1.5",
                size === "lg" && "text-sm py-1 px-3",
                className
            )}
        >
            <BadgeCheck className={iconSizes[size]} />
            Verified
        </Badge>
    )
}

type ClubVerificationStatusProps = {
    status: "unverified" | "pending" | "verified" | "rejected"
    showLabel?: boolean
}

export function ClubVerificationStatus({
    status,
    showLabel = true
}: ClubVerificationStatusProps) {
    const statusConfig = {
        unverified: {
            variant: "outline" as const,
            text: "Unverified",
            className: "text-muted-foreground border-muted-foreground/30",
        },
        pending: {
            variant: "outline" as const,
            text: "Pending",
            className: "text-yellow-600 border-yellow-600/30 bg-yellow-50",
        },
        verified: {
            variant: "default" as const,
            text: "Verified",
            className: "bg-blue-500 text-white hover:bg-blue-600",
        },
        rejected: {
            variant: "destructive" as const,
            text: "Rejected",
            className: "",
        },
    }

    const config = statusConfig[status]

    return (
        <Badge variant={config.variant} className={cn("gap-1", config.className)}>
            {status === "verified" && <BadgeCheck className="h-3 w-3" />}
            {showLabel && config.text}
        </Badge>
    )
}
