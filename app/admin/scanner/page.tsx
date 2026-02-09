"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrScanner, ManualCodeEntry, ScanResultDisplay } from "@/components/scanner"
import { Loader2, QrCode, Keyboard, Shield } from "lucide-react"
import { toast } from "sonner"

type ScanResult = {
    status: "idle" | "success" | "error" | "already_used"
    ticketCode?: string
    eventTitle?: string
    userName?: string
    message?: string
    usedAt?: string
}

export default function AdminScannerPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [scanResult, setScanResult] = useState<ScanResult>({ status: "idle" })
    const [verifying, setVerifying] = useState(false)

    const verifyTicket = async (codeOrData: string) => {
        setVerifying(true)
        setScanResult({ status: "idle" })

        try {
            // Try to parse as JSON (from QR code)
            let ticketCode: string
            let ticketId: string | undefined

            try {
                // Check if it's a Hackathon Check-in URL
                if (codeOrData.includes("/hackathons/") && codeOrData.includes("/check-in")) {
                    try {
                        const url = new URL(codeOrData)
                        const teamId = url.searchParams.get("team")
                        // Extract hackathonId from path: .../hackathons/[id]/check-in...
                        const matches = url.pathname.match(/\/hackathons\/([^\/]+)\/check-in/)

                        if (matches && matches[1] && teamId) {
                            toast.info("Redirecting to Hackathon Check-in...")
                            router.push(`/hackathons/${matches[1]}/check-in?team=${teamId}`)
                            return
                        }
                    } catch (e) {
                        // Not a valid URL, continue standard verification
                    }
                }

                const parsed = JSON.parse(codeOrData)
                ticketId = parsed.ticketId
                ticketCode = parsed.code
            } catch {
                // Assume it's just the ticket code
                ticketCode = codeOrData
            }

            const res = await fetch("/api/events/verify-ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId, ticketCode }),
            })

            const data = await res.json()

            if (data.valid) {
                setScanResult({
                    status: "success",
                    ticketCode: data.ticketCode,
                    eventTitle: data.eventTitle,
                    userName: data.userName,
                    message: data.message,
                })
                // Play success sound (optional)
                new Audio("/sounds/success.mp3").play().catch(() => { })
            } else if (data.error?.includes("already used")) {
                setScanResult({
                    status: "already_used",
                    ticketCode: data.ticketCode,
                    eventTitle: data.eventTitle,
                    userName: data.userName,
                    message: data.error,
                    usedAt: data.usedAt ? new Date(data.usedAt).toLocaleString() : undefined,
                })
                // Play warning sound
                new Audio("/sounds/warning.mp3").play().catch(() => { })
            } else {
                setScanResult({
                    status: "error",
                    message: data.error || "Invalid ticket",
                })
                // Play error sound
                new Audio("/sounds/error.mp3").play().catch(() => { })
            }
        } catch (error: any) {
            setScanResult({
                status: "error",
                message: error.message || "Verification failed",
            })
            toast.error("Verification failed")
        } finally {
            setVerifying(false)
        }
    }

    const resetScan = () => {
        setScanResult({ status: "idle" })
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Show result display if we have a result
    if (scanResult.status !== "idle") {
        return (
            <div className="container max-w-md mx-auto py-8 px-4">
                <ScanResultDisplay
                    status={scanResult.status}
                    ticketCode={scanResult.ticketCode}
                    eventTitle={scanResult.eventTitle}
                    userName={scanResult.userName}
                    message={scanResult.message}
                    usedAt={scanResult.usedAt}
                    onReset={resetScan}
                />
            </div>
        )
    }

    return (
        <div className="container max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Admin Only</span>
                </div>
                <h1 className="text-3xl font-bold">Ticket Scanner</h1>
                <p className="text-muted-foreground mt-2">
                    Scan QR codes or enter ticket codes to verify entry
                </p>
            </div>

            {/* Scanner Tabs */}
            <Tabs defaultValue="camera" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="camera" className="gap-2">
                        <QrCode className="h-4 w-4" />
                        Camera
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="gap-2">
                        <Keyboard className="h-4 w-4" />
                        Manual
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="camera">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scan QR Code</CardTitle>
                            <CardDescription>
                                Point camera at the ticket QR code
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QrScanner
                                onScan={verifyTicket}
                                disabled={verifying}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="manual">
                    <Card>
                        <CardHeader>
                            <CardTitle>Enter Ticket Code</CardTitle>
                            <CardDescription>
                                Type the ticket code manually (e.g., GLA-ABC12345)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ManualCodeEntry
                                onVerify={verifyTicket}
                                disabled={verifying}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {verifying && (
                <div className="mt-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">Verifying ticket...</p>
                </div>
            )}
        </div>
    )
}
