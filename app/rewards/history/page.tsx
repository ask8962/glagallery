"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2, Package, Sparkles, Star, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import type { Redemption, RedemptionStatus, RewardCategory } from "@/lib/types"

const statusConfig: Record<RedemptionStatus, { icon: typeof Clock; label: string; color: string }> = {
    pending: { icon: Clock, label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    processing: { icon: Loader2, label: "Processing", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    fulfilled: { icon: CheckCircle2, label: "Fulfilled", color: "bg-green-500/10 text-green-500 border-green-500/20" },
    cancelled: { icon: XCircle, label: "Cancelled", color: "bg-red-500/10 text-red-500 border-red-500/20" }
}

const categoryIcons: Record<RewardCategory, typeof Package> = {
    digital: Sparkles,
    physical: Package,
    privilege: Star
}

export default function RedemptionHistoryPage() {
    const { user, loading: authLoading } = useAuth()
    const [redemptions, setRedemptions] = useState<Redemption[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchRedemptions()
        }
    }, [user])

    const fetchRedemptions = async () => {
        if (!user) return

        try {
            const token = await user.getIdToken()
            const res = await fetch("/api/rewards/redemptions", {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.redemptions) {
                setRedemptions(data.redemptions)
            }
        } catch (error) {
            console.error("Error fetching redemptions:", error)
            toast.error("Failed to load redemption history")
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "Unknown"
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp._seconds * 1000)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <Link href="/rewards">
                    <Button variant="ghost" className="gap-2 mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Store
                    </Button>
                </Link>

                <h1 className="text-3xl font-bold mb-2">Redemption History</h1>
                <p className="text-muted-foreground">Track the status of your redeemed rewards</p>
            </motion.div>

            {/* Redemptions List */}
            {redemptions.length === 0 ? (
                <div className="text-center py-16">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Redemptions Yet</h3>
                    <p className="text-muted-foreground mb-4">You haven't redeemed any rewards yet.</p>
                    <Link href="/rewards">
                        <Button>Browse Rewards</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {redemptions.map((redemption, index) => {
                        const StatusIcon = statusConfig[redemption.status].icon
                        const CategoryIcon = categoryIcons[redemption.rewardCategory]

                        return (
                            <motion.div
                                key={redemption.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-lg bg-muted">
                                                    <CategoryIcon className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{redemption.rewardName}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Sparkles className="h-4 w-4" />
                                                        {redemption.pointsCost.toLocaleString()} points
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Redeemed on {formatDate(redemption.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant="outline" className={statusConfig[redemption.status].color}>
                                                    <StatusIcon className={`h-3 w-3 mr-1 ${redemption.status === 'processing' ? 'animate-spin' : ''}`} />
                                                    {statusConfig[redemption.status].label}
                                                </Badge>

                                                {redemption.status === "fulfilled" && redemption.fulfilledAt && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Fulfilled on {formatDate(redemption.fulfilledAt)}
                                                    </p>
                                                )}

                                                {redemption.status === "cancelled" && (
                                                    <p className="text-xs text-green-600">
                                                        Points refunded
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {redemption.shippingAddress && (
                                            <div className="mt-4 p-3 rounded-lg bg-muted/50">
                                                <p className="text-xs text-muted-foreground mb-1">Shipping Address</p>
                                                <p className="text-sm">{redemption.shippingAddress}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
