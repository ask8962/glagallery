"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { createHackathon } from "@/lib/hackathons"
import { getFirebase } from "@/lib/firebase"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, X, ImageIcon } from "lucide-react"
import { GLASignInGuard } from "@/components/gla-signin-guard"
import { validateTitle, validateDescription, sanitizeText, checkRateLimit } from "@/lib/validation"
import { toast } from "sonner"

export default function CreateHackathonPage() {
  const { user, profile, loading, signIn } = useAuth()
  const router = useRouter()
  const isAdmin = profile?.role === "admin"

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [theme, setTheme] = useState("")
  const [location, setLocation] = useState("")
  const [isOnline, setIsOnline] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string>("")
  const [bannerUploadProgress, setBannerUploadProgress] = useState(0)
  const [minTeamSize, setMinTeamSize] = useState(1)
  const [maxTeamSize, setMaxTeamSize] = useState(4)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [registrationDeadline, setRegistrationDeadline] = useState("")
  const [submissionDeadline, setSubmissionDeadline] = useState("")
  const [rules, setRules] = useState<string[]>([""])
  const [prizes, setPrizes] = useState<string[]>([""])
  const [categories, setCategories] = useState<string[]>([""])
  const [submitting, setSubmitting] = useState(false)

  if (!loading && !user) {
    return (
      <GLASignInGuard
        onSignIn={signIn}
        title="Sign in Required"
        description="You need to sign in to create hackathons."
      />
    )
  }

  if (!loading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Only administrators can create hackathons.</p>
        </div>
      </div>
    )
  }

  function addRule() {
    setRules([...rules, ""])
  }

  function removeRule(index: number) {
    setRules(rules.filter((_, i) => i !== index))
  }

  function updateRule(index: number, value: string) {
    const newRules = [...rules]
    newRules[index] = value
    setRules(newRules)
  }

  function addPrize() {
    setPrizes([...prizes, ""])
  }

  function removePrize(index: number) {
    setPrizes(prizes.filter((_, i) => i !== index))
  }

  function updatePrize(index: number, value: string) {
    const newPrizes = [...prizes]
    newPrizes[index] = value
    setPrizes(newPrizes)
  }

  function addCategory() {
    setCategories([...categories, ""])
  }

  function removeCategory(index: number) {
    setCategories(categories.filter((_, i) => i !== index))
  }

  function updateCategory(index: number, value: string) {
    const newCategories = [...categories]
    newCategories[index] = value
    setCategories(newCategories)
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB")
      return
    }

    setBannerFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setBannerPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !profile) return

    const rateLimitCheck = checkRateLimit("upload")
    if (!rateLimitCheck.allowed) {
      toast.error("Rate limit exceeded. Please try again later.")
      return
    }

    const titleValidation = validateTitle(title)
    if (!titleValidation.valid) {
      toast.error(titleValidation.error || "Invalid title")
      return
    }

    const descValidation = validateDescription(description)
    if (!descValidation.valid) {
      toast.error(descValidation.error || "Invalid description")
      return
    }

    setSubmitting(true)
    try {
      const { Timestamp } = await import("firebase/firestore")
      const { storage } = getFirebase()

      let bannerURL: string | undefined = undefined

      // Upload banner image if provided
      if (bannerFile) {
        const path = `hackathons/${user.uid}/${Date.now()}-${bannerFile.name}`
        const storageRef = ref(storage, path)
        const uploadTask = uploadBytesResumable(storageRef, bannerFile)

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
              setBannerUploadProgress(progress)
            },
            (error) => reject(error),
            async () => {
              try {
                bannerURL = await getDownloadURL(uploadTask.snapshot.ref)
                resolve()
              } catch (error) {
                reject(error)
              }
            },
          )
        })
      }

      const hackathonData = {
        title: titleValidation.sanitized,
        description: descValidation.sanitized,
        theme: theme.trim() ? sanitizeText(theme.trim()) : undefined,
        location: location.trim() ? sanitizeText(location.trim()) : undefined,
        isOnline,
        bannerURL,
        minTeamSize,
        maxTeamSize,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        registrationDeadline: Timestamp.fromDate(new Date(registrationDeadline)),
        submissionDeadline: Timestamp.fromDate(new Date(submissionDeadline)),
        status: "upcoming" as const,
        organizerUid: user.uid,
        organizerName: sanitizeText(profile.name || user.displayName || "Admin"),
        rules:
          rules.filter((r) => r.trim()).length > 0
            ? rules.filter((r) => r.trim()).map((r) => sanitizeText(r))
            : undefined,
        prizes:
          prizes.filter((p) => p.trim()).length > 0
            ? prizes.filter((p) => p.trim()).map((p) => sanitizeText(p))
            : undefined,
        categories:
          categories.filter((c) => c.trim()).length > 0
            ? categories.filter((c) => c.trim()).map((c) => sanitizeText(c))
            : undefined,
        registrationOpen: true,
      }

      const hackathonId = await createHackathon(hackathonData)
      toast.success("Hackathon created successfully!")
      router.push(`/hackathons/${hackathonId}`)
    } catch (error: any) {
      console.error("Error creating hackathon:", error)
      toast.error(error.message || "Failed to create hackathon. Please try again.")
    } finally {
      setSubmitting(false)
      setBannerUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Create New Hackathon</h1>
          <p className="text-muted-foreground">Organize an exciting coding competition for GLA students</p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <Card className="p-8 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., GLA Hackathon 2024"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the hackathon..."
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="theme">Theme (Optional)</Label>
                  <Input
                    id="theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g., Innovation for Education"
                  />
                </div>

                <div>
                  <Label htmlFor="banner">Banner Image (Optional)</Label>
                  <div className="space-y-3">
                    {bannerPreview ? (
                      <div className="relative">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                          <img
                            src={bannerPreview || "/placeholder.svg"}
                            alt="Banner preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBannerFile(null)
                            setBannerPreview("")
                          }}
                          className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {bannerUploadProgress > 0 && bannerUploadProgress < 100 && (
                          <div className="mt-2">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all duration-300"
                                style={{ width: `${bannerUploadProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Uploading... {bannerUploadProgress}%</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent/50 transition-colors duration-300 relative">
                        <Input
                          id="banner"
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-2">
                          <div className="h-12 w-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-accent" />
                          </div>
                          <p className="text-sm font-medium text-foreground">Click to upload banner image</p>
                          <p className="text-xs text-muted-foreground">Supports JPG, PNG, GIF, WebP (Max 5MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Format */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4">Location & Format</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch id="isOnline" checked={isOnline} onCheckedChange={setIsOnline} />
                  <Label htmlFor="isOnline">Online Event</Label>
                </div>

                {!isOnline && (
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., GLA University, Mathura"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Team Settings */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4">Team Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minTeamSize">Minimum Team Size *</Label>
                  <Input
                    id="minTeamSize"
                    type="number"
                    min="1"
                    value={minTeamSize}
                    onChange={(e) => setMinTeamSize(Number.parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="maxTeamSize">Maximum Team Size *</Label>
                  <Input
                    id="maxTeamSize"
                    type="number"
                    min="1"
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(Number.parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4">Important Dates</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="registrationDeadline">Registration Deadline *</Label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date & Time *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
                  <Input
                    id="submissionDeadline"
                    type="datetime-local"
                    value={submissionDeadline}
                    onChange={(e) => setSubmissionDeadline(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date & Time *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Rules */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4">Rules</h2>
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={rule}
                      onChange={(e) => updateRule(index, e.target.value)}
                      placeholder={`Rule ${index + 1}`}
                    />
                    {rules.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRule(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </div>

            {/* Prizes */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4">Prizes</h2>
              <div className="space-y-2">
                {prizes.map((prize, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={prize}
                      onChange={(e) => updatePrize(index, e.target.value)}
                      placeholder={`Prize ${index + 1}`}
                    />
                    {prizes.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePrize(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addPrize}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Prize
                </Button>
              </div>
            </div>

            {/* Judging Categories */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4">Judging Categories</h2>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={category}
                      onChange={(e) => updateCategory(index, e.target.value)}
                      placeholder={`Category ${index + 1} (e.g., Best Innovation)`}
                    />
                    {categories.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {submitting ? "Creating..." : "Create Hackathon"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
