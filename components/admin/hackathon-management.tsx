"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllHackathons, deleteHackathon } from "@/lib/hackathons"
import Link from "next/link"
import type { Hackathon } from "@/lib/types"
import { toast } from "sonner"
import { AdminTableSkeleton } from "@/components/skeletons/admin-skeleton"
import { useOrganization } from "@/context/organization-context"
import { isSuperAdminEmail } from "@/lib/config"
import { useAuth } from "@/context/auth-context"

export function HackathonManagement() {
    const { organization } = useOrganization()
    const { profile } = useAuth()
    const isSuperAdmin = profile?.role === "super_admin" || isSuperAdminEmail(profile?.email || "")
    
    const [hackathons, setHackathons] = useState<Hackathon[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (organization?.id || isSuperAdmin) {
            loadHackathons()
        }
    }, [organization?.id, isSuperAdmin])

    const loadHackathons = async () => {
        if (!organization?.id && !isSuperAdmin) return;
        try {
            setLoading(true)
            const orgIdParam = isSuperAdmin ? undefined : organization?.id;
            const data = await getAllHackathons(undefined, orgIdParam)
            setHackathons(data)
        } catch (error) {
            console.error("Error loading hackathons:", error)
            toast.error("Failed to load hackathons")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (hackathon: Hackathon) => {
        if (confirm(`Are you sure you want to delete "${hackathon.title}"? This action cannot be undone.`)) {
            try {
                await deleteHackathon(hackathon.id)
                setHackathons(hackathons.filter((h) => h.id !== hackathon.id))
                toast.success("Hackathon deleted successfully")
            } catch (error) {
                console.error("Failed to delete hackathon:", error)
                toast.error("Failed to delete hackathon. Please try again.")
            }
        }
    }

    if (loading) {
        return <AdminTableSkeleton rows={3} />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-primary">Hackathons Management</h2>
                <Link href="/hackathons/create">
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Create Hackathon</Button>
                </Link>
            </div>
            <Card className="overflow-hidden shadow-sm border border-border/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="p-4 text-left font-medium text-foreground">Title</th>
                                <th className="p-4 text-left font-medium text-foreground">Status</th>
                                <th className="p-4 text-left font-medium text-foreground">Organizer</th>
                                <th className="p-4 text-left font-medium text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hackathons.map((hackathon, index) => (
                                <tr
                                    key={hackathon.id}
                                    className={`border-b border-border/50 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                                >
                                    <td className="p-4 font-medium text-foreground">{hackathon.title}</td>
                                    <td className="p-4">
                                        <Badge variant="secondary">{hackathon.status}</Badge>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{hackathon.organizerName}</td>
                                    <td className="p-4 space-x-2">
                                        <Link href={`/hackathons/${hackathon.id}`}>
                                            <Button size="sm" variant="outline">
                                                View
                                            </Button>
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(hackathon)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {hackathons.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-muted-foreground">No hackathons found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
