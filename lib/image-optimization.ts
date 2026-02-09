/**
 * Image Optimization & Compression Utilities
 *
 * Client-side image compression and optimization before upload.
 */

import Compressor from "compressorjs"

export interface CompressionOptions {
  quality?: number // 0.1 to 1.0
  maxWidth?: number
  maxHeight?: number
  convertSize?: number // Convert to WebP if file size > convertSize (bytes)
}

export interface AggressiveCompressionOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  maxFileSizeMB?: number
  format?: "webp" | "jpeg" | "png"
}

export interface CompressionResult {
  file: File | Blob
  originalSize: number
  compressedSize: number
  compressionRatio: number
  format: string
}

/**
 * Compress image before upload
 */
export async function compressImage(file: File, options: CompressionOptions = {}): Promise<CompressionResult> {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1920,
    convertSize = 500000, // 500KB
  } = options

  return new Promise((resolve, reject) => {
    const originalSize = file.size

    new Compressor(file, {
      quality,
      maxWidth,
      maxHeight,
      convertTypes: file.size > convertSize ? ["image/png", "image/jpeg"] : [],
      convertSize,
      success: (compressedFile) => {
        const compressedSize = compressedFile.size
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

        resolve({
          file: compressedFile,
          originalSize,
          compressedSize,
          compressionRatio,
          format: compressedFile.type || file.type,
        })
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

/**
 * Generate multiple image sizes (thumbnail, medium, full)
 */
export async function generateImageSizes(file: File): Promise<{
  thumbnail: File | Blob
  medium: File | Blob
  full: File | Blob
}> {
  // Thumbnail: 300x300
  const thumbnail = await compressImage(file, {
    quality: 0.7,
    maxWidth: 300,
    maxHeight: 300,
  })

  // Medium: 800x800
  const medium = await compressImage(file, {
    quality: 0.8,
    maxWidth: 800,
    maxHeight: 800,
  })

  // Full: 1920x1920 (already compressed)
  const full = await compressImage(file, {
    quality: 0.85,
    maxWidth: 1920,
    maxHeight: 1920,
  })

  return {
    thumbnail: thumbnail.file,
    medium: medium.file,
    full: full.file,
  }
}

/**
 * Convert image to WebP format
 */
export async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to convert to WebP"))
            }
          },
          "image/webp",
          0.85,
        )
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  file: File,
  minWidth = 100,
  minHeight = 100,
  maxWidth = 10000,
  maxHeight = 10000,
): Promise<{ valid: boolean; error?: string; width?: number; height?: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const { width, height } = img

        if (width < minWidth || height < minHeight) {
          resolve({
            valid: false,
            error: `Image too small. Minimum dimensions: ${minWidth}x${minHeight}`,
            width,
            height,
          })
          return
        }

        if (width > maxWidth || height > maxHeight) {
          resolve({
            valid: false,
            error: `Image too large. Maximum dimensions: ${maxWidth}x${maxHeight}`,
            width,
            height,
          })
          return
        }

        resolve({ valid: true, width, height })
      }
      img.onerror = () => {
        resolve({
          valid: false,
          error: "Invalid image file",
        })
      }
      img.src = e.target?.result as string
    }
    reader.onerror = () => {
      resolve({
        valid: false,
        error: "Failed to read image file",
      })
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Get image metadata
 */
export function getImageMetadata(file: File): Promise<{
  width: number
  height: number
  aspectRatio: number
  size: number
  type: string
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          size: file.size,
          type: file.type,
        })
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Create blur placeholder (base64 data URL)
 */
export function createBlurPlaceholder(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        // Create small thumbnail for blur
        canvas.width = 20
        canvas.height = 20
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }
        ctx.drawImage(img, 0, 0, 20, 20)
        const dataURL = canvas.toDataURL("image/jpeg", 0.1)
        resolve(dataURL)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Aggressively compress image to meet file size requirements
 * Will iteratively reduce quality until target size is met
 */
export async function aggressiveCompressImage(
  file: File,
  options: AggressiveCompressionOptions = {},
): Promise<CompressionResult> {
  const {
    quality: initialQuality = 0.8,
    maxWidth = 1920,
    maxHeight = 1920,
    maxFileSizeMB = 1,
    format = "webp",
  } = options

  const maxSizeBytes = maxFileSizeMB * 1024 * 1024
  let currentQuality = initialQuality
  let result = await compressImage(file, {
    quality: currentQuality,
    maxWidth,
    maxHeight,
  })

  // Iteratively reduce quality until we meet size requirement
  while (result.compressedSize > maxSizeBytes && currentQuality > 0.1) {
    currentQuality -= 0.1
    result = await compressImage(file, {
      quality: currentQuality,
      maxWidth,
      maxHeight,
    })
  }

  // If still too large, reduce dimensions
  if (result.compressedSize > maxSizeBytes) {
    const scaleFactor = Math.sqrt(maxSizeBytes / result.compressedSize)
    result = await compressImage(file, {
      quality: 0.6,
      maxWidth: Math.floor(maxWidth * scaleFactor),
      maxHeight: Math.floor(maxHeight * scaleFactor),
    })
  }

  return result
}

export function shouldCompressImage(file: File, maxSizeMB = 1): boolean {
  return file.size > maxSizeMB * 1024 * 1024
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}
