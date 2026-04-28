"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ConfessionCard } from "./confession-card"
import { Loader2 } from "lucide-react"
import type { Confession, ConfessionCategory } from "@/lib/types"

interface ConfessionFeedProps {
    category?: ConfessionCategory
    refreshKey?: number
}

export function ConfessionFeed({ category, refreshKey }: ConfessionFeedProps) {
    const [confessions, setConfessions] = useState<Partial<Confession>[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [cursor, setCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const observerRef = useRef<HTMLDivElement>(null)

    const fetchConfessions = useCallback(
        async (nextCursor?: string | null) => {
            try {
                const params = new URLSearchParams()
                if (category) params.set("category", category)
                if (nextCursor) params.set("cursor", nextCursor)
                params.set("limit", "15")

                const res = await fetch(`/api/confessions?${params.toString()}`)
                if (!res.ok) throw new Error("Failed to fetch")

                const data = await res.json()
                return data
            } catch (error) {
                console.error("Fetch confessions error:", error)
                return { confessions: [], nextCursor: null, hasMore: false }
            }
        },
        [category]
    )

    // Initial load + reset on category/refresh change
    useEffect(() => {
        setLoading(true)
        setConfessions([])
        setCursor(null)
        setHasMore(true)

        fetchConfessions(null).then((data) => {
            setConfessions(data.confessions)
            setCursor(data.nextCursor)
            setHasMore(data.hasMore)
            setLoading(false)
        })
    }, [category, refreshKey, fetchConfessions])

    // Infinite scroll observer
    useEffect(() => {
        if (!observerRef.current || !hasMore || loadingMore) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && cursor) {
                    setLoadingMore(true)
                    fetchConfessions(cursor).then((data) => {
                        setConfessions((prev) => [...prev, ...data.confessions])
                        setCursor(data.nextCursor)
                        setHasMore(data.hasMore)
                        setLoadingMore(false)
                    })
                }
            },
            { threshold: 0.1 }
        )

        observer.observe(observerRef.current)
        return () => observer.disconnect()
    }, [cursor, hasMore, loadingMore, fetchConfessions])

    // Update a confession in place (after vote, etc.)
    const handleUpdate = (id: string, updates: Partial<Confession>) => {
        setConfessions((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        )
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border bg-card p-6 animate-pulse"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-full bg-muted" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-32 bg-muted rounded" />
                                <div className="h-2 w-20 bg-muted rounded" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-muted rounded" />
                            <div className="h-3 w-3/4 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (confessions.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-4xl mb-4">🤫</p>
                <h3 className="text-lg font-semibold mb-2">No confessions yet</h3>
                <p className="text-sm text-muted-foreground">
                    Be the first to speak your mind! Tap the + button below.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {confessions.map((confession, index) => (
                <ConfessionCard
                    key={confession.id || index}
                    confession={confession}
                    onUpdate={handleUpdate}
                />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={observerRef} className="h-10 flex items-center justify-center">
                {loadingMore && (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
                {!hasMore && confessions.length > 0 && (
                    <p className="text-sm text-muted-foreground">You've seen it all 👀</p>
                )}
            </div>
        </div>
    )
}
