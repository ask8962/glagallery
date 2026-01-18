"use client"

import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, Award } from "lucide-react"
import { useEffect, useState } from "react"

interface PointsToastProps {
  points: number
  reason: string
  show: boolean
  onClose: () => void
}

export function PointsToast({ points, reason, show, onClose }: PointsToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className="fixed top-20 right-4 z-50 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground px-6 py-4 rounded-xl shadow-2xl border-2 border-accent/50"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <TrendingUp className="h-6 w-6" />
            </motion.div>
            <div>
              <div className="font-bold text-lg">+{points} Points!</div>
              <div className="text-sm opacity-90">{reason}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface LevelUpToastProps {
  level: number
  title: string
  show: boolean
  onClose: () => void
}

export function LevelUpToast({ level, title, show, onClose }: LevelUpToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="bg-gradient-to-br from-accent via-accent/90 to-accent/80 text-accent-foreground p-8 rounded-2xl shadow-2xl border-4 border-accent/50 text-center max-w-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-4"
            >
              <Award className="h-20 w-20 mx-auto" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-3xl font-bold mb-2">Level Up!</h2>
              <div className="text-xl mb-2">Level {level}</div>
              <div className="text-2xl font-bold mb-4">{title}</div>
              <p className="text-sm opacity-90">Keep up the great work! 🎉</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface BadgeUnlockedToastProps {
  badge: {
    name: string
    description: string
    icon: string
  }
  show: boolean
  onClose: () => void
}

export function BadgeUnlockedToast({ badge, show, onClose }: BadgeUnlockedToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-20 right-4 z-50 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-purple-400 max-w-sm"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="text-4xl"
            >
              {badge.icon}
            </motion.div>
            <div>
              <div className="font-bold text-lg">Badge Unlocked!</div>
              <div className="text-sm font-semibold">{badge.name}</div>
              <div className="text-xs opacity-90">{badge.description}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
