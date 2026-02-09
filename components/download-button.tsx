"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    downloadMedia,
    generateFilename,
    generateWatermarkText,
} from "@/lib/download"

interface DownloadButtonProps {
    mediaUrl: string
    mediaType: "image" | "video"
    postTitle: string
    uploaderName: string
    className?: string
    variant?: "default" | "ghost" | "outline"
    size?: "default" | "sm" | "lg" | "icon"
}

export function DownloadButton({
    mediaUrl,
    mediaType,
    postTitle,
    uploaderName,
    className,
    variant = "ghost",
    size = "sm",
}: DownloadButtonProps) {
    const [downloading, setDownloading] = useState(false)

    async function handleDownload() {
        if (downloading) return

        setDownloading(true)

        try {
            const filename = generateFilename(postTitle, mediaType, uploaderName)
            const watermarkText = generateWatermarkText(uploaderName)

            await downloadMedia({
                url: mediaUrl,
                filename,
                mediaType,
                watermarkText: mediaType === "image" ? watermarkText : undefined,
            })

            toast.success(
                mediaType === "image"
                    ? "Image saved with watermark! 📸"
                    : "Video saved! 🎬"
            )
        } catch (error: any) {
            console.error("Download failed:", error)
            toast.error("Download failed. Please try again.")
        } finally {
            setDownloading(false)
        }
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleDownload}
            disabled={downloading}
            className={className}
            title={`Download ${mediaType}`}
        >
            {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
        </Button>
    )
}
