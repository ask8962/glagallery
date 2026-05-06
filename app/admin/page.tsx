"use client"

import { useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { motion } from "framer-motion"
import { isAdminEmail, isSuperAdminEmail } from "@/lib/config"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert, TerminalSquare, Activity, Zap, Server } from "lucide-react"

// Components
import { AdminStats } from "@/components/admin/admin-stats"
import { UserManagement } from "@/components/admin/user-management"
import { AdminQuickLinks } from "@/components/admin/admin-quick-links"
import { EventManagement } from "@/components/admin/event-management"
import { HackathonManagement } from "@/components/admin/hackathon-management"
import { BroadcastEmail } from "@/components/admin/broadcast-email"
import { FacultyVerification } from "@/components/admin/faculty-verification"
import { ClubVerificationDashboard } from "@/components/admin/club-verification-dashboard"
import { AcademicCalendarManager } from "@/components/admin/academic-calendar-manager"
import { PlatformSettings } from "@/components/admin/platform-settings"
import { ConfessionModeration } from "@/components/admin/confession-moderation"

export default function AdminPage() {
  const { user, profile } = useAuth()

  const email = profile?.email || user?.email || ""
  
  // Super Admin Check (Full Control)
  const isSuperAdmin = profile?.role === "super_admin" || isSuperAdminEmail(email)
  
  // Normal Admin Check (Limited Control)
  const isNormalAdmin = profile?.role === "admin" || isAdminEmail(email)
  
  const hasAccess = isSuperAdmin || isNormalAdmin

  useEffect(() => {
    console.log("Admin Access Check:", {
      email,
      role: profile?.role,
      isSuperAdmin,
      isNormalAdmin,
    })
  }, [profile, isSuperAdmin, isNormalAdmin, email])

  if (!hasAccess) {
    return (
      <main className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4 opacity-50" />
        <h1 className="text-3xl font-bold tracking-tight mb-2">Access Denied</h1>
        <p className="text-muted-foreground max-w-sm">
          You do not have the required permissions to view the command center.
        </p>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] relative selection:bg-primary/30">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <motion.main 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="mx-auto max-w-7xl px-4 py-12 space-y-16 relative z-10"
      >
        {/* Command Center Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-white/5"
        >
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              System Online • {isSuperAdmin ? "Global Super Admin" : "Tenant Admin"}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
              Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Center</span>
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              {isSuperAdmin 
                ? "Global terminal for managing all tenants, users, events, and platform configurations."
                : "Manage your users, events, clubs, and oversee community interactions."}
            </p>
          </div>

          {isSuperAdmin && (
            <Link href="/super-admin">
              <Button 
                variant="outline" 
                className="group relative overflow-hidden border-destructive/30 hover:border-destructive/80 bg-destructive/5 hover:bg-destructive/10 text-destructive-foreground transition-all duration-300 h-12 px-6"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-destructive/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <ShieldAlert className="w-4 h-4 mr-2" />
                <span className="font-semibold tracking-wide">ENTER TENANT MANAGER</span>
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl blur-xl opacity-50 pointer-events-none" />
          <AdminStats />
        </motion.div>

      {/* Users Management */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <UserManagement />
      </motion.section>

      {/* Admin Quick Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <AdminQuickLinks />
      </motion.section>

      {/* Event Management */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <EventManagement />
      </motion.section>

      {/* Hackathons Management */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <HackathonManagement />
      </motion.section>

      {/* SUPER ADMIN RESTRICTED SECTIONS */}
      {isSuperAdmin && (
        <>
          {/* Email Broadcast Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <BroadcastEmail />
          </motion.section>

          {/* Confessions Moderation */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
          >
            <ConfessionModeration />
          </motion.section>

          {/* Faculty Verification */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h2 className="text-2xl font-semibold text-primary mb-6">Faculty Verification</h2>
            <FacultyVerification />
          </motion.section>

          {/* Club Verification */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-2xl font-semibold text-primary mb-6">Club Verification</h2>
            <ClubVerificationDashboard />
          </motion.section>

          {/* Academic Calendar */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <h2 className="text-2xl font-semibold text-primary mb-6">Academic Calendar</h2>
            <AcademicCalendarManager />
          </motion.section>

          {/* Reward Campaign Management */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-primary">Reward Campaign</h2>
              <a href="/admin/campaign" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Manage Campaign
              </a>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-col space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Campaign Overview</h3>
                <p className="text-sm text-muted-foreground">Manage student reward claims, verify users, and process payouts.</p>
              </div>
            </div>
          </motion.section>

          {/* Platform Branding */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <h2 className="text-2xl font-semibold text-white/90 mb-6">Global Platform Settings</h2>
            <PlatformSettings />
          </motion.section>
        </>
      )}
      </motion.main>
    </div>
  )
}
