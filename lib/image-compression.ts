/**
 * Image compression utility using Canvas API
 */

export interface CompressionOptions {
    maxWidth?: number
    maxHeight?: number
    quality?: number // 0-1
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
}

/**
 * Compress an image file using Canvas
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    return new Promise((resolve, reject) => {
        const img = new Image()
        const reader = new FileReader()

        reader.onload = (e) => {
            img.src = e.target?.result as string
        }

        reader.onerror = () => {
            reject(new Error("Failed to read file"))
        }

        img.onload = () => {
            // Calculate new dimensions
            let width = img.width
            let height = img.height

            if (width > opts.maxWidth! || height > opts.maxHeight!) {
                const ratio = Math.min(
                    opts.maxWidth! / width,
                    opts.maxHeight! / height
                )
                width = Math.round(width * ratio)
                height = Math.round(height * ratio)
            }

            // Create canvas and draw resized image
            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext("2d")
            if (!ctx) {
                reject(new Error("Could not get canvas context"))
                return
            }

            ctx.drawImage(img, 0, 0, width, height)

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Failed to compress image"))
                        return
                    }

                    // Create new file with same name
                    const compressedFile = new File([blob], file.name, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    })

                    resolve(compressedFile)
                },
                "image/jpeg",
                opts.quality
            )
        }

        img.onerror = () => {
            reject(new Error("Failed to load image"))
        }

        reader.readAsDataURL(file)
    })
}

/**
 * Check if file needs compression
 */
export function needsCompression(file: File, maxSizeBytes: number = 2 * 1024 * 1024): boolean {
    return file.size > maxSizeBytes
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
