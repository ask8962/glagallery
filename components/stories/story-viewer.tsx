"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Story } from "@/lib/stories"
import { markStoryViewed, deleteStory, getTimeRemaining } from "@/lib/stories"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

interface StoryViewerProps {
    stories: Story[]
    initialIndex?: number
    onClose: () => void
    onStoryViewed?: (storyId: string) => void
}

const STORY_DURATION = 5000 // 5 seconds per story

export function StoryViewer({
    stories,
    initialIndex = 0,
    onClose,
    onStoryViewed,
}: StoryViewerProps) {
    const { user } = useAuth()
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [progress, setProgress] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    const currentStory = stories[currentIndex]
    const isOwner = user?.uid === currentStory?.userId

    // Mark story as viewed
    useEffect(() => {
        if (currentStory && user && !isOwner) {
            markStoryViewed(currentStory.id, user.uid)
                .then(() => onStoryViewed?.(currentStory.id))
                .catch(console.error)
        }
    }, [currentStory, user, isOwner, onStoryViewed])

    // Progress timer
    useEffect(() => {
        if (isPaused || !currentStory) return

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    // Move to next story
                    if (currentIndex < stories.length - 1) {
                        setCurrentIndex(currentIndex + 1)
                        return 0
                    } else {
                        onClose()
                        return 100
                    }
                }
                return prev + (100 / (STORY_DURATION / 100))
            })
        }, 100)

        return () => clearInterval(interval)
    }, [currentIndex, isPaused, stories.length, onClose, currentStory])

    // Reset progress when story changes
    useEffect(() => {
        setProgress(0)
    }, [currentIndex])

    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            setProgress(0)
        }
    }, [currentIndex])

    const goToNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setProgress(0)
        } else {
            onClose()
        }
    }, [currentIndex, stories.length, onClose])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
            if (e.key === "ArrowLeft") goToPrevious()
            if (e.key === "ArrowRight") goToNext()
            if (e.key === " ") setIsPaused((p) => !p)
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [goToPrevious, goToNext, onClose])

    const handleDelete = async () => {
        if (!currentStory || !isOwner) return

        try {
            await deleteStory(currentStory.id)
            toast.success("Story deleted")

            if (stories.length === 1) {
                onClose()
            } else {
                goToNext()
            }
        } catch (error) {
            toast.error("Failed to delete story")
        }
    }

    if (!currentStory) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black flex items-center justify-center"
                onClick={onClose}
            >
                {/* Story Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-md h-full max-h-[90vh] bg-black rounded-xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    {/* Progress Bars */}
                    <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
                        {stories.map((_, idx) => (
                            <div
                                key={idx}
                                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                            >
                                <div
                                    className="h-full bg-white transition-all duration-100 ease-linear"
                                    style={{
                                        width:
                                            idx < currentIndex
                                                ? "100%"
                                                : idx === currentIndex
                                                    ? `${progress}%`
                                                    : "0%",
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="absolute top-6 left-2 right-2 z-20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border-2 border-white">
                                <AvatarImage src={currentStory.userPhotoURL} />
                                <AvatarFallback>
                                    {currentStory.userName?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-white">
                                <p className="text-sm font-medium">{currentStory.userName}</p>
                                <p className="text-xs opacity-70">
                                    {getTimeRemaining(currentStory)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isOwner && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleDelete}
                                    className="text-white hover:bg-white/20"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-white hover:bg-white/20"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {currentStory.mediaType === "image" ? (
                            <img
                                src={currentStory.mediaURL}
                                alt="Story"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <video
                                src={currentStory.mediaURL}
                                autoPlay
                                muted
                                loop
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>

                    {/* Navigation Areas */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
                        onClick={goToPrevious}
                    />
                    <div
                        className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
                        onClick={goToNext}
                    />

                    {/* Navigation Buttons (visible on hover) */}
                    {currentIndex > 0 && (
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    )}
                    {currentIndex < stories.length - 1 && (
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    )}

                    {/* Caption & View Count */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        {currentStory.caption && (
                            <p className="text-white text-sm mb-2">{currentStory.caption}</p>
                        )}
                        {isOwner && (
                            <div className="flex items-center gap-1 text-white/70 text-xs">
                                <Eye className="h-4 w-4" />
                                <span>{currentStory.viewers.length} views</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
