"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { Loader2, ShieldCheck, AlertCircle, FileText, CheckCircle2 } from "lucide-react"

interface ClubVerificationRequestFormProps {
    clubId: string
    clubName: string
    currentStatus?: "unverified" | "pending" | "verified" | "rejected"
    rejectionReason?: string
}

export function ClubVerificationRequestForm({
    clubId,
    clubName,
    currentStatus = "unverified",
    rejectionReason,
}: ClubVerificationRequestFormProps) {
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        registrationNumber: "",
        advisorName: "",
        advisorEmail: "",
        advisorDepartment: "",
        documentUrl: "", // For now simple URL input, can be file upload later
    })

    // Status Badge Logic
    if (currentStatus === "verified") {
        return (
            <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Verified Club</AlertTitle>
                <AlertDescription>
                    This club is officially verified by the university.
                </AlertDescription>
            </Alert>
        )
    }

    if (currentStatus === "pending") {
        return (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <AlertTitle>Verification Pending</AlertTitle>
                <AlertDescription>
                    Your verification request is under review by the administration.
                </AlertDescription>
            </Alert>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const token = await user?.getIdToken()
            const res = await fetch("/api/clubs/verify/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    clubId,
                    ...formData, // registrationNumber, advisorUid (we need lookup?), documents
                    // The API expects: clubId, registrationNumber, advisorUid (optional), documents (array)
                    // Since we track advisor by email in this form, we might need to adjust API or just pass it as metadata
                    // For now let's pass it as is and update API to handle it locally? 
                    // Actually the API expects 'advisorUid'. Let's assumes we just pass the text fields for now
                    // and maybe the API needs to be flexible or we look up the advisor.
                    // Let's rely on manual admin review for these fields.

                    // Wait, the API I wrote in Step 3290 expects: 
                    // clubId, registrationNumber, advisorUid, documents

                    // I should update this form to match or update the API?
                    // The form asks for Name/Email. The API wants UID.
                    // Let's just send the text details as part of 'documents' or extra metadata?
                    // Actually, let's just send the registration number and document URL for now 
                    // and let the advisor part be handled via 'advisorUid' if they select a user?

                    // Let's keep it simple: Just Registration Number and Document URL
                    documents: [formData.documentUrl],
                    // We can't easily get advisorUid from email without a lookup API.
                    // Let's omit advisorUid for now and let Admin set it manually during approval?
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to submit request")
            }

            toast.success("Verification request submitted")
            setOpen(false)
            // Ideally refresh the page or parent state
            window.location.reload()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            {currentStatus === "rejected" && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Verification Rejected</AlertTitle>
                    <AlertDescription>
                        Reason: {rejectionReason}
                        <br />
                        You can modify your details and submit a new request.
                    </AlertDescription>
                </Alert>
            )}

            <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-accent" />
                            Club Verification
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {currentStatus === "unverified"
                                ? "Get verified to unlock exclusive features."
                                : "Resubmit verification request."}
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                {currentStatus === "rejected" ? "Appeal / Retry" : "Request Verification"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Request Club Verification</DialogTitle>
                                <DialogDescription>
                                    Submit official documents to get verified status for {clubName}.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="regNum">Registration Number / Club ID</Label>
                                    <Input
                                        id="regNum"
                                        placeholder="e.g. GLA-CLUB-2024-001"
                                        value={formData.registrationNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="docUrl">Supporting Document URL</Label>
                                    <Input
                                        id="docUrl"
                                        placeholder="Link to Google Drive / PDF (Constitution, Approval Letter)"
                                        value={formData.documentUrl}
                                        onChange={(e) => setFormData(prev => ({ ...prev, documentUrl: e.target.value }))}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Provide a link to your club's approval letter or constitution.
                                    </p>
                                </div>

                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Submit Request
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    )
}
