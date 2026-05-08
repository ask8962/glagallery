"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Link as LinkIcon, Trophy } from "lucide-react"
import { toast } from "sonner"
import type { ResourceType } from "@/lib/types"

interface AddResourceDialogProps {
    open: boolean
    onClose: () => void
    onAdded: () => void
}

const DEPARTMENTS = [
    "Computer Science", "Information Technology", "Electronics & Communication",
    "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
    "Biotechnology", "Pharmacy", "Management", "Law", "Agriculture",
    "Basic Sciences", "Humanities", "Other"
]

const SEMESTERS = [
    "Semester 1", "Semester 2", "Semester 3", "Semester 4",
    "Semester 5", "Semester 6", "Semester 7", "Semester 8"
]

export function AddResourceDialog({ open, onClose, onAdded }: AddResourceDialogProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        type: "notes" as ResourceType,
        department: "",
        semester: "",
        subject: "",
        driveLink: "",
        description: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast.error("You must be logged in to upload resources")
            return
        }

        if (!formData.driveLink.includes("drive.google.com")) {
            toast.error("Please provide a valid Google Drive link")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    authorUid: user.uid,
                    authorName: user.name || "Anonymous Student",
                    organizationId: user.organizationId || "gla",
                }),
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "Failed to add resource")

            if (data.pointsAwarded) {
                toast.success(
                    <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span>Resource added! You earned {data.pointsAwarded} points.</span>
                    </div>
                )
            } else {
                toast.success("Resource added successfully!")
            }
            
            // Reset form
            setFormData({
                title: "", type: "notes", department: "", semester: "", 
                subject: "", driveLink: "", description: ""
            })
            onAdded()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Share Study Material</DialogTitle>
                    <DialogDescription>
                        Help your juniors and classmates by sharing your notes or PYQs via Google Drive.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Resource Type</Label>
                            <Select 
                                value={formData.type} 
                                onValueChange={(val) => setFormData({ ...formData, type: val as ResourceType })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="notes">Class Notes</SelectItem>
                                    <SelectItem value="pyq">Previous Year Qs (PYQ)</SelectItem>
                                    <SelectItem value="book">E-Book / Reference</SelectItem>
                                    <SelectItem value="other">Other Material</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Semester</Label>
                            <Select 
                                value={formData.semester} 
                                onValueChange={(val) => setFormData({ ...formData, semester: val })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEMESTERS.map(sem => (
                                        <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Select 
                            value={formData.department} 
                            onValueChange={(val) => setFormData({ ...formData, department: val })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select your department" />
                            </SelectTrigger>
                            <SelectContent>
                                {DEPARTMENTS.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Subject / Course Name</Label>
                        <Input 
                            placeholder="e.g. Data Structures and Algorithms" 
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Document Title</Label>
                        <Input 
                            placeholder="e.g. Unit 1-4 Complete Notes (Handwritten)" 
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Google Drive Link</Label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                className="pl-9"
                                placeholder="https://drive.google.com/..." 
                                value={formData.driveLink}
                                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                                required
                                type="url"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Ensure the link sharing is set to "Anyone with the link can view".
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Short Description (Optional)</Label>
                        <Textarea 
                            placeholder="Any context? (e.g. Contains mid-sem questions too)" 
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Share Resource
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
