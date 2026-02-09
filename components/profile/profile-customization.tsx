"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateProfile } from "@/lib/profile"
import type { UserProfile, SocialLinks } from "@/lib/types"
import { Edit2, Instagram, Twitter, Linkedin, Github, Globe, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { validateBio, validateSocialURL } from "@/lib/validation"

interface ProfileCustomizationProps {
  profile: UserProfile
  onUpdate: () => void
}

export function ProfileCustomization({ profile, onUpdate }: ProfileCustomizationProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    bio: profile.bio || "",
    socialLinks: {
      instagram: profile.socialLinks?.instagram || "",
      twitter: profile.socialLinks?.twitter || "",
      linkedin: profile.socialLinks?.linkedin || "",
      github: profile.socialLinks?.github || "",
      website: profile.socialLinks?.website || "",
    },
  })

  const validateField = (field: string, value: string) => {
    let result: { valid: boolean; error?: string }

    if (field === "bio") {
      result = validateBio(value)
    } else {
      const platform = field.replace("socialLinks.", "")
      result = validateSocialURL(value, platform)
    }

    setErrors((prev) => ({
      ...prev,
      [field]: result.valid ? "" : result.error || "Invalid input",
    }))

    return result.valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const bioCheck = validateBio(formData.bio)
    if (!bioCheck.valid) {
      toast.error(bioCheck.error || "Invalid bio")
      return
    }

    // Validate social links
    for (const [platform, url] of Object.entries(formData.socialLinks)) {
      if (url) {
        const check = validateSocialURL(url, platform)
        if (!check.valid) {
          toast.error(`${platform}: ${check.error}`)
          return
        }
      }
    }

    setLoading(true)

    try {
      const socialLinks: SocialLinks = {}
      if (formData.socialLinks.instagram) socialLinks.instagram = formData.socialLinks.instagram
      if (formData.socialLinks.twitter) socialLinks.twitter = formData.socialLinks.twitter
      if (formData.socialLinks.linkedin) socialLinks.linkedin = formData.socialLinks.linkedin
      if (formData.socialLinks.github) socialLinks.github = formData.socialLinks.github
      if (formData.socialLinks.website) socialLinks.website = formData.socialLinks.website

      const result = await updateProfile(profile.uid, {
        bio: formData.bio.trim() || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      })

      if (result.success) {
        toast.success("Profile updated successfully!")
        setOpen(false)
        onUpdate()
      } else {
        toast.error(typeof result.error === "string" ? result.error : "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("An error occurred while updating your profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Customize your profile information and social links</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              onBlur={() => validateField("bio", formData.bio)}
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
              {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label>Social Links</Label>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  type="url"
                  placeholder="https://instagram.com/username"
                  value={formData.socialLinks.instagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, instagram: e.target.value },
                    })
                  }
                  onBlur={() => validateField("instagram", formData.socialLinks.instagram)}
                />
                {errors.instagram && <p className="text-xs text-destructive">{errors.instagram}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Label>
                <Input
                  id="twitter"
                  type="url"
                  placeholder="https://twitter.com/username"
                  value={formData.socialLinks.twitter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                    })
                  }
                  onBlur={() => validateField("twitter", formData.socialLinks.twitter)}
                />
                {errors.twitter && <p className="text-xs text-destructive">{errors.twitter}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, linkedin: e.target.value },
                    })
                  }
                  onBlur={() => validateField("linkedin", formData.socialLinks.linkedin)}
                />
                {errors.linkedin && <p className="text-xs text-destructive">{errors.linkedin}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="github" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </Label>
                <Input
                  id="github"
                  type="url"
                  placeholder="https://github.com/username"
                  value={formData.socialLinks.github}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, github: e.target.value },
                    })
                  }
                  onBlur={() => validateField("github", formData.socialLinks.github)}
                />
                {errors.github && <p className="text-xs text-destructive">{errors.github}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.socialLinks.website}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, website: e.target.value },
                    })
                  }
                  onBlur={() => validateField("website", formData.socialLinks.website)}
                />
                {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
