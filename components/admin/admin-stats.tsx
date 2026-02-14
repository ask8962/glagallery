"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore"
import { getAllHackathons } from "@/lib/hackathons"
import { Card } from "@/components/ui/card"
import { Users, Calendar, Trophy, QrCode } from "lucide-react"
import Link from "next/link"
import { AdminStatsSkeleton } from "@/components/skeletons/admin-skeleton"
import type { Event, Hackathon, UserProfile } from "@/lib/types"
import { useOrganization } from "@/context/organization-context"
import { isSuperAdminEmail } from "@/lib/config"

export function AdminStats() {
    const { db } = getFirebase()
    const { organization } = useOrganization()
    const { profile } = useAuth()
    const isSuperAdmin = profile?.role === "super_admin" || isSuperAdminEmail(profile?.email || "")
    
    const [usersCount, setUsersCount] = useState(0)
    const [eventsCount, setEventsCount] = useState(0)
    const [hackathonsCount, setHackathonsCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!organization?.id && !isSuperAdmin) return;
        setLoading(true)

        // Users count
        const qUsers = isSuperAdmin 
            ? collection(db, "users") 
            : query(collection(db, "users"), where("organizationId", "==", organization?.id))
        const unsubUsers = onSnapshot(qUsers, (snap) => {
            setUsersCount(snap.size)
        })

        // Events count
        const qEvents = isSuperAdmin 
            ? collection(db, "events") 
            : query(collection(db, "events"), where("organizationId", "==", organization?.id))
        const unsubEvents = onSnapshot(qEvents, (snap) => {
            setEventsCount(snap.size)
        })

        // Hackathons count
        const qHackathons = isSuperAdmin 
            ? collection(db, "hackathons") 
            : query(collection(db, "hackathons"), where("organizationId", "==", organization?.id))
        const unsubHackathons = onSnapshot(qHackathons, (snap) => {
            setHackathonsCount(snap.size)
        })

        // We can assume loading finishes when listeners attach, or use a complex state.
        // Simulating loading state for skeleton visualization
        const timer = setTimeout(() => setLoading(false), 1000)

        return () => {
            unsubUsers()
            unsubEvents()
            unsubHackathons()
            clearTimeout(timer)
        }
    }, [db, organization?.id, isSuperAdmin])

    if (loading) {
        return <AdminStatsSkeleton />
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 text-center">
                <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-accent" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">{usersCount}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 text-center">
                <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">{eventsCount}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 text-center">
                <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6 text-accent" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">{hackathonsCount}</div>
                <div className="text-sm text-muted-foreground">Hackathons</div>
            </div>

            {/* Scanner Quick Access */}
            <Link href="/admin/scanner" className="block">
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 shadow-sm border border-primary/20 text-center hover:shadow-md transition-all cursor-pointer">
                    <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <QrCode className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-lg font-bold text-primary mb-1">Scan Tickets</div>
                    <div className="text-sm text-muted-foreground">Verify Event Entry</div>
                </div>
            </Link>
        </div>
    )
}
