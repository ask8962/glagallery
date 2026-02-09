"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Gift, Plus, Loader2, Trash2, Edit, Package, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import type { Reward, Redemption, RewardCategory, RedemptionStatus } from "@/lib/types"

const categoryLabels: Record<RewardCategory, string> = {
    digital: "Digital",
    physical: "Physical",
    privilege: "Privilege"
}

const statusConfig: Record<RedemptionStatus, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500" },
    processing: { label: "Processing", color: "bg-blue-500/10 text-blue-500" },
    fulfilled: { label: "Fulfilled", color: "bg-green-500/10 text-green-500" },
    cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-500" }
}

export default function AdminRewardsPage() {
    const { user } = useAuth()
    const [rewards, setRewards] = useState<Reward[]>([])
    const [redemptions, setRedemptions] = useState<Redemption[]>([])
    const [loading, setLoading] = useState(true)
    const [createDialog, setCreateDialog] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        imageURL: "",
        category: "digital" as RewardCategory,
        pointsCost: "",
        stock: ""
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            // Fetch rewards
            const rewardsRes = await fetch("/api/rewards")
            const rewardsData = await rewardsRes.json()
            if (rewardsData.rewards) {
                setRewards(rewardsData.rewards)
            }

            // Fetch all redemptions (admin view)
            if (user) {
                const token = await user.getIdToken()
                const redemptionsRes = await fetch("/api/rewards/redemptions?admin=true", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const redemptionsData = await redemptionsRes.json()
                if (redemptionsData.redemptions) {
                    setRedemptions(redemptionsData.redemptions)
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const openCreateDialog = () => {
        setEditingId(null)
        setFormData({ name: "", description: "", imageURL: "", category: "digital", pointsCost: "", stock: "" })
        setCreateDialog(true)
    }

    const openEditDialog = (reward: Reward) => {
        setEditingId(reward.id)
        setFormData({
            name: reward.name,
            description: reward.description,
            imageURL: reward.imageURL || "",
            category: reward.category,
            pointsCost: reward.pointsCost.toString(),
            stock: reward.stock !== null ? reward.stock.toString() : ""
        })
        setCreateDialog(true)
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.description || !formData.pointsCost) {
            toast.error("Please fill in all required fields")
            return
        }

        setSubmitting(true)
        try {
            const token = await user!.getIdToken()

            let url = "/api/rewards"
            let method = "POST"

            if (editingId) {
                url = `/api/rewards/${editingId}`
                method = "PATCH"
            }

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    imageURL: formData.imageURL || null,
                    category: formData.category,
                    pointsCost: Number(formData.pointsCost),
                    stock: formData.stock ? Number(formData.stock) : null
                })
            })

            const data = await res.json()
            if (res.ok) {
                toast.success(editingId ? "Reward updated successfully!" : "Reward created successfully!")
                setCreateDialog(false)
                fetchData()
            } else {
                toast.error(data.error || "Failed to save reward")
            }
        } catch (error) {
            console.error("Error saving reward:", error)
            toast.error("Failed to save reward")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteReward = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return
        }

        try {
            const token = await user!.getIdToken()
            const res = await fetch(`/api/rewards/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (res.ok) {
                toast.success("Reward deleted successfully")
                setRewards(rewards.filter(r => r.id !== id))
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to delete reward")
            }
        } catch (error) {
            console.error("Error deleting reward:", error)
            toast.error("Failed to delete reward")
        }
    }

    const updateRedemptionStatus = async (redemptionId: string, status: RedemptionStatus) => {
        try {
            const token = await user!.getIdToken()
            const res = await fetch("/api/rewards/redemptions", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ redemptionId, status })
            })

            const data = await res.json()
            if (res.ok) {
                toast.success(`Status updated to ${status}`)
                fetchData()
            } else {
                toast.error(data.error || "Failed to update status")
            }
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Failed to update status")
        }
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "Unknown"
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp._seconds * 1000)
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }

    if (loading) {
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
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Gift className="h-8 w-8 text-primary" />
                        Rewards Management
                    </h1>
                    <p className="text-muted-foreground">Manage rewards catalog and redemptions</p>
                </div>

                <Dialog open={createDialog} onOpenChange={setCreateDialog}>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={async () => {
                                try {
                                    const token = await user?.getIdToken()
                                    if (!token) return toast.error("Please login first")

                                    const res = await fetch('/api/rewards/seed', {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${token}` }
                                    })
                                    const data = await res.json()
                                    if (res.ok) {
                                        toast.success("Rewards seeded successfully!")
                                        fetchData()
                                    } else {
                                        toast.error(data.error || "Failed to seed rewards")
                                    }
                                } catch (err) {
                                    console.error(err)
                                    toast.error("Error seeding rewards")
                                }
                            }}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Seed
                        </Button>
                        <Button className="gap-2" onClick={openCreateDialog}>
                            <Plus className="h-4 w-4" />
                            Add Reward
                        </Button>
                    </div>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Reward" : "Create New Reward"}</DialogTitle>
                            <DialogDescription>{editingId ? "Update existing reward details" : "Add a new reward to the store"}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
                                    placeholder="GLA T-Shirt"
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
                                    placeholder="Premium quality cotton t-shirt with GLA logo"
                                />
                            </div>

                            <div>
                                <Label htmlFor="imageURL">Image URL</Label>
                                <Input
                                    id="imageURL"
                                    value={formData.imageURL}
                                    onChange={(e) => setFormData(d => ({ ...d, imageURL: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="category">Category *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(v) => setFormData(d => ({ ...d, category: v as RewardCategory }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="digital">Digital</SelectItem>
                                            <SelectItem value="physical">Physical</SelectItem>
                                            <SelectItem value="privilege">Privilege</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="pointsCost">Points Cost *</Label>
                                    <Input
                                        id="pointsCost"
                                        type="number"
                                        value={formData.pointsCost}
                                        onChange={(e) => setFormData(d => ({ ...d, pointsCost: e.target.value }))}
                                        placeholder="500"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="stock">Stock (leave empty for unlimited)</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData(d => ({ ...d, stock: e.target.value }))}
                                    placeholder="Unlimited"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={submitting}>
                                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                {editingId ? "Update" : "Create"} Reward
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Tabs */}
            <Tabs defaultValue="rewards">
                <TabsList className="mb-6">
                    <TabsTrigger value="rewards" className="gap-2">
                        <Gift className="h-4 w-4" />
                        Rewards ({rewards.length})
                    </TabsTrigger>
                    <TabsTrigger value="redemptions" className="gap-2">
                        <Package className="h-4 w-4" />
                        Redemptions ({redemptions.length})
                    </TabsTrigger>
                </TabsList>

                {/* Rewards Tab */}
                <TabsContent value="rewards">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rewards.map((reward) => (
                            <Card key={reward.id} className="relative group overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline">{categoryLabels[reward.category]}</Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {reward.stock !== null ? `${reward.stock} left` : "Unlimited"}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">{reward.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 font-bold">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            {reward.pointsCost.toLocaleString()} pts
                                        </div>
                                        <Badge variant={reward.isActive ? "default" : "secondary"}>
                                            {reward.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>

                                    {/* Admin Actions Overlay */}
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => openEditDialog(reward)}>
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteReward(reward.id, reward.name)}>
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>

                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Redemptions Tab */}
                <TabsContent value="redemptions">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Reward</TableHead>
                                    <TableHead>Points</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {redemptions.map((redemption) => (
                                    <TableRow key={redemption.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{redemption.userName}</p>
                                                <p className="text-xs text-muted-foreground">{redemption.userEmail}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{redemption.rewardName}</p>
                                                <Badge variant="outline" className="text-xs">{categoryLabels[redemption.rewardCategory]}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>{redemption.pointsCost.toLocaleString()}</TableCell>
                                        <TableCell>{formatDate(redemption.createdAt)}</TableCell>
                                        <TableCell>
                                            <Badge className={statusConfig[redemption.status].color}>
                                                {statusConfig[redemption.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {redemption.status === "pending" && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateRedemptionStatus(redemption.id, "processing")}
                                                    >
                                                        Process
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => updateRedemptionStatus(redemption.id, "cancelled")}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            )}
                                            {redemption.status === "processing" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateRedemptionStatus(redemption.id, "fulfilled")}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                    Fulfill
                                                </Button>
                                            )}
                                            {(redemption.status === "fulfilled" || redemption.status === "cancelled") && (
                                                <span className="text-xs text-muted-foreground">No actions</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {redemptions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No redemptions yet
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
