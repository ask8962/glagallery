"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react"

export type AchievementType = "level_up" | "badge_unlocked" | "streak_milestone" | "points_earned"

export interface Achievement {
    id: string
    type: AchievementType
    title: string
    description: string
    icon: string
    value?: string | number
    subtext?: string
}

interface AchievementContextType {
    triggerAchievement: (achievement: Omit<Achievement, "id">) => void
    currentAchievement: Achievement | null
    dismissAchievement: () => void
}

const AchievementContext = createContext<AchievementContextType>({
    triggerAchievement: () => { },
    currentAchievement: null,
    dismissAchievement: () => { },
})

export function AchievementProvider({ children }: { children: React.ReactNode }) {
    const [queue, setQueue] = useState<Achievement[]>([])
    const [current, setCurrent] = useState<Achievement | null>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showNext = useCallback((achievementQueue: Achievement[]) => {
        if (achievementQueue.length === 0) {
            setCurrent(null)
            return
        }

        const [next, ...rest] = achievementQueue
        setCurrent(next)
        setQueue(rest)

        // Auto-dismiss after 5 seconds
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            setCurrent(null)
            // Show next queued achievement after a brief pause
            setTimeout(() => showNext(rest), 300)
        }, 5000)
    }, [])

    const triggerAchievement = useCallback((achievement: Omit<Achievement, "id">) => {
        const newAchievement: Achievement = {
            ...achievement,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        }

        if (current) {
            // Queue it
            setQueue(prev => [...prev, newAchievement])
        } else {
            // Show immediately
            setCurrent(newAchievement)
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => {
                setCurrent(null)
                setQueue(prev => {
                    if (prev.length > 0) {
                        setTimeout(() => showNext(prev), 300)
                    }
                    return prev
                })
            }, 5000)
        }
    }, [current, showNext])

    const dismissAchievement = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setCurrent(null)
        setTimeout(() => {
            setQueue(prev => {
                if (prev.length > 0) showNext(prev)
                return prev
            })
        }, 300)
    }, [showNext])

    return (
        <AchievementContext.Provider value= {{ triggerAchievement, currentAchievement: current, dismissAchievement }
}>
    { children }
    </AchievementContext.Provider>
  )
}

export function useAchievement() {
    return useContext(AchievementContext)
}

// Helper to create common achievement payloads
export const Achievements = {
    levelUp: (level: number, title: string) => ({
        type: "level_up" as const,
        title: `Level ${level}!`,
        description: `You've reached ${title}`,
        icon: "⚡",
        value: level,
        subtext: "Keep going to unlock the next level",
    }),
    badgeUnlocked: (name: string, icon: string, description: string) => ({
        type: "badge_unlocked" as const,
        title: "Badge Unlocked!",
        description: name,
        icon,
        subtext: description,
    }),
    streakMilestone: (days: number) => ({
        type: "streak_milestone" as const,
        title: `${days}-Day Streak! 🔥`,
        description: `You've logged in ${days} days in a row`,
        icon: "🔥",
        value: days,
        subtext: "Keep the streak alive!",
    }),
    pointsEarned: (points: number, reason: string) => ({
        type: "points_earned" as const,
        title: `+${points} Points`,
        description: reason,
        icon: "✨",
        value: points,
    }),
}
