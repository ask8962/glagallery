"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import {
    Loader2,
    ArrowLeft,
    Users,
    Calendar,
    Megaphone,
    TrendingUp,
    BarChart3,
    Ticket,
} from "lucide-react"
import { auth } from "@/lib/firebase"

interface AnalyticsData {
    overview: {
        memberCount: number
        teamCount: number
        totalEvents: number
        totalRSVPs: number
        announcementCount: number
        avgFillRate: number
    }
    recentEvents: {
        id: string
        title: string
        registeredCount: number
        capacity: number
        startDate: string | null
    }[]
    clubName: string
}

export default function ClubAnalyticsPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const clubId = params.id as string

    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user && clubId) {
            fetchAnalytics()
        }
    }, [user, clubId])

    const fetchAnalytics = async () => {
        try {
            const token = await auth.currentUser?.getIdToken()
            const res = await fetch(`/api/clubs/${clubId}/analytics`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!res.ok) {
                if (res.status === 403) {
                    setError("You don't have access to view analytics for this club")
                    return
                }
                throw new Error("Failed to fetch analytics")
            }

            const analyticsData = await res.json()
            setData(analyticsData)
        } catch (err: any) {
            setError(err.message)
            toast.error("Failed to load analytics")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="container max-w-4xl py-8 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Link href={`/clubs/${clubId}`}>
                    <Button variant="outline">Back to Club</Button>
                </Link>
            </div>
        )
    }

    if (!data) return null

    const { overview, recentEvents, clubName } = data

    return (
        <div className="container max-w-6xl py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/clubs/${clubId}/manage`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{clubName} Analytics</h1>
                        <p className="text-muted-foreground">Club performance overview</p>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overview.memberCount}</div>
                            <p className="text-xs text-muted-foreground">
                                {overview.teamCount} team members
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overview.totalEvents}</div>
                            <p className="text-xs text-muted-foreground">
                                Events hosted
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total RSVPs</CardTitle>
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overview.totalRSVPs}</div>
                            <p className="text-xs text-muted-foreground">
                                Registrations received
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Avg Fill Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overview.avgFillRate}%</div>
                            <Progress value={overview.avgFillRate} className="mt-2" />
                        </CardContent>
                    </Card>
                </div>

                {/* Announcements Stat */}
                <Card className="mb-8">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Announcements</CardTitle>
                            <CardDescription>Total announcements posted</CardDescription>
                        </div>
                        <Megaphone className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{overview.announcementCount}</div>
                    </CardContent>
                </Card>

                {/* Recent Events Performance */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            <CardTitle>Recent Events Performance</CardTitle>
                        </div>
                        <CardDescription>Registration stats for your events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentEvents.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No events yet. Create your first event!
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {recentEvents.map((event) => {
                                    const fillPercent = event.capacity > 0
                                        ? Math.round((event.registeredCount / event.capacity) * 100)
                                        : 0
                                    return (
                                        <div key={event.id} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Link
                                                    href={`/events/${event.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {event.title}
                                                </Link>
                                                <span className="text-sm text-muted-foreground">
                                                    {event.registeredCount}/{event.capacity} ({fillPercent}%)
                                                </span>
                                            </div>
                                            <Progress value={fillPercent} className="h-2" />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
