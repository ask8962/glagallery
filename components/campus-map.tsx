"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MapPin, Camera, Users, ArrowLeft, Heart, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface LocationMemory {
  id: string
  title: string
  mediaURL: string
  mediaType: "image" | "video"
  uploaderName: string
  tags: string[]
  likes: string[]
  location: string
  x: number // percentage from left
  y: number // percentage from top
}

interface CampusMapProps {
  memories: LocationMemory[]
  onMemoryClick: (memory: LocationMemory) => void
  onClose: () => void
}

const campusLocations = [
  { id: "main-gate", name: "Main Gate", x: 8, y: 92, icon: "🏛️" },
  { id: "library", name: "Central Library", x: 50, y: 75, icon: "📚" },
  { id: "ab-1", name: "AB-1", x: 26, y: 35, icon: "1️⃣" },
  { id: "ab-2", name: "AB-2", x: 48, y: 30, icon: "2️⃣" },
  { id: "ab-3", name: "AB-3", x: 45, y: 25, icon: "3️⃣" },
  { id: "ab-4", name: "AB-4", x: 42, y: 32, icon: "4️⃣" },
  { id: "ab-5", name: "AB-5", x: 38, y: 28, icon: "5️⃣" },
  { id: "ab-6", name: "AB-6", x: 55, y: 42, icon: "6️⃣" },
  { id: "ab-7", name: "AB-7", x: 49, y: 52, icon: "7️⃣" },
  { id: "ab-8", name: "AB-8", x: 46, y: 54, icon: "8️⃣" },
  { id: "ab-9", name: "AB-9", x: 45, y: 47, icon: "9️⃣" },
  { id: "ab-10", name: "AB-10", x: 42, y: 40, icon: "🔟" },
  { id: "canteen", name: "Main Canteen", x: 45, y: 62, icon: "🍽️" },
  { id: "sports-complex", name: "Sports Complex", x: 77, y: 46, icon: "⚽" },
  { id: "boys-hostel", name: "Boys Hostels", x: 92, y: 45, icon: "🏠" },
  { id: "girls-hostel", name: "Girls Hostels", x: 25, y: 15, icon: "🏡" },
  { id: "dispensary", name: "Aarogyam", x: 55, y: 74, icon: "🏥" },
  { id: "admin", name: "Admin Block", x: 45, y: 35, icon: "🏢" },
]

import { useRef, MouseEvent } from "react"
import { useSpring, useMotionValue, useTransform } from "framer-motion"

