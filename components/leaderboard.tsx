"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { collection, query, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore"
import type { UserProfile } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award } from "lucide-react"
import { motion } from "framer-motion"
import { OnlineIndicator } from "./online-indicator"

interface LeaderboardEntry {
  user: UserProfile
  points: number
  rank: number
}

interface LeaderboardProps {
  timeRange?: "week" | "month" | "all"
  limitCount?: number
  showOnlineStatus?: boolean
}

export function Leaderboard({ 
  timeRange = "all", 
  limitCount = 10,
  showOnlineStatus = true 
}: LeaderboardProps) {
  const { db } = getFirebase()
  const { user, loading: authLoading } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLeaderboard([])
      setLoading(false)
      return
    }

    setLoading(true)
    
    // Real-time listener for users sorted by points
    const usersRef = collection(db, "users")
    const q = query(usersRef, orderBy("points", "desc"), limit(limitCount))
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: LeaderboardEntry[] = []
        let rank = 1
        
        snapshot.forEach((doc) => {
          const userData = doc.data() as UserProfile
          const points = userData.points || 0
          
          entries.push({
            user: { ...userData, uid: doc.id },
            points,
            rank: rank++,
          })
        })
        
        setLeaderboard(entries)
        setLoading(false)
      },
      (error) => {
        console.error("Error loading leaderboard:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [db, limitCount, user, authLoading])

  function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>
  }

  function getRankBadge(rank: number) {
    if (rank === 1) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    if (rank === 2) return "bg-gray-400/10 text-gray-600 border-gray-400/20"
    if (rank === 3) return "bg-amber-600/10 text-amber-600 border-amber-600/20"
    return "bg-muted text-muted-foreground"
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </Card>
    )
  }

  if (!authLoading && !user) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Sign in with your GLA email to view the leaderboard.
      </Card>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Leaderboard</h3>
        <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-primary">Leaderboard</h3>
        <Badge variant="outline" className="text-xs">
          {timeRange === "all" ? "All Time" : timeRange === "week" ? "This Week" : "This Month"}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.user.uid}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-center w-8">
              {getRankIcon(entry.rank)}
            </div>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.user.photoURL} alt={entry.user.name || "User"} />
              <AvatarFallback className="bg-accent text-accent-foreground">
                {entry.user.name ? entry.user.name[0] : "?"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary truncate">
                  {entry.user.name || "Anonymous User"}
                </span>
                {showOnlineStatus && (
                  <OnlineIndicator userId={entry.user.uid} size="sm" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Level {entry.user.level || 1}
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-primary">{entry.points}</div>
              <div className="text-xs text-muted-foreground">points</div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
