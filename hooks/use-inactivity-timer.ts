"use client"

import { useEffect, useRef, useCallback } from "react"

interface UseInactivityTimerProps {
  timeoutMs: number // Default: 30 mins (1800000 ms)
  onTimeout: () => void
  isActive: boolean // Only track when user is actually logged in
}

export function useInactivityTimer({ timeoutMs, onTimeout, isActive }: UseInactivityTimerProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (isActive) {
      timerRef.current = setTimeout(() => {
        onTimeout()
      }, timeoutMs)
    }
  }, [timeoutMs, onTimeout, isActive])

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    // Initialize timer
    resetTimer()

    // Events to track
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]

    // Throttled reset to prevent excessive re-renders/clearTimeouts
    let throttleTimer = false
    const handleActivity = () => {
      if (!throttleTimer) {
        resetTimer()
        throttleTimer = true
        setTimeout(() => (throttleTimer = false), 1000) // Only reset timer at most once per second
      }
    }

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isActive, resetTimer])
}
