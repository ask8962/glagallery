"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"

interface Reply {
    id: string
    body: string
    anonymousAlias: string
    createdAt: string
}

interface ConfessionRepliesProps {
    confessionId: string
}

export function ConfessionReplies({ confessionId }: ConfessionRepliesProps) {
    const { user } = useAuth()
    const [replies, setReplies] = useState<Reply[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [text, setText] = useState("")

    useEffect(() => {
        const fetchReplies = async () => {
            try {
                const res = await fetch(`/api/confessions/${confessionId}/reply`)
                if (!res.ok) throw new Error("Failed to fetch replies")
                const data = await res.json()
                setReplies(data.replies || [])
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchReplies()
    }, [confessionId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast.error("Please sign in to reply")
            return
        }
        if (!text.trim()) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/confessions/${confessionId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    authorUid: user.uid,
                    authorEmail: user.email,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // Optimistic add
            setReplies((prev) => [
                ...prev,
                {
                    id: data.id,
                    body: text,
                    anonymousAlias: data.anonymousAlias,
                    createdAt: new Date().toISOString(),
                },
            ])
            setText("")
            toast.success("Reply posted! +2 points")
        } catch (err: any) {
            toast.error(err.message || "Failed to post reply")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto my-4" />
    }

    return (
        <div className="space-y-4">
            {/* Reply List */}
            <div className="space-y-3">
                {replies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                        No replies yet. Be the first!
                    </p>
                ) : (
                    replies.map((reply) => (
                        <div key={reply.id} className="bg-background rounded-lg p-3 shadow-sm border border-border/50">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                                    {(reply.anonymousAlias || "A").charAt(reply.anonymousAlias?.indexOf("#") === -1 ? 0 : (reply.anonymousAlias?.indexOf("#") || 0) + 1)}
                                </div>
                                <span className="text-xs font-semibold">{reply.anonymousAlias}</span>
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm pl-7">{reply.body}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end pt-2">
                <Textarea
                    placeholder="Write an anonymous reply..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[40px] h-[40px] resize-none py-2 text-sm bg-background"
                    maxLength={500}
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!text.trim() || submitting}
                    className="shrink-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                    {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </div>
    )
}
