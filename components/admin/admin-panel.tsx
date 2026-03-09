"use client"

import { useEffect, useState } from "react"
import {
  collection,
  collectionGroup,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  doc,
  where,
  Timestamp,
} from "firebase/firestore"
import { getFirebase } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { isAdminEmail } from "@/lib/config"
import { toast } from "sonner"
import {
  AlertTriangle,
  Check,
  X,
  Eye,
  EyeOff,
  Users,
  FileImage,
  MessageSquare,
  Flag,
  Mail,
  RefreshCw,
  Settings,
  Loader2 as Spinner
} from "lucide-react"
import { PlatformSettings } from "./platform-settings"

type Post = {
  id: string
  title?: string
  mediaURL?: string
  uploaderUid: string
  uploaderName?: string
  status?: "pending" | "approved" | "removed" | "flagged"
  createdAt?: any
}

type CommentRow = {
  id: string
  postId: string
  text: string
  name?: string
  uid?: string
  reported?: boolean
  hidden?: boolean
  createdAt?: any
}

type Report = {
  id: string
  contentType: "post" | "comment" | "user"
  contentId: string
  contentTitle?: string
  reportedBy: string
  reportedByName: string
  reason: string
  details?: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  createdAt?: any
}

type EmailLog = {
  id: string
  userId: string
  email: string
  notificationType: string
  status: "pending" | "sent" | "failed"
  error?: string
  createdAt?: any
}

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  points?: number
  createdAt?: any
  lastActive?: any
}

