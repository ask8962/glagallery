"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { doc, updateDoc, collection, getDocs, query, where, limit } from "firebase/firestore"
import { Check, ChevronRight, Bell, Sparkles, Users, BookOpen } from "lucide-react"

const INTEREST_CATEGORIES = [
    { id: "technology", label: "Technology", icon: "💻", color: "from-blue-500 to-cyan-500" },
    { id: "coding", label: "Coding & Dev", icon: "🧑‍💻", color: "from-emerald-500 to-green-500" },
    { id: "hackathons", label: "Hackathons", icon: "🏆", color: "from-yellow-500 to-orange-500" },
    { id: "ai_ml", label: "AI / ML", icon: "🤖", color: "from-purple-500 to-violet-500" },
    { id: "sports", label: "Sports", icon: "⚽", color: "from-red-500 to-rose-500" },
    { id: "arts", label: "Arts & Design", icon: "🎨", color: "from-pink-500 to-fuchsia-500" },
    { id: "music", label: "Music", icon: "🎵", color: "from-indigo-500 to-blue-500" },
    { id: "photography", label: "Photography", icon: "📸", color: "from-amber-500 to-yellow-500" },
    { id: "business", label: "Business", icon: "📊", color: "from-teal-500 to-emerald-500" },
    { id: "social", label: "Social Impact", icon: "🌍", color: "from-lime-500 to-green-500" },
    { id: "gaming", label: "Gaming", icon: "🎮", color: "from-violet-500 to-purple-500" },
    { id: "fitness", label: "Fitness", icon: "💪", color: "from-orange-500 to-red-500" },
]

const STEPS = [
    { title: "Pick Your Interests", subtitle: "We'll personalize your experience", icon: Sparkles },
    { title: "Discover Clubs", subtitle: "Join communities that match your vibe", icon: Users },
    { title: "Stay Updated", subtitle: "Never miss what matters", icon: Bell },
]

