"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { compressImage } from "@/lib/image-optimization"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Upload, Check, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AvatarEditorProps {
    currentAvatarUrl?: string
    userName?: string
    onUpdate?: () => void
    children?: React.ReactNode
}

// Premium DiceBear presets
const DICEBEAR_STYLES = "micah"
const PRESET_SEEDS = [
    "Felix", "Aneka", "Mimi", "Midnight", "Oliver", "Garfield",
    "Salem", "Cleo", "Buster", "Luna", "Simba", "Chloe"
]

export function AvatarEditor({ currentAvatarUrl, userName = "User", onUpdate, children }: AvatarEditorProps) {
    const { user } = useAuth()
    const { db, storage } = getFirebase()
    const [open, setOpen] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const presets = PRESET_SEEDS.map(seed => `https://api.dicebear.com/9.x/${DICEBEAR_STYLES}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`)

    const handleSaveAvatar = async (newPhotoUrl: string) => {
        if (!user) return
        setIsUpdating(true)
        try {
            // Update Auth Profile
            await updateProfile(user, { photoURL: newPhotoUrl })

            // Update Firestore Profile
            const userRef = doc(db, "users", user.uid)
            await updateDoc(userRef, { photoURL: newPhotoUrl })

            toast.success("Profile picture updated!")
            setOpen(false)
            if (onUpdate) onUpdate()
        } catch (error: any) {
            console.error("Error updating avatar:", error)
            toast.error(error.message || "Failed to update profile picture")
        } finally {
            setIsUpdating(false)
            setUploadProgress(0)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setIsUpdating(true)
        setUploadProgress(0)

        try {
            // Compress image to a reasonable avatar size (400x400 max)
            const compressed = await compressImage(file, {
                quality: 0.8,
                maxWidth: 400,
                maxHeight: 400,
            })

            // Upload to Firebase Storage
            const storageRef = ref(storage, `users/${user.uid}/avatar_${Date.now()}.jpg`)
            const uploadTask = uploadBytesResumable(storageRef, compressed.file)

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    setUploadProgress(Math.round(progress))
                },
                (error) => {
                    console.error("Upload error:", error)
                    toast.error("Failed to upload image")
                    setIsUpdating(false)
                    setUploadProgress(0)
                },
                async () => {
                    // Success! Get URL and save.
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                    await handleSaveAvatar(downloadURL)
                }
            )

        } catch (error: any) {
            console.error("Compression/Upload error:", error)
            toast.error(error.message || "Failed to process image")
            setIsUpdating(false)
            setUploadProgress(0)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <div className="relative group cursor-pointer">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                            <AvatarImage src={currentAvatarUrl || ""} alt={userName} />
                            <AvatarFallback className="text-2xl">{userName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                    </div>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Profile Picture</DialogTitle>
                    <DialogDescription>
                        Choose a premium 3D avatar or upload your own photo.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="presets" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="presets" className="gap-2"><Sparkles className="h-4 w-4" /> Presets</TabsTrigger>
                        <TabsTrigger value="upload" className="gap-2"><Upload className="h-4 w-4" /> Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="presets" className="mt-4">
                        <div className="grid grid-cols-4 gap-3">
                            {presets.map((url, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSaveAvatar(url)}
                                    disabled={isUpdating}
                                    className={cn(
                                        "relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-105 active:scale-95",
                                        currentAvatarUrl === url ? "border-accent ring-2 ring-accent/50 ring-offset-2 ring-offset-background" : "border-transparent hover:border-border"
                                    )}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover bg-muted" />
                                    {currentAvatarUrl === url && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <Check className="h-6 w-6 text-white drop-shadow-md" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-4">
                            Avatars provided by <a href="https://www.dicebear.com/" target="_blank" rel="noreferrer" className="underline hover:text-primary">DiceBear</a>
                        </p>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-4">
                        <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-xl border-border bg-muted/30">
                            {isUpdating && uploadProgress > 0 ? (
                                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                                    <div className="relative h-20 w-20 flex items-center justify-center">
                                        <Loader2 className="h-10 w-10 text-accent animate-spin" />
                                        <span className="absolute text-xs font-semibold">{uploadProgress}%</span>
                                    </div>
                                    <p className="text-sm font-medium animate-pulse">Uploading...</p>
                                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm border border-border">
                                        <Camera className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-1">Click to upload</h3>
                                    <p className="text-sm text-muted-foreground text-center mb-6 max-w-[250px]">
                                        SVG, PNG, JPG or GIF. Max dimensions 400x400px.
                                    </p>
                                    <div className="relative">
                                        <Button disabled={isUpdating} className="gap-2">
                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                            {isUpdating ? "Processing..." : "Select File"}
                                        </Button>
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            disabled={isUpdating}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
