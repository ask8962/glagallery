"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Check, X, Loader2, Eye, GraduationCap } from "lucide-react"

type FacultyRequest = {
    id: string
    uid: string
    email: string
    department: string
    designation: string
    employeeId?: string
    cabinNumber?: string
    officeHours?: string
    subjects: string[]
    researchAreas: string[]
    status: "pending" | "approved" | "rejected"
    submittedAt: string
    userName: string
    userPhoto?: string
}

export function FacultyVerification() {
    const { user } = useAuth()
    const { organization } = useOrganization()
    const [requests, setRequests] = useState<FacultyRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<FacultyRequest | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [showRejectDialog, setShowRejectDialog] = useState(false)

    useEffect(() => {
        fetchRequests()
    }, [user])

    const fetchRequests = async () => {
        if (!user || !organization?.id) return

        try {
            const token = await user.getIdToken()
            const res = await fetch(`/api/faculty/verify?status=pending&organizationId=${organization.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setRequests(data.requests)
            }
        } catch (error) {
            console.error("Error fetching requests:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (requestId: string, action: "approve" | "reject") => {
        if (action === "reject" && !rejectionReason) {
            toast.error("Please provide a rejection reason")
            return
        }

        setActionLoading(requestId)
        try {
            const token = await user?.getIdToken()
            const res = await fetch("/api/faculty/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    requestId,
                    action,
                    rejectionReason: action === "reject" ? rejectionReason : undefined,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }

            toast.success(action === "approve" ? "Faculty approved!" : "Request rejected")
            setRequests(prev => prev.filter(r => r.id !== requestId))
            setShowRejectDialog(false)
            setRejectionReason("")
            setSelectedRequest(null)
        } catch (error: any) {
            toast.error(error.message || "Action failed")
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending faculty verification requests</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-accent" />
                    Faculty Verification Requests
                </h3>
                <Badge variant="outline">{requests.length} pending</Badge>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Employee ID</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={req.userPhoto} />
                                            <AvatarFallback>{req.userName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{req.userName}</p>
                                            <p className="text-xs text-muted-foreground">{req.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{req.department}</TableCell>
                                <TableCell>{req.designation}</TableCell>
                                <TableCell>{req.employeeId || "-"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(req.submittedAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setSelectedRequest(req)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-green-600 hover:bg-green-50"
                                            disabled={actionLoading === req.id}
                                            onClick={() => handleAction(req.id, "approve")}
                                        >
                                            {actionLoading === req.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 hover:bg-red-50"
                                            disabled={actionLoading === req.id}
                                            onClick={() => {
                                                setSelectedRequest(req)
                                                setShowRejectDialog(true)
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* View Details Dialog */}
            <Dialog open={!!selectedRequest && !showRejectDialog} onOpenChange={() => setSelectedRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Faculty Registration Details</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Name</p>
                                    <p className="font-medium">{selectedRequest.userName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{selectedRequest.email}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Department</p>
                                    <p className="font-medium">{selectedRequest.department}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Designation</p>
                                    <p className="font-medium">{selectedRequest.designation}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Employee ID</p>
                                    <p className="font-medium">{selectedRequest.employeeId || "Not provided"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Cabin</p>
                                    <p className="font-medium">{selectedRequest.cabinNumber || "Not provided"}</p>
                                </div>
                            </div>
                            {selectedRequest.subjects.length > 0 && (
                                <div>
                                    <p className="text-muted-foreground text-sm mb-1">Subjects</p>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedRequest.subjects.map((s, i) => (
                                            <Badge key={i} variant="secondary">{s}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedRequest.researchAreas.length > 0 && (
                                <div>
                                    <p className="text-muted-foreground text-sm mb-1">Research Areas</p>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedRequest.researchAreas.map((a, i) => (
                                            <Badge key={i} variant="outline">{a}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Registration</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejection. This will be shared with the applicant.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Enter rejection reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!rejectionReason || actionLoading === selectedRequest?.id}
                            onClick={() => selectedRequest && handleAction(selectedRequest.id, "reject")}
                        >
                            {actionLoading === selectedRequest?.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Reject
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
