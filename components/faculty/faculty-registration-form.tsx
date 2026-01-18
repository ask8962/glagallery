"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { toast } from "sonner"
import { GraduationCap, Loader2 } from "lucide-react"

const DEPARTMENTS = [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Biotechnology",
    "Pharmacy",
    "Management",
    "Law",
    "Agriculture",
    "Basic Sciences",
    "Humanities",
    "Other",
] as const

const DESIGNATIONS = [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Lecturer",
    "Lab Instructor",
    "Teaching Assistant",
    "HOD",
    "Dean",
    "Director",
    "Registrar",
    "Administrative Officer",
    "Other",
] as const

export function FacultyRegistrationForm() {
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        department: "",
        designation: "",
        employeeId: "",
        cabinNumber: "",
        officeHours: "",
        subjects: "",
        researchAreas: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.department || !formData.designation) {
            toast.error("Please fill in required fields")
            return
        }

        setLoading(true)
        try {
            const token = await user?.getIdToken()
            const res = await fetch("/api/faculty/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    department: formData.department,
                    designation: formData.designation,
                    employeeId: formData.employeeId || undefined,
                    cabinNumber: formData.cabinNumber || undefined,
                    officeHours: formData.officeHours || undefined,
                    subjects: formData.subjects.split(",").map(s => s.trim()).filter(Boolean),
                    researchAreas: formData.researchAreas.split(",").map(s => s.trim()).filter(Boolean),
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit")
            }

            toast.success("Registration submitted! Awaiting admin approval.")
            setOpen(false)
            setFormData({
                department: "",
                designation: "",
                employeeId: "",
                cabinNumber: "",
                officeHours: "",
                subjects: "",
                researchAreas: "",
            })
        } catch (error: any) {
            toast.error(error.message || "Failed to submit registration")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Register as Faculty
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-accent" />
                        Faculty Registration
                    </DialogTitle>
                    <DialogDescription>
                        Submit your details for verification. An admin will review your request.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="department">Department *</Label>
                            <Select
                                value={formData.department}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="designation">Designation *</Label>
                            <Select
                                value={formData.designation}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, designation: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select designation" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DESIGNATIONS.map((des) => (
                                        <SelectItem key={des} value={des}>
                                            {des}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="employeeId">Employee ID</Label>
                            <Input
                                id="employeeId"
                                placeholder="e.g., GLA12345"
                                value={formData.employeeId}
                                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cabinNumber">Cabin Number</Label>
                            <Input
                                id="cabinNumber"
                                placeholder="e.g., A-Block 204"
                                value={formData.cabinNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, cabinNumber: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="officeHours">Office Hours</Label>
                        <Input
                            id="officeHours"
                            placeholder="e.g., Mon-Fri 10AM-12PM"
                            value={formData.officeHours}
                            onChange={(e) => setFormData(prev => ({ ...prev, officeHours: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                        <Textarea
                            id="subjects"
                            placeholder="e.g., Data Structures, Algorithms, Machine Learning"
                            value={formData.subjects}
                            onChange={(e) => setFormData(prev => ({ ...prev, subjects: e.target.value }))}
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="researchAreas">Research Areas (comma-separated)</Label>
                        <Textarea
                            id="researchAreas"
                            placeholder="e.g., Artificial Intelligence, Cloud Computing"
                            value={formData.researchAreas}
                            onChange={(e) => setFormData(prev => ({ ...prev, researchAreas: e.target.value }))}
                            rows={2}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Registration"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