export function CampusMap({ memories, onMemoryClick, onClose }: CampusMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  // 3D Tilt State
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth springs for rotation
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, -10]), { stiffness: 150, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { stiffness: 150, damping: 20 })

  // Group memories
  const memoriesByLocation = memories.reduce((acc, memory) => {
    if (!acc[memory.location]) acc[memory.location] = []
    acc[memory.location].push(memory)
    return acc
  }, {} as Record<string, LocationMemory[]>)

  const getLocationMemories = (locationId: string) => memoriesByLocation[locationId] || []
  const getTotalMemories = () => Object.values(memoriesByLocation).reduce((sum, mems) => sum + mems.length, 0)

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseXPct = (e.clientX - rect.left) / width - 0.5
    const mouseYPct = (e.clientY - rect.top) / height - 0.5
    mouseX.set(mouseXPct)
    mouseY.set(mouseYPct)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0f172a] overflow-hidden flex items-center justify-center perspective-[2000px]"
      onMouseMove={handleMouseMove}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#020617_100%)] -z-20" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 -z-10" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-full shadow-2xl flex items-center gap-4"
          >
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white">GLA 3D Campus</h1>
            </div>
            <Badge variant="secondary" className="bg-white/10 text-white border-0">
              <MapPin className="h-3 w-3 mr-1" />
              {getTotalMemories()} Memories
            </Badge>
          </motion.div>
        </div>
      </div>

      {/* 3D Map Container */}
      <motion.div
        ref={containerRef}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-[90vw] h-[80vh] max-w-[1400px] cursor-grab active:cursor-grabbing"
      >
        {/* Map Base Layer */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[8px] border-white/5 bg-[#e5e5e5]"
          style={{ transform: "translateZ(0)" }}
        >
          <Image
            src="/gla-map.png"
            alt="GLA Campus"
            fill
            className="object-cover scale-110"
            quality={100}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
        </div>

        {/* 3D Elements Layer */}
        <div className="absolute inset-0" style={{ transform: "translateZ(40px)" }}>
          {campusLocations.map((location) => {
            const hasMemories = getLocationMemories(location.id).length > 0
            const isSelected = selectedLocation === location.id

            return (
              <motion.div
                key={location.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${location.x}%`, top: `${location.y}%` }}
                onClick={() => setSelectedLocation(isSelected ? null : location.id)}
              >
                {/* Floating Pin */}
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.1 * Math.random() }}
                  className="relative"
                >
                  {/* Pin Stem */}
                  <div className={cn(
                    "w-1 h-8 mx-auto -mb-1 bg-gradient-to-b from-white/50 to-transparent",
                    isSelected ? "h-12 bg-primary/80" : ""
                  )} />

                  {/* Pin Head */}
                  <div className={cn(
                    "relative flex items-center justify-center transition-all duration-500 shadow-2xl backdrop-blur-md border border-white/20",
                    isSelected
                      ? "w-16 h-16 rounded-2xl bg-primary text-primary-foreground scale-110 rotate-[360deg]"
                      : hasMemories
                        ? "w-12 h-12 rounded-full bg-white/90 text-primary hover:scale-110 hover:bg-white"
                        : "w-8 h-8 rounded-full bg-black/60 text-white/50 hover:bg-black/80 hover:text-white"
                  )}>
                    {hasMemories && !isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white" />
                    )}
                    <span className={cn("text-xl select-none", isSelected && "text-3xl")}>
                      {location.icon}
                    </span>
                  </div>

                  {/* Label (Floating above) */}
                  <div className={cn(
                    "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 rounded-full bg-black/80 text-white text-xs font-medium whitespace-nowrap opacity-0 transform translate-y-2 transition-all duration-300",
                    (isSelected || hasMemories) && "opacity-100 translate-y-0"
                  )}>
                    {location.name}
                  </div>
                </motion.div>

                {/* Base Shadow */}
                <div className="w-8 h-2 bg-black/40 blur-sm rounded-full mx-auto mt-8 transform scale-x-150 opacity-50 group-hover:opacity-80 transition-opacity" />
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Selected Location Overlay */}
      <AnimatePresence>
        {selectedLocation && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="pointer-events-auto bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="relative h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 p-6 flex flex-col justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 rounded-full hover:bg-white/10 text-white"
                  onClick={() => setSelectedLocation(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl border border-white/20">
                    {campusLocations.find(l => l.id === selectedLocation)?.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {campusLocations.find(l => l.id === selectedLocation)?.name}
                    </h2>
                    <p className="text-white/60 text-sm">
                      {getLocationMemories(selectedLocation).length} memories here
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {getLocationMemories(selectedLocation).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {getLocationMemories(selectedLocation).map((memory, i) => (
                      <motion.div
                        key={memory.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                        onClick={() => onMemoryClick(memory)}
                      >
                        {memory.mediaType === "image" ? (
                          <Image
                            src={memory.mediaURL}
                            alt={memory.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <video src={memory.mediaURL} className="h-full w-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <p className="text-white text-xs font-medium line-clamp-1">{memory.title}</p>
                          <div className="flex items-center gap-1 text-[10px] text-white/70 mt-1">
                            <Heart className="h-3 w-3 fill-red-500 text-red-500" /> {memory.likes.length}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Camera className="h-12 w-12 mx-auto text-white/20 mb-3" />
                    <p className="text-white/50">No memories yet. Be the first!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
