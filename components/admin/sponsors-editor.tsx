"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Sponsor, SponsorTier } from "@/lib/types"
import { Plus, Trash2, ExternalLink, Trophy, Star, Award, Medal, Loader2 } from "lucide-react"
import { getFirebase } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { toast } from "sonner"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"

interface SponsorsEditorProps {
    hackathonId: string
    sponsors: Sponsor[]
    onUpdate?: () => void
}

const tierConfig: Record<SponsorTier, { label: string; icon: React.ReactNode; color: string }> = {
    platinum: { label: "Platinum", icon: <Trophy className="h-4 w-4" />, color: "bg-cyan-500/20 text-cyan-400" },
    gold: { label: "Gold", icon: <Star className="h-4 w-4" />, color: "bg-yellow-500/20 text-yellow-400" },
    silver: { label: "Silver", icon: <Award className="h-4 w-4" />, color: "bg-gray-400/20 text-gray-300" },
    bronze: { label: "Bronze", icon: <Medal className="h-4 w-4" />, color: "bg-orange-500/20 text-orange-400" },
    partner: { label: "Partner", icon: null, color: "bg-muted text-muted-foreground" }
}

export function SponsorsEditor({ hackathonId, sponsors, onUpdate }: SponsorsEditorProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    // Form state
    const [name, setName] = useState("")
    const [logoURL, setLogoURL] = useState("")
    const [tier, setTier] = useState<SponsorTier>("gold")
    const [website, setWebsite] = useState("")
    const [description, setDescription] = useState("")

    const resetForm = () => {
        setName("")
        setLogoURL("")
        setTier("gold")
        setWebsite("")
        setDescription("")
    }

    const handleAddSponsor = async () => {
        if (!name || !logoURL) {
            toast.error("Name and Logo URL are required")
            return
        }

        setLoading(true)
        try {
            const { db } = getFirebase()
            const newSponsor: Sponsor = {
                id: uuidv4(),
                name,
                logoURL,
                tier,
                website: website || undefined,
                description: description || undefined
            }

            await updateDoc(doc(db, "hackathons", hackathonId), {
                sponsors: arrayUnion(newSponsor)
            })

            toast.success("Sponsor added!")
            setDialogOpen(false)
            resetForm()
            onUpdate?.()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteSponsor = async (sponsor: Sponsor) => {
        if (!confirm(`Remove ${sponsor.name} as a sponsor?`)) return

        setDeleting(sponsor.id)
        try {
            const { db } = getFirebase()
            await updateDoc(doc(db, "hackathons", hackathonId), {
                sponsors: arrayRemove(sponsor)
            })
            toast.success("Sponsor removed")
            onUpdate?.()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setDeleting(null)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sponsors</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Sponsor
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Sponsor</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Company Name *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Google"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="logo">Logo URL *</Label>
                                <Input
                                    id="logo"
                                    value={logoURL}
                                    onChange={(e) => setLogoURL(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tier</Label>
                                <Select value={tier} onValueChange={(v) => setTier(v as SponsorTier)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(tierConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center gap-2">
                                                    {config.icon}
                                                    {config.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website (optional)</Label>
                                <Input
                                    id="website"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://company.com"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddSponsor} disabled={loading || !name || !logoURL}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Add Sponsor
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {(!sponsors || sponsors.length === 0) ? (
                    <p className="text-center text-muted-foreground py-4">
                        No sponsors added yet
                    </p>
                ) : (
                    <div className="space-y-3">
                        {sponsors.map((sponsor) => {
                            const config = tierConfig[sponsor.tier]
                            return (
                                <div
                                    key={sponsor.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-12 w-12 rounded bg-white p-1">
                                            <Image
                                                src={sponsor.logoURL}
                                                alt={sponsor.name}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{sponsor.name}</p>
                                                <Badge className={config.color}>
                                                    {config.icon}
                                                    <span className="ml-1">{config.label}</span>
                                                </Badge>
                                            </div>
                                            {sponsor.website && (
                                                <a
                                                    href={sponsor.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    {sponsor.website}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        disabled={deleting === sponsor.id}
                                        onClick={() => handleDeleteSponsor(sponsor)}
                                    >
                                        {deleting === sponsor.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
