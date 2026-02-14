"use client"

import { QRCodeSVG } from "qrcode.react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, CheckCircle2 } from "lucide-react"
import type { Team } from "@/lib/types"

interface TeamQRCodeProps {
    hackathonId: string
    team: Team
}

export function TeamQRCode({ hackathonId, team }: TeamQRCodeProps) {
    // QR encodes a proper URL so external scanners redirect to the check-in page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://campushub.pro"
    const qrData = `${baseUrl}/hackathons/${hackathonId}/check-in?team=${team.id}`

    const isCheckedIn = (team as any).checkedIn === true

    return (
        <Card className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
                <QrCode className="h-5 w-5" />
                <h3 className="font-semibold">Team Check-in QR Code</h3>
            </div>

            {isCheckedIn ? (
                <div className="flex flex-col items-center gap-3 py-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        ✓ Checked In
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                        Your team has been checked in at the venue
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                        <QRCodeSVG
                            value={qrData}
                            size={200}
                            level="H"
                            includeMargin
                            bgColor="#ffffff"
                            fgColor="#000000"
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                            Show this QR code at the venue entry for check-in
                        </p>
                    </div>

                    <Badge variant="outline" className="text-xs">
                        Team ID: {team.id.slice(0, 8)}...
                    </Badge>
                </>
            )}
        </Card>
    )
}
