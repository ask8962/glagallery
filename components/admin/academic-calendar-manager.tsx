"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Calendar, Plus, Trash2, Loader2, Pencil } from "lucide-react"
import type { AcademicEvent, AcademicEventType } from "@/lib/types"
import { useOrganization } from "@/context/organization-context"

const EVENT_TYPES: { value: AcademicEventType; label: string; color: string }[] = [
    { value: "exam", label: "Examination", color: "bg-red-100 text-red-700" },
    { value: "holiday", label: "Holiday", color: "bg-green-100 text-green-700" },
    { value: "semester_start", label: "Semester Start", color: "bg-blue-100 text-blue-700" },
    { value: "semester_end", label: "Semester End", color: "bg-blue-100 text-blue-700" },
    { value: "registration", label: "Registration", color: "bg-purple-100 text-purple-700" },
    { value: "convocation", label: "Convocation", color: "bg-yellow-100 text-yellow-700" },
    { value: "placement", label: "Placement", color: "bg-orange-100 text-orange-700" },
    { value: "cultural_fest", label: "Cultural Fest", color: "bg-pink-100 text-pink-700" },
    { value: "sports_week", label: "Sports Week", color: "bg-cyan-100 text-cyan-700" },
    { value: "workshop", label: "Workshop", color: "bg-indigo-100 text-indigo-700" },
    { value: "other", label: "Other", color: "bg-gray-100 text-gray-700" },
]

export function AcademicCalendarManager() {
    const { user } = useAuth()
    const { organization } = useOrganization()
    const [events, setEvents] = useState<AcademicEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "other" as AcademicEventType,
        startDate: "",
        endDate: "",
        allDay: true,
    })

    useEffect(() => {
        fetchEvents()
    }, [user])

    const fetchEvents = async () => {
        if (!user) return

        try {
            if (!organization?.id) return;
            const token = await user.getIdToken()
            const res = await fetch(`/api/academic-calendar?limit=100&organizationId=${organization.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setEvents(data.events)
            }
        } catch (error) {
            console.error("Error fetching events:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title || !formData.startDate || !formData.endDate) {
            toast.error("Please fill in all required fields")
            return
        }

        setSaving(true)
        try {
            const token = await user?.getIdToken()
            const res = await fetch("/api/academic-calendar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...formData, organizationId: organization?.id }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }

            toast.success("Event created successfully")
            setDialogOpen(false)
            setFormData({
                title: "",
                description: "",
                type: "other",
                startDate: "",
                endDate: "",
                allDay: true,
            })
            fetchEvents()
        } catch (error: any) {
            toast.error(error.message || "Failed to create event")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (eventId: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return

        setDeleting(eventId)
        try {
            const token = await user?.getIdToken()
            const res = await fetch(`/api/academic-calendar/${eventId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }

            toast.success("Event deleted")
            setEvents(prev => prev.filter(e => e.id !== eventId))
        } catch (error: any) {
            toast.error(error.message || "Failed to delete")
        } finally {
            setDeleting(null)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    }

    const getTypeConfig = (type: AcademicEventType) => {
        return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1]
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    Academic Calendar
                </h3>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 bg-accent text-accent-foreground">
                            <Plus className="h-4 w-4" />
                            Add Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add Academic Event</DialogTitle>
                            <DialogDescription>
                                Create a new academic calendar event
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Mid-Semester Examinations"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Event Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as AcademicEventType }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EVENT_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date *</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Additional details..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Create Event
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No academic events yet</p>
                    <p className="text-sm">Create your first event to get started</p>
                </div>
            ) : (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((event) => {
                                const typeConfig = getTypeConfig(event.type)
                                return (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            <p className="font-medium">{event.title}</p>
                                            {event.description && (
                                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                                    {event.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={typeConfig.color}>
                                                {typeConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(event.startDate)}</TableCell>
                                        <TableCell>{formatDate(event.endDate)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:bg-red-50"
                                                disabled={deleting === event.id}
                                                onClick={() => handleDelete(event.id)}
                                            >
                                                {deleting === event.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
