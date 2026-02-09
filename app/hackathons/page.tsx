"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getAllHackathons, updateHackathonStatus } from "@/lib/hackathons"
import { getFirebase } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore"
import type { Hackathon } from "@/lib/types"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, Trophy, Plus } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { GLASignInGuard } from "@/components/gla-signin-guard"
import { HackathonListSkeleton } from "@/components/skeletons/hackathon-skeleton"

const statusColors = {
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  registration: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  active: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  judging: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

export default function HackathonsPage() {
  const { user, profile, loading, signIn } = useAuth()
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [filter, setFilter] = useState<Hackathon["status"] | "all">("all")
  const [loadingHackathons, setLoadingHackathons] = useState(true)
  const isAdmin = profile?.role === "admin"

  useEffect(() => {
    setLoadingHackathons(true)
    const { db } = getFirebase()
    const hackathonsRef = collection(db, "hackathons")

    // Build query based on filter
    let q
    if (filter === "all") {
      q = query(hackathonsRef, orderBy("startDate", "desc"))
    } else {
      q = query(hackathonsRef, where("status", "==", filter), orderBy("startDate", "desc"))
    }

    // Real-time listener for hackathons
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const hackathonsList: Hackathon[] = []
        snapshot.forEach((doc) => {
          hackathonsList.push({ id: doc.id, ...(doc.data() as any) })
        })
        setHackathons(hackathonsList)
        setLoadingHackathons(false)

        // Update statuses for all hackathons
        hackathonsList.forEach((h) => {
          updateHackathonStatus(h.id).catch(console.error)
        })
      },
      (error) => {
        console.error("Error loading hackathons:", error)
        // Fallback to non-real-time loading
        getAllHackathons(filter === "all" ? undefined : filter)
          .then(setHackathons)
          .catch(console.error)
          .finally(() => setLoadingHackathons(false))
      },
    )

    return () => unsubscribe()
  }, [filter])

  if (!loading && !user) {
    return (
      <GLASignInGuard
        onSignIn={signIn}
        title="Sign in to View Hackathons"
        description="Join exciting hackathons and compete with your peers. Only verified GLA students can participate."
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 py-16 border-b border-border"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-12 bg-accent" />
                <span className="text-sm font-medium text-accent">Competitions</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                Hackathons
                <span className="block text-accent">at GLA</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Join exciting coding competitions, build innovative projects, and compete with your peers.
              </p>
            </div>
            {isAdmin && (
              <Link href="/hackathons/create">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Hackathon
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-card border-b border-border py-6"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-wrap gap-2">
            {(["all", "upcoming", "registration", "active", "judging", "completed"] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(status)}
                className={`transition-all duration-300 ${
                  filter === status
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : "hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Hackathons Grid */}
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-12">
        {loadingHackathons ? (
          <HackathonListSkeleton count={6} />
        ) : hackathons.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">No hackathons found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === "all" ? "No hackathons have been created yet." : `No ${filter} hackathons at the moment.`}
            </p>
            {isAdmin && (
              <Link href="/hackathons/create">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Create First Hackathon</Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((hackathon, index) => (
              <motion.div
                key={hackathon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link href={`/hackathons/${hackathon.id}`}>
                  <Card className="overflow-hidden bg-card shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl border-0 ring-1 ring-border/50 hover:ring-accent/30 group h-full flex flex-col">
                    {hackathon.bannerURL && (
                      <div className="relative h-48 bg-muted overflow-hidden">
                        <img
                          src={hackathon.bannerURL || "/placeholder.svg"}
                          alt={hackathon.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className={statusColors[hackathon.status]}>{hackathon.status}</Badge>
                        </div>
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">
                        {hackathon.title}
                      </h3>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{hackathon.description}</p>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format((hackathon.startDate as any)?.toDate?.() || new Date(), "MMM d, yyyy")} -{" "}
                            {format((hackathon.endDate as any)?.toDate?.() || new Date(), "MMM d, yyyy")}
                          </span>
                        </div>

                        {hackathon.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{hackathon.isOnline ? "Online" : hackathon.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            Team size: {hackathon.minTeamSize}-{hackathon.maxTeamSize} members
                          </span>
                        </div>

                        {hackathon.prizes && hackathon.prizes.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            <span>
                              {hackathon.prizes.length} prize{hackathon.prizes.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/50">
                        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
