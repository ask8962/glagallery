"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import type { UserProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { GLASignInGuard } from "@/components/gla-signin-guard"
import { LevelBadge } from "@/components/gamification/level-badge"
import { BadgesShowcase } from "@/components/gamification/badges-showcase"
import { Flame, Instagram, Twitter, Linkedin, Github, Globe, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileCustomization } from "@/components/profile/profile-customization"
import { AvatarEditor } from "@/components/profile/avatar-editor"
import { FacultyRegistrationForm } from "@/components/faculty/faculty-registration-form"
import { PrivacySettings } from "@/components/profile/privacy-settings"
import { ActivityFeed } from "@/components/profile/activity-feed"
import { FollowersList, FollowingList, FollowSystem } from "@/components/profile/follow-system"
import { TwoFactorSettings } from "@/components/profile/two-factor-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { ProfileHeaderSkeleton, StatsSkeleton } from "@/components/skeletons/profile-skeleton"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function ProfilePage() {
  const { user, profile, loading, signIn } = useAuth()
  const { db } = getFirebase()
  const searchParams = useSearchParams()

  // Check if viewing another user's profile
  const viewingUserId = searchParams.get("user")
  const isOwnProfile = !viewingUserId || viewingUserId === user?.uid

  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Load the profile (own or other user's)
  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true)
      try {
        const targetUserId = viewingUserId || user?.uid
        if (!targetUserId) {
          setLoadingProfile(false)
          return
        }

        const userDoc = await getDoc(doc(db, "users", targetUserId))
        if (userDoc.exists()) {
          setCurrentProfile(userDoc.data() as UserProfile)
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoadingProfile(false)
      }
    }

    if (user || viewingUserId) {
      loadProfile()
    } else {
      setLoadingProfile(false)
    }
  }, [db, user, viewingUserId])

  const handleProfileUpdate = async () => {
    if (!user) return
    const userDoc = await getDoc(doc(db, "users", user.uid))
    if (userDoc.exists()) {
      setCurrentProfile(userDoc.data() as UserProfile)
    }
  }

  // Only require sign-in for viewing own profile
  if (!loading && !user && isOwnProfile) {
    return (
      <GLASignInGuard
        onSignIn={signIn}
        title="Your Profile"
        description="View and manage your profile. Sign in with your GLA University email to access your profile."
      />
    )
  }

  // Check if profile exists
  if (!loadingProfile && !currentProfile && viewingUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-primary mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-4">This user profile doesn't exist.</p>
          <Link href="/search">
            <Button>Back to Search</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const followersCount = (currentProfile?.followers || []).length
  const followingCount = (currentProfile?.following || []).length

  if (loading || loadingProfile || !currentProfile) {
    return (
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl px-4 py-8">
        <ProfileHeaderSkeleton />
        <div className="my-8">
          <StatsSkeleton />
        </div>
      </motion.main>
    )
  }

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl px-4 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <Card className="p-6">
          {/* Back button when viewing other users */}
          {!isOwnProfile && (
            <div className="mb-4">
              <Link href="/search">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Search
                </Button>
              </Link>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {isOwnProfile ? (
                <AvatarEditor 
                  currentAvatarUrl={currentProfile.photoURL} 
                  userName={currentProfile.name} 
                  onUpdate={handleProfileUpdate} 
                />
              ) : (
                <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                  <AvatarImage src={currentProfile.photoURL || ""} alt={currentProfile.name} />
                  <AvatarFallback className="text-2xl">{currentProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-primary">{currentProfile.name}</h1>
                    {currentProfile.role === "faculty" && (
                      <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-lg whitespace-nowrap">
                        Faculty Member
                      </span>
                    )}
                  </div>
                  {currentProfile.bio && <p className="text-muted-foreground mb-4 max-w-2xl">{currentProfile.bio}</p>}
                </div>
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <>
                      {currentProfile.role !== "faculty" && <FacultyRegistrationForm />}
                      <ProfileCustomization profile={currentProfile} onUpdate={handleProfileUpdate} />
                      <PrivacySettings profile={currentProfile} onUpdate={handleProfileUpdate} />
                    </>
                  ) : (
                    <FollowSystem profile={currentProfile} onUpdate={handleProfileUpdate} />
                  )}
                </div>
              </div>

              {/* Social Links */}
              {currentProfile.role === "faculty" && currentProfile.facultyProfile && (
                <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">Department</span>
                    <span className="text-sm font-medium">{currentProfile.facultyProfile.department}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">Designation</span>
                    <span className="text-sm font-medium">{currentProfile.facultyProfile.designation}</span>
                  </div>
                  {currentProfile.facultyProfile.cabinNumber && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Cabin / Room</span>
                      <span className="text-sm font-medium">{currentProfile.facultyProfile.cabinNumber}</span>
                    </div>
                  )}
                  {currentProfile.facultyProfile.officeHours && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Office Hours</span>
                      <span className="text-sm font-medium">{currentProfile.facultyProfile.officeHours}</span>
                    </div>
                  )}
                </div>
              )}

              {currentProfile.socialLinks && Object.keys(currentProfile.socialLinks).length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {currentProfile.socialLinks.instagram && (
                    <a
                      href={currentProfile.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {currentProfile.socialLinks.twitter && (
                    <a
                      href={currentProfile.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                      <span>Twitter</span>
                    </a>
                  )}
                  {currentProfile.socialLinks.linkedin && (
                    <a
                      href={currentProfile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {currentProfile.socialLinks.github && (
                    <a
                      href={currentProfile.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {currentProfile.socialLinks.website && (
                    <a
                      href={currentProfile.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Website</span>
                    </a>
                  )}
                </div>
              )}

              {/* Follow Stats */}
              <div className="flex gap-4">
                <FollowersList userId={currentProfile.uid} count={followersCount} />
                <FollowingList userId={currentProfile.uid} count={followingCount} />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Gamification Stats - Only show for own profile */}
      {isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-6 shadow-sm border border-accent/20 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <LevelBadge points={currentProfile?.points || 0} showProgress={true} />

              {/* Streak */}
              {currentProfile?.streak && currentProfile.streak > 0 && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 flex items-center gap-2 bg-background/50 rounded-lg px-4 py-2"
                >
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-semibold text-foreground">{currentProfile.streak} Day Streak!</span>
                </motion.div>
              )}
            </div>

            <BadgesShowcase unlockedBadges={currentProfile?.badges || []} />
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-12"
      >
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 text-center">
          <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div className="text-2xl font-bold text-primary mb-1">{followersCount}</div>
          <div className="text-sm text-muted-foreground">Followers</div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 text-center">
          <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div className="text-2xl font-bold text-primary mb-1">{followingCount}</div>
          <div className="text-sm text-muted-foreground">Following</div>
        </div>
      </motion.div>

      {/* Tabs for Activity and Security */}
      {isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList>
              <TabsTrigger value="activity">Activity Feed</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <ActivityFeed userId={currentProfile.uid} />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <TwoFactorSettings profile={currentProfile} onUpdate={handleProfileUpdate} />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.main>
  )
}