export function OnboardingFlow() {
    const { user, profile } = useAuth()
    const [step, setStep] = useState(0)
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [notifPref, setNotifPref] = useState({ events: true, clubs: true, achievements: true })
    const [isVisible, setIsVisible] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Only show for authenticated users who haven't completed onboarding
    const [suggestedClubs, setSuggestedClubs] = useState<any[]>([])
    const [isLoadingClubs, setIsLoadingClubs] = useState(false)

    // Fetch real clubs when hitting step 1
    useEffect(() => {
        if (step === 1 && suggestedClubs.length === 0) {
            const fetchClubs = async () => {
                setIsLoadingClubs(true)
                try {
                    const { db } = getFirebase()
                    const q = query(
                        collection(db, "clubs"),
                        where("status", "==", "approved"),
                        limit(4)
                    )
                    const snapshot = await getDocs(q)
                    const clubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    setSuggestedClubs(clubs)
                } catch (error) {
                    console.error("Failed to load clubs", error)
                } finally {
                    setIsLoadingClubs(false)
                }
            }
            fetchClubs()
        }
    }, [step, suggestedClubs.length])

    if (!user || !profile || profile.onboardingComplete || !isVisible) {
        return null
    }

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleComplete = async () => {
        if (!user) return
        setIsSaving(true)

        try {
            const { db } = getFirebase()
            const userRef = doc(db, "users", user.uid)
            await updateDoc(userRef, {
                interests: selectedInterests,
                onboardingComplete: true,
                notificationPreferences: {
                    events: notifPref.events,
                    clubs: notifPref.clubs,
                    achievements: notifPref.achievements,
                    email: true,
                    push: true,
                },
            })
            setIsVisible(false)
        } catch (error) {
            console.error("Error saving onboarding:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSkip = async () => {
        if (!user) return
        try {
            const { db } = getFirebase()
            const userRef = doc(db, "users", user.uid)
            await updateDoc(userRef, { onboardingComplete: true })
        } catch { }
        setIsVisible(false)
    }

    const canProceed = step === 0 ? selectedInterests.length >= 1 : true

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[90] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200/20 dark:border-gray-700/30"
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Progress bar */}
                        <div className="flex gap-1.5 px-6 pt-6">
                            {STEPS.map((_, i) => (
                                <div key={i} className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                        initial={false}
                                        animate={{ width: i <= step ? "100%" : "0%" }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Header */}
                        <div className="px-6 pt-5 pb-2">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        {(() => {
                                            const Icon = STEPS[step].icon
                                            return <Icon className="w-5 h-5 text-blue-500" />
                                        })()}
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {STEPS[step].title}
                                        </h2>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">
                                        {STEPS[step].subtitle}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4 min-h-[300px]">
                            <AnimatePresence mode="wait">
                                {step === 0 && (
                                    <motion.div
                                        key="interests"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        className="grid grid-cols-3 gap-2.5"
                                    >
                                        {INTEREST_CATEGORIES.map((cat, i) => {
                                            const isSelected = selectedInterests.includes(cat.id)
                                            return (
                                                <motion.button
                                                    key={cat.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    onClick={() => toggleInterest(cat.id)}
                                                    className={`
                            relative flex flex-col items-center gap-1.5 p-3 rounded-xl
                            border-2 transition-all duration-200 text-center
                            ${isSelected
                                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md shadow-blue-500/10"
                                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
                                                        }
                          `}
                                                >
                                                    <span className="text-2xl">{cat.icon}</span>
                                                    <span className={`text-xs font-medium ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>
                                                        {cat.label}
                                                    </span>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                                                        >
                                                            <Check className="w-3 h-3 text-white" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            )
                                        })}
                                    </motion.div>
                                )}

                                {step === 1 && (
                                    <motion.div
                                        key="clubs"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        className="space-y-3"
                                    >
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            Based on your interests, you might like these:
                                        </p>
                                        {isLoadingClubs ? (
                                            <div className="flex justify-center py-8">
                                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : suggestedClubs.length > 0 ? (
                                            suggestedClubs.map((club, i) => (
                                                <motion.div
                                                    key={club.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                                                >
                                                    {club.imageUrl ? (
                                                        <img src={club.imageUrl} alt={club.name} className="w-10 h-10 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex flex-shrink-0 items-center justify-center text-blue-500 text-lg">
                                                            {club.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{club.name}</h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{club.description || "Join this club"}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {club.members?.length || 0}
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-sm text-gray-500">
                                                No clubs match your interests yet.
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-2">
                                            You can explore and join clubs anytime from the Clubs page
                                        </p>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="notifications"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        className="space-y-4"
                                    >
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            Choose what you&apos;d like to hear about:
                                        </p>
                                        {[
                                            { key: "events" as const, label: "Events & Hackathons", desc: "New events, deadlines, and updates", icon: "📅" },
                                            { key: "clubs" as const, label: "Club Activity", desc: "Announcements from your clubs", icon: "👥" },
                                            { key: "achievements" as const, label: "Achievements", desc: "Level ups, badges, and streaks", icon: "🏆" },
                                        ].map((item, i) => (
                                            <motion.div
                                                key={item.key}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                            >
                                                <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                                    <span className="text-2xl">{item.icon}</span>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{item.label}</h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={notifPref[item.key]}
                                                            onChange={() => setNotifPref(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                                            className="sr-only"
                                                        />
                                                        <div
                                                            className={`w-11 h-6 rounded-full transition-colors ${notifPref[item.key]
                                                                ? "bg-blue-500"
                                                                : "bg-gray-300 dark:bg-gray-600"
                                                                }`}
                                                        >
                                                            <motion.div
                                                                className="w-5 h-5 bg-white rounded-full shadow-sm mt-0.5"
                                                                animate={{ x: notifPref[item.key] ? 22 : 2 }}
                                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                            />
                                                        </div>
                                                    </div>
                                                </label>
                                            </motion.div>
                                        ))}

                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30"
                                        >
                                            <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                                You can change these anytime in your profile settings
                                            </p>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 flex items-center justify-between">
                            <button
                                onClick={handleSkip}
                                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                Skip for now
                            </button>

                            <div className="flex gap-2">
                                {step > 0 && (
                                    <button
                                        onClick={() => setStep(s => s - 1)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Back
                                    </button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (step < STEPS.length - 1) {
                                            setStep(s => s + 1)
                                        } else {
                                            handleComplete()
                                        }
                                    }}
                                    disabled={!canProceed || isSaving}
                                    className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                    transition-all duration-200
                    ${canProceed
                                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                        }
                  `}
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : step === STEPS.length - 1 ? (
                                        <>
                                            Get Started
                                            <Sparkles className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
