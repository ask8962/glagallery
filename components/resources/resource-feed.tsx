"use client"

import { useEffect, useState, useCallback } from "react"
import { ResourceCard } from "./resource-card"
import { Button } from "@/components/ui/button"
import { Loader2, FolderOpen } from "lucide-react"
import type { AcademicResource, ResourceType } from "@/lib/types"

interface ResourceFeedProps {
    type?: ResourceType | "all"
    department?: string
    semester?: string
    refreshKey: number
}

export function ResourceFeed({ type = "all", department = "all", semester = "all", refreshKey }: ResourceFeedProps) {
    const [resources, setResources] = useState<Partial<AcademicResource>[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [nextCursor, setNextCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchResources = useCallback(
        async (isInitial = true) => {
            try {
                if (isInitial) {
                    setLoading(true)
                } else {
                    setLoadingMore(true)
                }
                setError(null)

                const queryParams = new URLSearchParams()
                if (type && type !== "all") queryParams.append("type", type)
                if (department && department !== "all") queryParams.append("department", department)
                if (semester && semester !== "all") queryParams.append("semester", semester)
                if (!isInitial && nextCursor) queryParams.append("cursor", nextCursor)
                
                queryParams.append("limit", "15")

                const response = await fetch(`/api/resources?${queryParams.toString()}`)
                if (!response.ok) throw new Error("Failed to fetch resources")

                const data = await response.json()

                setResources((prev) => (isInitial ? data.resources : [...prev, ...data.resources]))
                setNextCursor(data.nextCursor)
                setHasMore(data.hasMore)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
                setLoadingMore(false)
            }
        },
        [type, department, semester, nextCursor]
    )

    useEffect(() => {
        fetchResources(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, department, semester, refreshKey])

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12 text-destructive">
                <p>Error: {error}</p>
                <Button variant="outline" onClick={() => fetchResources(true)} className="mt-4">
                    Try Again
                </Button>
            </div>
        )
    }

    if (resources.length === 0) {
        return (
            <div className="text-center py-20 px-4 border rounded-xl bg-muted/10 border-dashed">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-500/10 rounded-full">
                        <FolderOpen className="h-10 w-10 text-blue-500" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold">No materials found</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                    Be the first to share notes or PYQs for this section and help your classmates out!
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => fetchResources(false)}
                        disabled={loadingMore}
                        className="w-full sm:w-auto"
                    >
                        {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load More
                    </Button>
                </div>
            )}
        </div>
    )
}
