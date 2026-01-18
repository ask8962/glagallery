"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, Camera, Loader2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createStory } from "@/lib/stories"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { compressImage } from "@/lib/image-compression"

interface CreateStoryProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onStoryCreated?: () => void
}

export function CreateStory({
    open,
    onOpenChange,
    onStoryCreated,
}: CreateStoryProps) {
    const { user, profile } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [caption, setCaption] = useState("")
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        // Validate file type
        if (!selectedFile.type.startsWith("image/") && !selectedFile.type.startsWith("video/")) {
            toast.error("Please select an image or video")
            return
        }

        // Validate file size (max 50MB for videos, 10MB for images)
        const maxSize = selectedFile.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024
        if (selectedFile.size > maxSize) {
            toast.error(`File too large. Max ${selectedFile.type.startsWith("video/") ? "50MB" : "10MB"}`)
            return
        }

        let processedFile = selectedFile

        // Compress images
        if (selectedFile.type.startsWith("image/")) {
            try {
                processedFile = await compressImage(selectedFile, {
                    maxWidth: 1080,
                    maxHeight: 1920,
                    quality: 0.85,
                })
            } catch (error) {
                console.warn("Image compression failed, using original")
            }
        }

        setFile(processedFile)
        setPreview(URL.createObjectURL(processedFile))
    }

    const handleSubmit = async () => {
        if (!file || !user || !profile) return

        setUploading(true)

        try {
            await createStory(
                file,
                user.uid,
                profile.name,
                profile.photoURL,
                caption || undefined
            )

            toast.success("Story posted! 🎉")
            onStoryCreated?.()
            handleClose()
        } catch (error: any) {
            console.error("Failed to create story:", error)
            toast.error(error.message || "Failed to post story")
        } finally {
            setUploading(false)
        }
    }

    const handleClose = () => {
        setFile(null)
        setPreview(null)
        setCaption("")
        onOpenChange(false)
    }

    if (!open) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/90 flex items-end sm:items-center justify-center"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-background rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden safe-area-inset-bottom"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b shrink-0">
                        <h2 className="text-lg font-semibold">Create Story</h2>
                        <Button variant="ghost" size="icon" onClick={handleClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {!preview ? (
                            // Upload area
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-muted rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                            >
                                <Camera className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="font-medium mb-1">Add Photo or Video</p>
                                <p className="text-sm text-muted-foreground">
                                    Your story will disappear after 24 hours
                                </p>
                            </div>
                        ) : (
                            // Preview - responsive aspect ratio
                            <div className="relative aspect-[9/16] max-h-[50vh] sm:max-h-[40vh] bg-black rounded-xl overflow-hidden mx-auto">
                                {file?.type.startsWith("video/") ? (
                                    <video
                                        src={preview}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                )}

                                {/* Remove button */}
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => {
                                        setFile(null)
                                        setPreview(null)
                                    }}
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                                >
                                    <X className="h-4 w-4 text-white" />
                                </Button>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {preview && (
                            <>
                                {/* Caption */}
                                <div className="space-y-2">
                                    <Label htmlFor="caption">Caption (optional)</Label>
                                    <Input
                                        id="caption"
                                        placeholder="Add a caption..."
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        maxLength={200}
                                    />
                                </div>

                                {/* Expiry notice */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                                    <Clock className="h-4 w-4 shrink-0" />
                                    <span>This story will expire in 24 hours</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer - fixed at bottom */}
                    <div className="p-4 border-t flex gap-2 shrink-0 bg-background">
                        <Button variant="outline" onClick={handleClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!file || uploading}
                            className="flex-1"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Post Story
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
