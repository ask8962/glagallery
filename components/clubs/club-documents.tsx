"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ClubDocument } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { FileText, Upload, Trash2, Download, Loader2, FileSpreadsheet, File } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface ClubDocumentsProps {
    clubId: string
    isAdmin: boolean
}

const documentTypeLabels: Record<string, string> = {
    constitution: "Constitution",
    minutes: "Meeting Minutes",
    budget: "Budget",
    report: "Report",
    other: "Other"
}

const documentTypeIcons: Record<string, React.ReactNode> = {
    constitution: <FileText className="h-5 w-5" />,
    minutes: <FileSpreadsheet className="h-5 w-5" />,
    budget: <FileSpreadsheet className="h-5 w-5" />,
    report: <File className="h-5 w-5" />,
    other: <File className="h-5 w-5" />
}

export function ClubDocuments({ clubId, isAdmin }: ClubDocumentsProps) {
    const { user } = useAuth()
    const [documents, setDocuments] = useState<ClubDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Upload form state
    const [file, setFile] = useState<File | null>(null)
    const [docName, setDocName] = useState("")
    const [docType, setDocType] = useState<string>("")

    useEffect(() => {
        fetchDocuments()
    }, [clubId])

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/documents`)
            if (res.ok) {
                const data = await res.json()
                setDocuments(data.documents)
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!file || !docName || !docType || !user) {
            toast.error("Please fill all fields")
            return
        }

        setUploading(true)
        try {
            const token = await user.getIdToken()
            const formData = new FormData()
            formData.append("file", file)
            formData.append("name", docName)
            formData.append("type", docType)

            const res = await fetch(`/api/clubs/${clubId}/documents`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Upload failed")
            }

            toast.success("Document uploaded successfully")
            setDialogOpen(false)
            setFile(null)
            setDocName("")
            setDocType("")
            fetchDocuments()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (docId: string) => {
        if (!user || !confirm("Are you sure you want to delete this document?")) return

        try {
            const token = await user.getIdToken()
            const res = await fetch(`/api/clubs/${clubId}/documents?docId=${docId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Delete failed")
            }

            toast.success("Document deleted")
            fetchDocuments()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                </CardTitle>
                {isAdmin && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Upload className="h-4 w-4" />
                                Upload
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Upload Document</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="file">File (PDF or Word)</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Document Name</Label>
                                    <Input
                                        id="name"
                                        value={docName}
                                        onChange={(e) => setDocName(e.target.value)}
                                        placeholder="e.g., Club Constitution 2025"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Document Type</Label>
                                    <Select value={docType} onValueChange={setDocType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="constitution">Constitution</SelectItem>
                                            <SelectItem value="minutes">Meeting Minutes</SelectItem>
                                            <SelectItem value="budget">Budget</SelectItem>
                                            <SelectItem value="report">Report</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleUpload}
                                    disabled={uploading || !file || !docName || !docType}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Uploading...
                                        </>
                                    ) : (
                                        "Upload Document"
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent>
                {documents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                        No documents uploaded yet
                    </p>
                ) : (
                    <div className="space-y-3">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        {documentTypeIcons[doc.type]}
                                    </div>
                                    <div>
                                        <p className="font-medium">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {documentTypeLabels[doc.type]} • {format(doc.uploadedAt?.toDate ? doc.uploadedAt.toDate() : new Date(doc.uploadedAt), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => window.open(doc.url, "_blank")}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    {isAdmin && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(doc.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
