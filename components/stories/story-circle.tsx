"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus } from "lucide-react"

interface StoryCircleProps {
    userId: string
    userName: string
    userPhotoURL?: string
    hasUnviewed?: boolean
    isOwn?: boolean
    onClick?: () => void
    size?: "sm" | "md" | "lg"
}

export function StoryCircle({
    userId,
    userName,
    userPhotoURL,
    hasUnviewed = true,
    isOwn = false,
    onClick,
    size = "md",
}: StoryCircleProps) {
    const sizeClasses = {
        sm: "h-12 w-12",
        md: "h-16 w-16",
        lg: "h-20 w-20",
    }

    const ringClasses = {
        sm: "p-[2px]",
        md: "p-[3px]",
        lg: "p-[3px]",
    }

    const plusClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    }

    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1 group"
        >
            <div
                className={cn(
                    "rounded-full",
                    ringClasses[size],
                    hasUnviewed
                        ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                        : "bg-gray-300 dark:bg-gray-600",
                    "transition-transform group-hover:scale-105"
                )}
            >
                <div className="rounded-full bg-background p-[2px]">
                    <Avatar className={cn(sizeClasses[size], "relative")}>
                        <AvatarImage src={userPhotoURL} alt={userName} />
                        <AvatarFallback className="bg-accent/20 text-accent font-medium">
                            {userName?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>

                        {/* Plus icon for "Add Story" */}
                        {isOwn && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-accent text-accent-foreground rounded-full p-0.5 border-2 border-background">
                                <Plus className={plusClasses[size]} />
                            </div>
                        )}
                    </Avatar>
                </div>
            </div>

            <span className={cn(
                "text-xs font-medium truncate max-w-[64px]",
                hasUnviewed ? "text-foreground" : "text-muted-foreground"
            )}>
                {isOwn ? "Your Story" : userName.split(" ")[0]}
            </span>
        </button>
    )
}
