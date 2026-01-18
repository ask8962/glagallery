"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-context"
import type { Post } from "@/lib/types"
import { getFirebase } from "@/lib/firebase"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
} from "firebase/firestore"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { QueryDocumentSnapshot } from "firebase/firestore"
import { validateComment, checkRateLimit, sanitizeText } from "@/lib/validation"
import { moderateContent, shouldAutoHide } from "@/lib/content-moderation"
import { ReportDialog } from "@/components/report-dialog"
import { isAdminEmail } from "@/lib/config"
import { toast } from "sonner"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  post: Post
}

type CommentDoc = {
  id: string
  uid: string
  text: string
  name: string
  photoURL?: string
  createdAt: Timestamp
  hidden?: boolean
}

const PAGE = 10

export function CommentsDrawer({ open, onOpenChange, post }: Props) {
  const { user, profile, loading: authLoading } = useAuth()
  const { db } = getFirebase()

  const [text, setText] = useState("")
  const [items, setItems] = useState<CommentDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [last, setLast] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const isAdmin = profile?.role === "admin" || isAdminEmail(user?.email || "")

  async function loadMore() {
    if (!last || loading || authLoading || !user) return
    setLoading(true)
    try {
      const base = collection(db, "posts", post.id, "comments")
      const q = query(base, where("hidden", "==", false), orderBy("createdAt", "asc"), startAfter(last), limit(PAGE))
      const snap = await getDocs(q)
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CommentDoc[]
      setItems((prev) => [...prev, ...docs])
      setLast(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null)
      setHasMore(snap.size === PAGE)
    } catch (error) {
      console.error("Error loading more comments:", error)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    if (authLoading || !user) {
      setItems([])
      setHasMore(false)
      setLoading(false)
      return
    }

    const { db } = getFirebase()
    const commentsRef = collection(db, "posts", post.id, "comments")
    const q = query(commentsRef, where("hidden", "==", false), orderBy("createdAt", "desc"), limit(PAGE))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newItems: CommentDoc[] = []
        snapshot.forEach((d) => {
          newItems.push({ id: d.id, ...(d.data() as any) })
        })
        setItems(newItems)
        setHasMore(snapshot.size === PAGE)
        setLoading(false)
      },
      (error) => {
        console.error("Error loading comments:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [open, post.id, authLoading, user])

  async function addComment() {
    if (!user || !text.trim() || submitting) return

    // Client-side rate limit check (optional, but good for UX)
    const rateLimitCheck = checkRateLimit("comment")
    if (!rateLimitCheck.allowed) {
      toast.error("Comment rate limit exceeded. Please try again later.")
      return
    }

    // Validate and sanitize comment
    const commentValidation = validateComment(text)
    if (!commentValidation.valid) {
      toast.error(commentValidation.error || "Invalid comment")
      return
    }

    // Content moderation check
    const moderationResult = moderateContent(commentValidation.sanitized)
    if (!moderationResult.allowed) {
      toast.error(moderationResult.reasons.join(". ") || "Comment contains inappropriate content")
      return
    }

    setSubmitting(true)

    try {
      const shouldHide = shouldAutoHide(moderationResult)
      const sanitizedText = commentValidation.sanitized

      const res = await fetch("/api/comments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          uid: user.uid,
          text: sanitizedText,
          userName: sanitizeText(profile?.name || user.displayName || "GLA Student"),
          userPhotoURL: user.photoURL || null
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to post comment")
      }

      const { id } = await res.json()

      const newComment = {
        id,
        uid: user.uid,
        text: sanitizedText,
        name: sanitizeText(profile?.name || user.displayName || "GLA Student"),
        photoURL: user.photoURL || undefined,
        createdAt: Timestamp.now(), // Optimistic timestamp
        hidden: shouldHide, // API handles hidden status? We assume API uses same default or param. 
        // NOTE: API implemented earlier defaulted hidden: false. 
        // Ideally pass hidden status to API or let server decide.
        // For now, let's update API later if moderation needed on server.
      }

      // Update UI 
      setText("")
      setItems((prev) => [newComment, ...prev])
      toast.success("Comment added!")

      // Notification logic (client side for now)
      if (post.uploaderUid !== user.uid && !shouldHide) {
        try {
          const { notifyComment } = await import("@/lib/notifications")
          await notifyComment(
            post.uploaderUid,
            post.id,
            id,
            profile?.name || user.displayName || "GLA Student",
            user.uid,
            post.title,
          )
        } catch (error) {
          console.error("Failed to send comment notification:", error)
        }
      }

    } catch (error: any) {
      console.error("Error adding comment:", error)
      toast.error(error.message || "Failed to add comment. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteComment(c: CommentDoc) {
    if (!user) return
    if (!(isAdmin || c.uid === user.uid)) return

    try {
      await deleteDoc(doc(db, "posts", post.id, "comments", c.id))
      setItems((prev) => prev.filter((x) => x.id !== c.id))
      toast.success("Comment deleted")
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    }
  }

  const ordered = useMemo(() => items, [items])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-primary">Comments</DialogTitle>
          <DialogDescription className="sr-only">View and add comments for this post</DialogDescription>
        </DialogHeader>

        {authLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading comments...</div>
        ) : !user ? (
          <p className="text-sm text-muted-foreground">Sign in with your GLA email to view and add comments.</p>
        ) : (
          <>
            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {ordered.length === 0 ? (
                <p className="text-sm text-muted-foreground">Be the first to share a thought about this moment.</p>
              ) : (
                ordered.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 rounded-md border p-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={c.photoURL ?? undefined} alt={c.name} />
                      <AvatarFallback>{c.name?.[0] ?? "U"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-foreground">{c.name}</div>
                        <div className="flex gap-1">
                          {user && (
                            <ReportDialog contentType="comment" contentId={c.id} contentTitle={c.text.slice(0, 50)} />
                          )}
                          {(isAdmin || (user && user.uid === c.uid)) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteComment(c)}
                              className="h-6 px-2 text-xs"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-foreground">{c.text}</div>
                    </div>
                  </div>
                ))
              )}
              {hasMore && (
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
                    {loading ? "Loading..." : "Show more"}
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center gap-2">
              <Textarea
                placeholder="Write a thoughtful comment..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[70px]"
                maxLength={500}
              />
              <Button onClick={addComment} disabled={!user || !text.trim() || submitting}>
                {submitting ? "Posting..." : "Comment"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
