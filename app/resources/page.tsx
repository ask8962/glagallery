"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { ResourceFeed } from "@/components/resources/resource-feed"
import { AddResourceDialog } from "@/components/resources/add-resource-dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Plus, BookOpen, FileText, DownloadCloud, FileType } from "lucide-react"
import type { ResourceType } from "@/lib/types"

const CATEGORIES: { value: ResourceType | "all"; label: string; icon: any; color: string }[] = [
    { value: "all", label: "All Materials", icon: BookOpen, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { value: "notes", label: "Class Notes", icon: FileText, color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
    { value: "pyq", label: "PYQs", icon: DownloadCloud, color: "bg-red-500/10 text-red-500 border-red-500/20" },
    { value: "book", label: "E-Books", icon: BookOpen, color: "bg-green-500/10 text-green-500 border-green-500/20" },
    { value: "other", label: "Other", icon: FileType, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
]

const DEPARTMENTS = [
    "All Departments", "Computer Science", "Information Technology", "Electronics & Communication",
    "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
    "Biotechnology", "Pharmacy", "Management", "Law", "Agriculture",
    "Basic Sciences", "Humanities"
]

const SEMESTERS = [
    "All Semesters", "Semester 1", "Semester 2", "Semester 3", "Semester 4",
    "Semester 5", "Semester 6", "Semester 7", "Semester 8"
]

export default function ResourcesPage() {
    const { user } = useAuth()
    const [activeType, setActiveType] = useState<ResourceType | "all">("all")
    const [activeDept, setActiveDept] = useState("all")
    const [activeSem, setActiveSem] = useState("all")
    
    const [showCreate, setShowCreate] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden border-b bg-gradient-to-b from-blue-500/5 via-background to-background"
            >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="container max-w-5xl mx-auto px-4 py-10 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold">Study Materials</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Notes, PYQs, and books shared by your campus community.
                                </p>
                            </div>
                        </div>
                        
                        {/* Filters on desktop */}
                        <div className="hidden md:flex items-center gap-3">
                            <Select value={activeDept} onValueChange={setActiveDept}>
                                <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map(d => (
                                        <SelectItem key={d} value={d === "All Departments" ? "all" : d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={activeSem} onValueChange={setActiveSem}>
                                <SelectTrigger className="w-[150px] bg-background/50 backdrop-blur-sm">
                                    <SelectValue placeholder="Semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEMESTERS.map(s => (
                                        <SelectItem key={s} value={s === "All Semesters" ? "all" : s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="container max-w-5xl mx-auto px-4 py-6">
                
                {/* Mobile Filters */}
                <div className="flex md:hidden gap-3 mb-6">
                    <Select value={activeDept} onValueChange={setActiveDept}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Dept" />
                        </SelectTrigger>
                        <SelectContent>
                            {DEPARTMENTS.map(d => (
                                <SelectItem key={d} value={d === "All Departments" ? "all" : d}>
                                    {d === "All Departments" ? "All Depts" : d}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={activeSem} onValueChange={setActiveSem}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Sem" />
                        </SelectTrigger>
                        <SelectContent>
                            {SEMESTERS.map(s => (
                                <SelectItem key={s} value={s === "All Semesters" ? "all" : s}>
                                    {s === "All Semesters" ? "All Sems" : s.replace("Semester ", "Sem ")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setActiveType(cat.value)}
                            className={\`
                                flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium 
                                border transition-all whitespace-nowrap
                                \${activeType === cat.value
                                    ? cat.color + " shadow-sm ring-1 ring-primary/20"
                                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                }
                            \`}
                        >
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Feed */}
                <ResourceFeed
                    type={activeType}
                    department={activeDept}
                    semester={activeSem}
                    refreshKey={refreshKey}
                />
            </div>

            {/* Floating Create Button */}
            {user && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="fixed bottom-6 right-6 z-50"
                >
                    <Button
                        onClick={() => setShowCreate(true)}
                        size="lg"
                        className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-110"
                    >
                        <Plus className="h-6 w-6 text-white" />
                    </Button>
                </motion.div>
            )}

            {/* Create Dialog */}
            <AddResourceDialog
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onAdded={() => {
                    setShowCreate(false)
                    setRefreshKey((k) => k + 1)
                }}
            />
        </div>
    )
}
