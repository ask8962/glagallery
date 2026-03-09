"use client"

import { useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { motion } from "framer-motion"
import { isAdminEmail } from "@/lib/config"

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

export default function AdminPage() {
  const { user, profile } = useAuth()

  const isAdmin = (profile?.role === "admin" || profile?.role === "super_admin") ||
    isAdminEmail(profile?.email || "")

  useEffect(() => {
    console.log("Admin Access Check:", {
      email: profile?.email,
      role: profile?.role,
      isAdmin,
    })
  }, [profile, isAdmin])

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-primary">Admin only</h1>
        <p className="text-sm text-muted-foreground">This area is restricted.</p>
      </main>
    )
  }

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl px-4 py-8 space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-1 w-12 bg-accent" />
          <span className="text-sm font-medium text-accent">Admin Panel</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
          Content
          <span className="block text-accent">Management</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Manage users, events, clubs, and oversee community interactions.
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
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

      {/* Email Broadcast Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <BroadcastEmail />
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
        <h2 className="text-2xl font-semibold text-primary mb-6">Platform Settings</h2>
        <PlatformSettings />
      </motion.section>
    </motion.main>
  )
}
