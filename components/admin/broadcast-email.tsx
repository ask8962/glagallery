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
import { Send, Loader2, Eye, CheckCircle, AlertCircle, User, Mail, Trophy, Star, Users, Search, Maximize2 } from "lucide-react"
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

// Generate the exact same HTML template as the backend for accurate live preview
function generatePreviewHTML(subject: string, body: string): string {
    const formattedBody = body
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: transparent; /* Makes it look seamless in the UI */
      color: #18181b;
      -webkit-font-smoothing: antialiased;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      border-radius: 12px;
      border: 1px solid #e4e4e7;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #09090b 0%, #27272a 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .header span {
      color: #3b82f6;
    }
    .content {
      padding: 40px;
    }
    .subject {
      color: #09090b;
      margin: 0 0 24px 0;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: -0.025em;
    }
    .body-text {
      color: #3f3f46;
      font-size: 16px;
      line-height: 1.6;
      margin: 0;
    }
    .body-text p {
      margin-top: 0;
      margin-bottom: 16px;
    }
    .cta-container {
      padding: 0 40px 40px 40px;
      text-align: left;
    }
    .button {
      display: inline-block;
      background-color: #09090b;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
    }
    .footer {
      padding: 32px 20px;
      text-align: center;
      color: #71717a;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer a {
      color: #52525b;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <table class="main" cellpadding="0" cellspacing="0" align="center">
    <tr>
      <td class="header">
        <h1>Campus<span>Hub</span></h1>
      </td>
    </tr>
    <tr>
      <td class="content">
        <h2 class="subject">${subject || "Subject line will appear here..."}</h2>
        <div class="body-text">
          <p>${formattedBody || "Start typing your message to see the preview..."}</p>
        </div>
      </td>
    </tr>
    <tr>
      <td class="cta-container">
        <a href="#" class="button">Open CampusHub &rarr;</a>
      </td>
    </tr>
  </table>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} CampusHub. The ultimate campus operating system.</p>
    <p>You received this email because you are a registered user.</p>
  </div>
