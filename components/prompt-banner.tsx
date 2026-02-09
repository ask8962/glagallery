"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Sparkles, Calendar, Camera } from "lucide-react"
import Link from "next/link"

const weeklyPrompts = [
  {
    id: 1,
    title: "Monsoon Magic",
    description: "Capture the beauty of rain on campus - puddles, umbrellas, and cozy moments",
    icon: "🌧️",
    color: "from-blue-500 to-cyan-500",
    deadline: "Ends in 3 days"
  },
  {
    id: 2,
    title: "Library Vibes",
    description: "Show us your study spots, late-night sessions, and academic achievements",
    icon: "📚",
    color: "from-purple-500 to-pink-500",
    deadline: "Ends in 5 days"
  },
  {
    id: 3,
    title: "Sports Spirit",
    description: "Action shots from the field, team celebrations, and athletic moments",
    icon: "⚽",
    color: "from-green-500 to-emerald-500",
    deadline: "Ends in 2 days"
  },
  {
    id: 4,
    title: "Festival Fever",
    description: "Cultural performances, decorations, and the energy of campus fests",
    icon: "🎭",
    color: "from-orange-500 to-red-500",
    deadline: "Ends in 1 day"
  }
]

// Get current week's prompt (cycling through the array)
const getCurrentPrompt = () => {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  return weeklyPrompts[weekNumber % weeklyPrompts.length]
}

export default function PromptBanner() {
  const currentPrompt = getCurrentPrompt()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-6 mb-8"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 text-6xl">{currentPrompt.icon}</div>
        <div className="absolute bottom-4 left-4 text-4xl opacity-50">{currentPrompt.icon}</div>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary-foreground">Weekly Challenge</h3>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <Calendar className="h-3 w-3" />
                <span>{currentPrompt.deadline}</span>
              </div>
            </div>
          </div>
          
          <div className="text-4xl">{currentPrompt.icon}</div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
            {currentPrompt.title}
          </h2>
          <p className="text-primary-foreground/90 leading-relaxed">
            {currentPrompt.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/upload">
            <Button 
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Camera className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Join Challenge
            </Button>
          </Link>
          
          <Button 
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm"
          >
            View Submissions
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="mt-4 flex items-center gap-2 text-sm text-primary-foreground/70">
          <div className="flex-1 h-1 bg-primary-foreground/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <span>65% complete</span>
        </div>
      </div>

      {/* Floating elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute top-4 right-4 bg-accent/20 backdrop-blur-sm px-3 py-1 rounded-full"
      >
        <span className="text-xs font-medium text-accent">Active</span>
      </motion.div>
    </motion.div>
  )
}
