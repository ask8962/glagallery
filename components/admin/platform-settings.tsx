"use client"

import { useState } from "react"
import { useConfig } from "@/context/config-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"
import { Save, Image as ImageIcon, Loader2 as Spinner } from "lucide-react"

export function PlatformSettings() {
    const { config } = useConfig()
    const { user } = useAuth()
    const { organization } = useOrganization()

    const [name, setName] = useState(config.name)
    const [tagline, setTagline] = useState(config.tagline)
    const [description, setDescription] = useState(config.description)
    const [logoUrl, setLogoUrl] = useState(config.logoUrl)
    
    const [allowedDomains, setAllowedDomains] = useState(organization?.allowedDomains?.join(", ") || "")

    const [contactAddress, setContactAddress] = useState(config.contactAddress || "")
    const [contactPhone, setContactPhone] = useState(config.contactPhone || "")
    const [contactEmail, setContactEmail] = useState(config.contactEmail || "")
    const [officialWebsiteUrl, setOfficialWebsiteUrl] = useState(config.officialWebsiteUrl || "")

    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Platform Name is required")
            return
        }

        setIsSaving(true)
        try {
            const token = await user?.getIdToken()
            if (!token) throw new Error("Not authenticated")

            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    tagline,
                    description,
                    logoUrl,
                    contactAddress,
                    contactPhone,
                    contactEmail,
                    officialWebsiteUrl,
                    organizationId: organization?.id,
                    allowedDomains
                })
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Failed to update platform settings")
            }

            toast.success("Platform settings updated successfully!")
        } catch (error: any) {
            console.error("Error saving settings:", error)
            toast.error(error.message || "Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Platform Branding</CardTitle>
                    <CardDescription>
                        Update the core identity of the platform including name and tagline.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="platform-name">Platform Name</Label>
                        <Input
                            id="platform-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. My College Gallery"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                            id="tagline"
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            placeholder="e.g. The official campus event and community platform"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">About Description (Landing Page)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detailed description of the platform or the university..."
                            className="min-h-[120px]"
                        />
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="allowed-domains">Allowed Email Domains (Comma Separated)</Label>
                        <Textarea
                            id="allowed-domains"
                            value={allowedDomains}
                            onChange={(e) => setAllowedDomains(e.target.value)}
                            placeholder="e.g. gla.ac.in, mycollege.edu"
                            className="min-h-[60px]"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Only users with these email domains will be routed to your organization upon sign in. 
                        </p>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="logo-url">Logo URL</Label>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0 border overflow-hidden relative">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <Input
                                id="logo-url"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://..."
                                className="flex-1"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Enter the URL of the logo image. For best results, use a square image (e.g., 512x512).
                        </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium">Contact & External Links</h3>

                        <div className="space-y-2">
                            <Label htmlFor="contact-address">Physical Address</Label>
                            <Input
                                id="contact-address"
                                value={contactAddress}
                                onChange={(e) => setContactAddress(e.target.value)}
                                placeholder="e.g. 17km Stone, Mathura-Delhi Road"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contact-phone">Phone Number</Label>
                                <Input
                                    id="contact-phone"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    placeholder="e.g. +91 12345 67890"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contact-email">Email Address</Label>
                                <Input
                                    id="contact-email"
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="e.g. info@university.edu"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="official-website">Official Website URL</Label>
                            <Input
                                id="official-website"
                                value={officialWebsiteUrl}
                                onChange={(e) => setOfficialWebsiteUrl(e.target.value)}
                                placeholder="e.g. https://www.university.edu"
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto gap-2">
                            {isSaving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
