"use client"

import { motion } from "framer-motion"
import type { Badge } from "@/lib/types"
import { BADGES } from "@/lib/gamification"
import { Lock } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface BadgesShowcaseProps {
  unlockedBadges: Badge[]
  className?: string
}

export function BadgesShowcase({ unlockedBadges, className = "" }: BadgesShowcaseProps) {
  const allBadges = Object.values(BADGES)
  
  const isUnlocked = (badgeId: string) => {
    return unlockedBadges.some(b => b.id === badgeId)
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Badges ({unlockedBadges.length}/{allBadges.length})
        </h3>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-5 gap-3">
          {allBadges.map((badge, index) => {
            const unlocked = isUnlocked(badge.id)
            
            return (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative aspect-square rounded-xl flex items-center justify-center text-3xl transition-all duration-300 ${
                      unlocked
                        ? "bg-gradient-to-br from-accent/20 to-accent/10 border-2 border-accent/30 cursor-pointer hover:scale-110 hover:shadow-lg"
                        : "bg-muted border-2 border-border opacity-50 cursor-default"
                    }`}
                  >
                    {unlocked ? (
                      <span className="drop-shadow-lg">{badge.icon}</span>
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                    
                    {unlocked && (
                      <motion.div
                        className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                      >
                        <svg className="h-full w-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-center">
                    <div className="font-semibold text-sm">{badge.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {badge.description}
                    </div>
                    {!unlocked && (
                      <div className="text-xs text-orange-500 mt-1">
                        🔒 Locked
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}
