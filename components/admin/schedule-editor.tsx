"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Trash2, Clock, GripVertical, Loader2 } from "lucide-react"
import { getFirebase } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

interface ScheduleItem {
    id?: string
    time: string
    title: string
    description?: string
    speaker?: string
}

interface ScheduleEditorProps {
    hackathonId: string
    schedule: ScheduleItem[]
    onUpdate?: () => void
}

export function ScheduleEditor({ hackathonId, schedule = [], onUpdate }: ScheduleEditorProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form state
    const [time, setTime] = useState("")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [speaker, setSpeaker] = useState("")

    const resetForm = () => {
        setTime("")
        setTitle("")
        setDescription("")
        setSpeaker("")
    }

    const handleAddItem = async () => {
        if (!time || !title) {
            toast.error("Time and title are required")
            return
        }

        setLoading(true)
        try {
            const { db } = getFirebase()
            const newItem: ScheduleItem = {
                id: uuidv4(),
                time,
                title,
                description: description || undefined,
                speaker: speaker || undefined
            }

            const newSchedule = [...schedule, newItem]

            await updateDoc(doc(db, "hackathons", hackathonId), {
                schedule: newSchedule
            })

            toast.success("Schedule item added!")
            setDialogOpen(false)
            resetForm()
            onUpdate?.()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        try {
            const { db } = getFirebase()
            const newSchedule = schedule.filter(item => item.id !== itemId)

            await updateDoc(doc(db, "hackathons", hackathonId), {
                schedule: newSchedule
            })

            toast.success("Schedule item removed")
            onUpdate?.()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Event Schedule
                </CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Schedule Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="time">Time *</Label>
                                    <Input
                                        id="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        placeholder="e.g., 10:00 AM"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="speaker">Speaker</Label>
                                    <Input
                                        id="speaker"
                                        value={speaker}
                                        onChange={(e) => setSpeaker(e.target.value)}
                                        placeholder="e.g., John Doe"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Opening Ceremony"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddItem} disabled={loading || !time || !title}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Add to Schedule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {schedule.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                        No schedule items yet
                    </p>
                ) : (
                    <div className="space-y-2">
                        {schedule.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 group"
                            >
                                <div className="flex items-center gap-3">
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    <span className="font-mono text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
                                        {item.time}
                                    </span>
                                    <div>
                                        <p className="font-medium">{item.title}</p>
                                        {item.speaker && (
                                            <p className="text-xs text-muted-foreground">
                                                Speaker: {item.speaker}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                                    onClick={() => item.id && handleDeleteItem(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
