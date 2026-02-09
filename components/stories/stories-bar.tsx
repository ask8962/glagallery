"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { StoryCircle } from "./story-circle"
import { StoryViewer } from "./story-viewer"
import { CreateStory } from "./create-story"
import { getActiveStories, hasViewedStory } from "@/lib/stories"
import type { Story } from "@/lib/stories"
import { useAuth } from "@/context/auth-context"
import { Skeleton } from "@/components/ui/skeleton"

export function StoriesBar() {
    const { user, profile } = useAuth()
    const [storiesByUser, setStoriesByUser] = useState<Map<string, Story[]>>(new Map())
    const [loading, setLoading] = useState(true)
    const [viewingStories, setViewingStories] = useState<Story[] | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [viewedStories, setViewedStories] = useState<Set<string>>(new Set())

    // Fetch stories
    const fetchStories = async () => {
        try {
            const stories = await getActiveStories()
            setStoriesByUser(stories)
        } catch (error) {
            console.error("Failed to fetch stories:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchStories()
            // Refresh every 30 seconds
            const interval = setInterval(fetchStories, 30000)
            return () => clearInterval(interval)
        }
    }, [user])

    // Check if user has viewed all stories from a user
    const hasUnviewedStories = (stories: Story[]): boolean => {
        if (!user) return true
        return stories.some((story) => !hasViewedStory(story, user.uid))
    }

    // Get own stories
    const ownStories = user ? storiesByUser.get(user.uid) || [] : []
    const hasOwnStory = ownStories.length > 0

    // Get other users' stories (sorted by unviewed first)
    const otherUsers = Array.from(storiesByUser.entries())
        .filter(([userId]) => userId !== user?.uid)
        .sort((a, b) => {
            const aUnviewed = hasUnviewedStories(a[1])
            const bUnviewed = hasUnviewedStories(b[1])
            if (aUnviewed && !bUnviewed) return -1
            if (!aUnviewed && bUnviewed) return 1
            return 0
        })

    const handleStoryViewed = (storyId: string) => {
        setViewedStories((prev) => new Set([...prev, storyId]))
    }

    if (!user) return null

    return (
        <>
            <div className="w-full bg-background/80 backdrop-blur-sm border-b py-4 mb-4">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-1">
                        {loading ? (
                            // Loading skeletons
                            <>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <Skeleton className="h-16 w-16 rounded-full" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                {/* Your Story / Add Story */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0 }}
                                >
                                    <StoryCircle
                                        userId={user.uid}
                                        userName={profile?.name || "You"}
                                        userPhotoURL={profile?.photoURL}
                                        hasUnviewed={hasOwnStory}
                                        isOwn={true}
                                        onClick={() => {
                                            if (hasOwnStory) {
                                                setViewingStories(ownStories)
                                            } else {
                                                setShowCreate(true)
                                            }
                                        }}
                                    />
                                </motion.div>

                                {/* Other users' stories */}
                                {otherUsers.map(([userId, stories], index) => {
                                    const firstStory = stories[0]
                                    const hasUnviewed = hasUnviewedStories(stories)

                                    return (
                                        <motion.div
                                            key={userId}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: (index + 1) * 0.05 }}
                                        >
                                            <StoryCircle
                                                userId={userId}
                                                userName={firstStory.userName}
                                                userPhotoURL={firstStory.userPhotoURL}
                                                hasUnviewed={hasUnviewed}
                                                onClick={() => setViewingStories(stories)}
                                            />
                                        </motion.div>
                                    )
                                })}

                                {/* Add more story button if user already has stories */}
                                {hasOwnStory && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => setShowCreate(true)}
                                        className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                                            <span className="text-2xl text-muted-foreground">+</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Add</span>
                                    </motion.button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Story Viewer */}
            {viewingStories && (
                <StoryViewer
                    stories={viewingStories}
                    onClose={() => setViewingStories(null)}
                    onStoryViewed={handleStoryViewed}
                />
            )}

            {/* Create Story Modal */}
            <CreateStory
                open={showCreate}
                onOpenChange={setShowCreate}
                onStoryCreated={fetchStories}
            />
        </>
    )
}
