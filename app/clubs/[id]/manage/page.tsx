"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Save, Upload, X, ImageIcon, Building2, BarChart3 } from "lucide-react"
import { getFirebase } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import type { Club } from "@/lib/types"
import Link from "next/link"
import { TeamManagement } from "@/components/clubs/team-management"
import { JoinRequestsList } from "@/components/clubs/join-requests-list"
import { ClubVerificationRequestForm } from "@/components/clubs/verification-request-form"

export default function ManageClubPage() {
    const params = useParams()
    const router = useRouter()
    const { user, profile } = useAuth()
    const { storage } = getFirebase()
    const clubId = params.id as string

    const logoInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    const [club, setClub] = useState<Club | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [uploadingCover, setUploadingCover] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [email, setEmail] = useState("")
    const [logoURL, setLogoURL] = useState("")
    const [coverImageURL, setCoverImageURL] = useState("")
    const [instagram, setInstagram] = useState("")
    const [linkedin, setLinkedin] = useState("")
    const [website, setWebsite] = useState("")
    const [discord, setDiscord] = useState("")

    const isClubAdmin = club && user && (
        club.presidentUid === user.uid ||
        club.admins?.includes(user.uid) ||
        profile?.role === "admin"
    )

    useEffect(() => {
        fetchClub()
    }, [clubId])

    const fetchClub = async () => {
        try {
            const token = await user?.getIdToken()
            const res = await fetch(`/api/clubs/${clubId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error("Club not found")
            const data = await res.json()
            setClub(data.club)

            // Populate form
            setName(data.club.name || "")
            setDescription(data.club.description || "")
            setEmail(data.club.email || "")
            setLogoURL(data.club.logoURL || "")
            setCoverImageURL(data.club.coverImageURL || "")
            setInstagram(data.club.socialLinks?.instagram || "")
            setLinkedin(data.club.socialLinks?.linkedin || "")
            setWebsite(data.club.socialLinks?.website || "")
            setDiscord(data.club.socialLinks?.discord || "")
        } catch (error) {
            console.error("Failed to fetch club:", error)
            toast.error("Failed to load club")
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (
        file: File,
        type: "logo" | "cover",
        setUploading: (v: boolean) => void,
        setURL: (v: string) => void
    ) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }

        const maxSize = type === "logo" ? 2 : 5 // 2MB for logo, 5MB for cover
        if (file.size > maxSize * 1024 * 1024) {
            toast.error(`Image must be less than ${maxSize}MB`)
            return
        }

        setUploading(true)
        try {
            const folder = type === "logo" ? "club-logos" : "club-covers"
            const fileName = `${folder}/${clubId}-${Date.now()}-${file.name}`
            const storageRef = ref(storage, fileName)

            await uploadBytes(storageRef, file)
            const downloadURL = await getDownloadURL(storageRef)

            setURL(downloadURL)
            toast.success(`${type === "logo" ? "Logo" : "Cover"} uploaded!`)
        } catch (error) {
            console.error("Upload error:", error)
            toast.error(`Failed to upload ${type}`)
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        if (!name.trim() || !description.trim()) {
            toast.error("Name and description are required")
            return
        }

        setSaving(true)
        try {
            const token = await user?.getIdToken()
            const res = await fetch(`/api/clubs/${clubId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    description,
                    email,
                    logoURL,
                    coverImageURL,
                    socialLinks: {
                        instagram: instagram || undefined,
                        linkedin: linkedin || undefined,
                        website: website || undefined,
                        discord: discord || undefined,
                    },
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to update")
            }

            toast.success("Club updated successfully!")
            router.push(`/clubs/${clubId}`)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!club) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold">Club not found</h2>
                <Link href="/clubs">
                    <Button>Back to Clubs</Button>
                </Link>
            </div>
        )
    }

    if (!isClubAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground">Only club admins can manage this club.</p>
                <Link href={`/clubs/${clubId}`}>
                    <Button>Back to Club</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container max-w-3xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link href={`/clubs/${clubId}`}>
                        <Button variant="ghost" size="sm" className="mb-4 gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Club
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-accent" />
                        <h1 className="text-2xl font-bold">Manage Club</h1>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-muted-foreground">
                            Update your club's profile, images, and social links.
                        </p>
                        <Link href={`/clubs/${clubId}/analytics`}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Analytics
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    {/* Verification Status */}
                    {club && (
                        <ClubVerificationRequestForm
                            clubId={clubId}
                            clubName={club.name}
                            currentStatus={club.verification?.status}
                            rejectionReason={club.verification?.rejectionReason}
                        />
                    )}

                    {/* Cover Image */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cover Image</CardTitle>
                            <CardDescription>
                                This appears at the top of your club's profile page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                {coverImageURL ? (
                                    <div className="relative h-40 rounded-lg overflow-hidden bg-muted">
                                        <Image
                                            src={coverImageURL}
                                            alt="Cover"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            onClick={() => setCoverImageURL("")}
                                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        {uploadingCover && (
                                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => coverInputRef.current?.click()}
                                        className="h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
                                    >
                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            Click to upload cover image
                                        </span>
                                    </div>
                                )}
                                <input
                                    ref={coverInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFileUpload(file, "cover", setUploadingCover, setCoverImageURL)
                                    }}
                                    className="hidden"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logo */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Club Logo</CardTitle>
                            <CardDescription>
                                Square image that represents your club.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                {logoURL ? (
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted">
                                        <Image
                                            src={logoURL}
                                            alt="Logo"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            onClick={() => setLogoURL("")}
                                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        {uploadingLogo && (
                                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => logoInputRef.current?.click()}
                                        className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
                                    >
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Upload</span>
                                    </div>
                                )}
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFileUpload(file, "logo", setUploadingLogo, setLogoURL)
                                    }}
                                    className="hidden"
                                />
                                <p className="text-sm text-muted-foreground">
                                    PNG, JPG up to 2MB
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Club Name *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Contact Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Social Links */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Links</CardTitle>
                            <CardDescription>
                                Add your club's social media profiles.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        placeholder="https://instagram.com/..."
                                        value={instagram}
                                        onChange={(e) => setInstagram(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">LinkedIn</Label>
                                    <Input
                                        id="linkedin"
                                        placeholder="https://linkedin.com/company/..."
                                        value={linkedin}
                                        onChange={(e) => setLinkedin(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        placeholder="https://..."
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discord">Discord</Label>
                                    <Input
                                        id="discord"
                                        placeholder="https://discord.gg/..."
                                        value={discord}
                                        onChange={(e) => setDiscord(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Management */}
                    {club && user && (
                        <TeamManagement
                            clubId={clubId}
                            presidentUid={club.presidentUid}
                            user={user}
                        />
                    )}

                    {/* Join Requests Section */}
                    {club && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Membership Requests</CardTitle>
                                <CardDescription>Review and approve join requests</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <JoinRequestsList clubId={clubId} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end gap-4">
                        <Link href={`/clubs/${clubId}`}>
                            <Button variant="outline">Cancel</Button>
                        </Link>
                        <Button
                            onClick={handleSave}
                            disabled={saving || uploadingLogo || uploadingCover}
                            className="gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
