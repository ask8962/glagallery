"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { motion } from "framer-motion"
import { Calendar, MapPin, Users, ArrowRight, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getAllHackathons } from "@/lib/hackathons"
import type { Hackathon } from "@/lib/types"
import { format } from "date-fns"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function EventsSection() {
  const { user, loading: authLoading } = useAuth()
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Only load hackathons if user is authenticated
    if (!authLoading && user) {
      loadHackathons()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  async function loadHackathons() {
    try {
      setError(null)
      // Get upcoming and active hackathons
      const allHackathons = await getAllHackathons()
      const featured = allHackathons
        .filter((h) => h.status === "upcoming" || h.status === "registration" || h.status === "active")
        .slice(0, 3) // Show top 3
      setHackathons(featured)
    } catch (error: any) {
      console.error("Error loading hackathons:", error)
      // Silently fail - don't show section if there's an error
      setError(error.message || "Failed to load events")
      setHackathons([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        </div>
      </section>
    )
  }

  // Don't show section if no hackathons or if there was an error
  if (hackathons.length === 0 || error) {
    return null
  }
  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-1 w-12 bg-accent" />
            <span className="text-sm font-medium text-accent">Featured Events</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Campus Life in
            <span className="block text-accent">Full Swing</span>
          </h2>

          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From cultural extravaganzas to technical symposiums, our campus buzzes with activities that bring students
            together and create lasting memories.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hackathons.map((hackathon, index) => (
            <motion.div
              key={hackathon.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Link href={`/hackathons/${hackathon.id}`}>
                <Card className="overflow-hidden bg-card shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl border-0 ring-1 ring-border/50 hover:ring-accent/30 group h-full flex flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {hackathon.bannerURL ? (
                      <Image
                        src={hackathon.bannerURL || "/placeholder.svg"}
                        alt={hackathon.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                    )}

                    {/* Status badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="secondary" className="bg-accent/90 text-accent-foreground">
                        <Trophy className="h-3 w-3 mr-1" />
                        {hackathon.status}
                      </Badge>
                    </div>

                    {/* Theme tag */}
                    {hackathon.theme && (
                      <div className="absolute top-4 left-4 z-10">
                        <Badge variant="secondary" className="bg-accent/90 text-accent-foreground">
                          {hackathon.theme}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2 group-hover:text-accent transition-colors">
                        {hackathon.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {hackathon.description}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm flex-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-accent" />
                        <span>
                          {format((hackathon.startDate as any)?.toDate?.() || new Date(), "MMM d, yyyy")} -{" "}
                          {format((hackathon.endDate as any)?.toDate?.() || new Date(), "MMM d, yyyy")}
                        </span>
                      </div>
                      {hackathon.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 text-accent" />
                          <span>{hackathon.isOnline ? "Online" : hackathon.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 text-accent" />
                        <span>
                          Team size: {hackathon.minTeamSize}-{hackathon.maxTeamSize}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent transition-all duration-300 bg-transparent"
                      onClick={(e) => {
                        e.preventDefault()
                        router.push(`/hackathons/${hackathon.id}`)
                      }}
                    >
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/hackathons">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              View All Hackathons
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
