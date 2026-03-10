"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { isAdminEmail } from "@/lib/config"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  Users, Calendar, Ticket, IndianRupee, Building2, Gift,
  TrendingUp, RefreshCw, Mail, AlertTriangle, BarChart3, Trophy
} from "lucide-react"
import { AdminStatsSkeleton } from "@/components/skeletons/admin-skeleton"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalEvents: number
    upcomingEvents: number
    totalTickets: number
    totalRevenue: number
    totalClubs: number
    totalHackathons: number
    totalRedemptions: number
  }
  usersByRole: { student: number; admin: number; faculty: number; club: number }
  registrationsTrend: { date: string; label: string; count: number }[]
  topEvents: { title: string; registrations: number }[]
  emailHealth: { sent: number; failed: number; total: number }
}

const CHART_COLORS = {
  primary: "#1a1a2e",
  accent: "#ffd700",
  blue: "#4f8cff",
  green: "#22c55e",
  red: "#ef4444",
  purple: "#a855f7",
  orange: "#f97316",
  teal: "#14b8a6",
}

const ROLE_COLORS = [CHART_COLORS.blue, CHART_COLORS.accent, CHART_COLORS.purple, CHART_COLORS.teal]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
}

export default function AnalyticsPage() {
  const { profile, user } = useAuth()
  const isAdmin = profile?.role === "admin" || isAdminEmail(profile?.email || "")

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load")
      setData(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAdmin) loadAnalytics()
  }, [isAdmin, loadAnalytics])

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-primary">Admin only</h1>
        <p className="text-sm text-muted-foreground">This area is restricted.</p>
      </main>
    )
  }

  if (loading || !data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <AdminStatsSkeleton />
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={loadAnalytics} variant="outline">Retry</Button>
      </main>
    )
  }

  const { overview, usersByRole, registrationsTrend, topEvents, emailHealth } = data

  const kpis = [
    { label: "Total Users", value: overview.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Events", value: overview.totalEvents, icon: Calendar, color: "text-accent", bg: "bg-accent/10", sub: `${overview.upcomingEvents} upcoming` },
    { label: "Tickets Sold", value: overview.totalTickets, icon: Ticket, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Revenue", value: `₹${overview.totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Active Clubs", value: overview.totalClubs, icon: Building2, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Rewards Redeemed", value: overview.totalRedemptions, icon: Gift, color: "text-orange-500", bg: "bg-orange-500/10" },
  ]

  const pieData = [
    { name: "Students", value: usersByRole.student },
    { name: "Admins", value: usersByRole.admin },
    { name: "Faculty", value: usersByRole.faculty },
    { name: "Clubs", value: usersByRole.club },
  ].filter(d => d.value > 0)

  const emailPieData = [
    { name: "Sent", value: emailHealth.sent, color: CHART_COLORS.green },
    { name: "Failed", value: emailHealth.failed, color: CHART_COLORS.red },
  ].filter(d => d.value > 0)

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-7xl px-4 py-8 space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1 flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Platform health at a glance</p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className={`h-10 w-10 ${kpi.bg} rounded-lg flex items-center justify-center mb-3`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-primary">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              {kpi.sub && <p className="text-xs text-accent mt-0.5">{kpi.sub}</p>}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1: Registration Trend + Top Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart — Registrations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Registrations — Last 7 Days
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Daily event ticket registrations</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={registrationsTrend}>
              <defs>
                <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={CHART_COLORS.accent}
                strokeWidth={2}
                fill="url(#gradientArea)"
                name="Registrations"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart — Top Events */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Top Events by Registrations
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Events with the most ticket registrations</p>
          {topEvents.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topEvents} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  dataKey="title"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 16) + "…" : v}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="registrations" fill={CHART_COLORS.blue} radius={[0, 6, 6, 0]} name="Registrations" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No event data yet</div>
          )}
        </Card>
      </div>

      {/* Charts Row 2: Users by Role + Email Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart — Users by Role */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Users by Role
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Role distribution across all registered users</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Email Health */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Mail className="h-5 w-5 text-accent" />
            Email Delivery Health
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {emailHealth.total} total emails tracked
          </p>
          {emailHealth.total > 0 ? (
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={emailPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {emailPieData.map((entry, index) => (
                      <Cell key={`ecell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Sent: <strong>{emailHealth.sent}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Failed: <strong>{emailHealth.failed}</strong></span>
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                  Success Rate: <Badge variant="outline">
                    {emailHealth.total > 0 ? ((emailHealth.sent / emailHealth.total) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No email logs yet
            </div>
          )}
        </Card>
      </div>

      {/* Quick Stats Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span>🏆 <strong className="text-primary">{overview.totalHackathons}</strong> Hackathons</span>
          <span className="text-border">|</span>
          <span>🎫 <strong className="text-primary">{overview.totalTickets}</strong> Tickets Generated</span>
          <span className="text-border">|</span>
          <span>📧 <strong className="text-primary">{emailHealth.total}</strong> Emails Sent</span>
          <span className="text-border">|</span>
          <span>🎁 <strong className="text-primary">{overview.totalRedemptions}</strong> Rewards Redeemed</span>
        </div>
      </Card>
    </motion.main>
  )
}
