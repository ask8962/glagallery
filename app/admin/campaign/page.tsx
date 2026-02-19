"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Shield,
    Search,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Loader2,
    Download,
    Phone,
    Banknote,
    Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

interface Claim {
    uid: string
    email: string
    displayName: string
    phoneNumber?: string
    rewardAmount: number
    status: "claimed" | "flagged" | "paid" | "rejected"
    claimedAt: string
    ipAddress: string
    referrerUid?: string
    referralBonus?: number
    adminNotes?: string
}

interface Stats {
    totalClaims: number
    totalAmount: number
    flaggedClaims: number
}

export default function CampaignAdminPage() {
    const { user } = useAuth()
    const [claims, setClaims] = useState<Claim[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        fetchData()
    }, [user])

    const fetchData = async () => {
        if (!user) return
        try {
            const token = await user.getIdToken()
            const res = await fetch("/api/campaign/admin", {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            setClaims(data.claims)
            setStats(data.stats)
        } catch (error) {
            toast.error("Failed to load claims")
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (uid: string, newStatus: string) => {
        try {
            const token = await user?.getIdToken()
            const res = await fetch("/api/campaign/admin", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ uid, status: newStatus }),
            })

            if (res.ok) {
                toast.success(`Claim marked as ${newStatus}`)
                fetchData() // Refresh list
            } else {
                toast.error("Failed to update status")
            }
        } catch (error) {
            toast.error("Error updating claim")
        }
    }

    const filteredClaims = claims.filter((claim) => {
        const matchesSearch =
            claim.email.toLowerCase().includes(search.toLowerCase()) ||
            claim.displayName.toLowerCase().includes(search.toLowerCase()) ||
            claim.phoneNumber?.includes(search) ||
            claim.uid.includes(search)

        const matchesStatus =
            statusFilter === "all" || claim.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const downloadCSV = () => {
        const headers = [
            "Name",
            "Email",
            "Phone",
            "Amount",
            "Status",
            "Date",
            "IP",
            "Referrer",
            "Bonus",
        ]
        const rows = filteredClaims.map((c) => [
            c.displayName,
            c.email,
            c.phoneNumber || "",
            c.rewardAmount,
            c.status,
            new Date(c.claimedAt).toLocaleDateString(),
            c.ipAddress,
            c.referrerUid || "",
            c.referralBonus || 0,
        ])

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "campaign_claims.csv")
        document.body.appendChild(link)
        link.click()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="h-8 w-8 text-primary" />
                        Campaign Admin
                    </h1>
                    <p className="text-muted-foreground">
                        Manage reward claims and anti-fraud checks
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button onClick={fetchData}>Refresh</Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalClaims || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flagged Claims</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">
                            {stats?.flaggedClaims || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Liability</CardTitle>
                        <Banknote className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            ₹{stats?.totalAmount || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, phone, or UID..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="claimed">Claimed</option>
                    <option value="flagged">Flagged</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User / Contact</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Risk Info</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClaims.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No claims found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClaims.map((claim) => (
                                <TableRow key={claim.uid}>
                                    <TableCell>
                                        <div className="font-medium">{claim.displayName}</div>
                                        <div className="text-xs text-muted-foreground">{claim.email}</div>
                                        {claim.phoneNumber && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                <Phone className="h-3 w-3" />
                                                {claim.phoneNumber}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-green-600">₹{claim.rewardAmount}</div>
                                        {claim.referralBonus ? (
                                            <div className="text-xs text-green-600">+ ₹{claim.referralBonus} ref</div>
                                        ) : null}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                claim.status === "flagged"
                                                    ? "text-yellow-600 border-yellow-500 bg-yellow-50"
                                                    : claim.status === "paid"
                                                        ? "text-green-600 border-green-500 bg-green-50"
                                                        : claim.status === "rejected"
                                                            ? "text-red-600 border-red-500 bg-red-50"
                                                            : "text-blue-600 border-blue-500 bg-blue-50"
                                            }
                                        >
                                            {claim.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs">
                                            <div title="IP Address">🌐 {claim.ipAddress}</div>
                                            {claim.referrerUid && (
                                                <div title="Referred By">🔗 Ref: {claim.referrerUid.slice(0, 6)}...</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(claim.claimedAt).toLocaleDateString()}
                                        <br />
                                        {new Date(claim.claimedAt).toLocaleTimeString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {claim.status !== "paid" && claim.status !== "rejected" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => updateStatus(claim.uid, "paid")}
                                                        title="Mark as Paid"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => updateStatus(claim.uid, "rejected")}
                                                        title="Reject Claim"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            {claim.status === "claimed" && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-yellow-600"
                                                    onClick={() => updateStatus(claim.uid, "flagged")}
                                                    title="Flag Suspicious"
                                                >
                                                    <AlertTriangle className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
