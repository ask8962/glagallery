"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, ExternalLink, BookOpen, FileText, DownloadCloud, FileType, Clock } from "lucide-react"
import type { AcademicResource } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export default function SingleResourcePage() {
    const params = useParams()
    const router = useRouter()
    const [resource, setResource] = useState<Partial<AcademicResource> | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchResource = async () => {
            try {
                const res = await fetch(`/api/resources/${params.id}`)
                if (!res.ok) throw new Error("Resource not found")
                const data = await res.json()
                setResource(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchResource()
    }, [params.id])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !resource) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
                <p className="text-destructive text-lg font-medium">{error || "Resource not found"}</p>
                <Button onClick={() => router.push("/resources")} variant="outline">
                    Back to All Resources
                </Button>
            </div>
        )
    }

    const getIcon = () => {
        switch (resource.type) {
            case "notes": return <FileText className="h-12 w-12 text-blue-500" />
            case "pyq": return <DownloadCloud className="h-12 w-12 text-red-500" />
            case "book": return <BookOpen className="h-12 w-12 text-green-500" />
            default: return <FileType className="h-12 w-12 text-orange-500" />
        }
    }

    const getTypeColor = () => {
        switch (resource.type) {
            case "notes": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "pyq": return "bg-red-500/10 text-red-500 border-red-500/20"
            case "book": return "bg-green-500/10 text-green-500 border-green-500/20"
            default: return "bg-orange-500/10 text-orange-500 border-orange-500/20"
        }
    }

    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => router.push("/resources")} className="pl-0 gap-2 hover:bg-transparent hover:underline">
                    <ArrowLeft className="h-4 w-4" />
                    Back to CampusHub
                </Button>

                <Card className="p-6 md:p-10 border shadow-lg bg-card/50 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="p-4 rounded-2xl bg-muted/50 border flex-shrink-0">
                            {getIcon()}
                        </div>
                        
                        <div className="space-y-4 flex-1">
                            <div>
                                <Badge variant="outline" className={`mb-3 ${getTypeColor()}`}>
                                    {resource.type?.toUpperCase()}
                                </Badge>
                                <h1 className="text-2xl md:text-3xl font-bold">{resource.title}</h1>
                                <p className="text-muted-foreground mt-2 flex flex-wrap gap-2 items-center text-sm md:text-base">
                                    <span className="font-medium text-foreground">{resource.subject}</span>
                                    <span>•</span>
                                    <span>{resource.department}</span>
                                    <span>•</span>
                                    <span>{resource.semester}</span>
                                </p>
                            </div>

                            {resource.description ? (
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                    <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                                        {resource.description}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No additional context provided.</p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">Shared by {resource.authorName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {resource.createdAt ? formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true }) : "recently"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <p className="text-sm text-muted-foreground text-center sm:text-left">
                            This material is securely hosted on Google Drive.
                        </p>
                        <Button size="lg" className="w-full sm:w-auto gap-2" asChild>
                            <a href={resource.driveLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-5 w-5" />
                                View Document in Drive
                            </a>
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
