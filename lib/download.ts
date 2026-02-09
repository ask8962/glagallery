"use client"

/**
 * Download utility for images/videos with watermark support
 * Uses Canvas API to add watermark overlay on images
 */

export interface DownloadOptions {
    url: string
    filename: string
    mediaType: "image" | "video"
    watermarkText?: string // e.g., "@username • GLA Gallery"
}

/**
 * Download an image with a watermark overlay
 */
async function downloadImageWithWatermark(
    imageUrl: string,
    filename: string,
    watermarkText: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous" // Required for Firebase Storage images

        img.onload = () => {
            // Create canvas
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            if (!ctx) {
                reject(new Error("Could not get canvas context"))
                return
            }

            // Set canvas dimensions to image dimensions
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight

            // Draw the original image
            ctx.drawImage(img, 0, 0)

            // Configure watermark style
            const fontSize = Math.max(16, Math.floor(canvas.width / 40)) // Responsive font size
            const padding = fontSize

            ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
            ctx.textAlign = "right"
            ctx.textBaseline = "bottom"

            // Measure text for background
            const textMetrics = ctx.measureText(watermarkText)
            const textWidth = textMetrics.width
            const textHeight = fontSize * 1.2

            // Position: bottom-right corner
            const x = canvas.width - padding
            const y = canvas.height - padding

            // Draw semi-transparent background
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
            ctx.beginPath()
            ctx.roundRect(
                x - textWidth - padding * 0.5,
                y - textHeight,
                textWidth + padding,
                textHeight + padding * 0.3,
                8
            )
            ctx.fill()

            // Draw text shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
            ctx.fillText(watermarkText, x + 2, y + 2)

            // Draw watermark text
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
            ctx.fillText(watermarkText, x, y)

            // Convert canvas to blob and download
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Could not create image blob"))
                        return
                    }

                    const url = URL.createObjectURL(blob)
                    const link = document.createElement("a")
                    link.href = url
                    link.download = filename
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                    resolve()
                },
                "image/jpeg",
                0.95 // High quality
            )
        }

        img.onerror = () => {
            reject(new Error("Failed to load image for watermarking"))
        }

        img.src = imageUrl
    })
}

/**
 * Download a video file directly (no watermark for videos)
 */
async function downloadVideo(videoUrl: string, filename: string): Promise<void> {
    try {
        const response = await fetch(videoUrl)
        const blob = await response.blob()

        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    } catch (error) {
        // Fallback: open in new tab
        window.open(videoUrl, "_blank")
        throw error
    }
}

/**
 * Main download function
 */
export async function downloadMedia(options: DownloadOptions): Promise<void> {
    const { url, filename, mediaType, watermarkText } = options

    if (mediaType === "image" && watermarkText) {
        return downloadImageWithWatermark(url, filename, watermarkText)
    } else if (mediaType === "video") {
        return downloadVideo(url, filename)
    } else {
        // Fallback: direct download without watermark
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}

/**
 * Generate a clean filename from post title
 */
export function generateFilename(
    title: string,
    mediaType: "image" | "video",
    uploaderName?: string
): string {
    // Clean the title for filename
    const cleanTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 50)

    const extension = mediaType === "video" ? "mp4" : "jpg"
    const prefix = uploaderName ? `${uploaderName.replace(/\s+/g, "-")}_` : ""

    return `gla-gallery_${prefix}${cleanTitle}.${extension}`
}

/**
 * Generate watermark text
 */
export function generateWatermarkText(uploaderName: string): string {
    return `📸 @${uploaderName} • GLA Gallery`
}
