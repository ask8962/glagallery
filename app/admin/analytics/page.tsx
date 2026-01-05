"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { collection, query, getDocs } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Users } from "lucide-react"
import { AdminStatsSkeleton } from "@/components/skeletons/admin-skeleton"

const ADMIN_EMAIL = "anukalp.gupta_cs23@gla.ac.in"

interface AnalyticsData {
  totalUsers: number
  usersByRole: { admin: number; faculty: number; student: number; club: number }
}

export default function AnalyticsPage() {
  const { profile } = useAuth()
  const { db } = getFirebase()
  const isAdmin = profile?.role === "admin" || profile?.email === ADMIN_EMAIL

  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    loadAnalytics()
  }, [isAdmin, db])

  async function loadAnalytics() {
    if (!isAdmin) return

    setLoading(true)
    try {
      // Get all users
      const usersSnap = await getDocs(collection(db, "users"))

      const usersByRole = { admin: 0, faculty: 0, student: 0, club: 0 }

      usersSnap.forEach((doc) => {
        const data = doc.data()
        const role = (data.role as keyof typeof usersByRole) || 'student'
        if (role in usersByRole) {
          usersByRole[role]++
        } else {
          usersByRole.student++
        }
      })

      setAnalytics({
        totalUsers: usersSnap.size,
        usersByRole
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-primary">Admin only</h1>
        <p className="text-sm text-muted-foreground">This area is restricted.</p>
      </main>
    )
  }

  if (loading || !analytics) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <AdminStatsSkeleton />
      </main>
    )
  }

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track user statistics</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Users</p>
              <p className="text-3xl font-bold text-primary">{analytics.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-accent" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Students</span>
              <Badge>{analytics.usersByRole.student}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Faculty</span>
              <Badge variant="secondary">{analytics.usersByRole.faculty}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Clubs</span>
              <Badge variant="outline">{analytics.usersByRole.club}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Admins</span>
              <Badge variant="destructive">{analytics.usersByRole.admin}</Badge>
            </div>
          </div>
        </Card>
      </div>

    </motion.main>
  )
}
