"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase"
import type { Activity } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import {
  Upload,
  Heart,
  MessageCircle,
  Award,
  TrendingUp,
  UserPlus,
  Users,
  Loader2,
} from "lucide-react"

interface ActivityFeedProps {
  userId: string
}

const activityIcons: Record<string, React.ReactNode> = {
  post_uploaded: <Upload className="h-4 w-4" />,
  post_liked: <Heart className="h-4 w-4" />,
  post_commented: <MessageCircle className="h-4 w-4" />,
  comment_received: <MessageCircle className="h-4 w-4" />,
  like_received: <Heart className="h-4 w-4" />,
  badge_unlocked: <Award className="h-4 w-4" />,
  level_up: <TrendingUp className="h-4 w-4" />,
  followed: <UserPlus className="h-4 w-4" />,
  followed_by: <Users className="h-4 w-4" />,
}

export function ActivityFeed({ userId }: ActivityFeedProps) {
  const { db } = getFirebase()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const activitiesRef = collection(db, "activities")
    const q = query(
      activitiesRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activitiesList: Activity[] = []
        snapshot.forEach((doc) => {
          activitiesList.push({
            id: doc.id,
            ...(doc.data() as Omit<Activity, "id">),
          })
        })
        setActivities(activitiesList)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching activities:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [db, userId])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>No activity yet</p>
          <p className="text-sm mt-2">Your activities will appear here</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {activities.map((activity) => {
            let createdAt: Date
            if (activity.createdAt?.toDate) {
              createdAt = activity.createdAt.toDate()
            } else if (activity.createdAt?.seconds) {
              createdAt = new Date(activity.createdAt.seconds * 1000)
            } else if (activity.createdAt) {
              createdAt = new Date(activity.createdAt)
            } else {
              createdAt = new Date()
            }

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    {activityIcons[activity.type] || <Upload className="h-4 w-4" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
