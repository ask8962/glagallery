"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { doc, getDoc, collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore"
import type { Hackathon, Team } from "@/lib/types"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { UserPlus, X } from "lucide-react"
import Link from "next/link"

export default function RegisterTeamPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile } = useAuth()
  const { db } = getFirebase()
  const hackathonId = params.id as string

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [teamName, setTeamName] = useState("")
  const [memberEmails, setMemberEmails] = useState<string[]>([""])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hackathonId) {
      loadHackathon()
    }
  }, [hackathonId, user])

  async function loadHackathon() {
    setLoading(true)
    try {
      const hackathonDoc = await getDoc(doc(db, "hackathons", hackathonId))
      if (hackathonDoc.exists()) {
        setHackathon({ id: hackathonDoc.id, ...hackathonDoc.data() } as Hackathon)
      }
    } catch (error) {
      console.error("Error loading hackathon:", error)
    } finally {
      setLoading(false)
    }
  }

  function addMemberField() {
    setMemberEmails([...memberEmails, ""])
  }

  function removeMemberField(index: number) {
    setMemberEmails(memberEmails.filter((_, i) => i !== index))
  }

  function updateMemberEmail(index: number, value: string) {
    const newEmails = [...memberEmails]
    newEmails[index] = value
    setMemberEmails(newEmails)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !hackathon || !teamName.trim()) return

    setError(null)
    setSubmitting(true)

    try {
      // Validate team size
      const totalMembers = memberEmails.filter((e) => e.trim() !== "").length + 1 // +1 for leader
      if (totalMembers < hackathon.minTeamSize || totalMembers > hackathon.maxTeamSize) {
        setError(
          `Team size must be between ${hackathon.minTeamSize} and ${hackathon.maxTeamSize} members.`
        )
        setSubmitting(false)
        return
      }

      // Check if user is already in a team
      const existingTeamsQuery = query(
        collection(db, "teams"),
        where("hackathonId", "==", hackathonId),
        where("members", "array-contains-any", [{ uid: user.uid }])
      )
      const existingTeams = await getDocs(existingTeamsQuery)
      if (!existingTeams.empty) {
        setError("You are already part of a team for this hackathon.")
        setSubmitting(false)
        return
      }

      // Validate and find member users
      const memberUids: string[] = []
      const memberData: any[] = []

      for (const email of memberEmails) {
        if (email.trim()) {
          if (!email.endsWith("@gla.ac.in")) {
            setError(`All members must have GLA University email addresses (@gla.ac.in)`)
            setSubmitting(false)
            return
          }

          // Find user by email (in a real app, you'd have a users collection indexed by email)
          // For now, we'll just store the email and let them join later
          memberData.push({
            email: email.trim(),
            uid: "", // Will be filled when they join
            name: email.split("@")[0],
            joinedAt: null,
          })
        }
      }

      // Create team with leader
      const teamData = {
        hackathonId,
        name: teamName.trim(),
        leaderUid: user.uid,
        leaderName: profile?.name || user.displayName || "Team Leader",
        members: [
          {
            uid: user.uid,
            name: profile?.name || user.displayName || "Team Leader",
            email: user.email || "",
            photoURL: user.photoURL || undefined,
            role: "Team Leader",
            joinedAt: Timestamp.now(),
          },
          ...memberData,
        ],
        status: "registered" as const,
        createdAt: Timestamp.now(),
      }

      await addDoc(collection(db, "teams"), teamData)
      router.push(`/hackathons/${hackathonId}`)
    } catch (error: any) {
      console.error("Error registering team:", error)
      setError(error.message || "Failed to register team. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Hackathon not found</h2>
          <Link href="/hackathons">
            <Button>Back to Hackathons</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Sign in required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to register a team.</p>
          <Link href="/hackathons">
            <Button>Back to Hackathons</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl px-4 py-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-primary mb-2">Register Team</h1>
        <p className="text-muted-foreground">Create a team for {hackathon.title}</p>
      </motion.div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="teamName">Team Name *</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              placeholder="e.g., Code Warriors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Team Members</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMemberField}>
                <UserPlus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{profile?.name || user.displayName}</p>
                <p className="text-xs text-muted-foreground">Team Leader</p>
              </div>
              {memberEmails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateMemberEmail(index, e.target.value)}
                    placeholder="member@gla.ac.in"
                  />
                  {memberEmails.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMemberField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Team size: {memberEmails.filter((e) => e.trim() !== "").length + 1} /{" "}
              {hackathon.minTeamSize}-{hackathon.maxTeamSize} members
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {submitting ? "Registering..." : "Register Team"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </motion.main>
  )
}
