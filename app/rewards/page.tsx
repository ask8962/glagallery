"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Gift, Sparkles, Package, Star, Loader2, ShoppingBag, History, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"
import Link from "next/link"
import type { Reward, RewardCategory } from "@/lib/types"

const categoryIcons: Record<RewardCategory, typeof Gift> = {
    digital: Sparkles,
    physical: Package,
    privilege: Star
}

const categoryLabels: Record<RewardCategory, string> = {
    digital: "Digital",
    physical: "Physical",
    privilege: "Privilege"
}

const categoryColors: Record<RewardCategory, string> = {
    digital: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    physical: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    privilege: "bg-amber-500/10 text-amber-500 border-amber-500/20"
}

export default function RewardsPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const { organization, loading: orgLoading } = useOrganization()
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<"all" | RewardCategory>("all")
    const [redeemingId, setRedeemingId] = useState<string | null>(null)
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; reward: Reward | null }>({ open: false, reward: null })
    const [shippingAddress, setShippingAddress] = useState("")

    const userPoints = profile?.points || 0

    useEffect(() => {
        if (!orgLoading && organization?.id) {
            fetchRewards()
        }
    }, [organization?.id, orgLoading])

    const fetchRewards = async () => {
        if (!organization?.id) return
        
        try {
            const res = await fetch(`/api/rewards?organizationId=${organization.id}`)
            const data = await res.json()
            if (data.rewards) {
                setRewards(data.rewards)
            }
        } catch (error) {
            console.error("Error fetching rewards:", error)
            toast.error("Failed to load rewards")
        } finally {
            setLoading(false)
        }
    }

    const handleRedeem = async () => {
        if (!confirmDialog.reward || !user) return

        const reward = confirmDialog.reward
        if (reward.category === "physical" && !shippingAddress.trim()) {
            toast.error("Please enter a shipping address")
            return
        }

        setRedeemingId(reward.id)
        try {
            const token = await user.getIdToken()
            const res = await fetch("/api/rewards/redeem", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    rewardId: reward.id,
                    shippingAddress: reward.category === "physical" ? shippingAddress : undefined
                })
            })

            const data = await res.json()
            if (res.ok) {
                toast.success(`🎉 ${reward.name} redeemed successfully!`)
                setConfirmDialog({ open: false, reward: null })
                setShippingAddress("")
                // Refresh rewards to update stock
                fetchRewards()
            } else {
                toast.error(data.error || "Failed to redeem reward")
            }
        } catch (error) {
            console.error("Error redeeming:", error)
            toast.error("Failed to redeem reward")
        } finally {
            setRedeemingId(null)
        }
    }

    const filteredRewards = selectedCategory === "all"
        ? rewards
        : rewards.filter(r => r.category === selectedCategory)

    if (authLoading || orgLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-4">
                    <Gift className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium">Rewards Store</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Redeem Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Points</span>
                </h1>

                <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
                    Use your hard-earned points to unlock exclusive rewards, merchandise, and privileges!
                </p>

                {/* Points Balance Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block"
                >
                    <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-500/20">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm text-muted-foreground">Your Balance</p>
                                    <p className="text-3xl font-bold">{userPoints.toLocaleString()} <span className="text-lg text-muted-foreground">points</span></p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* History & Wallet Links */}
                <div className="mt-4 flex gap-3 justify-center flex-wrap">
                    <Link href="/rewards/wallet">
                        <Button variant="default" className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            Points Wallet
                        </Button>
                    </Link>
                    <Link href="/rewards/history">
                        <Button variant="outline" className="gap-2">
                            <History className="h-4 w-4" />
                            Redemption History
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as typeof selectedCategory)} className="mb-8">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
                    <TabsTrigger value="all" className="gap-2">
                        <Filter className="h-4 w-4" />
                        All
                    </TabsTrigger>
                    <TabsTrigger value="digital" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Digital
                    </TabsTrigger>
                    <TabsTrigger value="physical" className="gap-2">
                        <Package className="h-4 w-4" />
                        Physical
                    </TabsTrigger>
                    <TabsTrigger value="privilege" className="gap-2">
                        <Star className="h-4 w-4" />
                        Privilege
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Rewards Grid */}
            {filteredRewards.length === 0 ? (
                <div className="text-center py-16">
                    <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Rewards Available</h3>
                    <p className="text-muted-foreground mb-4">Check back later for new rewards!</p>
                </div>
            ) : (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    layout
                >
                    <AnimatePresence mode="popLayout">
                        {filteredRewards.map((reward, index) => {
                            const Icon = categoryIcons[reward.category]
                            const canAfford = userPoints >= reward.pointsCost
                            const outOfStock = reward.stock !== null && reward.stock <= 0

                            return (
                                <motion.div
                                    key={reward.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    layout
                                >
                                    <Card className={`h-full flex flex-col transition-all duration-300 hover:shadow-lg ${!canAfford || outOfStock ? 'opacity-60' : 'hover:border-primary/50'}`}>
                                        <CardHeader className="pb-3">
                                            {/* Category Badge */}
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className={categoryColors[reward.category]}>
                                                    <Icon className="h-3 w-3 mr-1" />
                                                    {categoryLabels[reward.category]}
                                                </Badge>
                                                {reward.stock !== null && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {reward.stock} left
                                                    </span>
                                                )}
                                            </div>

                                            {/* Reward Image */}
                                            <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center mb-3 overflow-hidden">
                                                {reward.imageURL ? (
                                                    <img
                                                        src={reward.imageURL}
                                                        alt={reward.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Icon className="h-16 w-16 text-muted-foreground/50" />
                                                )}
                                            </div>

                                            <CardTitle className="text-lg">{reward.name}</CardTitle>
                                            <CardDescription className="line-clamp-2">{reward.description}</CardDescription>
                                        </CardHeader>

                                        <CardFooter className="mt-auto pt-0">
                                            <div className="w-full flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-lg font-bold">
                                                    <Sparkles className="h-4 w-4 text-primary" />
                                                    {reward.pointsCost.toLocaleString()}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    disabled={!canAfford || outOfStock || redeemingId === reward.id}
                                                    onClick={() => setConfirmDialog({ open: true, reward })}
                                                >
                                                    {redeemingId === reward.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : outOfStock ? (
                                                        "Out of Stock"
                                                    ) : !canAfford ? (
                                                        "Need More Points"
                                                    ) : (
                                                        "Redeem"
                                                    )}
                                                </Button>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </motion.div>
            )
            }

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, reward: open ? confirmDialog.reward : null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Redemption</DialogTitle>
                        <DialogDescription>
                            You are about to redeem <strong>{confirmDialog.reward?.name}</strong> for <strong>{confirmDialog.reward?.pointsCost.toLocaleString()} points</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {confirmDialog.reward?.category === "physical" && (
                        <div className="space-y-2">
                            <Label htmlFor="address">Shipping Address *</Label>
                            <Textarea
                                id="address"
                                placeholder="Enter your full shipping address..."
                                value={shippingAddress}
                                onChange={(e) => setShippingAddress(e.target.value)}
                                rows={3}
                            />
                        </div>
                    )}

                    <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex justify-between text-sm">
                            <span>Current Balance:</span>
                            <span className="font-medium">{userPoints.toLocaleString()} points</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Cost:</span>
                            <span className="font-medium text-red-500">-{confirmDialog.reward?.pointsCost.toLocaleString()} points</span>
                        </div>
                        <hr className="my-2 border-border" />
                        <div className="flex justify-between font-semibold">
                            <span>New Balance:</span>
                            <span>{(userPoints - (confirmDialog.reward?.pointsCost || 0)).toLocaleString()} points</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialog({ open: false, reward: null })}>
                            Cancel
                        </Button>
                        <Button onClick={handleRedeem} disabled={redeemingId !== null}>
                            {redeemingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirm Redemption
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
