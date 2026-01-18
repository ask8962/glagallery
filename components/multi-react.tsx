"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const reactOptions = [
  { emoji: "❤️", label: "Love", color: "text-red-500" },
  { emoji: "🔥", label: "Fire", color: "text-orange-500" },
  { emoji: "😍", label: "Adore", color: "text-pink-500" },
  { emoji: "😂", label: "Funny", color: "text-yellow-500" },
  { emoji: "😮", label: "Wow", color: "text-blue-500" },
  { emoji: "👍", label: "Like", color: "text-green-500" },
]

interface MultiReactProps {
  postId: string
  userReacts: Record<string, string[]> // { userId: emoji }
  currentUser?: { uid: string }
  onReact: (emoji: string) => void
  className?: string
}

export function MultiReact({ postId, userReacts, currentUser, onReact, className }: MultiReactProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null)

  // Get current user's reaction
  const currentUserReact = currentUser ? userReacts[currentUser.uid] : null
  
  // Count total reactions
  const reactionCounts = reactOptions.reduce((acc, option) => {
    acc[option.emoji] = Object.values(userReacts).filter(reacts => reacts.includes(option.emoji)).length
    return acc
  }, {} as Record<string, number>)

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0)

  const handleReact = (emoji: string) => {
    onReact(emoji)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      {/* Main React Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 px-3 text-xs transition-all duration-200",
          currentUserReact 
            ? "bg-accent/10 text-accent border-accent/30" 
            : "hover:bg-accent/10 hover:text-accent hover:border-accent/30"
        )}
      >
        <span className="mr-1">
          {currentUserReact ? currentUserReact[0] : "🤍"}
        </span>
        {totalReactions > 0 && (
          <span className="ml-1 font-medium">{totalReactions}</span>
        )}
      </Button>

      {/* React Options Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-2 bg-background border border-border rounded-xl shadow-lg p-2 z-50"
          >
            <div className="flex gap-1">
              {reactOptions.map((option) => {
                const count = reactionCounts[option.emoji]
                const isSelected = currentUserReact?.includes(option.emoji)
                
                return (
                  <motion.button
                    key={option.emoji}
                    onClick={() => handleReact(option.emoji)}
                    onMouseEnter={() => setHoveredEmoji(option.emoji)}
                    onMouseLeave={() => setHoveredEmoji(null)}
                    className={cn(
                      "relative p-2 rounded-lg transition-all duration-200 hover:scale-110",
                      isSelected ? "bg-accent/20" : "hover:bg-muted"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-lg">{option.emoji}</span>
                    
                    {/* Count badge */}
                    {count > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-4 w-4 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-medium"
                      >
                        {count}
                      </motion.div>
                    )}

                    {/* Tooltip */}
                    <AnimatePresence>
                      {hoveredEmoji === option.emoji && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded whitespace-nowrap"
                        >
                          {option.label}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction Summary (when closed) */}
      {!isOpen && totalReactions > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-full left-0 mb-1 flex gap-1"
        >
          {reactOptions
            .filter(option => reactionCounts[option.emoji] > 0)
            .slice(0, 3)
            .map((option) => (
              <span key={option.emoji} className="text-sm">
                {option.emoji}
              </span>
            ))}
          {Object.values(reactionCounts).filter(count => count > 0).length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{Object.values(reactionCounts).filter(count => count > 0).length - 3}
            </span>
          )}
        </motion.div>
      )}
    </div>
  )
}
