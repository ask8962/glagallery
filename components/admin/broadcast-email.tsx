"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Send, Loader2, Eye, CheckCircle, AlertCircle, User, Mail, Trophy, Star, Users, Search } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import type { UserProfile } from "@/lib/types"
import { useOrganization } from "@/context/organization-context"
import { isSuperAdminEmail } from "@/lib/config"

const PLACEHOLDERS = [
    { tag: "[Name]", label: "Name", icon: User, description: "User's display name" },
    { tag: "[Email]", label: "Email", icon: Mail, description: "User's email" },
    { tag: "[Points]", label: "Points", icon: Trophy, description: "User's total points" },
    { tag: "[Level]", label: "Level", icon: Star, description: "User's level" },
]

// Sample user for preview
const SAMPLE_USER = {
    name: "Anukalp Gupta",
    email: "ganukalp70@gmail.com",
    points: 1250,
    level: 5,
}

export function BroadcastEmail() {
    const { user, profile } = useAuth()
    const { db } = getFirebase()
    const { organization } = useOrganization()
    const isSuperAdmin = profile?.role === "super_admin" || isSuperAdminEmail(user?.email || "")
    
    const [subject, setSubject] = useState("")
    const [body, setBody] = useState("")
    const [sending, setSending] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
    const [customEmails, setCustomEmails] = useState("")

    // User selection
    const [users, setUsers] = useState<UserProfile[]>([])
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Load users
    useEffect(() => {
        async function loadUsers() {
            if (!organization?.id && !isSuperAdmin) return;
            try {
                const q = isSuperAdmin
                    ? collection(db, "users")
                    : query(collection(db, "users"), where("organizationId", "==", organization?.id))
                const usersSnap = await getDocs(q)
                const usersData: UserProfile[] = []
                usersSnap.forEach((doc) => {
                    usersData.push({ uid: doc.id, ...doc.data() } as UserProfile)
                })
                setUsers(usersData)
                // Default to no one selected for safety
                setSelectedUsers(new Set())
            } catch (error) {
                console.error("Failed to load users:", error)
            } finally {
                setLoadingUsers(false)
            }
        }
        loadUsers()
    }, [db, organization?.id, isSuperAdmin])

    // Filter users by search
    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelectAll = () => {
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set())
        } else {
            setSelectedUsers(new Set(filteredUsers.map(u => u.uid)))
        }
    }

    const toggleUser = (uid: string) => {
        const newSelected = new Set(selectedUsers)
        if (newSelected.has(uid)) {
            newSelected.delete(uid)
        } else {
            newSelected.add(uid)
        }
        setSelectedUsers(newSelected)
    }

    const insertPlaceholder = (tag: string) => {
        const textarea = document.getElementById("broadcast-body") as HTMLTextAreaElement
        if (textarea) {
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const newBody = body.substring(0, start) + tag + body.substring(end)
            setBody(newBody)

            setTimeout(() => {
                textarea.focus()
                textarea.setSelectionRange(start + tag.length, start + tag.length)
            }, 0)
        } else {
            setBody(body + tag)
        }
    }

    const getPreviewText = (text: string) => {
        return text
            .replace(/\[Name\]/gi, SAMPLE_USER.name)
            .replace(/\[Email\]/gi, SAMPLE_USER.email)
            .replace(/\[Points\]/gi, String(SAMPLE_USER.points))
            .replace(/\[Level\]/gi, String(SAMPLE_USER.level))
    }

    const handleSend = async () => {
        console.log("handleSend started");
        
        const customEmailList = customEmails.split(",").map(e => e.trim()).filter(e => e && e.includes("@"));

        if (!subject.trim() || !body.trim()) {
            toast.error("Please fill in both subject and body")
            return
        }

        if (selectedUsers.size === 0 && customEmailList.length === 0) {
            toast.error("Please select at least one user or enter a custom email")
            return
        }

        if (!user?.email) {
            console.error("No user email found in auth context");
            toast.error("You must be logged in to send broadcasts");
            return;
        }

        setSending(true)
        setResult(null)

        try {
            const payload = {
                subject,
                body,
                adminEmail: user.email,
                userIds: Array.from(selectedUsers),
                customEmails: customEmailList,
            };
            console.log("Sending broadcast payload:", payload);

            const token = await user.getIdToken();
            const response = await fetch("/api/admin/broadcast", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            })

            console.log("Response status:", response.status);
            const data = await response.json()
            console.log("Response data:", data);

            if (!response.ok) {
                throw new Error(data.error || "Failed to send broadcast")
            }

            setResult({ sent: data.stats.sent, failed: data.stats.failed })
            toast.success(`Broadcast sent to ${data.stats.sent} users!`)

            setSubject("")
            setBody("")
            setShowConfirm(false) // Close only on success
        } catch (error: any) {
            console.error("Broadcast error in frontend:", error);
            toast.error(error.message || "Failed to send broadcast")
            // Don't close dialog on error so they can retry
        } finally {
            setSending(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Email Broadcast
                </CardTitle>
                <CardDescription>
                    Send a notification email to selected users. Use placeholders for personalization.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* User Selection */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Select Recipients</Label>
                        <Badge variant="secondary">
                            {selectedUsers.size} of {users.length} selected
                        </Badge>
                    </div>

                    {/* Search and Select All */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            className="whitespace-nowrap"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            {selectedUsers.size === filteredUsers.length ? "Deselect All" : "Select All"}
                        </Button>
                    </div>

                    {/* User List */}
                    <ScrollArea className="h-48 border rounded-lg p-2">
                        {loadingUsers ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No users found
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredUsers.map((u) => (
                                    <div
                                        key={u.uid}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                                        onClick={() => toggleUser(u.uid)}
                                    >
                                        <Checkbox
                                            checked={selectedUsers.has(u.uid)}
                                            onCheckedChange={() => toggleUser(u.uid)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{u.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {u.role}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Custom Emails */}
                <div className="space-y-2">
                    <Label htmlFor="custom-emails">Custom Emails (Optional)</Label>
                    <Input
                        id="custom-emails"
                        placeholder="email1@example.com, email2@example.com"
                        value={customEmails}
                        onChange={(e) => setCustomEmails(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Separate multiple emails with commas. Useful for directing to people not in the system.
                    </p>
                </div>

                {/* Placeholders */}
                <div>
                    <Label className="text-sm font-medium mb-2 block">Insert Placeholders</Label>
                    <div className="flex flex-wrap gap-2">
                        {PLACEHOLDERS.map((p) => (
                            <Button
                                key={p.tag}
                                variant="outline"
                                size="sm"
                                onClick={() => insertPlaceholder(p.tag)}
                                className="gap-1"
                            >
                                <p.icon className="h-3 w-3" />
                                {p.label}
                            </Button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Click to insert placeholder at cursor position
                    </p>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                    <Label htmlFor="broadcast-subject">Subject *</Label>
                    <Input
                        id="broadcast-subject"
                        placeholder="Hey [Name], exciting news from GLA Gallery!"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>

                {/* Body */}
                <div className="space-y-2">
                    <Label htmlFor="broadcast-body">Message Body *</Label>
                    <Textarea
                        id="broadcast-body"
                        placeholder="Hey [Name],

We have an exciting update for you! Your current points: [Points]

Check out the latest features on GLA Gallery..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                    />
                </div>

                {/* Preview Toggle */}
                {(subject || body) && (
                    <div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className="gap-2"
                        >
                            <Eye className="h-4 w-4" />
                            {showPreview ? "Hide" : "Show"} Preview
                        </Button>

                        {showPreview && (
                            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary">Preview</Badge>
                                    <span className="text-xs text-muted-foreground">
                                        (Sample: {SAMPLE_USER.name})
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">{getPreviewText(subject) || "(No subject)"}</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {getPreviewText(body) || "(No message)"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-green-500/10">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                            <p className="font-medium text-green-700 dark:text-green-400">
                                Broadcast Complete!
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Sent: {result.sent} | Failed: {result.failed}
                            </p>
                        </div>
                    </div>
                )}

                {/* Send Button */}
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowConfirm(true)}
                        disabled={!subject.trim() || !body.trim() || (selectedUsers.size === 0 && customEmails.trim() === "") || sending}
                        className="gap-2"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Send Broadcast
                            </>
                        )}
                    </Button>
                </div>

                {/* Confirmation Dialog */}
                <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                                Confirm Broadcast
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will send an email to <strong>{selectedUsers.size} registered user{selectedUsers.size !== 1 ? 's' : ''}</strong>
                                {customEmails.trim() !== "" ? ` and your custom email recipients` : ""}.
                                This action cannot be undone. Are you sure you want to proceed?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={sending}>
                                Cancel
                            </Button>
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    console.log("Confirm clicked, triggering handleSend");
                                    handleSend();
                                }}
                                disabled={sending}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    `Yes, Send Broadcast`
                                )}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}
