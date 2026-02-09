"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore"
import type { UserProfile, Hackathon } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { getAllHackathons, deleteHackathon } from "@/lib/hackathons"
import Link from "next/link"
import { Trophy, Calendar, Flag, QrCode, Building2, Users, Shield, Activity, ShoppingBag } from "lucide-react"
import { AdminStatsSkeleton, AdminTableSkeleton } from "@/components/skeletons/admin-skeleton"
import { BroadcastEmail } from "@/components/admin/broadcast-email"
import { NoShowReport } from "@/components/admin/noshow-report"
import { EventAttendeesList } from "@/components/admin/event-attendees-list"
import { CreateClubDialog } from "@/components/admin/create-club-dialog"

import { FacultyVerification } from "@/components/admin/faculty-verification"
import { ClubVerificationDashboard } from "@/components/admin/club-verification-dashboard"
import { AcademicCalendarManager } from "@/components/admin/academic-calendar-manager"
import type { Event } from "@/lib/types"

const ADMIN_EMAIL = "anukalp.gupta_cs23@gla.ac.in"

export default function AdminPage() {
  const { user, profile } = useAuth()
  const { db } = getFirebase()
  const isAdmin = profile?.role === "admin" || profile?.email === ADMIN_EMAIL

  const [users, setUsers] = useState<UserProfile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) return

    setLoading(true)

    // Set up listeners with error handling
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const list: UserProfile[] = []
        snap.forEach((d) => list.push(d.data() as any))
        setUsers(list)
        setLoading(false) // Assuming users load last or managing separate loading states would be better, but this matches original
      },
      (error) => {
        console.error("Error loading users:", error)
      },
    )

    const unsubEvents = onSnapshot(
      query(collection(db, "events"), orderBy("endDate", "desc")),
      (snap) => {
        const list: Event[] = []
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
        setEvents(list)
      },
      (error) => { console.error("Error loading events:", error) }
    )

    // Load hackathons with error handling
    getAllHackathons()
      .then(setHackathons)
      .catch((error) => {
        console.error("Error loading hackathons:", error)
      })

    return () => {
      unsubUsers()
      unsubEvents()
    }
  }, [db, isAdmin])

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-primary">Admin only</h1>
        <p className="text-sm text-muted-foreground">This area is restricted.</p>
      </main>
    )
  }

  async function toggleRole(u: UserProfile) {
    // Prevent demoting the super admin
    if (u.email === ADMIN_EMAIL && u.role === "admin") {
      alert("Cannot demote the super admin")
      return
    }

    try {
      const newRole = u.role === "admin" ? "student" : "admin"
      await updateDoc(doc(db, "users", u.uid), { role: newRole })
    } catch (error) {
      console.error("Failed to update user role:", error)
      alert("Failed to update user role. Please try again.")
    }
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
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
      >
        {loading ? (
          <AdminStatsSkeleton />
        ) : (
          <>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 text-center">
              <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 text-center">
              <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{events.length}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 text-center">
              <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{hackathons.length}</div>
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
          </>
        )}
      </motion.div>

      {/* Users Management */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-primary">User Management</h2>
          {profile && <CreateClubDialog user={profile} students={users} />}
        </div>
        {loading ? (
          <AdminTableSkeleton rows={5} />
        ) : (
          <Card className="overflow-hidden shadow-sm border border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-left font-medium text-foreground">Name</th>
                    <th className="p-4 text-left font-medium text-foreground">Email</th>
                    <th className="p-4 text-left font-medium text-foreground">Role</th>
                    <th className="p-4 text-left font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user.uid}
                      className={`border-b border-border/50 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                    >
                      <td className="p-4 font-medium text-foreground">{user.name}</td>
                      <td className="p-4 text-muted-foreground">{user.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRole(user)}
                          className="hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all duration-300"
                        >
                          {user.role === "admin" ? "Demote" : "Promote"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </motion.section>

      {/* Admin Links - Removed removed pages */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Link href="/admin/health">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-accent/20 hover:border-accent/40">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">System Health</h3>
                <p className="text-sm text-muted-foreground">Database stats and performance</p>
              </div>
              <Activity className="h-8 w-8 text-accent" />
            </div>
          </Card>
        </Link>
        <Link href="/admin/analytics">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-accent/20 hover:border-accent/40">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground">User engagement metrics</p>
              </div>
              <Trophy className="h-8 w-8 text-accent" />
            </div>
          </Card>
        </Link>
        <Link href="/admin/rewards">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-accent/20 hover:border-accent/40">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">Rewards Store</h3>
                <p className="text-sm text-muted-foreground">Manage rewards and redemptions</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-accent" />
            </div>
          </Card>
        </Link>
      </motion.section>

      {/* Event Management */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-primary">Event Management</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            return (
              <div key={event.id} className="space-y-4">
                <NoShowReport
                  eventId={event.id}
                  eventTitle={event.title}
                  eventEndDate={event.endDate?.toDate()}
                  noShowsProcessed={event.noShowsProcessed}
                  noShowCount={event.noShowCount}
                />

                <div className="flex justify-end">
                  <EventAttendeesList
                    eventId={event.id}
                    eventTitle={event.title}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {events.length === 0 && (
          <p className="text-muted-foreground">No events found.</p>
        )}
      </motion.section>

      {/* Hackathons Management */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-primary">Hackathons Management</h2>
          <Link href="/hackathons/create">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Create Hackathon</Button>
          </Link>
        </div>
        <Card className="overflow-hidden shadow-sm border border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium text-foreground">Title</th>
                  <th className="p-4 text-left font-medium text-foreground">Status</th>
                  <th className="p-4 text-left font-medium text-foreground">Organizer</th>
                  <th className="p-4 text-left font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hackathons.map((hackathon, index) => (
                  <tr
                    key={hackathon.id}
                    className={`border-b border-border/50 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                  >
                    <td className="p-4 font-medium text-foreground">{hackathon.title}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{hackathon.status}</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{hackathon.organizerName}</td>
                    <td className="p-4 space-x-2">
                      <Link href={`/hackathons/${hackathon.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (
                            confirm(
                              `Are you sure you want to delete "${hackathon.title}"? This action cannot be undone.`,
                            )
                          ) {
                            try {
                              await deleteHackathon(hackathon.id)
                              setHackathons(hackathons.filter((h) => h.id !== hackathon.id))
                            } catch (error) {
                              alert("Failed to delete hackathon. Please try again.")
                            }
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.section>

      {/* Email Broadcast Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
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
    </motion.main>
  )
}
