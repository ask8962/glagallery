"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, X, AlertCircle } from "lucide-react"
import type { ConfessionCategory } from "@/lib/types"

interface CreateConfessionProps {
    open: boolean
    onClose: () => void
    onCreated: () => void
}

export function CreateConfession({ open, onClose, onCreated }: CreateConfessionProps) {
    const { user, profile } = useAuth()
    const [loading, setLoading] = useState(false)
    const [text, setText] = useState("")
    const [category, setCategory] = useState<ConfessionCategory>("confession")
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast.error("Please sign in to post")
            return
        }

        if (!text.trim()) {
            toast.error("Post cannot be empty")
            return
        }

        if (category === "poll") {
            const validOptions = pollOptions.filter((opt) => opt.trim() !== "")
            if (validOptions.length < 2) {
                toast.error("Polls need at least 2 options")
                return
            }
        }

        setLoading(true)
        try {
            const payload: any = {
                text,
                category,
                authorUid: user.uid,
                authorEmail: user.email,
                organizationId: profile?.organizationId,
            }

            if (category === "poll") {
                payload.pollOptions = pollOptions.filter((opt) => opt.trim() !== "")
            }

            const res = await fetch("/api/confessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to post")
            }

            // Gamification popup could go here
            toast.success(`Posted as ${data.anonymousAlias}! +5 points`)
            
            if (data.moderation?.action === "review") {
                toast("Your post was flagged for review, but is visible for now.", {
                    icon: "👀",
                })
            } else if (data.moderation?.action === "reject") {
                toast.error("Post removed: Inappropriate content detected.")
                // Note: lenient mode, we still set status=removed in backend if it's super bad (>70),
                // but if they want pure lenient, we might need to adjust backend. For now backend is 
                // reject -> removed, but 30-70 is pending_review -> active.
            }

            setText("")
            setCategory("confession")
            setPollOptions(["", ""])
            onCreated()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const addPollOption = () => {
        if (pollOptions.length >= 6) {
            toast.error("Maximum 6 options allowed")
            return
        }
        setPollOptions([...pollOptions, ""])
    }

    const updatePollOption = (index: number, value: string) => {
        const newOptions = [...pollOptions]
        newOptions[index] = value
        setPollOptions(newOptions)
    }

    const removePollOption = (index: number) => {
        if (pollOptions.length <= 2) {
            toast.error("Minimum 2 options required")
            return
        }
        const newOptions = pollOptions.filter((_, i) => i !== index)
        setPollOptions(newOptions)
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <span>🤫</span> Post Anonymously
                        </DialogTitle>
                        <DialogDescription>
                            Your identity is hidden from other students.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="bg-orange-500/10 text-orange-600 px-6 py-3 text-xs font-medium flex items-start gap-2 border-y">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                        Keep it respectful. Hate speech, bullying, or illegal content will result in a ban. Admins can reveal identities if rules are broken.
                    </p>
                </div>

                <ScrollArea className="flex-1 px-6 py-4">
                    <form id="create-confession-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={category}
                                onValueChange={(v) => setCategory(v as ConfessionCategory)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="confession">🔥 Confession</SelectItem>
                                    <SelectItem value="meme">😂 Meme / Joke</SelectItem>
                                    <SelectItem value="poll">📊 Poll</SelectItem>
                                    <SelectItem value="hot_take">💡 Hot Take</SelectItem>
                                    <SelectItem value="marketplace">🛒 Marketplace</SelectItem>
                                    <SelectItem value="question">❓ Question</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                {category === "poll" ? "Poll Question" : "What's on your mind?"}
                            </Label>
                            <Textarea
                                placeholder={
                                    category === "poll"
                                        ? "E.g., Where's the best place to study?"
                                        : "Type your anonymous message here..."
                                }
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="min-h-[120px] resize-none text-base"
                                maxLength={1000}
                            />
                            <div className="text-right text-xs text-muted-foreground">
                                {text.length}/1000
                            </div>
                        </div>

                        {category === "poll" && (
                            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                                <Label>Poll Options</Label>
                                {pollOptions.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Input
                                            value={opt}
                                            onChange={(e) => updatePollOption(i, e.target.value)}
                                            placeholder={`Option ${i + 1}`}
                                            maxLength={50}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removePollOption(i)}
                                            className="shrink-0 text-muted-foreground hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {pollOptions.length < 6 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addPollOption}
                                        className="w-full border-dashed"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Option
                                    </Button>
                                )}
                            </div>
                        )}
                    </form>
                </ScrollArea>

                <div className="p-6 pt-4 border-t mt-auto flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="create-confession-form"
                        disabled={loading || !text.trim()}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md shadow-orange-500/20"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Post Anonymously
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
