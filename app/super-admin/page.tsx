"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, where, count } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, CalendarDays, Ticket } from "lucide-react"

export default function SuperAdminMetricsPage() {
    const [metrics, setMetrics] = useState({
        totalColleges: 0,
        activeColleges: 0,
        paidColleges: 0,
        totalEvents: 0,
        totalStudents: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const { db } = getFirebase()
                
                // Fetch Organizations count
                const orgsSnap = await getDocs(collection(db, "organizations"))
                const totalOrgs = orgsSnap.size
                const activeOrgs = orgsSnap.docs.filter(doc => doc.data().status !== "suspended").length
                
                // Fetch Events count
                const eventsSnap = await getDocs(collection(db, "events"))
                const totalEvents = eventsSnap.size

                // Fetch Users count (Approximation of students for now)
                const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "user")))
                const totalStudents = usersSnap.size

                // Fetch Leads count that are paid
                const crmSnap = await getDocs(query(collection(db, "billing_crm"), where("status", "==", "paid")))
                const paidOrgs = crmSnap.size

                setMetrics({
                    totalColleges: totalOrgs,
                    activeColleges: activeOrgs,
                    paidColleges: paidOrgs,
                    totalEvents,
                    totalStudents
                })
            } catch (error) {
                console.error("Failed to fetch metrics", error)
            } finally {
                setLoading(false)
            }
        }

        fetchMetrics()
    }, [])

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Metrics</h1>
                <p className="text-muted-foreground mt-2">Global SaaS overview for tracking growth and engagement.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Colleges</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : metrics.totalColleges}</div>
                        <p className="text-xs text-muted-foreground">
                            {loading ? "..." : metrics.activeColleges} currently active
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Paid Tenants</CardTitle>
                        <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{loading ? "..." : metrics.paidColleges}</div>
                        <p className="text-xs text-muted-foreground">Successfully closed deals</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Global Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : metrics.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">Registered users across all platforms</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Events Hosted</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : metrics.totalEvents}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function BriefcaseIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    )
}
