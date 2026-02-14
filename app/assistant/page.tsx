"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { ChatMessage, TypingIndicator, type Message } from "@/components/assistant/chat-message"
import { ChatInput } from "@/components/assistant/chat-input"
import { Button } from "@/components/ui/button"
import { Bot, Sparkles, Trash2, ArrowDown } from "lucide-react"
import { nanoid } from "nanoid"
import { motion, AnimatePresence } from "framer-motion"

const WELCOME_SUGGESTIONS = [
    "What events are happening this week?",
    "Tell me about GLA University clubs",
    "How do I register for a hackathon?",
    "What are the campus facilities?",
]

export default function AssistantPage() {
    const { user, profile, loading: authLoading, signIn } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [rateLimited, setRateLimited] = useState(false)
    const [rateLimitMessage, setRateLimitMessage] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [showScrollButton, setShowScrollButton] = useState(false)

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading, scrollToBottom])

    // Show/hide scroll-to-bottom button
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container
            setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100)
        }

        container.addEventListener("scroll", handleScroll)
        return () => container.removeEventListener("scroll", handleScroll)
    }, [])

    const sendMessage = useCallback(async (content?: string) => {
        const messageText = content || input.trim()
        if (!messageText || isLoading || !user) return

        const userMessage: Message = {
            id: nanoid(),
            role: "user",
            content: messageText,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)
        setRateLimited(false)

        try {
            const allMessages = [...messages, userMessage].map(m => ({
                role: m.role,
                content: m.content,
            }))

            // Get Firebase auth token for rate limiting / user identification
            let token: string | null = null
            try {
                token = await user.getIdToken()
            } catch (e) {
                console.warn("Failed to get auth token", e)
            }

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ messages: allMessages }),
            })

            if (res.status === 429) {
                const data = await res.json()
                setRateLimited(true)
                setRateLimitMessage(data.error || "You've reached the message limit. Please wait a while before trying again.")
                setIsLoading(false)
                return
            }

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`)
            }

            const data = await res.json()

            const botMessage: Message = {
                id: nanoid(),
                role: "assistant",
                content: data.content || "Sorry, I couldn't generate a response. Please try again.",
                timestamp: new Date(),
                provider: data.provider,
            }

            setMessages(prev => [...prev, botMessage])
        } catch (error) {
            console.error("Chat error:", error)
            const errorMessage: Message = {
                id: nanoid(),
                role: "assistant",
                content: "Oops! Something went wrong. Please try again in a moment. 🔄",
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }, [input, isLoading, messages, user])

    const clearChat = () => {
        setMessages([])
        setRateLimited(false)
        setRateLimitMessage("")
    }

    // Auth gate
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Bot className="h-12 w-12 text-accent animate-pulse" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md space-y-6"
                >
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Bot className="h-10 w-10 text-accent" />
                    </div>
                    <h1 className="text-2xl font-bold">Sign in to use GLA Bot</h1>
                    <p className="text-muted-foreground">
                        GLA Bot is your intelligent campus assistant. Sign in with your GLA account to start chatting.
                    </p>
                    <Button
                        onClick={() => signIn()}
                        size="lg"
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                        Sign in to continue
                    </Button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
            {/* Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 shrink-0">
                <div className="mx-auto max-w-3xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold">GLA Bot</h1>
                            <p className="text-xs text-muted-foreground">Campus AI Assistant</p>
                        </div>
                    </div>
                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearChat}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto relative"
            >
                {messages.length === 0 ? (
                    /* Welcome Screen */
                    <div className="flex items-center justify-center h-full px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="text-center max-w-lg space-y-8"
                        >
                            <div className="space-y-3">
                                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-accent" />
                                </div>
                                <h2 className="text-xl font-bold">
                                    Hi{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}! 👋
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    I&apos;m GLA Bot, your campus AI assistant. Ask me about events, clubs, hackathons, or anything campus-related.
                                </p>
                            </div>

                            {/* Suggestion chips */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {WELCOME_SUGGESTIONS.map((suggestion, i) => (
                                    <motion.button
                                        key={suggestion}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * (i + 1) }}
                                        onClick={() => sendMessage(suggestion)}
                                        className="text-left px-4 py-3 rounded-xl border bg-card hover:bg-accent/5 hover:border-accent/30 transition-all text-sm text-muted-foreground hover:text-foreground group"
                                    >
                                        <span className="group-hover:text-accent transition-colors">→</span>{" "}
                                        {suggestion}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* Message list */
                    <div className="mx-auto max-w-3xl divide-y divide-border/30">
                        <AnimatePresence initial={false}>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChatMessage
                                        message={message}
                                        userPhotoURL={user.photoURL ?? undefined}
                                        userName={user.displayName ?? undefined}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <TypingIndicator />
                            </motion.div>
                        )}

                        {rateLimited && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="px-4 py-5"
                            >
                                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                                    ⏱️ {rateLimitMessage}
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Scroll to bottom button */}
                <AnimatePresence>
                    {showScrollButton && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="sticky bottom-4 flex justify-center"
                        >
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={scrollToBottom}
                                className="rounded-full shadow-lg"
                            >
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => sendMessage()}
                isLoading={isLoading}
                disabled={rateLimited}
            />
        </div>
    )
}
