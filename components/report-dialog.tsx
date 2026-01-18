"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Flag, Loader2 } from "lucide-react"
import { getFirebase } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { sanitizeText, checkRateLimit } from "@/lib/validation"

interface ReportDialogProps {
  contentType: "post" | "comment" | "user"
  contentId: string
  contentTitle?: string
  trigger?: React.ReactNode
}

const REPORT_REASONS = {
  post: [
    "Inappropriate content",
    "Spam or misleading",
    "Copyright violation",
    "Harassment or bullying",
    "Violence or dangerous content",
    "Other",
  ],
  comment: ["Inappropriate language", "Spam", "Harassment or bullying", "Off-topic", "Other"],
  user: ["Harassment or bullying", "Spam account", "Impersonation", "Inappropriate behavior", "Other"],
}

export function ReportDialog({ contentType, contentId, contentTitle, trigger }: ReportDialogProps) {
  const { user } = useAuth()
  const { db } = getFirebase()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!user || !reason.trim()) {
      toast.error("Please select a reason for reporting")
      return
    }

    // Check rate limit for reports
    const rateLimitCheck = checkRateLimit("report")
    if (!rateLimitCheck.allowed) {
      toast.error("Report rate limit exceeded. Please try again later.")
      return
    }

    setSubmitting(true)
    try {
      const sanitizedDetails = details.trim() ? sanitizeText(details.trim()) : ""

      await addDoc(collection(db, "reports"), {
        contentType,
        contentId,
        contentTitle: contentTitle ? sanitizeText(contentTitle) : "",
        reportedBy: user.uid,
        reportedByName: sanitizeText(user.displayName || user.email || "Anonymous"),
        reportedByEmail: user.email,
        reason,
        details: sanitizedDetails,
        status: "pending",
        createdAt: serverTimestamp(),
      })

      toast.success("Report submitted. Our team will review it shortly.")
      setOpen(false)
      setReason("")
      setDetails("")
    } catch (error) {
      console.error("Error submitting report:", error)
      toast.error("Failed to submit report. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive">
            <Flag className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Report {contentType === "post" ? "Post" : contentType === "comment" ? "Comment" : "User"}
          </DialogTitle>
          <DialogDescription>Help us keep the community safe by reporting inappropriate content.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Reason for reporting</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS[contentType].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Additional details (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context about this report..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{details.length}/500 characters</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!reason || submitting} variant="destructive">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
