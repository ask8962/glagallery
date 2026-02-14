"use client"

import { useEffect, useState } from "react"
import { getFirebase } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"
import { motion } from "framer-motion"
import type { HackathonJudging } from "@/lib/types"

interface LeaderboardEntry {
  teamId: string
  teamName: string
  score: number
  rank: number
  submissionId?: string
}

interface LiveLeaderboardProps {
  hackathonId: string
  showTop?: number
}

export function LiveLeaderboard({ hackathonId, showTop = 10 }: LiveLeaderboardProps) {
  const { db } = getFirebase()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hackathonId) return

    // Listen to judging results for this hackathon
    const judgingRef = collection(db, "hackathons", hackathonId, "judging")
    const q = query(
      judgingRef,
      orderBy("averageScore", "desc"),
      limit(showTop)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: LeaderboardEntry[] = []
        let rankIndex = 0
        snapshot.forEach((doc) => {
          const data = doc.data() as HackathonJudging
          rankIndex++
          entries.push({
            teamId: data.teamId,
            teamName: data.teamId, // Will be enriched with team name
            score: data.averageScore || 0,
            rank: rankIndex,
            submissionId: data.submissionId,
          })
        })

        // Enrich with team names
        Promise.all(
          entries.map(async (entry) => {
            try {
              const { getTeamById } = await import("@/lib/hackathons")
              const team = await getTeamById(hackathonId, entry.teamId)
              if (team) {
                entry.teamName = team.name
              }
            } catch {
              // Ignore errors
            }
            return entry
          })
        ).then((enriched) => {
          setLeaderboard(enriched)
          setLoading(false)
        })
      },
      (error) => {
        console.error("Error loading leaderboard:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [hackathonId, db, showTop])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading leaderboard...</div>
      </Card>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No submissions yet. Be the first to submit!
        </div>
      </Card>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
    return <Award className="h-5 w-5 text-muted-foreground" />
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
    if (rank === 2) return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    if (rank === 3) return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
    return "bg-muted text-muted-foreground"
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-accent" />
        <h3 className="text-lg font-semibold text-primary">Live Leaderboard</h3>
        <Badge variant="secondary" className="ml-auto">
          Top {showTop}
        </Badge>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.teamId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-4 p-4 rounded-lg border ${entry.rank <= 3 ? "bg-accent/5 border-accent/20" : "bg-muted/30"
              }`}
          >
            <div className="flex items-center gap-3 flex-shrink-0">
              {getRankIcon(entry.rank)}
              <Badge className={getRankBadge(entry.rank)}>#{entry.rank}</Badge>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-primary truncate">{entry.teamName}</div>
              <div className="text-sm text-muted-foreground">Score: {entry.score.toFixed(2)}</div>
            </div>

            {entry.rank <= 3 && (
              <Badge variant="outline" className="flex-shrink-0">
                {entry.rank === 1 ? "🥇 Winner" : entry.rank === 2 ? "🥈 Runner-up" : "🥉 Third"}
              </Badge>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
