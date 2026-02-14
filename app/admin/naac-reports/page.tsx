"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { isAdminEmail, isSuperAdminEmail } from "@/lib/config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { FileText, Download, Loader2, Users, Calendar, Trophy, Building2, GraduationCap, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { UserProfile, Event, Hackathon, Club } from "@/lib/types"

// ─── helpers ───
function toDate(val: any): Date {
  if (!val) return new Date()
  if (val.toDate) return val.toDate()
  if (val.seconds) return new Date(val.seconds * 1000)
  return new Date(val)
}

type ReportData = {
  users: UserProfile[]
  events: Event[]
  hackathons: Hackathon[]
  clubs: Club[]
  orgName: string
}

export default function NaacReportsPage() {
  const { profile } = useAuth()
  const { organization } = useOrganization()
  const { db } = getFirebase()
  const isAdmin = profile?.role === "admin" || isAdminEmail(profile?.email || "") || isSuperAdminEmail(profile?.email || "")
  const isSuperAdmin = profile?.role === "super_admin" || isSuperAdminEmail(profile?.email || "")

  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [academicYear, setAcademicYear] = useState("2024-25")

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-primary">Admin only</h1>
        <p className="text-sm text-muted-foreground">This area is restricted.</p>
      </main>
    )
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const orgId = organization?.id
      
      // Fetch users
      const usersQ = isSuperAdmin
        ? collection(db, "users")
        : query(collection(db, "users"), where("organizationId", "==", orgId))
      const usersSnap = await getDocs(usersQ)
      const users: UserProfile[] = []
      usersSnap.forEach(d => users.push({ uid: d.id, ...d.data() } as UserProfile))

      // Fetch events
      const eventsQ = isSuperAdmin
        ? collection(db, "events")
        : query(collection(db, "events"), where("organizationId", "==", orgId))
      const eventsSnap = await getDocs(eventsQ)
      const events: Event[] = []
      eventsSnap.forEach(d => events.push({ id: d.id, ...d.data() } as any))

      // Fetch hackathons
      const hackQ = isSuperAdmin
        ? collection(db, "hackathons")
        : query(collection(db, "hackathons"), where("organizationId", "==", orgId))
      const hackSnap = await getDocs(hackQ)
      const hackathons: Hackathon[] = []
      hackSnap.forEach(d => hackathons.push({ id: d.id, ...d.data() } as any))

      // Fetch clubs
      const clubsQ = isSuperAdmin
        ? collection(db, "clubs")
        : query(collection(db, "clubs"), where("organizationId", "==", orgId))
      const clubsSnap = await getDocs(clubsQ)
      const clubs: Club[] = []
      clubsSnap.forEach(d => clubs.push({ id: d.id, ...d.data() } as any))

      setReportData({
        users,
        events,
        hackathons,
        clubs,
        orgName: organization?.name || "CampusHub Platform (All Tenants)",
      })
      toast.success("Report data loaded successfully!")
    } catch (err: any) {
      console.error("Error fetching report data:", err)
      toast.error("Failed to fetch report data")
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    if (!reportData) return
    setGenerating(true)

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 15
      const contentW = pageW - margin * 2
      let y = 20

      const addPage = () => { doc.addPage(); y = 20 }
      const checkPage = (needed: number) => { if (y + needed > 270) addPage() }

      // ─── COVER PAGE ───
      doc.setFillColor(13, 17, 23) // #0D1117
      doc.rect(0, 0, pageW, 297, "F")

      doc.setTextColor(250, 204, 21) // accent
      doc.setFontSize(28)
      doc.setFont("helvetica", "bold")
      doc.text("NAAC / NBA", pageW / 2, 60, { align: "center" })
      doc.text("Accreditation Report", pageW / 2, 75, { align: "center" })

      doc.setTextColor(255)
      doc.setFontSize(14)
      doc.setFont("helvetica", "normal")
      doc.text(`Criterion 3.4 — Extracurricular Activities`, pageW / 2, 100, { align: "center" })

      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(reportData.orgName, pageW / 2, 130, { align: "center" })

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Academic Year: ${academicYear}`, pageW / 2, 145, { align: "center" })
      doc.text(`Generated: ${format(new Date(), "PPP")}`, pageW / 2, 155, { align: "center" })
      doc.text(`Powered by CampusHub (campushub.pro)`, pageW / 2, 175, { align: "center" })

      // ─── EXECUTIVE SUMMARY ───
      addPage()
      doc.setTextColor(0)
      doc.setFillColor(250, 204, 21)
      doc.rect(margin, y, contentW, 10, "F")
      doc.setTextColor(0)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("1. EXECUTIVE SUMMARY", margin + 3, y + 7)
      y += 18

      doc.setTextColor(50)
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")

      const totalStudents = reportData.users.filter(u => u.role === "student").length
      const totalFaculty = reportData.users.filter(u => u.role === "faculty" || u.role === "club_advisor").length
      const totalEvents = reportData.events.length
      const completedEvents = reportData.events.filter(e => e.status === "completed").length
      const totalHackathons = reportData.hackathons.length
      const activeClubs = reportData.clubs.filter(c => c.status === "active").length
      const totalRegistrations = reportData.events.reduce((acc, e) => acc + (e.registeredCount || 0), 0)

      const summaryLines = [
        `Total Registered Students: ${totalStudents}`,
        `Faculty / Advisors: ${totalFaculty}`,
        `Total Events Conducted: ${totalEvents} (${completedEvents} completed)`,
        `Hackathons Organized: ${totalHackathons}`,
        `Active Clubs & Societies: ${activeClubs}`,
        `Total Event Registrations (student engagement): ${totalRegistrations}`,
        `Report Period: Academic Year ${academicYear}`,
      ]
      summaryLines.forEach(line => {
        doc.text(`• ${line}`, margin + 2, y)
        y += 6
      })

      // ─── CRITERION 3.4.1 — Events ───
      y += 6
      checkPage(20)
      doc.setFillColor(250, 204, 21)
      doc.rect(margin, y, contentW, 10, "F")
      doc.setTextColor(0)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("2. CRITERION 3.4.1 — Events & Activities", margin + 3, y + 7)
      y += 18

      // Events Table Header
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, y, contentW, 7, "F")
      const cols = [margin, margin + 60, margin + 95, margin + 120, margin + 145]
      doc.text("Event Title", cols[0] + 2, y + 5)
      doc.text("Category", cols[1] + 2, y + 5)
      doc.text("Date", cols[2] + 2, y + 5)
      doc.text("Registrations", cols[3] + 2, y + 5)
      doc.text("Status", cols[4] + 2, y + 5)
      y += 8

      doc.setFont("helvetica", "normal")
      reportData.events.forEach((event) => {
        checkPage(8)
        const eventDate = toDate(event.startDate)
        doc.text(event.title.substring(0, 35), cols[0] + 2, y + 4)
        doc.text(event.category || "—", cols[1] + 2, y + 4)
        doc.text(format(eventDate, "dd/MM/yy"), cols[2] + 2, y + 4)
        doc.text(String(event.registeredCount || 0), cols[3] + 2, y + 4)
        doc.text(event.status || "—", cols[4] + 2, y + 4)
        doc.setDrawColor(220)
        doc.line(margin, y + 6, margin + contentW, y + 6)
        y += 7
      })

      if (reportData.events.length === 0) {
        doc.text("No events recorded for this period.", margin + 2, y + 4)
        y += 7
      }

      // ─── CRITERION 3.4.2 — Hackathons ───
      y += 6
      checkPage(20)
      doc.setFillColor(250, 204, 21)
      doc.rect(margin, y, contentW, 10, "F")
      doc.setTextColor(0)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("3. CRITERION 3.4.2 — Hackathons & Competitions", margin + 3, y + 7)
      y += 18

      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, y, contentW, 7, "F")
      const hCols = [margin, margin + 65, margin + 100, margin + 135]
      doc.text("Hackathon Title", hCols[0] + 2, y + 5)
      doc.text("Theme", hCols[1] + 2, y + 5)
      doc.text("Date", hCols[2] + 2, y + 5)
      doc.text("Status", hCols[3] + 2, y + 5)
      y += 8

      doc.setFont("helvetica", "normal")
      reportData.hackathons.forEach((h) => {
        checkPage(8)
        const hDate = toDate(h.startDate)
        doc.text(h.title.substring(0, 38), hCols[0] + 2, y + 4)
        doc.text((h.theme || "—").substring(0, 20), hCols[1] + 2, y + 4)
        doc.text(format(hDate, "dd/MM/yy"), hCols[2] + 2, y + 4)
        doc.text(h.status || "—", hCols[3] + 2, y + 4)
        doc.setDrawColor(220)
        doc.line(margin, y + 6, margin + contentW, y + 6)
        y += 7
      })

      if (reportData.hackathons.length === 0) {
        doc.text("No hackathons recorded for this period.", margin + 2, y + 4)
        y += 7
      }

      // ─── CRITERION 3.4.3 — Clubs & Societies ───
      y += 6
      checkPage(20)
      doc.setFillColor(250, 204, 21)
      doc.rect(margin, y, contentW, 10, "F")
      doc.setTextColor(0)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("4. CRITERION 3.4.3 — Clubs & Societies", margin + 3, y + 7)
      y += 18

      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, y, contentW, 7, "F")
      const cCols = [margin, margin + 55, margin + 90, margin + 120, margin + 150]
      doc.text("Club Name", cCols[0] + 2, y + 5)
      doc.text("Category", cCols[1] + 2, y + 5)
      doc.text("Members", cCols[2] + 2, y + 5)
      doc.text("Founded", cCols[3] + 2, y + 5)
      doc.text("Status", cCols[4] + 2, y + 5)
      y += 8

      doc.setFont("helvetica", "normal")
      reportData.clubs.forEach((c) => {
        checkPage(8)
        const founded = toDate(c.foundedDate)
        doc.text(c.name.substring(0, 32), cCols[0] + 2, y + 4)
        doc.text(c.category || "—", cCols[1] + 2, y + 4)
        doc.text(String(c.members?.length || 0), cCols[2] + 2, y + 4)
        doc.text(format(founded, "dd/MM/yy"), cCols[3] + 2, y + 4)
        doc.text(c.status || "—", cCols[4] + 2, y + 4)
        doc.setDrawColor(220)
        doc.line(margin, y + 6, margin + contentW, y + 6)
        y += 7
      })

      if (reportData.clubs.length === 0) {
        doc.text("No clubs recorded for this period.", margin + 2, y + 4)
        y += 7
      }

      // ─── STUDENT ENGAGEMENT METRICS ───
      y += 6
      checkPage(40)
      doc.setFillColor(250, 204, 21)
      doc.rect(margin, y, contentW, 10, "F")
      doc.setTextColor(0)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("5. STUDENT ENGAGEMENT METRICS", margin + 3, y + 7)
      y += 18

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(50)

      const avgPoints = totalStudents > 0
        ? Math.round(reportData.users.reduce((a, u) => a + (u.points || 0), 0) / totalStudents)
        : 0
      const avgLevel = totalStudents > 0
        ? (reportData.users.reduce((a, u) => a + (u.level || 1), 0) / totalStudents).toFixed(1)
        : "0"
      const avgReliability = totalStudents > 0
        ? (reportData.users.reduce((a, u) => a + (u.reliabilityScore || 100), 0) / totalStudents).toFixed(1)
        : "0"
      const techEvents = reportData.events.filter(e => e.category === "tech").length
      const culturalEvents = reportData.events.filter(e => e.category === "cultural").length
      const sportEvents = reportData.events.filter(e => e.category === "sports").length
      const workshopEvents = reportData.events.filter(e => e.category === "workshop").length

      const metrics = [
        `Average Gamification Points per Student: ${avgPoints}`,
        `Average Student Level: ${avgLevel}`,
        `Average Event Reliability Score: ${avgReliability}%`,
        ``,
        `Events by Category:`,
        `   Technical: ${techEvents}  |  Cultural: ${culturalEvents}  |  Sports: ${sportEvents}  |  Workshops: ${workshopEvents}`,
      ]
      metrics.forEach(line => {
        doc.text(line, margin + 2, y)
        y += 6
      })

      // ─── TOP STUDENTS TABLE ───
      y += 6
      checkPage(30)
      doc.setFillColor(250, 204, 21)
      doc.rect(margin, y, contentW, 10, "F")
      doc.setTextColor(0)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("6. TOP ENGAGED STUDENTS (Leaderboard)", margin + 3, y + 7)
      y += 18

      const topStudents = [...reportData.users]
        .filter(u => u.role === "student")
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 20)

      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, y, contentW, 7, "F")
      const sCols = [margin, margin + 10, margin + 70, margin + 110, margin + 140]
      doc.text("#", sCols[0] + 2, y + 5)
      doc.text("Student Name", sCols[1] + 2, y + 5)
      doc.text("Email", sCols[2] + 2, y + 5)
      doc.text("Points", sCols[3] + 2, y + 5)
      doc.text("Level", sCols[4] + 2, y + 5)
      y += 8

      doc.setFont("helvetica", "normal")
      topStudents.forEach((s, i) => {
        checkPage(8)
        doc.text(String(i + 1), sCols[0] + 2, y + 4)
        doc.text((s.name || "—").substring(0, 35), sCols[1] + 2, y + 4)
        doc.text((s.email || "—").substring(0, 25), sCols[2] + 2, y + 4)
        doc.text(String(s.points || 0), sCols[3] + 2, y + 4)
        doc.text(String(s.level || 1), sCols[4] + 2, y + 4)
        doc.setDrawColor(220)
        doc.line(margin, y + 6, margin + contentW, y + 6)
        y += 7
      })

      // ─── FOOTER / DISCLAIMER ───
      addPage()
      doc.setFillColor(250, 204, 21)
      doc.rect(margin, y, contentW, 10, "F")
      doc.setTextColor(0)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("DISCLAIMER & CERTIFICATION", margin + 3, y + 7)
      y += 18

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(50)
      const disclaimer = [
        "This report has been auto-generated by CampusHub (campushub.pro),",
        "a multi-tenant campus operating system. All data is sourced from real-time",
        "platform records including event registrations, hackathon submissions,",
        "club memberships, and student engagement gamification metrics.",
        "",
        "This report is intended to support NAAC Criterion 3.4 (Extension Activities)",
        "and NBA accreditation requirements related to extracurricular and co-curricular",
        "activity documentation.",
        "",
        `Report generated on ${format(new Date(), "PPPp")}`,
        "",
        "For verification, contact: admin@campushub.pro",
      ]
      disclaimer.forEach(line => {
        doc.text(line, margin + 2, y)
        y += 6
      })

      // Save
      const filename = `NAAC_Report_${reportData.orgName.replace(/\s/g, "_")}_${academicYear}.pdf`
      doc.save(filename)
      toast.success(`Report downloaded as ${filename}`)
    } catch (err: any) {
      console.error("PDF generation error:", err)
      toast.error("Failed to generate PDF")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-6xl px-4 py-8 space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <FileText className="h-8 w-8" />
          NAAC / NBA Report Generator
        </h1>
        <p className="text-muted-foreground">
          Generate accreditation-ready reports for Criterion 3.4 (Extension Activities) from your live platform data.
        </p>
      </div>

      {/* Config Card */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="text-lg">Report Configuration</CardTitle>
          <CardDescription>Select the academic year and fetch live data to generate your report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-25">2024-25</SelectItem>
                  <SelectItem value="2023-24">2023-24</SelectItem>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization</label>
              <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
                {organization?.name || "All Tenants (Super Admin)"}
              </p>
            </div>
            <Button onClick={fetchReportData} disabled={loading} className="h-10">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
              {loading ? "Fetching..." : "Fetch Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary Cards */}
      {reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Students", value: reportData.users.filter(u => u.role === "student").length, color: "text-blue-500" },
              { icon: Calendar, label: "Events", value: reportData.events.length, color: "text-green-500" },
              { icon: Trophy, label: "Hackathons", value: reportData.hackathons.length, color: "text-amber-500" },
              { icon: Building2, label: "Clubs", value: reportData.clubs.length, color: "text-purple-500" },
            ].map((stat, i) => (
              <Card key={i} className="text-center p-4">
                <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Generate Button */}
          <Card className="border-accent/50 bg-accent/5">
            <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-accent" />
                  Ready to Generate
                </h3>
                <p className="text-sm text-muted-foreground">
                  This will create a multi-page PDF with cover page, executive summary, event tables, hackathon details, club listings, student leaderboard, and engagement metrics.
                </p>
              </div>
              <Button
                onClick={generatePDF}
                disabled={generating}
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 min-w-[200px]"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" /> Download NAAC Report</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  Recent Events ({reportData.events.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto space-y-2">
                {reportData.events.slice(0, 8).map(e => (
                  <div key={e.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <span className="truncate mr-2 font-medium">{e.title}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{e.category}</Badge>
                  </div>
                ))}
                {reportData.events.length === 0 && <p className="text-xs text-muted-foreground">No events</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Hackathons ({reportData.hackathons.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto space-y-2">
                {reportData.hackathons.slice(0, 8).map(h => (
                  <div key={h.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <span className="truncate mr-2 font-medium">{h.title}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">{h.status}</Badge>
                  </div>
                ))}
                {reportData.hackathons.length === 0 && <p className="text-xs text-muted-foreground">No hackathons</p>}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </motion.main>
  )
}
