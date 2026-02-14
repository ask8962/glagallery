"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { useParams } from "next/navigation"
import { getFirebase } from "@/lib/firebase"
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import type { Team } from "@/lib/types"
import { sanitizeText } from "@/lib/validation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { format } from "date-fns"

interface ChatMessage {
  id: string
  uid: string
  name: string
  photoURL?: string
  text: string
  createdAt: Timestamp
}

export default function TeamChatPage() {
  const { user, profile } = useAuth()
  const params = useParams()
  const hackathonId = params.id as string
  const { db } = getFirebase()

  const [team, setTeam] = useState<Team | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState("")
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !hackathonId) return

    // Get user's team
    const loadTeam = async () => {
      try {
        const { getUserTeams } = await import("@/lib/hackathons")
        const teams = await getUserTeams(hackathonId, user.uid)
        if (teams.length > 0) {
          setTeam(teams[0])
        }
      } catch (error) {
        console.error("Error loading team:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTeam()
  }, [user, hackathonId])

  useEffect(() => {
    if (!team) return

    // Listen to messages
    const messagesRef = collection(db, "hackathons", hackathonId, "teams", team.id, "messages")
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = []
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...(doc.data() as any) })
      })
      setMessages(msgs)

      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    })

    return () => unsubscribe()
  }, [team, hackathonId, db])

  async function sendMessage() {
    if (!user || !team || !messageText.trim()) return

    const sanitizedText = sanitizeText(messageText.trim())
    if (!sanitizedText) return

    try {
      const messagesRef = collection(db, "hackathons", hackathonId, "teams", team.id, "messages")
      await addDoc(messagesRef, {
        uid: user.uid,
        name: profile?.name || user.displayName || "GLA Student",
        photoURL: user.photoURL || undefined,
        text: sanitizedText,
        createdAt: serverTimestamp(),
      })
      setMessageText("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">No Team Found</h2>
          <p className="text-muted-foreground mb-4">
            You need to be part of a team to access team chat.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </Card>
      </div>
    )
  }

  const isMember = team.members.some((m) => m.uid === user?.uid)

  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You are not a member of this team.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <div className="p-4 border-b border-border">
            <h1 className="text-2xl font-bold text-primary">Team Chat: {team.name}</h1>
            <p className="text-sm text-muted-foreground">{team.members.length} members</p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwn = message.uid === user?.uid
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.photoURL} />
                      <AvatarFallback>
                        {message.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-primary">{message.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            (message.createdAt as any)?.toDate?.() || new Date(),
                            "h:mm a"
                          )}
                        </span>
                      </div>
                      <div
                        className={`inline-block p-3 rounded-lg ${isOwn
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-foreground"
                          }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex gap-2"
            >
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                maxLength={500}
              />
              <Button type="submit" disabled={!messageText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