</body>
</html>`;
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

            const token = await user.getIdToken();
            const response = await fetch("/api/admin/broadcast", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to send broadcast")
            }

            setResult({ sent: data.stats.sent, failed: data.stats.failed })
            toast.success(`Broadcast sent to ${data.stats.sent} users!`)

            setSubject("")
            setBody("")
            setShowConfirm(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to send broadcast")
        } finally {
            setSending(false)
        }
    }

    // Replace placeholders with sample data for the preview
    const previewSubject = getPreviewText(subject);
    const previewBody = getPreviewText(body);
    const htmlPreview = generatePreviewHTML(previewSubject, previewBody);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Form Controls */}
            <Card className="border-border/50 shadow-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Send className="h-6 w-6 text-primary" />
                        Campaign Builder
                    </CardTitle>
                    <CardDescription>
                        Design and send beautiful email broadcasts to your community.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 relative">
                    
                    {/* User Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Select Recipients</Label>
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                {selectedUsers.size} of {users.length} selected
                            </Badge>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-background/50 focus-visible:ring-primary/50"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleSelectAll}
                                className="whitespace-nowrap hover:bg-primary/5"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                {selectedUsers.size === filteredUsers.length ? "Deselect All" : "Select All"}
                            </Button>
                        </div>

                        <ScrollArea className="h-[200px] border rounded-xl p-2 bg-muted/20">
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
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
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
                                            <Badge variant="outline" className="text-[10px] font-medium bg-background/50">
                                                {u.role}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="custom-emails" className="text-base font-semibold">Custom Email Addresses</Label>
                        <Input
                            id="custom-emails"
                            placeholder="investor@example.com, partner@example.com"
                            value={customEmails}
                            onChange={(e) => setCustomEmails(e.target.value)}
                            className="bg-background/50 focus-visible:ring-primary/50"
                        />
                        <p className="text-xs text-muted-foreground">
                            Comma separated. Send to people who aren't registered users.
                        </p>
                    </div>

                    {/* Email Content Builder */}
                    <div className="space-y-6 pt-4 border-t">
                        <div className="space-y-3">
                            <Label htmlFor="broadcast-subject" className="text-base font-semibold">Subject Line</Label>
                            <Input
                                id="broadcast-subject"
                                placeholder="Hey [Name], exciting news!"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-background/50 text-lg py-6 focus-visible:ring-primary/50"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="broadcast-body" className="text-base font-semibold">Message Body</Label>
                            </div>
                            
                            {/* Smart Placeholders */}
                            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/30 rounded-lg border border-border/50">
                                <span className="text-xs font-medium text-muted-foreground self-center mr-2 ml-1">Insert:</span>
                                {PLACEHOLDERS.map((p) => (
                                    <Button
                                        key={p.tag}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => insertPlaceholder(p.tag)}
                                        className="h-7 text-xs bg-background/50 hover:bg-primary/10 hover:text-primary border border-border/50 shadow-sm"
                                    >
                                        <p.icon className="h-3 w-3 mr-1.5" />
                                        {p.label}
                                    </Button>
                                ))}
                            </div>

                            <Textarea
                                id="broadcast-body"
                                placeholder="We have an exciting update for you! Check out the latest features..."
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={12}
                                className="font-mono text-sm leading-relaxed bg-background/50 focus-visible:ring-primary/50 resize-y"
                            />
                        </div>
                    </div>

                    {result && (
                        <div className="flex items-center gap-4 p-4 border rounded-xl bg-green-500/10 border-green-500/20">
                            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-green-700 dark:text-green-400">
                                    Campaign Delivered
                                </p>
                                <p className="text-sm text-green-600/80 dark:text-green-400/80">
                                    Successfully sent to {result.sent} recipients. {result.failed > 0 && \`(\${result.failed} failed)\`}
                                </p>
                            </div>
                        </div>
                    )}

                    <Button
                        size="lg"
                        onClick={() => setShowConfirm(true)}
                        disabled={!subject.trim() || !body.trim() || (selectedUsers.size === 0 && customEmails.trim() === "") || sending}
                        className="w-full text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Processing Campaign...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5 mr-2" />
                                Send Broadcast
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Right Column: Live Interactive Preview */}
            <div className="lg:sticky lg:top-24 space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Live Inbox Preview
                    </h3>
                    <Badge variant="outline" className="bg-background">
                        Personalized for: {SAMPLE_USER.name}
                    </Badge>
                </div>
                
                <div className="relative rounded-2xl border shadow-2xl bg-[#f4f4f5] overflow-hidden group">
                    {/* Fake Browser Chrome */}
                    <div className="h-10 bg-muted/80 border-b flex items-center px-4 gap-2 backdrop-blur-md">
                        <div className="flex gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-red-400/80" />
                            <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                            <div className="h-3 w-3 rounded-full bg-green-400/80" />
                        </div>
                        <div className="mx-auto bg-background/50 rounded-md px-3 py-1 text-xs text-muted-foreground font-medium flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {SAMPLE_USER.email}
                        </div>
                    </div>

                    {/* Email Content via iframe (isolated styles) */}
                    <div className="h-[700px] w-full bg-transparent p-4 overflow-hidden relative">
                        {(!subject && !body) ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <Maximize2 className="h-12 w-12 mb-4 opacity-20" />
                                <p>Start typing to see magic...</p>
                            </div>
                        ) : null}
                        
                        <iframe 
                            srcDoc={htmlPreview}
                            title="Email Preview"
                            className="w-full h-full border-none bg-transparent relative z-10"
                            sandbox="allow-same-origin"
                        />
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent className="border-border/50 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            Launch Campaign?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            You are about to broadcast this email to <strong>{selectedUsers.size} registered user{selectedUsers.size !== 1 ? 's' : ''}</strong>
                            {customEmails.trim() !== "" ? ` and your custom recipients` : ""}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
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
                                "Yes, Blast it 🚀"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

