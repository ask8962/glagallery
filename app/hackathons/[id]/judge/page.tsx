"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useParams, useRouter } from "next/navigation"
import { 
  getHackathonById,
  getHackathonSubmissions,
  submitJudgeScore,
  getHackathonJudging
} from "@/lib/hackathons"
import type { Hackathon, Submission, HackathonJudging } from "@/lib/types"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Star, ExternalLink } from "lucide-react"

export default function JudgeHackathonPage() {
  const { user, profile } = useAuth()
  const params = useParams()
  const router = useRouter()
  const hackathonId = params.id as string
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [judging, setJudging] = useState<HackathonJudging[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comments, setComments] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (hackathonId && user) {
      loadData()
    }
  }, [hackathonId, user])

  async function loadData() {
    setLoading(true)
    try {
      const [hackathonData, submissionsData, judgingData] = await Promise.all([
        getHackathonById(hackathonId),
        getHackathonSubmissions(hackathonId),
        getHackathonJudging(hackathonId)
      ])
      
      if (!hackathonData) {
        router.push("/hackathons")
        return
      }
      
      setHackathon(hackathonData)
      setSubmissions(submissionsData)
      setJudging(judgingData)
      
      // Initialize scores from existing judging
      if (judgingData.length > 0 && user) {
        const userJudging = judgingData.find(j => 
          j.scores.some(s => s.judgeUid === user.uid)
        )
        if (userJudging) {
          const userScore = userJudging.scores.find(s => s.judgeUid === user.uid)
          if (userScore) {
            setScores(userScore.criteria)
            setComments(userScore.comments || "")
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitScore() {
    if (!selectedSubmission || !user || !profile || !hackathon) return
    
    setSubmitting(true)
    try {
      const criteria = hackathon.categories || ["Innovation", "Design", "Functionality", "Presentation"]
      let totalScore = 0
      
      criteria.forEach(category => {
        const score = scores[category] || 0
        totalScore += score
      })
      
      await submitJudgeScore(
        hackathonId,
        selectedSubmission.id,
        selectedSubmission.teamId,
        {
          judgeUid: user.uid,
          judgeName: profile.name || user.displayName || "Judge",
          criteria: scores,
          totalScore,
          comments: comments.trim() || undefined,
        }
      )
      
      await loadData()
      setSelectedSubmission(null)
      setScores({})
      setComments("")
      alert("Score submitted successfully!")
    } catch (error: any) {
      alert(error.message || "Failed to submit score. Please try again.")
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

  if (!hackathon) {
    return null
  }

  const isJudge = hackathon.judges?.includes(user?.uid || "") || profile?.role === "admin"
  const isOrganizer = hackathon.organizerUid === user?.uid

  if (!isJudge && !isOrganizer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-primary mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Only judges and organizers can access this page.
          </p>
          <Button onClick={() => router.push(`/hackathons/${hackathonId}`)}>
            Back to Hackathon
          </Button>
        </Card>
      </div>
    )
  }

  const criteria = hackathon.categories || ["Innovation", "Design", "Functionality", "Presentation"]
  const maxScorePerCategory = 25 // Default, can be customized

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Judge Submissions</h1>
            <p className="text-muted-foreground">{hackathon.title}</p>
          </div>

          <Tabs defaultValue="submissions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="submissions" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-primary mb-1">{submission.projectName}</h3>
                        <p className="text-sm text-muted-foreground">Team: {submission.teamName}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        Judge
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {submission.projectDescription}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {submission.technologies.map((tech, i) => (
                        <Badge key={i} variant="secondary">{tech}</Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      {submission.projectURL && (
                        <a
                          href={submission.projectURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Demo
                        </a>
                      )}
                      {submission.repositoryURL && (
                        <a
                          href={submission.repositoryURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Code
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="mt-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-primary mb-4">Judging Results</h2>
                {judging.length > 0 ? (
                  <div className="space-y-4">
                    {judging
                      .sort((a, b) => b.averageScore - a.averageScore)
                      .map((result, index) => {
                        const submission = submissions.find(s => s.id === result.submissionId)
                        return (
                          <div
                            key={result.submissionId}
                            className="p-4 bg-muted/50 rounded-lg border border-border"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-primary">
                                    {submission?.projectName || "Unknown Project"}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {submission?.teamName || "Unknown Team"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-accent">
                                  {result.averageScore.toFixed(1)}
                                </div>
                                <div className="text-xs text-muted-foreground">Average Score</div>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              {result.scores.length} judge{result.scores.length > 1 ? "s" : ""} scored
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No scores submitted yet.</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Judging Dialog */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-4">
                Judge: {selectedSubmission.projectName}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-primary mb-2">Project Description</h3>
                  <p className="text-muted-foreground">{selectedSubmission.projectDescription}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-primary mb-4">Scoring ({maxScorePerCategory} points per category)</h3>
                  <div className="space-y-4">
                    {criteria.map((category) => (
                      <div key={category}>
                        <label className="block text-sm font-medium mb-2">{category}</label>
                        <Input
                          type="number"
                          min="0"
                          max={maxScorePerCategory}
                          value={scores[category] || ""}
                          onChange={(e) => setScores({
                            ...scores,
                            [category]: parseInt(e.target.value) || 0
                          })}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">Total Score:</span>
                      <span className="text-2xl font-bold text-accent">
                        {Object.values(scores).reduce((sum, score) => sum + (score || 0), 0)} / {maxScorePerCategory * criteria.length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Comments (Optional)</label>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add your feedback..."
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button
                    onClick={handleSubmitScore}
                    disabled={submitting}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit Score"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSubmission(null)
                      setScores({})
                      setComments("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
