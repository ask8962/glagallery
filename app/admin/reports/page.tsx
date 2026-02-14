"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  limit,
} from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Flag, Check, X } from "lucide-react"
import { format } from "date-fns"
import { AdminTableSkeleton } from "@/components/skeletons/admin-skeleton"
import { isAdminEmail } from "@/lib/config"

interface Report {
  id: string
  contentType: "post" | "comment" | "user"
  contentId: string
  contentTitle?: string
  reportedBy: string
  reportedByName: string
  reason: string
  details?: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  createdAt: any
  reviewedAt?: any
  reviewedBy?: string
}

export default function ReportsPage() {
  const { profile } = useAuth()
  const { db } = getFirebase()
  const isAdmin = profile?.role === "admin" || isAdminEmail(profile?.email || "")

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "resolved" | "dismissed">("all")

  useEffect(() => {
    if (!isAdmin) return

    const reportsRef = collection(db, "reports")
    let q = query(reportsRef, orderBy("createdAt", "desc"), limit(100))

    if (filter !== "all") {
      q = query(reportsRef, orderBy("status", "asc"), orderBy("createdAt", "desc"), limit(100))
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reportsList: Report[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (filter === "all" || data.status === filter) {
            reportsList.push({ id: doc.id, ...(data as any) })
          }
        })
        setReports(reportsList)
        setLoading(false)
      },
      (error) => {
        console.error("Error loading reports:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [db, isAdmin, filter])

  async function updateReportStatus(reportId: string, status: Report["status"]) {
    if (!isAdmin) return

    try {
      const reportRef = doc(db, "reports", reportId)
      await updateDoc(reportRef, {
        status,
        reviewedAt: new Date(),
        reviewedBy: profile?.uid,
      })
    } catch (error) {
      console.error("Error updating report status:", error)
      alert("Failed to update report status")
    }
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-primary">Admin only</h1>
        <p className="text-sm text-muted-foreground">This area is restricted.</p>
      </main>
    )
  }

  const pendingCount = reports.filter((r) => r.status === "pending").length

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-6xl px-4 py-8 space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Content Reports</h1>
        <p className="text-muted-foreground">Review and manage user reports</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "pending", "reviewed", "resolved", "dismissed"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === "pending" && pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Reports Table */}
      {loading ? (
        <AdminTableSkeleton rows={10} />
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center">
          <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No reports found</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium">Type</th>
                  <th className="p-4 text-left font-medium">Content</th>
                  <th className="p-4 text-left font-medium">Reason</th>
                  <th className="p-4 text-left font-medium">Reported By</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Date</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr
                    key={report.id}
                    className={`border-b border-border/50 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                  >
                    <td className="p-4">
                      <Badge variant="outline">{report.contentType}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="max-w-xs">
                        <p className="font-medium truncate">
                          {report.contentTitle || report.contentId}
                        </p>
                        {report.details && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {report.details}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground">{report.reason}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground">{report.reportedByName}</span>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          report.status === "pending"
                            ? "destructive"
                            : report.status === "resolved"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {report.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {format(
                        (report.createdAt as any)?.toDate?.() || new Date(),
                        "MMM d, yyyy"
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {report.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReportStatus(report.id, "resolved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReportStatus(report.id, "dismissed")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.main>
  )
}
