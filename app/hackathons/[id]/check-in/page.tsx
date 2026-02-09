"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { getHackathonById, getHackathonTeams, checkInTeam, getCheckedInTeams } from "@/lib/hackathons"
import type { Hackathon, Team } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { motion } from "framer-motion"
import {
    QrCode,
    CheckCircle2,
    Users,
    Search,
    ArrowLeft,
    Camera,
    XCircle,
    Printer,
    Volume2,
} from "lucide-react"
import Link from "next/link"

const ADMIN_EMAIL = "anukalp.gupta_cs23@gla.ac.in"

// Sound effects
function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
        oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1) // C#6
        oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.2) // E6

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.4)
    } catch {
        // Audio not supported
    }
}

function playErrorSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
    } catch {
        // Audio not supported
    }
}

export default function CheckInPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const { user, profile } = useAuth()
    const hackathonId = params.id as string
    const teamIdFromUrl = searchParams.get("team")

    const [hackathon, setHackathon] = useState<Hackathon | null>(null)
    const [teams, setTeams] = useState<Team[]>([])
    const [checkedInTeams, setCheckedInTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [scannerActive, setScannerActive] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [soundEnabled, setSoundEnabled] = useState(true)

    const scannerRef = useRef<any>(null)
    const processedTeamRef = useRef<string | null>(null)
    const isAdmin = profile?.role === "admin" || profile?.email === ADMIN_EMAIL

    useEffect(() => {
        loadData()
    }, [hackathonId])

    // Handle team check-in from URL query param (when QR scanned externally)
    useEffect(() => {
        if (teamIdFromUrl && user && isAdmin && !loading && !processing) {
            // Prevent double processing
            if (processedTeamRef.current === teamIdFromUrl) return
            processedTeamRef.current = teamIdFromUrl

            handleCheckIn(teamIdFromUrl)
        }
    }, [teamIdFromUrl, user, isAdmin, loading])

    async function loadData() {
        setLoading(true)
        try {
            const [hackathonData, teamsData, checkedIn] = await Promise.all([
                getHackathonById(hackathonId),
                getHackathonTeams(hackathonId),
                getCheckedInTeams(hackathonId),
            ])
            setHackathon(hackathonData)
            setTeams(teamsData)
            setCheckedInTeams(checkedIn)
        } catch (error) {
            console.error("Error loading data:", error)
            toast.error("Failed to load hackathon data")
        } finally {
            setLoading(false)
        }
    }

    const handleCheckIn = useCallback(async (teamId: string) => {
        if (!user || processing) return

        setProcessing(true)
        try {
            const result = await checkInTeam(hackathonId, teamId, user.uid)

            if (result.success) {
                if (soundEnabled) playSuccessSound()
                toast.success(result.message, {
                    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
                })
                // Refresh data
                const [teamsData, checkedIn] = await Promise.all([
                    getHackathonTeams(hackathonId),
                    getCheckedInTeams(hackathonId),
                ])
                setTeams(teamsData)
                setCheckedInTeams(checkedIn)
            } else {
                if (soundEnabled) playErrorSound()
                toast.error(result.message)
            }
        } catch (error) {
            if (soundEnabled) playErrorSound()
            toast.error("Failed to check in team")
        } finally {
            setProcessing(false)
        }
    }, [hackathonId, user, processing, soundEnabled])

    const handleQRScan = useCallback(async (decodedText: string) => {
        // New QR format: URL like https://glagallery.vercel.app/hackathons/{id}/check-in?team={teamId}
        // Also support old format: hackathonId|teamId

        let teamId: string | null = null

        if (decodedText.includes("/check-in?team=")) {
            // New URL format
            const url = new URL(decodedText)
            teamId = url.searchParams.get("team")
        } else if (decodedText.includes("|")) {
            // Old format: hackathonId|teamId
            const parts = decodedText.split("|")
            if (parts.length === 2 && parts[0] === hackathonId) {
                teamId = parts[1]
            }
        }

        if (!teamId) {
            if (soundEnabled) playErrorSound()
            toast.error("Invalid QR code format")
            return
        }

        await handleCheckIn(teamId)
    }, [hackathonId, handleCheckIn, soundEnabled])

    const startScanner = async () => {
        try {
            const { Html5Qrcode } = await import("html5-qrcode")

            if (scannerRef.current) {
                await scannerRef.current.stop()
            }

            const html5QrCode = new Html5Qrcode("qr-reader")
            scannerRef.current = html5QrCode

            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleQRScan(decodedText)
                },
                () => { }
            )

            setScannerActive(true)
        } catch (error) {
            console.error("Error starting scanner:", error)
            toast.error("Failed to start camera. Please check permissions.")
        }
    }

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop()
            } catch {
                // Ignore
            }
        }
        setScannerActive(false)
    }

    const handlePrintRoster = () => {
        const printWindow = window.open("", "_blank")
        if (!printWindow) {
            toast.error("Please allow popups to print the roster")
            return
        }

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Check-in Roster - ${hackathon?.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          h2 { font-size: 18px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .checked { color: green; }
          .pending { color: orange; }
          .stats { margin-bottom: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${hackathon?.title}</h1>
        <h2>Team Check-in Roster</h2>
        <div class="stats">
          <strong>Total:</strong> ${teams.length} teams | 
          <strong class="checked">Checked In:</strong> ${checkedInTeams.length} | 
          <strong class="pending">Pending:</strong> ${teams.length - checkedInTeams.length}
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Team Name</th>
              <th>Members</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${teams.map((team, index) => {
            const isChecked = checkedInTeams.some(t => t.id === team.id)
            return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${team.name}</td>
                  <td>${team.members?.length || 0}</td>
                  <td class="${isChecked ? 'checked' : 'pending'}">${isChecked ? '✓ Checked In' : 'Pending'}</td>
                </tr>
              `
        }).join("")}
          </tbody>
        </table>
        <script>window.print(); window.close();</script>
      </body>
      </html>
    `

        printWindow.document.write(html)
        printWindow.document.close()
    }

    useEffect(() => {
        return () => {
            stopScanner()
        }
    }, [])

    // Filter teams by search
    const filteredTeams = teams.filter((team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const isTeamCheckedIn = (teamId: string) =>
        checkedInTeams.some((t) => t.id === teamId)

    if (!isAdmin) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-10 text-center">
                <h1 className="text-2xl font-bold text-primary">Admin Only</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    This page is restricted to hackathon organizers.
                </p>
            </main>
        )
    }

    if (loading) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/3" />
                    <div className="h-64 bg-muted rounded" />
                </div>
            </main>
        )
    }

    if (!hackathon) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-10 text-center">
                <h1 className="text-2xl font-bold text-primary">Hackathon Not Found</h1>
            </main>
        )
    }

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-4xl px-4 py-8 space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/hackathons/${hackathonId}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Team Check-in</h1>
                        <p className="text-sm text-muted-foreground">{hackathon.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                    >
                        <Volume2 className={`h-4 w-4 ${soundEnabled ? "" : "opacity-50"}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrintRoster}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Roster
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                    <Users className="h-6 w-6 mx-auto text-accent mb-2" />
                    <p className="text-2xl font-bold">{teams.length}</p>
                    <p className="text-xs text-muted-foreground">Total Teams</p>
                </Card>
                <Card className="p-4 text-center">
                    <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                    <p className="text-2xl font-bold">{checkedInTeams.length}</p>
                    <p className="text-xs text-muted-foreground">Checked In</p>
                </Card>
                <Card className="p-4 text-center col-span-2 md:col-span-1">
                    <XCircle className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                    <p className="text-2xl font-bold">{teams.length - checkedInTeams.length}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                </Card>
            </div>

            {/* QR Scanner */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-accent" />
                        <h2 className="font-semibold">QR Scanner</h2>
                    </div>
                    <Button
                        onClick={scannerActive ? stopScanner : startScanner}
                        variant={scannerActive ? "destructive" : "default"}
                        size="sm"
                    >
                        {scannerActive ? "Stop Scanner" : "Start Scanner"}
                    </Button>
                </div>

                <div
                    id="qr-reader"
                    className={`w-full max-w-sm mx-auto rounded-lg overflow-hidden ${scannerActive ? "h-64" : "h-0"
                        }`}
                />

                {!scannerActive && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                        Click "Start Scanner" to scan team QR codes
                    </p>
                )}
            </Card>

            {/* Manual Check-in */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <QrCode className="h-5 w-5 text-accent" />
                    <h2 className="font-semibold">Manual Check-in</h2>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search teams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredTeams.map((team) => {
                        const checkedIn = isTeamCheckedIn(team.id)
                        return (
                            <motion.div
                                key={team.id}
                                initial={false}
                                animate={checkedIn ? { scale: [1, 1.02, 1] } : {}}
                                className={`flex items-center justify-between p-3 rounded-lg border ${checkedIn
                                        ? "bg-green-50 dark:bg-green-950 border-green-200"
                                        : "bg-muted/30"
                                    }`}
                            >
                                <div>
                                    <p className="font-medium">{team.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {team.members?.length || 0} members
                                    </p>
                                </div>
                                {checkedIn ? (
                                    <Badge className="bg-green-100 text-green-700">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Checked In
                                    </Badge>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => handleCheckIn(team.id)}
                                        disabled={processing}
                                    >
                                        Check In
                                    </Button>
                                )}
                            </motion.div>
                        )
                    })}

                    {filteredTeams.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            No teams found
                        </p>
                    )}
                </div>
            </Card>
        </motion.main>
    )
}
