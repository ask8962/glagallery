"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { followUser, unfollowUser, isFollowing, getFollowers, getFollowing } from "@/lib/profile"
import type { UserProfile } from "@/lib/types"
import { UserPlus, Users, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"

interface FollowSystemProps {
  profile: UserProfile
  onUpdate: () => void
}

export function FollowSystem({ profile, onUpdate }: FollowSystemProps) {
  const { user } = useAuth()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (user && profile.uid !== user.uid) {
      checkFollowStatus()
    } else {
      setChecking(false)
    }
  }, [user, profile.uid])

  const checkFollowStatus = async () => {
    if (!user) return
    setChecking(true)
    const isFollowingUser = await isFollowing(user.uid, profile.uid)
    setFollowing(isFollowingUser)
    setChecking(false)
  }

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow users")
      return
    }

    setLoading(true)
    try {
      const result = following
        ? await unfollowUser(user.uid, profile.uid)
        : await followUser(user.uid, profile.uid)

      if (result.success) {
        setFollowing(!following)
        toast.success(following ? "Unfollowed successfully" : "Following now!")
        onUpdate()
      } else {
        toast.error(result.error || "Failed to update follow status")
      }
    } catch (error) {
      console.error("Error updating follow status:", error)
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.uid === profile.uid) {
    return null
  }

  if (checking) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  return (
    <Button
      variant={following ? "outline" : "default"}
      onClick={handleFollow}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {following ? "Following" : "Follow"}
    </Button>
  )
}

interface FollowersListProps {
  userId: string
  count: number
}

export function FollowersList({ userId, count }: FollowersListProps) {
  const [open, setOpen] = useState(false)
  const [followers, setFollowers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)

  const loadFollowers = async () => {
    setLoading(true)
    try {
      const followersList = await getFollowers(userId)
      setFollowers(followersList)
    } catch (error) {
      console.error("Error loading followers:", error)
      toast.error("Failed to load followers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadFollowers()
    }
  }, [open, userId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-1">
          <Users className="h-4 w-4" />
          <span className="font-semibold">{count}</span>
          <span className="text-muted-foreground">Followers</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Followers</DialogTitle>
          <DialogDescription>
            People who are following you
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No followers yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {followers.map((follower) => (
              <div
                key={follower.uid}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar>
                  <AvatarImage src={follower.photoURL} alt={follower.name} />
                  <AvatarFallback>
                    {follower.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{follower.name}</p>
                  {follower.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {follower.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface FollowingListProps {
  userId: string
  count: number
}

export function FollowingList({ userId, count }: FollowingListProps) {
  const [open, setOpen] = useState(false)
  const [following, setFollowing] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)

  const loadFollowing = async () => {
    setLoading(true)
    try {
      const followingList = await getFollowing(userId)
      setFollowing(followingList)
    } catch (error) {
      console.error("Error loading following:", error)
      toast.error("Failed to load following")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadFollowing()
    }
  }, [open, userId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-1">
          <UserPlus className="h-4 w-4" />
          <span className="font-semibold">{count}</span>
          <span className="text-muted-foreground">Following</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Following</DialogTitle>
          <DialogDescription>
            People you are following
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Not following anyone yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {following.map((user) => (
              <div
                key={user.uid}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar>
                  <AvatarImage src={user.photoURL} alt={user.name} />
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
