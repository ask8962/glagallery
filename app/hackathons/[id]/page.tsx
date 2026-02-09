"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { getUserTeams, registerForHackathon, getHackathonTeams, updateHackathonStatus } from "@/lib/hackathons"
import type { Hackathon, Team } from "@/lib/types"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, MapPin, Trophy, Clock, UserPlus, Code, Award } from "lucide-react"
import { format } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SectionErrorBoundary } from "@/components/section-error-boundary"
import { useErrorHandler } from "@/components/error-boundary"
import { HackathonDetailSkeleton } from "@/components/skeletons/hackathon-skeleton"
import { CountdownTimer } from "@/components/hackathons/countdown-timer"
import { LiveLeaderboard } from "@/components/hackathons/live-leaderboard"
import { WinnerAnnouncement } from "@/components/hackathons/winner-announcement"

const statusColors = {
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  registration: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  active: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  judging: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

export default function HackathonDetailPage() {
  const { user, profile } = useAuth()
  const params = useParams()
  const router = useRouter()
  const hackathonId = params.id as string
  const handleError = useErrorHandler()

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [userTeam, setUserTeam] = useState<Team | null>(null)
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [showWinners, setShowWinners] = useState(false)

  const isAdmin = profile?.role === "admin"
  const isOrganizer = hackathon?.organizerUid === user?.uid
  const canRegister = hackathon?.status === "registration" || hackathon?.status === "upcoming"
  const isActive = hackathon?.status === "active"
  const isCompleted = hackathon?.status === "completed"

  async function loadHackathon() {
    if (!hackathonId) return

    try {
      // Load user's team
      if (user) {
        const teams = await getUserTeams(hackathonId, user.uid)
        if (teams.length > 0) {
          setUserTeam(teams[0])
        }
      }

      // Load all teams (for organizers/admins)
      if (isAdmin || hackathon?.organizerUid === user?.uid) {
        const teams = await getHackathonTeams(hackathonId)
        setAllTeams(teams)
      }
    } catch (error) {
      console.error("Error reloading hackathon data:", error)
    }
  }

  useEffect(() => {
    if (!hackathonId) return

    setLoading(true)
    const { db } = getFirebase()
    const hackathonRef = doc(db, "hackathons", hackathonId)

    // Real-time listener for hackathon
    const unsubscribe = onSnapshot(
      hackathonRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          router.push("/hackathons")
          return
        }

        const data = { id: snapshot.id, ...snapshot.data() } as Hackathon
        setHackathon(data)

        // Update status if needed
        await updateHackathonStatus(hackathonId)

        // Load user's team
        if (user) {
          const teams = await getUserTeams(hackathonId, user.uid)
          if (teams.length > 0) {
            setUserTeam(teams[0])
          }
        }

        // Load all teams (for organizers/admins)
        if (isAdmin || data.organizerUid === user?.uid) {
          const teams = await getHackathonTeams(hackathonId)
          setAllTeams(teams)
        }

        setLoading(false)
      },
      (error) => {
        console.error("Error loading hackathon:", error)
        handleError(error instanceof Error ? error : new Error(String(error)))
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [hackathonId, user, isAdmin, router])

  async function handleRegister() {
    if (!user || !hackathon || !teamName.trim()) return

    setRegistering(true)
    try {
      await registerForHackathon(
        hackathonId,
        teamName.trim(),
        user.uid,
        profile?.name || user.displayName || "GLA Student",
        user.email || "",
        user.photoURL || undefined,
      )
      setShowRegisterDialog(false)
      setTeamName("")
      await loadHackathon()
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error))
      handleError(err)
      alert(err.message || "Failed to register. Please try again.")
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return <HackathonDetailSkeleton />
  }

  if (!hackathon) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 py-16 border-b border-border"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          {hackathon.bannerURL && (
            <div className="relative h-64 rounded-xl overflow-hidden mb-6">
              <img
                src={hackathon.bannerURL || "/placeholder.svg"}
                alt={hackathon.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge className={statusColors[hackathon.status]}>{hackathon.status}</Badge>
                {hackathon.theme && <Badge variant="outline">{hackathon.theme}</Badge>}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">{hackathon.title}</h1>

              <p className="text-lg text-muted-foreground max-w-3xl mb-6">{hackathon.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format((hackathon.startDate as any)?.toDate?.() || new Date(), "MMM d, yyyy h:mm a")} -{" "}
                    {format((hackathon.endDate as any)?.toDate?.() || new Date(), "MMM d, yyyy h:mm a")}
                  </span>
                </div>

                {hackathon.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{hackathon.isOnline ? "Online Event" : hackathon.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    Team size: {hackathon.minTeamSize}-{hackathon.maxTeamSize} members
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Registration closes:{" "}
                    {format((hackathon.registrationDeadline as any)?.toDate?.() || new Date(), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full lg:w-auto">
              {!userTeam && canRegister && (
                <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Register for Hackathon</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Create your team to secure a spot in this hackathon. You can invite members later.
                    </DialogDescription>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Team Name *</label>
                        <Input
                          placeholder="Enter your team name"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleRegister}
                        disabled={!teamName.trim() || registering}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        {registering ? "Registering..." : "Create Team & Register"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {userTeam && (
                <Link href={`/hackathons/${hackathonId}/team`}>
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                    <Users className="h-4 w-4 mr-2" />
                    My Team
                  </Button>
                </Link>
              )}

              {isActive && userTeam && (
                <Link href={`/hackathons/${hackathonId}/submit`}>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Code className="h-4 w-4 mr-2" />
                    Submit Project
                  </Button>
                </Link>
              )}

              {(isAdmin || isOrganizer || hackathon.judges?.includes(user?.uid || "")) && (
                <div className="flex flex-col gap-3">
                  {(isAdmin || isOrganizer) && (
                    <Link href={`/hackathons/${hackathonId}/check-in`}>
                      <Button variant="outline" className="w-full bg-transparent border-primary/50 text-primary hover:bg-primary/10">
                        <Users className="h-4 w-4 mr-2" />
                        Team Check-In
                      </Button>
                    </Link>
                  )}

                  <Link href={`/hackathons/${hackathonId}/judge`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Award className="h-4 w-4 mr-2" />
                      Judge Submissions
                    </Button>
                  </Link>
                </div>
              )}

              {isCompleted && (
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowWinners(true)}>
                  <Trophy className="h-4 w-4 mr-2" />
                  View Winners
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Countdown Timer & Leaderboard */}
      {(isActive || hackathon.status === "judging") && (
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hackathon.submissionDeadline && (
              <CountdownTimer
                deadline={(hackathon.submissionDeadline as any)?.toDate?.() || new Date()}
                showWarning={true}
                warningThreshold={60 * 60 * 1000} // 1 hour
              />
            )}
            {(isActive || hackathon.status === "judging") && <LiveLeaderboard hackathonId={hackathonId} showTop={10} />}
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
          <SectionErrorBoundary>
            <WinnerAnnouncement hackathonId={hackathonId} hackathonTitle={hackathon.title} showCertificates={true} />
          </SectionErrorBoundary>
        </div>
      )}

      {/* Content Tabs */}
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-12">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="prizes">Prizes</TabsTrigger>
            <TabsTrigger value="teams">Teams ({allTeams.length || "..."})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-4">About This Hackathon</h2>
              <div className="prose prose-lg max-w-none text-foreground">
                <p className="text-muted-foreground leading-relaxed">{hackathon.description}</p>

                {hackathon.theme && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-primary mb-2">Theme</h3>
                    <p className="text-muted-foreground">{hackathon.theme}</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-4">Rules & Guidelines</h2>
              {hackathon.rules && hackathon.rules.length > 0 ? (
                <ul className="space-y-3">
                  {hackathon.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-accent font-bold mt-1">{index + 1}.</span>
                      <span className="text-muted-foreground flex-1">{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No specific rules have been set for this hackathon.</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="prizes" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-accent" />
                Prizes & Awards
              </h2>
              {hackathon.prizes && hackathon.prizes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hackathon.prizes.map((prize, index) => (
                    <div key={index} className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-accent" />
                        <span className="font-semibold text-primary">Prize #{index + 1}</span>
                      </div>
                      <p className="text-muted-foreground">{prize}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Prize details will be announced soon.</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-4">Registered Teams</h2>
              {allTeams.length > 0 ? (
                <div className="space-y-4">
                  {allTeams.map((team) => (
                    <div key={team.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-primary">{team.name}</h3>
                        <Badge variant={team.status === "submitted" ? "default" : "secondary"}>{team.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {team.members.length} member{team.members.length > 1 ? "s" : ""}
                        </span>
                        {team.projectName && (
                          <>
                            <span>-</span>
                            <span>{team.projectName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No teams registered yet.</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showWinners} onOpenChange={setShowWinners}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Hackathon Winners</DialogTitle>
          </DialogHeader>
          <WinnerAnnouncement
            hackathonId={hackathonId}
            hackathonTitle={hackathon.title}
            showCertificates={true}
            onClose={() => setShowWinners(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
