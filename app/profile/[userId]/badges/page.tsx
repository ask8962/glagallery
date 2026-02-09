"use client"

import { useEffect, useState } from "react"
import { getFirebase } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import type { UserProfile, Badge } from "@/lib/types"
import { motion } from "framer-motion"
import { Award, Lock, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface BadgesPageProps {
    params: { userId: string }
}

// Define all available badges
const ALL_BADGES: Badge[] = [
    { id: "first_post", name: "First Steps", description: "Upload your first memory", icon: "🎯", tier: "bronze" },
    { id: "10_posts", name: "Memory Keeper", description: "Share 10 memories", icon: "📸", tier: "bronze" },
    { id: "50_posts", name: "Storyteller", description: "Share 50 memories", icon: "📚", tier: "silver" },
    { id: "100_posts", name: "Legend", description: "Share 100 memories", icon: "🏆", tier: "gold" },
    { id: "first_like", name: "Appreciated", description: "Receive your first like", icon: "❤️", tier: "bronze" },
    { id: "100_likes", name: "Popular", description: "Receive 100 likes", icon: "🌟", tier: "silver" },
    { id: "500_likes", name: "Celebrity", description: "Receive 500 likes", icon: "✨", tier: "gold" },
    { id: "first_comment", name: "Conversationalist", description: "Leave your first comment", icon: "💬", tier: "bronze" },
    { id: "50_comments", name: "Engaged", description: "Leave 50 comments", icon: "🗣️", tier: "silver" },
    { id: "first_follower", name: "Noticed", description: "Get your first follower", icon: "👋", tier: "bronze" },
    { id: "10_followers", name: "Influencer", description: "Get 10 followers", icon: "🎭", tier: "silver" },
    { id: "50_followers", name: "Icon", description: "Get 50 followers", icon: "👑", tier: "gold" },
    { id: "streak_7", name: "Consistent", description: "7-day login streak", icon: "🔥", tier: "bronze" },
    { id: "streak_30", name: "Dedicated", description: "30-day login streak", icon: "💪", tier: "silver" },
    { id: "streak_100", name: "Unstoppable", description: "100-day login streak", icon: "⚡", tier: "gold" },
    { id: "hackathon_participant", name: "Hacker", description: "Participate in a hackathon", icon: "💻", tier: "bronze" },
    { id: "hackathon_winner", name: "Champion", description: "Win a hackathon", icon: "🥇", tier: "gold" },
    { id: "early_adopter", name: "Early Adopter", description: "Joined in the first month", icon: "🚀", tier: "silver" },
]

const tierColors = {
    bronze: "from-amber-600/20 to-amber-800/20 border-amber-600/50",
    silver: "from-slate-300/20 to-slate-500/20 border-slate-400/50",
    gold: "from-yellow-400/20 to-yellow-600/20 border-yellow-500/50",
}

const tierLabels = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
}

export default function BadgesPage({ params }: BadgesPageProps) {
    const { userId } = params
    const { db } = getFirebase()
    const [earnedBadges, setEarnedBadges] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadBadges() {
            try {
                const userDoc = await getDoc(doc(db, "users", userId))
                if (userDoc.exists()) {
                    const profile = userDoc.data() as UserProfile
                    setEarnedBadges(profile.badges?.map((b) => b.id) || [])
                }
            } catch (error) {
                console.error("Error loading badges:", error)
            } finally {
                setLoading(false)
            }
        }
        loadBadges()
    }, [db, userId])

    const earnedCount = earnedBadges.length
    const totalCount = ALL_BADGES.length
    const progressPercent = Math.round((earnedCount / totalCount) * 100)

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
                ))}
            </div>
        )
    }

    // Group badges by tier
    const badgesByTier = {
        gold: ALL_BADGES.filter((b) => b.tier === "gold"),
        silver: ALL_BADGES.filter((b) => b.tier === "silver"),
        bronze: ALL_BADGES.filter((b) => b.tier === "bronze"),
    }

    return (
        <div className="space-y-8">
            {/* Progress Overview */}
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold">Badge Collection</h2>
                        <p className="text-muted-foreground">
                            {earnedCount} of {totalCount} badges earned
                        </p>
                    </div>
                    <div className="text-3xl font-bold text-accent">{progressPercent}%</div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-accent to-accent/70"
                    />
                </div>
            </div>

            {/* Badges by Tier */}
            {(["gold", "silver", "bronze"] as const).map((tier) => (
                <div key={tier}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>{tierLabels[tier]} Badges</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            ({badgesByTier[tier].filter((b) => earnedBadges.includes(b.id)).length}/{badgesByTier[tier].length})
                        </span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {badgesByTier[tier].map((badge, index) => {
                            const earned = earnedBadges.includes(badge.id)

                            return (
                                <motion.div
                                    key={badge.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "relative p-4 rounded-xl border-2 bg-gradient-to-br transition-all",
                                        earned ? tierColors[tier] : "bg-muted/50 border-muted grayscale opacity-50"
                                    )}
                                >
                                    {/* Status indicator */}
                                    <div className="absolute top-2 right-2">
                                        {earned ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* Badge icon */}
                                    <div className="text-4xl mb-2">{badge.icon}</div>

                                    {/* Badge info */}
                                    <h4 className="font-medium text-sm">{badge.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {badge.description}
                                    </p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            ))}

            {earnedCount === 0 && (
                <div className="text-center py-8">
                    <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Badges Yet</h2>
                    <p className="text-muted-foreground">
                        Start engaging with the community to earn badges!
                    </p>
                </div>
            )}
        </div>
    )
}
