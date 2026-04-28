"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfessionReplies } from "./confession-replies"
import { PollDisplay } from "./poll-display"
import { motion } from "framer-motion"
import {
    ArrowBigUp,
    ArrowBigDown,
    MessageCircle,
    Flag,
    Flame,
    Lightbulb,
    ShoppingBag,
    HelpCircle,
    BarChart3,
    Share2,
} from "lucide-react"
import { toast } from "sonner"
import type { Confession, ConfessionCategory } from "@/lib/types"

const CATEGORY_CONFIG: Record<ConfessionCategory, { icon: any; label: string; color: string }> = {
    confession: { icon: Flame, label: "Confession", color: "bg-red-500/10 text-red-400 border-red-500/20" },
    meme: { icon: MessageCircle, label: "Meme", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    poll: { icon: BarChart3, label: "Poll", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    hot_take: { icon: Lightbulb, label: "Hot Take", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    marketplace: { icon: ShoppingBag, label: "Marketplace", color: "bg-green-500/10 text-green-400 border-green-500/20" },
    question: { icon: HelpCircle, label: "Question", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
}

// Generate a consistent color from the alias string
function aliasColor(alias: string): string {
    const colors = [
        "from-red-500 to-orange-500",
        "from-blue-500 to-cyan-500",
        "from-purple-500 to-pink-500",
        "from-green-500 to-emerald-500",
        "from-yellow-500 to-amber-500",
        "from-indigo-500 to-violet-500",
        "from-teal-500 to-cyan-500",
        "from-rose-500 to-pink-500",
    ]
    let hash = 0
    for (let i = 0; i < alias.length; i++) {
        hash = alias.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
}

function timeAgo(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const seconds = Math.floor((now - then) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
}

interface ConfessionCardProps {
    confession: Partial<Confession>
    onUpdate: (id: string, updates: Partial<Confession>) => void
}

export function ConfessionCard({ confession, onUpdate }: ConfessionCardProps) {
    const { user } = useAuth()
    const [showReplies, setShowReplies] = useState(false)
    const [voting, setVoting] = useState(false)
    const [myVote, setMyVote] = useState<"up" | "down" | null>(null)
    const [reporting, setReporting] = useState(false)

    const cat = CATEGORY_CONFIG[confession.category || "confession"]
    const CatIcon = cat.icon
    const gradient = aliasColor(confession.anonymousAlias || "anon")
    const netVotes = (confession.upvotes || 0) - (confession.downvotes || 0)

    const handleVote = async (voteType: "up" | "down") => {
        if (!user) {
            toast.error("Sign in to vote")
            return
        }
        if (voting) return
        setVoting(true)

        try {
            const res = await fetch(`/api/confessions/${confession.id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.uid, voteType }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // Optimistic update
            if (data.action === "removed") {
                setMyVote(null)
                onUpdate(confession.id!, {
                    upvotes: voteType === "up" ? (confession.upvotes || 1) - 1 : confession.upvotes,
                    downvotes: voteType === "down" ? (confession.downvotes || 1) - 1 : confession.downvotes,
                })
            } else if (data.action === "switched") {
                setMyVote(voteType)
                onUpdate(confession.id!, {
                    upvotes: voteType === "up" ? (confession.upvotes || 0) + 1 : Math.max((confession.upvotes || 1) - 1, 0),
                    downvotes: voteType === "down" ? (confession.downvotes || 0) + 1 : Math.max((confession.downvotes || 1) - 1, 0),
                })
            } else {
                setMyVote(voteType)
                onUpdate(confession.id!, {
                    upvotes: voteType === "up" ? (confession.upvotes || 0) + 1 : confession.upvotes,
                    downvotes: voteType === "down" ? (confession.downvotes || 0) + 1 : confession.downvotes,
                })
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to vote")
        } finally {
            setVoting(false)
        }
    }

    const handleReport = async () => {
        if (!user) {
            toast.error("Sign in to report")
            return
        }
        if (reporting) return
        setReporting(true)

        try {
            const res = await fetch(`/api/confessions/${confession.id}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.uid, reason: "inappropriate" }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success("Reported. Admins will review this post.")
        } catch (err: any) {
            toast.error(err.message || "Failed to report")
        } finally {
            setReporting(false)
        }
    }

    const handleShare = async () => {
        const url = `${window.location.origin}/confessions#${confession.id}`
        try {
            await navigator.clipboard.writeText(url)
            toast.success("Link copied!")
        } catch {
            toast.error("Failed to copy link")
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card hover:bg-card/80 transition-colors overflow-hidden"
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                            className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shadow-md`}
                        >
                            {(confession.anonymousAlias || "A").charAt(confession.anonymousAlias?.indexOf("#") === -1 ? 0 : (confession.anonymousAlias?.indexOf("#") || 0) + 1)}
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{confession.anonymousAlias}</p>
                            <p className="text-xs text-muted-foreground">
                                {timeAgo(confession.createdAt)}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className={`text-[11px] ${cat.color}`}>
                        <CatIcon className="h-3 w-3 mr-1" />
                        {cat.label}
                    </Badge>
                </div>

                {/* Body */}
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap mb-4">
                    {confession.body}
                </p>

                {/* Poll (if applicable) */}
                {confession.category === "poll" && confession.pollOptions && (
                    <PollDisplay
                        confessionId={confession.id!}
                        options={confession.pollOptions}
                        expiresAt={confession.pollExpiresAt}
                    />
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-2 border-t">
                    {/* Vote */}
                    <div className="flex items-center rounded-full bg-muted/50">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote("up")}
                            disabled={voting}
                            className={`h-8 px-2.5 rounded-l-full rounded-r-none hover:text-orange-500 ${
                                myVote === "up" ? "text-orange-500 bg-orange-500/10" : ""
                            }`}
                        >
                            <ArrowBigUp className={`h-5 w-5 ${myVote === "up" ? "fill-current" : ""}`} />
                        </Button>
                        <span className={`text-sm font-bold min-w-[2rem] text-center ${
                            netVotes > 0 ? "text-orange-500" : netVotes < 0 ? "text-blue-500" : "text-muted-foreground"
                        }`}>
                            {netVotes}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote("down")}
                            disabled={voting}
                            className={`h-8 px-2.5 rounded-r-full rounded-l-none hover:text-blue-500 ${
                                myVote === "down" ? "text-blue-500 bg-blue-500/10" : ""
                            }`}
                        >
                            <ArrowBigDown className={`h-5 w-5 ${myVote === "down" ? "fill-current" : ""}`} />
                        </Button>
                    </div>

                    {/* Replies */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReplies(!showReplies)}
                        className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{confession.replyCount || 0}</span>
                    </Button>

                    {/* Share */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                        className="h-8 text-muted-foreground hover:text-foreground"
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>

                    {/* Report */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReport}
                        disabled={reporting}
                        className="h-8 text-muted-foreground hover:text-red-500 ml-auto"
                    >
                        <Flag className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Replies Section */}
            {showReplies && (
                <div className="border-t bg-muted/20 p-4">
                    <ConfessionReplies confessionId={confession.id!} />
                </div>
            )}
        </motion.div>
    )
}
