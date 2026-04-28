"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, ShieldAlert, Trash2, CheckCircle2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { Confession } from "@/lib/types"

export function ConfessionModeration() {
    const { user } = useAuth()
    const [confessions, setConfessions] = useState<Confession[]>([])
    const [loading, setLoading] = useState(true)
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

    const fetchConfessions = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/admin/confessions?limit=50")
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            setConfessions(data.confessions)
        } catch (error: any) {
            toast.error(error.message || "Failed to load confessions")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConfessions()
    }, [])

    const handleAction = async (id: string, action: "approve" | "hide" | "remove") => {
        try {
            const res = await fetch("/api/admin/confessions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    confessionId: id,
                    action,
                    adminEmail: user?.email,
                }),
            })
            
            if (!res.ok) throw new Error("Action failed")
            
            toast.success(`Post marked as ${action}`)
            fetchConfessions() // Refresh to get updated status
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const revealIdentity = async (id: string) => {
        try {
            const res = await fetch("/api/admin/confessions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    confessionId: id,
                    action: "reveal_identity",
                    adminEmail: user?.email,
                }),
            })
            
            if (!res.ok) throw new Error("Failed to reveal identity")
            
            setRevealedIds(prev => new Set(prev).add(id))
            toast.warning("Identity revealed. Audit log updated.")
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card className="border-red-500/20">
            <CardHeader className="bg-red-500/5 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-red-600">
                    <ShieldAlert className="h-5 w-5" />
                    Confessions Moderation
                </CardTitle>
                <CardDescription>
                    Super Admin access. Revealing identities is logged for security audits.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                    {confessions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No posts found.
                        </div>
                    ) : (
                        confessions.map((post) => (
                            <div key={post.id} className="p-4 flex flex-col md:flex-row gap-4 hover:bg-muted/30 transition-colors">
                                {/* Post Content */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize text-xs">
                                            {post.category}
                                        </Badge>
                                        <Badge 
                                            variant={
                                                post.status === "active" ? "default" :
                                                post.status === "pending_review" ? "secondary" :
                                                post.status === "hidden" ? "outline" : "destructive"
                                            }
                                            className="text-[10px] uppercase"
                                        >
                                            {post.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            Score: {post.moderationScore}/100
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm bg-card p-3 rounded-md border">
                                        {post.body}
                                    </p>
                                    
                                    {(post.reportCount || 0) > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                            <AlertTriangle className="h-3 w-3" />
                                            Reported {post.reportCount} times
                                        </div>
                                    )}
                                </div>

                                {/* Identity & Actions */}
                                <div className="w-full md:w-64 space-y-3 shrink-0 bg-muted/20 p-3 rounded-lg border">
                                    <div className="text-sm">
                                        <span className="text-muted-foreground text-xs block mb-1">Author Identity:</span>
                                        {revealedIds.has(post.id) ? (
                                            <div className="space-y-1">
                                                <p className="font-mono text-xs truncate" title={post.authorEmail}>
                                                    {post.authorEmail}
                                                </p>
                                                <p className="font-mono text-[10px] text-muted-foreground truncate" title={post.authorUid}>
                                                    {post.authorUid}
                                                </p>
                                            </div>
                                        ) : (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => revealIdentity(post.id)}
                                                className="w-full h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Eye className="h-3 w-3 mr-1" /> Reveal Identity
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                        {post.status !== "active" && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleAction(post.id, "approve")}
                                                className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                            >
                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                                            </Button>
                                        )}
                                        
                                        {post.status !== "hidden" && post.status !== "removed" && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleAction(post.id, "hide")}
                                                className="h-7 text-xs"
                                            >
                                                <Eye className="h-3 w-3 mr-1" /> Hide
                                            </Button>
                                        )}
                                        
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleAction(post.id, "remove")}
                                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 col-span-full"
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" /> Hard Remove
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
