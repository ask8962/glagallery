"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { ConfessionFeed } from "@/components/confessions/confession-feed"
import { CreateConfession } from "@/components/confessions/create-confession"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Plus, Flame, MessageCircle, BarChart3, Lightbulb, ShoppingBag, HelpCircle } from "lucide-react"
import type { ConfessionCategory } from "@/lib/types"

const CATEGORIES: { value: ConfessionCategory | "all"; label: string; icon: any; color: string }[] = [
    { value: "all", label: "All", icon: Flame, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    { value: "confession", label: "Confessions", icon: Flame, color: "bg-red-500/10 text-red-500 border-red-500/20" },
    { value: "meme", label: "Memes", icon: MessageCircle, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    { value: "poll", label: "Polls", icon: BarChart3, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { value: "hot_take", label: "Hot Takes", icon: Lightbulb, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    { value: "marketplace", label: "Marketplace", icon: ShoppingBag, color: "bg-green-500/10 text-green-500 border-green-500/20" },
    { value: "question", label: "Questions", icon: HelpCircle, color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
]

export default function ConfessionsPage() {
    const { user } = useAuth()
    const [activeCategory, setActiveCategory] = useState<ConfessionCategory | "all">("all")
    const [showCreate, setShowCreate] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden border-b bg-gradient-to-b from-orange-500/5 via-background to-background"
            >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="container max-w-4xl mx-auto px-4 py-10 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Flame className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Campus Confessions</h1>
                            <p className="text-sm text-muted-foreground">
                                Speak your mind, anonymously. 🔥
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="container max-w-4xl mx-auto px-4 py-6">
                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setActiveCategory(cat.value)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium 
                                border transition-all whitespace-nowrap
                                ${activeCategory === cat.value
                                    ? cat.color + " shadow-sm"
                                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                }
                            `}
                        >
                            <cat.icon className="h-3.5 w-3.5" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Feed */}
                <ConfessionFeed
                    category={activeCategory === "all" ? undefined : activeCategory}
                    refreshKey={refreshKey}
                />
            </div>

            {/* Floating Create Button */}
            {user && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="fixed bottom-6 right-6 z-50"
                >
                    <Button
                        onClick={() => setShowCreate(true)}
                        size="lg"
                        className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-xl shadow-orange-500/30 transition-all hover:scale-110"
                    >
                        <Plus className="h-6 w-6 text-white" />
                    </Button>
                </motion.div>
            )}

            {/* Create Dialog */}
            <CreateConfession
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={() => {
                    setShowCreate(false)
                    setRefreshKey((k) => k + 1)
                }}
            />
        </div>
    )
}
