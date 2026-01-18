"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff } from "lucide-react"
import jsQR from "jsqr"

interface QrScannerProps {
    onScan: (data: string) => void
    disabled?: boolean
}

export function QrScanner({ onScan, disabled }: QrScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastScannedRef = useRef<string | null>(null)

    const startCamera = async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            })

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
                setHasPermission(true)
                setIsScanning(true)
            }
        } catch (err: any) {
            setHasPermission(false)
            setError(err.message || "Camera access denied")
        }
    }

    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
            videoRef.current.srcObject = null
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
        }
        setIsScanning(false)
    }, [])

    // Actual QR scanning using jsQR
    useEffect(() => {
        if (!isScanning) return

        const scanFrame = () => {
            if (!videoRef.current || !canvasRef.current) return

            const video = videoRef.current
            const canvas = canvasRef.current
            const ctx = canvas.getContext("2d")

            if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            })

            if (code && code.data) {
                // Prevent duplicate scans of the same code within 3 seconds
                if (lastScannedRef.current !== code.data) {
                    lastScannedRef.current = code.data
                    console.log("QR Code Detected:", code.data)
                    onScan(code.data)

                    // Reset after 3 seconds to allow re-scanning
                    setTimeout(() => {
                        lastScannedRef.current = null
                    }, 3000)
                }
            }
        }

        // Scan every 200ms for responsiveness
        scanIntervalRef.current = setInterval(scanFrame, 200)

        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current)
            }
        }
    }, [isScanning, onScan])

    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [stopCamera])

    if (disabled) {
        return (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Scanner paused</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Camera View */}
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning overlay */}
                {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-primary rounded-lg animate-pulse" />
                    </div>
                )}

                {/* No camera started */}
                {!isScanning && hasPermission === null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                        <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground text-center px-4">
                            Click "Start Camera" to begin scanning
                        </p>
                    </div>
                )}

                {/* Permission denied */}
                {hasPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                        <CameraOff className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground text-center px-4">
                            Camera access denied. Please enable camera permissions.
                        </p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-2">
                {!isScanning ? (
                    <Button onClick={startCamera} className="gap-2">
                        <Camera className="h-4 w-4" />
                        Start Camera
                    </Button>
                ) : (
                    <Button onClick={stopCamera} variant="outline" className="gap-2">
                        <CameraOff className="h-4 w-4" />
                        Stop Camera
                    </Button>
                )}
            </div>

            {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
            )}
        </div>
    )
}
