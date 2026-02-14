"use client"

import { useEffect, useState } from "react"
import { subscribeToUserPresence } from "@/lib/presence"
import { Badge } from "@/components/ui/badge"
import { Circle } from "lucide-react"

interface OnlineIndicatorProps {
  userId: string
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

export function OnlineIndicator({ userId, showLabel = false, size = "md" }: OnlineIndicatorProps) {
  const [status, setStatus] = useState<"online" | "offline" | "away" | null>(null)

  useEffect(() => {
    if (!userId) return
    
    const unsubscribe = subscribeToUserPresence(userId, (newStatus) => {
      setStatus(newStatus)
    })

    return () => unsubscribe()
  }, [userId])

  if (!status || status === "offline") return null

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  }

  const colorClasses = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-400",
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <Circle
          className={`${sizeClasses[size]} ${colorClasses[status]} rounded-full animate-pulse`}
          fill="currentColor"
        />
        {status === "online" && (
          <div
            className={`absolute inset-0 ${sizeClasses[size]} ${colorClasses[status]} rounded-full animate-ping opacity-75`}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground capitalize">{status}</span>
      )}
    </div>
  )
}
