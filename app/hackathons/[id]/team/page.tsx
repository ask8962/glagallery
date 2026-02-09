"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useParams, useRouter } from "next/navigation"
import {
  getTeamById,
  getHackathonById,
  addTeamMember,
  removeTeamMember,
  getUserTeams
} from "@/lib/hackathons"
import type { Team, Hackathon, TeamMember } from "@/lib/types"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, UserPlus, X, Crown, Mail, LogOut } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase"
import { OnlineIndicator } from "@/components/online-indicator"
import { TeamQRCode } from "@/components/hackathons/team-qr-code"
import Link from "next/link"

export default function TeamManagementPage() {
  const { user, profile } = useAuth()
  const params = useParams()
  const router = useRouter()
  const hackathonId = params.id as string

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  useEffect(() => {
    if (!hackathonId || !user) return

    setLoading(true)
    let unsubscribe: (() => void) | null = null

    async function loadData() {
      try {
        const { db } = getFirebase()

        // Load hackathon data
        const hackathonData = await getHackathonById(hackathonId)
        if (!hackathonData) {
          router.push("/hackathons")
          return
        }
        setHackathon(hackathonData)

        // Load user's team
        const userTeams = await getUserTeams(hackathonId, user.uid)
        if (userTeams.length > 0) {
          const teamId = userTeams[0].id
          const teamRef = doc(db, "hackathons", hackathonId, "teams", teamId)

          // Set up real-time listener for team
          unsubscribe = onSnapshot(
            teamRef,
            (snapshot) => {
              if (!snapshot.exists()) {
                router.push(`/hackathons/${hackathonId}`)
                return
              }

              const teamData = { id: snapshot.id, ...snapshot.data() } as Team
              setTeam(teamData)
              setLoading(false)
            },
            (error) => {
              console.error("Error loading team:", error)
              setLoading(false)
            }
          )
        } else {
          router.push(`/hackathons/${hackathonId}`)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setLoading(false)
      }
    }

    loadData()

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [hackathonId, user, router])

  async function handleInviteMember() {
    if (!team || !inviteEmail.trim() || !user) return

    setInviting(true)
    try {
      // Find user by email
      const { db } = getFirebase()
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", inviteEmail.trim().toLowerCase()))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        alert("User not found. Please make sure they have signed up with their GLA email.")
        return
      }

      const userDoc = snapshot.docs[0]
      const userData = userDoc.data()

      // Check if user is already in a team
      const existingTeams = await getUserTeams(hackathonId, userData.uid)
      if (existingTeams.length > 0) {
        alert("This user is already registered in a team for this hackathon.")
        return
      }

      // Add member
      await addTeamMember(hackathonId, team.id, {
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        photoURL: userData.photoURL,
        role: "Team Member",
      })

      setInviteEmail("")
      setShowInviteDialog(false)
      // Real-time listener will automatically update the team data
      // No need to manually reload
    } catch (error: any) {
      alert(error.message || "Failed to invite member. Please try again.")
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(memberUid: string) {
    if (!team || !user) return

    if (memberUid === team.leaderUid && team.members.length > 1) {
      if (!confirm("You are the team leader. Removing yourself will transfer leadership to another member. Continue?")) {
        return
      }
    }

    try {
      await removeTeamMember(hackathonId, team.id, memberUid)

      // If user removed themselves, redirect to hackathon page
      if (memberUid === user.uid) {
        router.push(`/hackathons/${hackathonId}`)
      }
      // Real-time listener will automatically update the team data
      // No need to manually reload
    } catch (error: any) {
      alert(error.message || "Failed to remove member. Please try again.")
    }
  }

  async function handleLeaveTeam() {
    if (!team || !user) return

    const isLeader = team.leaderUid === user.uid
    const isLastMember = team.members.length === 1

    let confirmMessage = ""
    if (isLastMember) {
      confirmMessage = "You are the last member. Leaving will delete the team. Are you sure you want to leave?"
    } else if (isLeader) {
      confirmMessage = "You are the team leader. Leaving will transfer leadership to another member. Are you sure you want to leave?"
    } else {
      confirmMessage = "Are you sure you want to leave this team? You will need to be invited again to rejoin."
    }

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      await removeTeamMember(hackathonId, team.id, user.uid)
      router.push(`/hackathons/${hackathonId}`)
    } catch (error: any) {
      alert(error.message || "Failed to leave team. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!team || !hackathon) {
    return null
  }

  const isLeader = team.leaderUid === user?.uid
  const canAddMembers = team.members.length < hackathon.maxTeamSize
  const canRemoveMembers = team.members.length > hackathon.minTeamSize

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">{team.name}</h1>
              <p className="text-muted-foreground">Team for {hackathon.title}</p>
            </div>
            <Badge variant={team.status === "submitted" ? "default" : "secondary"}>
              {team.status}
            </Badge>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
                <Users className="h-6 w-6" />
                Team Members ({team.members.length}/{hackathon.maxTeamSize})
              </h2>

              {isLeader && canAddMembers && (
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Send an invitation to another verified GLA student.
                    </DialogDescription>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">GLA Email Address</label>
                        <Input
                          type="email"
                          placeholder="student@gla.ac.in"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the GLA email address of the person you want to invite
                        </p>
                      </div>
                      <Button
                        onClick={handleInviteMember}
                        disabled={!inviteEmail.trim() || inviting}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        {inviting ? "Inviting..." : "Send Invitation"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-3">
              {team.members.map((member) => (
                <div
                  key={member.uid}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.photoURL} alt={member.name} />
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        {member.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{member.name}</span>
                        {member.uid === team.leaderUid && (
                          <Badge variant="outline" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Leader
                          </Badge>
                        )}
                        <OnlineIndicator userId={member.uid} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{member.email}</span>
                        {member.role && (
                          <>
                            <span>•</span>
                            <span>{member.role}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Leader can remove other members */}
                    {isLeader &&
                      member.uid !== team.leaderUid &&
                      canRemoveMembers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.uid)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Remove member"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}

                    {/* Any member can leave the team themselves */}
                    {member.uid === user?.uid && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLeaveTeam}
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        title="Leave team"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Leave
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* QR Code for Check-in */}
          <TeamQRCode hackathonId={hackathonId} team={team} />

          {team.projectName && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-primary mb-4">Project Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-primary">Project Name:</span>
                  <p className="text-muted-foreground">{team.projectName}</p>
                </div>
                {team.projectDescription && (
                  <div>
                    <span className="font-medium text-primary">Description:</span>
                    <p className="text-muted-foreground">{team.projectDescription}</p>
                  </div>
                )}
                {team.repositoryURL && (
                  <div>
                    <span className="font-medium text-primary">Repository:</span>
                    <a
                      href={team.repositoryURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline block"
                    >
                      {team.repositoryURL}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          {hackathon.status === "active" && team.status !== "submitted" && (
            <div className="mt-6">
              <Link href={`/hackathons/${hackathonId}/submit`}>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Submit Project
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
