import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, RotateCcw } from "lucide-react"

type ResultStatus = "success" | "error" | "already_used"

interface ScanResultDisplayProps {
    status: ResultStatus
    ticketCode?: string
    eventTitle?: string
    userName?: string
    message?: string
    usedAt?: string
    onReset: () => void
}

export function ScanResultDisplay({
    status,
    ticketCode,
    eventTitle,
    userName,
    message,
    usedAt,
    onReset,
}: ScanResultDisplayProps) {
    const config = {
        success: {
            icon: CheckCircle,
            title: "✓ Valid Ticket",
            bgClass: "bg-green-500/10 border-green-500",
            iconClass: "text-green-500",
            titleClass: "text-green-600",
        },
        error: {
            icon: XCircle,
            title: "✗ Invalid Ticket",
            bgClass: "bg-red-500/10 border-red-500",
            iconClass: "text-red-500",
            titleClass: "text-red-600",
        },
        already_used: {
            icon: AlertTriangle,
            title: "⚠ Already Scanned",
            bgClass: "bg-yellow-500/10 border-yellow-500",
            iconClass: "text-yellow-500",
            titleClass: "text-yellow-600",
        },
    }

    const { icon: Icon, title, bgClass, iconClass, titleClass } = config[status]

    return (
        <Card className={`${bgClass} border-2`}>
            <CardContent className="pt-6">
                <div className="text-center">
                    <Icon className={`h-20 w-20 mx-auto mb-4 ${iconClass}`} />
                    <h2 className={`text-2xl font-bold ${titleClass}`}>{title}</h2>

                    {message && (
                        <p className="text-muted-foreground mt-2">{message}</p>
                    )}

                    {(ticketCode || userName || eventTitle) && (
                        <div className="mt-6 space-y-2 text-left bg-background/50 rounded-lg p-4">
                            {ticketCode && (
                                <p className="text-sm">
                                    <span className="text-muted-foreground">Code:</span>{" "}
                                    <span className="font-mono font-bold">{ticketCode}</span>
                                </p>
                            )}
                            {eventTitle && (
                                <p className="text-sm">
                                    <span className="text-muted-foreground">Event:</span>{" "}
                                    <span className="font-medium">{eventTitle}</span>
                                </p>
                            )}
                            {userName && (
                                <p className="text-sm">
                                    <span className="text-muted-foreground">Attendee:</span>{" "}
                                    <span className="font-medium">{userName}</span>
                                </p>
                            )}
                            {usedAt && status === "already_used" && (
                                <p className="text-sm">
                                    <span className="text-muted-foreground">Used At:</span>{" "}
                                    <span className="font-medium">{usedAt}</span>
                                </p>
                            )}
                        </div>
                    )}

                    <Button
                        onClick={onReset}
                        className="mt-6 gap-2"
                        variant={status === "success" ? "default" : "outline"}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Scan Next Ticket
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
