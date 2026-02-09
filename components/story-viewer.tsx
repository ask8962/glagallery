"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Story {
  id: string
  mediaURL: string
  mediaType: "image" | "video"
  title: string
  uploaderName: string
  uploaderPhotoURL?: string
  likes: string[]
  comments: any[]
  createdAt: any
}

interface StoryViewerProps {
  stories: Story[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  onLike: (storyId: string) => void
  onComment: (storyId: string) => void
}

export function StoryViewer({ 
  stories, 
  initialIndex, 
  isOpen, 
  onClose, 
  onLike, 
  onComment 
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const currentStory = stories[currentIndex]

  // Auto-advance story
  useEffect(() => {
    if (!isOpen || !isPlaying) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory()
          return 0
        }
        return prev + 2 // 5 seconds total (100 / 2 = 50 intervals of 100ms)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, isPlaying, currentIndex])

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    }
  }

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left") {
      nextStory()
    } else {
      prevStory()
    }
  }

  if (!isOpen || !currentStory) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 z-10 flex gap-1">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{ 
                  width: index < currentIndex ? "100%" : 
                         index === currentIndex ? `${progress}%` : "0%" 
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-16 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/20">
              {currentStory.uploaderPhotoURL ? (
                <Image
                  src={currentStory.uploaderPhotoURL}
                  alt={currentStory.uploaderName}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-accent flex items-center justify-center">
                  <span className="text-accent-foreground font-medium">
                    {currentStory.uploaderName[0]}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="text-white font-medium">{currentStory.uploaderName}</div>
              <div className="text-white/70 text-sm">
                {new Date(currentStory.createdAt?.toDate?.() || currentStory.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Story Content */}
        <div className="relative h-full w-full">
          {currentStory.mediaType === "image" ? (
            <Image
              src={currentStory.mediaURL}
              alt={currentStory.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <video
              src={currentStory.mediaURL}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Swipe areas */}
          <div 
            className="absolute left-0 top-0 w-1/3 h-full cursor-pointer"
            onClick={() => handleSwipe("right")}
          />
          <div 
            className="absolute right-0 top-0 w-1/3 h-full cursor-pointer"
            onClick={() => handleSwipe("left")}
          />

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStory}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {currentIndex < stories.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={nextStory}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-8 left-4 right-4 z-10">
          <div className="mb-4">
            <h3 className="text-white text-lg font-semibold mb-1">{currentStory.title}</h3>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span>{currentStory.likes.length} likes</span>
              <span>{currentStory.comments.length} comments</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(currentStory.id)}
              className="text-white hover:bg-white/20"
            >
              <Heart className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(currentStory.id)}
              className="text-white hover:bg-white/20"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Touch indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-xs">
          Swipe to navigate
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
