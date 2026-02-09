"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Activity,
    Users,
    Database,
    AlertCircle,
    Server,
    ImageIcon,
    Calendar,
    RefreshCw,
    HardDrive,
} from "lucide-react"
import { auth } from "@/lib/firebase"

interface HealthData {
    overview: {
        totalUsers: number
        totalPosts: number
        totalEvents: number
        totalClubs: number
        flaggedPosts: number
    }
    recentActivity: {
        newUsers: number
        newPosts: number
    }
    storage: {
        mediaCount: number
        estimatedGB: number
    }
    timestamp: string
}

export default function HealthDashboardPage() {
    const [data, setData] = useState<HealthData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHealth()
    }, [])

    const fetchHealth = async () => {
        setLoading(true)
        try {
            const token = await auth.currentUser?.getIdToken()
            const res = await fetch("/api/admin/health", {
                headers: { Authorization: `Bearer ${token}` },
            })
            const healthData = await res.json()

            if (!res.ok) throw new Error(healthData.error)

            setData(healthData)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Running system diagnostics...</p>
                </div>
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="container max-w-6xl py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="h-6 w-6" />
                        System Health
                    </h1>
                    <p className="text-muted-foreground">
                        Real-time system metrics and status
                    </p>
                </div>
                <Button variant="outline" onClick={fetchHealth}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Status Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">Healthy</div>
                        <p className="text-xs text-muted-foreground">
                            All systems operational
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.overview.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            +{data.recentActivity.newUsers} in last 7 days
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.storage.estimatedGB} GB</div>
                        <p className="text-xs text-muted-foreground">
                            {data.storage.mediaCount} media files
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.overview.flaggedPosts}</div>
                        <p className="text-xs text-muted-foreground">
                            Items requiring review
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Database Stats */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Database Statistics</CardTitle>
                        <CardDescription>
                            Record counts across collections
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Users</p>
                                    <Progress value={(data.overview.totalUsers / 1000) * 100} className="h-2" />
                                </div>
                                <div className="ml-4 font-medium">{data.overview.totalUsers}</div>
                            </div>
                            <div className="flex items-center">
                                <ImageIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Posts</p>
                                    <Progress value={(data.overview.totalPosts / 5000) * 100} className="h-2" />
                                </div>
                                <div className="ml-4 font-medium">{data.overview.totalPosts}</div>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Events</p>
                                    <Progress value={(data.overview.totalEvents / 500) * 100} className="h-2" />
                                </div>
                                <div className="ml-4 font-medium">{data.overview.totalEvents}</div>
                            </div>
                            <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Clubs</p>
                                    <Progress value={(data.overview.totalClubs / 50) * 100} className="h-2" />
                                </div>
                                <div className="ml-4 font-medium">{data.overview.totalClubs}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Info */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>System Information</CardTitle>
                        <CardDescription>
                            Environment details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Server className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Environment</span>
                                </div>
                                <span className="text-sm text-muted-foreground capitalize">
                                    {process.env.NODE_ENV}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Region</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    asia-south1
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Storage Bucket</span>
                                </div>
                                <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                                    gla-gallery.firebasestorage.app
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Server Time</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
