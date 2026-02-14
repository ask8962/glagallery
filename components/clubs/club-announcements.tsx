"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Plus, Pin, Megaphone, Trash2 } from "lucide-react"
import { auth } from "@/lib/firebase"

interface Announcement {
    id: string
    title: string
    content: string
    isPinned: boolean
    authorName: string
    createdAt: string
}

interface ClubAnnouncementsProps {
    clubId: string
    isAdmin: boolean
}

export function ClubAnnouncements({ clubId, isAdmin }: ClubAnnouncementsProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [isPinned, setIsPinned] = useState(false)

    useEffect(() => {
        fetchAnnouncements()
    }, [clubId])

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/announcements`)
            const data = await res.json()

            // Sort: pinned first, then by date
            const sorted = (data.announcements || []).sort((a: Announcement, b: Announcement) => {
                if (a.isPinned && !b.isPinned) return -1
                if (!a.isPinned && b.isPinned) return 1
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })

            setAnnouncements(sorted)
        } catch (error) {
            console.error("Failed to fetch announcements:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("Title and content are required")
            return
        }

        setSubmitting(true)
        try {
            const token = await auth.currentUser?.getIdToken()
            const res = await fetch(`/api/clubs/${clubId}/announcements`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ title, content, isPinned }),
            })

            if (!res.ok) throw new Error("Failed to create announcement")

            toast.success("Announcement posted!")
            setDialogOpen(false)
            setTitle("")
            setContent("")
            setIsPinned(false)
            fetchAnnouncements()
        } catch (error: any) {
            toast.error(error.message || "Failed to post announcement")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (announcementId: string) => {
        if (!confirm("Delete this announcement?")) return

        try {
            const token = await auth.currentUser?.getIdToken()
            const res = await fetch(
                `/api/clubs/${clubId}/announcements?announcementId=${announcementId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            )

            if (!res.ok) throw new Error("Failed to delete")

            toast.success("Announcement deleted")
            fetchAnnouncements()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header with Create Button */}
            {isAdmin && (
                <div className="flex justify-end">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Announcement
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Announcement</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <Input
                                    placeholder="Announcement Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                <Textarea
                                    placeholder="Write your announcement..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={5}
                                />
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="pinned"
                                        checked={isPinned}
                                        onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                                    />
                                    <label htmlFor="pinned" className="text-sm">
                                        Pin this announcement
                                    </label>
                                </div>
                                <Button onClick={handleCreate} disabled={submitting} className="w-full">
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Post Announcement"
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="text-center py-12">
                    <Megaphone className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No announcements yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((announcement) => (
                        <Card key={announcement.id} className={announcement.isPinned ? "border-accent" : ""}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {announcement.isPinned && (
                                            <Badge variant="secondary" className="gap-1">
                                                <Pin className="h-3 w-3" />
                                                Pinned
                                            </Badge>
                                        )}
                                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                                    </div>
                                    {isAdmin && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(announcement.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {announcement.content}
                                </p>
                                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                                    <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-[10px]">
                                            {announcement.authorName?.charAt(0) || "A"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{announcement.authorName}</span>
                                    <span>•</span>
                                    <span>{formatDate(announcement.createdAt)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
