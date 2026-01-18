"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface CountdownTimerProps {
  deadline: Date
  onExpired?: () => void
  showWarning?: boolean
  warningThreshold?: number // milliseconds before deadline to show warning
}

export function CountdownTimer({
  deadline,
  onExpired,
  showWarning = true,
  warningThreshold = 60 * 60 * 1000, // 1 hour default
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
  }>(calculateTimeLeft())

  const [isExpired, setIsExpired] = useState(false)
  const [showWarningState, setShowWarningState] = useState(false)

  function calculateTimeLeft() {
    const now = new Date().getTime()
    const deadlineTime = deadline.getTime()
    const difference = deadlineTime - now

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
      }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      total: difference,
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      if (newTimeLeft.total <= 0 && !isExpired) {
        setIsExpired(true)
        if (onExpired) {
          onExpired()
        }
      }

      // Show warning if within threshold
      if (showWarning && newTimeLeft.total > 0 && newTimeLeft.total <= warningThreshold) {
        setShowWarningState(true)
      } else {
        setShowWarningState(false)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [deadline, onExpired, isExpired, showWarning, warningThreshold])

  if (isExpired) {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive/20">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">Deadline has passed</span>
        </div>
      </Card>
    )
  }

  return (
    <AnimatePresence>
      {showWarningState && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4"
        >
          <Card className="p-4 bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Deadline approaching! Submit soon.</span>
            </div>
          </Card>
        </motion.div>
      )}
      
      <Card className={`p-6 ${showWarningState ? "border-orange-300 dark:border-orange-800" : ""}`}>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-6 w-6 text-accent" />
          <h3 className="text-lg font-semibold text-primary">Time Remaining</h3>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">{timeLeft.days}</div>
            <div className="text-xs text-muted-foreground uppercase">Days</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">{timeLeft.hours}</div>
            <div className="text-xs text-muted-foreground uppercase">Hours</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">{timeLeft.minutes}</div>
            <div className="text-xs text-muted-foreground uppercase">Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">{timeLeft.seconds}</div>
            <div className="text-xs text-muted-foreground uppercase">Seconds</div>
          </div>
        </div>
        
        {timeLeft.total < warningThreshold && (
          <Badge variant="destructive" className="mt-4 w-full justify-center">
            Urgent: Less than {Math.floor(warningThreshold / (1000 * 60))} minutes remaining
          </Badge>
        )}
      </Card>
    </AnimatePresence>
  )
}