export function AdminPanel() {
  const { user, profile } = useAuth()
  const { db } = getFirebase()
  const [tab, setTab] = useState("posts")
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<CommentRow[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [users, setUsers] = useState<UserRow[]>([])

  const authorized = profile?.role === "admin" || isAdminEmail(user?.email || "")

  const loadPosts = async () => {
    setLoading(true)
    try {
      const q = query(
        collection(db, "posts"),
        where("status", "in", ["pending", "flagged"]),
        orderBy("createdAt", "desc"),
        limit(50),
      )
      const snap = await getDocs(q)
      setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Post[])
    } catch (error) {
      console.error("Error loading posts:", error)
      toast.error("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  const loadReportedComments = async () => {
    setLoading(true)
    try {
      const q = query(
        collectionGroup(db, "comments"),
        where("reported", "==", true),
        orderBy("createdAt", "desc"),
        limit(100),
      )
      const snap = await getDocs(q)
      setComments(
        snap.docs.map((d) => {
          const postPath = d.ref.parent.parent
          return {
            id: d.id,
            postId: postPath?.id || "",
            ...(d.data() as any),
          } as CommentRow
        }),
      )
    } catch (error) {
      console.error("Error loading comments:", error)
      toast.error("Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      const q = query(
        collection(db, "reports"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc"),
        limit(100),
      )
      const snap = await getDocs(q)
      setReports(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Report[])
    } catch (error) {
      console.error("Error loading reports:", error)
      toast.error("Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  const loadEmailLogs = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "email_logs"), orderBy("createdAt", "desc"), limit(100))
      const snap = await getDocs(q)
      setEmailLogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as EmailLog[])
    } catch (error) {
      console.error("Error loading email logs:", error)
      toast.error("Failed to load email logs")
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "users"), orderBy("points", "desc"), limit(100))
      const snap = await getDocs(q)
      setUsers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as UserRow[])
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authorized) return
    if (tab === "posts") loadPosts()
    if (tab === "comments") loadReportedComments()
    if (tab === "reports") loadReports()
    if (tab === "emails") loadEmailLogs()
    if (tab === "users") loadUsers()
  }, [tab, authorized])

  if (!authorized) {
    return (
      <Card className="mt-4 p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">Not authorized. Please sign in with an admin account.</p>
        </div>
      </Card>
    )
  }

  const approve = async (postId: string) => {
    try {
      await updateDoc(doc(db, "posts", postId), {
        status: "approved",
        approvedAt: Timestamp.now(),
        approvedBy: user?.uid,
      } as any)
      toast.success("Post approved")
      await loadPosts()
    } catch (error) {
      console.error("Error approving post:", error)
      toast.error("Failed to approve post")
    }
  }

  const remove = async (postId: string) => {
    try {
      await updateDoc(doc(db, "posts", postId), {
        status: "removed",
        removedAt: Timestamp.now(),
        removedBy: user?.uid,
      } as any)
      toast.success("Post removed")
      await loadPosts()
    } catch (error) {
      console.error("Error removing post:", error)
      toast.error("Failed to remove post")
    }
  }

  const hideComment = async (postId: string, commentId: string, hidden: boolean) => {
    try {
      await updateDoc(doc(db, `posts/${postId}/comments/${commentId}`), {
        hidden,
        moderatedAt: Timestamp.now(),
        moderatedBy: user?.uid,
      } as any)
      toast.success(hidden ? "Comment hidden" : "Comment unhidden")
      await loadReportedComments()
    } catch (error) {
      console.error("Error moderating comment:", error)
      toast.error("Failed to moderate comment")
    }
  }

  const resolveReport = async (reportId: string, status: "resolved" | "dismissed") => {
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status,
        resolvedAt: Timestamp.now(),
        resolvedBy: user?.uid,
      })
      toast.success(`Report ${status}`)
      await loadReports()
    } catch (error) {
      console.error("Error resolving report:", error)
      toast.error("Failed to resolve report")
    }
  }

  const updateUserRole = async (userId: string, newRole: "student" | "admin") => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        roleUpdatedAt: Timestamp.now(),
        roleUpdatedBy: user?.uid,
      })
      toast.success(`User role updated to ${newRole}`)
      await loadUsers()
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error("Failed to update user role")
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <div className="mt-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            <span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Comments</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Emails</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pending/Flagged Posts</h3>
            <Button variant="outline" size="sm" onClick={loadPosts} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Spinner className="h-4 w-4" /> Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No pending posts</p>
          ) : (
            <ul className="space-y-3">
              {posts.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{p.title || "Untitled"}</div>
                      <div className="text-xs text-muted-foreground">
                        By: {p.uploaderName || "Unknown"} | {formatDate(p.createdAt)}
                      </div>
                      <Badge variant={p.status === "flagged" ? "destructive" : "secondary"} className="mt-1">
                        {p.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => approve(p.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Reported Comments</h3>
            <Button variant="outline" size="sm" onClick={loadReportedComments} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Spinner className="h-4 w-4" /> Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No reported comments</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{c.name || "User"}</div>
                      <p className="text-sm text-foreground mt-1">{c.text}</p>
                      <div className="text-xs text-muted-foreground mt-1">Post ID: {c.postId}</div>
                      {c.hidden && (
                        <Badge variant="secondary" className="mt-1">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.hidden ? (
                        <Button size="sm" variant="outline" onClick={() => hideComment(c.postId, c.id, false)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Unhide
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => hideComment(c.postId, c.id, true)}>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Content Reports</h3>
            <Button variant="outline" size="sm" onClick={loadReports} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Spinner className="h-4 w-4" /> Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No pending reports</p>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{r.contentType}</Badge>
                        <span className="text-sm font-medium">{r.reason}</span>
                      </div>
                      {r.contentTitle && <p className="text-sm text-muted-foreground mt-1">"{r.contentTitle}"</p>}
                      {r.details && <p className="text-sm text-foreground mt-1">{r.details}</p>}
                      <div className="text-xs text-muted-foreground mt-2">
                        Reported by: {r.reportedByName} | {formatDate(r.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => resolveReport(r.id, "resolved")}>
                        <Check className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => resolveReport(r.id, "dismissed")}>
                        <X className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Email Logs</h3>
            <Button variant="outline" size="sm" onClick={loadEmailLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Spinner className="h-4 w-4" /> Loading email logs...
            </div>
          ) : emailLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No email logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => (
                    <tr key={log.id} className="border-b">
                      <td className="p-2 truncate max-w-[200px]">{log.email}</td>
                      <td className="p-2">
                        <Badge variant="outline">{log.notificationType}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={
                            log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "secondary"
                          }
                        >
                          {log.status}
                        </Badge>
                        {log.error && <span className="text-xs text-destructive block">{log.error}</span>}
                      </td>
                      <td className="p-2 text-muted-foreground">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">User Management</h3>
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Spinner className="h-4 w-4" /> Loading users...
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Points</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="p-2 font-medium">{u.name}</td>
                      <td className="p-2 text-muted-foreground truncate max-w-[200px]">{u.email}</td>
                      <td className="p-2">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                      </td>
                      <td className="p-2">{u.points || 0}</td>
                      <td className="p-2">
                        {u.role === "admin" ? (
                          <Button size="sm" variant="ghost" onClick={() => updateUserRole(u.id, "student")}>
                            Demote
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => updateUserRole(u.id, "admin")}>
                            Make Admin
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <PlatformSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
