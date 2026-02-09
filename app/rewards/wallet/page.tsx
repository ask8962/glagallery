"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Wallet, ArrowUpCircle, ArrowDownCircle, Sparkles, Loader2, Clock, Gift, Award, MessageSquare, Heart, Calendar, LogIn } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { PointTransaction, PointTransactionType } from "@/lib/types"

const typeConfig: Record<PointTransactionType, { icon: any; label: string; color: string }> = {
    daily_login: { icon: LogIn, label: "Daily Login", color: "text-blue-500" },
    post: { icon: Sparkles, label: "Post", color: "text-purple-500" },
    like: { icon: Heart, label: "Like", color: "text-pink-500" },
    comment: { icon: MessageSquare, label: "Comment", color: "text-cyan-500" },
    hackathon: { icon: Award, label: "Hackathon", color: "text-yellow-500" },
    event: { icon: Calendar, label: "Event", color: "text-orange-500" },
    redemption: { icon: Gift, label: "Redemption", color: "text-red-500" },
    refund: { icon: ArrowUpCircle, label: "Refund", color: "text-green-500" },
    bonus: { icon: Sparkles, label: "Bonus", color: "text-indigo-500" },
    other: { icon: Sparkles, label: "Other", color: "text-gray-500" },
}

export default function PointsWalletPage() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<PointTransaction[]>([])
    const [currentBalance, setCurrentBalance] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchHistory()
        }
    }, [user])

    const fetchHistory = async () => {
        try {
            const token = await user!.getIdToken()
            const res = await fetch("/api/points/history", {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                setTransactions(data.transactions || [])
                setCurrentBalance(data.currentBalance || 0)
            } else {
                toast.error(data.error || "Failed to load history")
            }
        } catch (error) {
            console.error("Error fetching history:", error)
            toast.error("Failed to load history")
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "Unknown"
        const date = timestamp._seconds
            ? new Date(timestamp._seconds * 1000)
            : new Date(timestamp)
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Wallet className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Points Wallet</h1>
                <p className="text-muted-foreground">Your earnings and spending history</p>
            </motion.div>

            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles className="h-6 w-6 text-primary" />
                                <span className="text-4xl font-bold">{currentBalance.toLocaleString()}</span>
                                <span className="text-muted-foreground">pts</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-6">
                            <Link href="/rewards">
                                <Button variant="outline" size="sm">
                                    <Gift className="h-4 w-4 mr-2" />
                                    Redeem Rewards
                                </Button>
                            </Link>
                            <Link href="/rewards/history">
                                <Button variant="ghost" size="sm">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Redemption History
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Transaction List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Activity History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No transactions yet</p>
                            <p className="text-sm">Start earning points by engaging with the community!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx, index) => {
                                const config = typeConfig[tx.type] || typeConfig.other
                                const Icon = config.icon
                                const isPositive = tx.amount > 0

                                return (
                                    <motion.div
                                        key={tx.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full bg-background ${config.color}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{tx.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(tx.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={isPositive ? "default" : "destructive"}
                                            className={isPositive ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}
                                        >
                                            {isPositive ? "+" : ""}{tx.amount.toLocaleString()}
                                        </Badge>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
