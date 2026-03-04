"use client"

import { useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAchievement, type Achievement } from "@/hooks/use-achievement"
import { X } from "lucide-react"

// Confetti particle system
function useConfetti(active: boolean) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animFrameRef = useRef<number>(0)

    useEffect(() => {
        if (!active || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const colors = [
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
            "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
            "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
        ]

        interface Particle {
            x: number; y: number; vx: number; vy: number
            size: number; color: string; rotation: number
            rotationSpeed: number; opacity: number; shape: "rect" | "circle"
        }

        const particles: Particle[] = []

        // Create burst of particles from center top
        for (let i = 0; i < 120; i++) {
            const angle = (Math.random() * Math.PI * 2)
            const speed = 3 + Math.random() * 8
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: canvas.height * 0.3,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 4,
                size: 4 + Math.random() * 8,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1,
                shape: Math.random() > 0.5 ? "rect" : "circle",
            })
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            let alive = false
            for (const p of particles) {
                if (p.opacity <= 0) continue
                alive = true

                p.x += p.vx
                p.y += p.vy
                p.vy += 0.15 // gravity
                p.vx *= 0.99 // air resistance
                p.rotation += p.rotationSpeed
                p.opacity -= 0.008

                ctx.save()
                ctx.globalAlpha = Math.max(0, p.opacity)
                ctx.translate(p.x, p.y)
                ctx.rotate((p.rotation * Math.PI) / 180)
                ctx.fillStyle = p.color

                if (p.shape === "rect") {
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
                } else {
                    ctx.beginPath()
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
                    ctx.fill()
                }

                ctx.restore()
            }

            if (alive) {
                animFrameRef.current = requestAnimationFrame(animate)
            }
        }

        animFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [active])

    return canvasRef
}

// Achievement type to gradient mapping
const typeGradients: Record<string, string> = {
    level_up: "from-yellow-500/20 via-orange-500/20 to-red-500/20",
    badge_unlocked: "from-purple-500/20 via-pink-500/20 to-rose-500/20",
    streak_milestone: "from-orange-500/20 via-red-500/20 to-yellow-500/20",
    points_earned: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
}

const typeBorderColors: Record<string, string> = {
    level_up: "border-yellow-500/30",
    badge_unlocked: "border-purple-500/30",
    streak_milestone: "border-orange-500/30",
    points_earned: "border-emerald-500/30",
}

const typeGlowColors: Record<string, string> = {
    level_up: "shadow-yellow-500/20",
    badge_unlocked: "shadow-purple-500/20",
    streak_milestone: "shadow-orange-500/20",
    points_earned: "shadow-emerald-500/20",
}

function AchievementCard({ achievement, onDismiss }: { achievement: Achievement; onDismiss: () => void }) {
    const gradient = typeGradients[achievement.type] || typeGradients.points_earned
    const border = typeBorderColors[achievement.type] || typeBorderColors.points_earned
    const glow = typeGlowColors[achievement.type] || typeGlowColors.points_earned

    return (
        <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 0.8,
            }}
            className="relative z-[100]"
        >
            <div
                className={`
          relative overflow-hidden rounded-2xl border ${border}
          bg-gradient-to-br ${gradient}
          backdrop-blur-xl shadow-2xl ${glow}
          p-6 min-w-[340px] max-w-[420px]
        `}
            >
                {/* Shimmer effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 2, repeat: 2, ease: "linear" }}
                />

                {/* Close button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4 text-white/60" />
                </button>

                {/* Content */}
                <div className="relative flex items-center gap-4">
                    {/* Icon with pulse */}
                    <motion.div
                        className="text-5xl flex-shrink-0"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 15,
                            delay: 0.2,
                        }}
                    >
                        <motion.span
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="block"
                        >
                            {achievement.icon}
                        </motion.span>
                    </motion.div>

                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <motion.h3
                            className="text-lg font-bold text-white tracking-tight"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            {achievement.title}
                        </motion.h3>

                        {/* Description */}
                        <motion.p
                            className="text-sm text-white/80 mt-0.5"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            {achievement.description}
                        </motion.p>

                        {/* Subtext */}
                        {achievement.subtext && (
                            <motion.p
                                className="text-xs text-white/50 mt-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                {achievement.subtext}
                            </motion.p>
                        )}
                    </div>

                    {/* Value badge */}
                    {achievement.value && (
                        <motion.div
                            className="flex-shrink-0 bg-white/10 backdrop-blur rounded-xl px-3 py-1.5 border border-white/10"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.3 }}
                        >
                            <span className="text-xl font-black text-white">
                                {achievement.value}
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Progress bar (auto-dismiss indicator) */}
                <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-white/30 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                />
            </div>
        </motion.div>
    )
}

export function AchievementOverlay() {
    const { currentAchievement, dismissAchievement } = useAchievement()
    const showConfetti = currentAchievement?.type === "level_up" || currentAchievement?.type === "badge_unlocked"
    const canvasRef = useConfetti(showConfetti)

    return (
        <>
            {/* Confetti canvas */}
            <AnimatePresence>
                {showConfetti && (
                    <motion.canvas
                        ref={canvasRef}
                        className="fixed inset-0 z-[99] pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </AnimatePresence>

            {/* Achievement notification card */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
                <AnimatePresence mode="wait">
                    {currentAchievement && (
                        <AchievementCard
                            key={currentAchievement.id}
                            achievement={currentAchievement}
                            onDismiss={dismissAchievement}
                        />
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}
