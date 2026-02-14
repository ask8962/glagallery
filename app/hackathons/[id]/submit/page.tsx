"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useParams, useRouter } from "next/navigation"
import {
  getTeamById,
  getHackathonById,
  submitProject,
  getSubmissionByTeam
} from "@/lib/hackathons"
import type { Team, Hackathon, Submission } from "@/lib/types"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Upload, CheckCircle } from "lucide-react"
import { getUserTeams } from "@/lib/hackathons"

export default function SubmitProjectPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const hackathonId = params.id as string

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectURL, setProjectURL] = useState("")
  const [repositoryURL, setRepositoryURL] = useState("")
  const [demoVideoURL, setDemoVideoURL] = useState("")
  const [presentationURL, setPresentationURL] = useState("")
  const [technologies, setTechnologies] = useState("")

  useEffect(() => {
    if (hackathonId && user) {
      loadData()
    }
  }, [hackathonId, user])

  async function loadData() {
    setLoading(true)
    try {
      const [hackathonData, userTeams] = await Promise.all([
        getHackathonById(hackathonId),
        getUserTeams(hackathonId, user!.uid)
      ])

      if (!hackathonData) {
        router.push("/hackathons")
        return
      }

      setHackathon(hackathonData)

      if (userTeams.length > 0) {
        const userTeam = userTeams[0]
        setTeam(userTeam)
        setProjectName(userTeam.projectName || "")
        setProjectDescription(userTeam.projectDescription || "")
        setRepositoryURL(userTeam.repositoryURL || "")
        setDemoVideoURL(userTeam.demoVideoURL || "")
        setPresentationURL(userTeam.presentationURL || "")

        // Check for existing submission
        const existingSubmission = await getSubmissionByTeam(hackathonId, userTeam.id)
        if (existingSubmission) {
          setSubmission(existingSubmission)
        }
      } else {
        router.push(`/hackathons/${hackathonId}`)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!team || !hackathon) return

    setSubmitting(true)
    try {
      const technologiesArray = technologies
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0)

      await submitProject(hackathonId, team.id, {
        teamName: team.name,
        projectName: projectName.trim(),
        projectDescription: projectDescription.trim(),
        projectURL: projectURL.trim() || undefined,
        repositoryURL: repositoryURL.trim() || undefined,
        demoVideoURL: demoVideoURL.trim() || undefined,
        presentationURL: presentationURL.trim() || undefined,
        technologies: technologiesArray,
        screenshots: [],
      })

      router.push(`/hackathons/${hackathonId}/team`)
    } catch (error: any) {
      alert(error.message || "Failed to submit project. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!team || !hackathon) {
    return null
  }

  if (hackathon.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-primary mb-4">Submission Not Available</h2>
          <p className="text-muted-foreground mb-4">
            Project submissions are only available during the active phase of the hackathon.
          </p>
          <Button onClick={() => router.push(`/hackathons/${hackathonId}`)}>
            Back to Hackathon
          </Button>
        </Card>
      </div>
    )
  }

  if (submission) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <Card className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-4">Project Submitted Successfully!</h2>
            <p className="text-muted-foreground mb-6">
              Your project has been submitted. You can view it in your team page.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push(`/hackathons/${hackathonId}/team`)}>
                View Team
              </Button>
              <Button variant="outline" onClick={() => router.push(`/hackathons/${hackathonId}`)}>
                Back to Hackathon
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Submit Your Project</h1>
            <p className="text-muted-foreground">
              Submit your project for {hackathon.title}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name *</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter your project name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Project Description *</label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your project, what problem it solves, and how it works..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Project URL (Live Demo)</label>
                <Input
                  type="url"
                  value={projectURL}
                  onChange={(e) => setProjectURL(e.target.value)}
                  placeholder="https://your-project.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Repository URL *</label>
                <Input
                  type="url"
                  value={repositoryURL}
                  onChange={(e) => setRepositoryURL(e.target.value)}
                  placeholder="https://github.com/username/project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Demo Video URL</label>
                <Input
                  type="url"
                  value={demoVideoURL}
                  onChange={(e) => setDemoVideoURL(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Presentation URL</label>
                <Input
                  type="url"
                  value={presentationURL}
                  onChange={(e) => setPresentationURL(e.target.value)}
                  placeholder="https://docs.google.com/presentation/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Technologies Used</label>
                <Input
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  placeholder="React, Node.js, MongoDB (comma-separated)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple technologies with commas
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit Project"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
