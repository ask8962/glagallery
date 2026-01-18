"use client"

import { motion } from "framer-motion"
import { getUserLevel } from "@/lib/gamification"
import { Trophy, TrendingUp } from "lucide-react"

interface LevelBadgeProps {
  points: number
  className?: string
  showProgress?: boolean
}

export function LevelBadge({ points, className = "", showProgress = false }: LevelBadgeProps) {
  const { level, title, nextLevel } = getUserLevel(points)
  
  const progress = nextLevel 
    ? ((points - (level === 1 ? 0 : getUserLevel(nextLevel.minPoints - 1).level)) / 
       (nextLevel.minPoints - (level === 1 ? 0 : getUserLevel(nextLevel.minPoints - 1).level))) * 100
    : 100

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* Level Icon */}
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg">
            <Trophy className="h-6 w-6 text-accent-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border-2 border-background">
            {level}
          </div>
        </div>

        {/* Level Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-accent">{title}</span>
            <span className="text-xs text-muted-foreground">{points} pts</span>
          </div>
          
          {showProgress && nextLevel && (
            <div className="mt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>{nextLevel.minPoints - points} pts to {nextLevel.title}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
