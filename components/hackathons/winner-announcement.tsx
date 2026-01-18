"use client"

import { useEffect, useState } from "react"
import { getFirebase } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, Download, PartyPopper } from "lucide-react"
import { motion } from "framer-motion"
import type { HackathonJudging } from "@/lib/types"
import { generateCertificateHTML, type CertificateData } from "@/lib/certificates"
import confetti from "canvas-confetti"

interface WinnerData {
  teamId: string
  teamName: string
  projectName?: string
  members: Array<{ uid: string; name: string; photoURL?: string }>
  score: number
  rank: number
}

interface WinnerAnnouncementProps {
  hackathonId: string
  hackathonTitle: string
  showCertificates?: boolean
  onClose?: () => void
}

export function WinnerAnnouncement({
  hackathonId,
  hackathonTitle,
  showCertificates = true,
  onClose,
}: WinnerAnnouncementProps) {
  const { db } = getFirebase()
  const [winners, setWinners] = useState<WinnerData[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    loadWinners()
  }, [hackathonId])

  useEffect(() => {
    if (winners.length > 0 && !showConfetti) {
      setShowConfetti(true)
      triggerConfetti()
    }
  }, [winners])

  function triggerConfetti() {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#efb810", "#0b1b36", "#ffffff"],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#efb810", "#0b1b36", "#ffffff"],
      })
    }, 250)
  }

  async function loadWinners() {
    setLoading(true)
    try {
      // Get top 3 judging results
      const judgingRef = collection(db, "hackathons", hackathonId, "judging")
      const q = query(judgingRef, orderBy("averageScore", "desc"), limit(3))
      const snapshot = await getDocs(q)

      const winnerData: WinnerData[] = []
      let rank = 1

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as HackathonJudging

        // Get team details
        const { getTeamById } = await import("@/lib/hackathons")
        const team = await getTeamById(hackathonId, data.teamId)

        if (team) {
          winnerData.push({
            teamId: team.id,
            teamName: team.name,
            projectName: team.projectName,
            members: team.members,
            score: data.averageScore || 0,
            rank: rank++,
          })
        }
      }

      setWinners(winnerData)
    } catch (error) {
      console.error("Error loading winners:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleDownloadCertificate(winner: WinnerData, memberIndex: number) {
    const member = winner.members[memberIndex]
    const position = winner.rank === 1 ? "winner" : winner.rank === 2 ? "runner-up" : "third"

    const certData: CertificateData = {
      recipientName: member.name,
      recipientEmail: "",
      recipientUid: member.uid,
      hackathonId,
      hackathonTitle,
      teamName: winner.teamName,
      teamId: winner.teamId,
      position,
      issueDate: new Date(),
      verified: true,
      id: `${hackathonId}_${winner.teamId}_${member.uid}`,
    }

    const html = generateCertificateHTML(certData)
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `certificate_${member.name.replace(/\s+/g, "_")}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-8 w-8 text-yellow-500" />
    if (rank === 2) return <Medal className="h-8 w-8 text-gray-400" />
    return <Medal className="h-8 w-8 text-amber-600" />
  }

  const getRankLabel = (rank: number) => {
    if (rank === 1) return "1st Place - Winner"
    if (rank === 2) return "2nd Place - Runner-up"
    return "3rd Place"
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-yellow-600"
    if (rank === 2) return "from-gray-300 to-gray-500"
    return "from-amber-400 to-amber-600"
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mx-auto mb-4" />
          <div className="h-4 w-64 bg-muted rounded mx-auto" />
        </div>
      </Card>
    )
  }

  if (winners.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">Winners have not been announced yet.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <PartyPopper className="h-8 w-8 text-accent" />
          <h2 className="text-3xl font-bold text-primary">Congratulations!</h2>
          <PartyPopper className="h-8 w-8 text-accent transform scale-x-[-1]" />
        </div>
        <p className="text-muted-foreground text-lg">Winners of {hackathonTitle}</p>
      </motion.div>

      {/* Winner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reorder to show 2nd, 1st, 3rd in desktop */}
        {[winners[1], winners[0], winners[2]].filter(Boolean).map((winner, displayIndex) => (
          <motion.div
            key={winner.teamId}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: displayIndex * 0.2 }}
            className={`${winner.rank === 1 ? "md:-mt-8 md:scale-110 z-10" : ""}`}
          >
            <Card className="overflow-hidden">
              {/* Rank Banner */}
              <div className={`bg-gradient-to-r ${getRankColor(winner.rank)} p-4 text-center`}>
                <div className="flex items-center justify-center gap-2 text-white">
                  {getRankIcon(winner.rank)}
                  <span className="font-bold text-lg">{getRankLabel(winner.rank)}</span>
                </div>
              </div>

              {/* Team Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-primary text-center mb-2">{winner.teamName}</h3>
                {winner.projectName && (
                  <p className="text-sm text-muted-foreground text-center mb-4">Project: {winner.projectName}</p>
                )}

                <Badge variant="secondary" className="w-full justify-center mb-4">
                  Score: {winner.score.toFixed(2)} points
                </Badge>

                {/* Team Members */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Team Members</h4>
                  {winner.members.map((member, idx) => (
                    <div key={member.uid} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.photoURL || "/placeholder.svg"} />
                          <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{member.name}</span>
                      </div>
                      {showCertificates && (
                        <Button size="sm" variant="ghost" onClick={() => handleDownloadCertificate(winner, idx)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="text-center">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  )
}
