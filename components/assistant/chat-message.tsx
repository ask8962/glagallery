"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bot, User, Copy, Check } from "lucide-react"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export type Message = {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    provider?: string // "Claude" | "Gemini" | "Grok"
}

interface ChatMessageProps {
    message: Message
    userPhotoURL?: string
    userName?: string
}

export function ChatMessage({ message, userPhotoURL, userName }: ChatMessageProps) {
    const [copied, setCopied] = useState(false)
    const isBot = message.role === "assistant"

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            className={cn(
                "group flex gap-3 px-4 py-5 transition-colors",
                isBot ? "bg-muted/30" : "bg-transparent"
            )}
        >
            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0 mt-0.5 ring-2 ring-border/50">
                {isBot ? (
                    <>
                        <AvatarFallback className="bg-accent text-accent-foreground">
                            <Bot className="h-4 w-4" />
                        </AvatarFallback>
                    </>
                ) : (
                    <>
                        <AvatarImage src={userPhotoURL} alt={userName || "You"} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </>
                )}
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                        {isBot ? "GLA Bot" : (userName || "You")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isBot && message.provider && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-medium">
                            via {message.provider}
                        </span>
                    )}
                </div>

                {/* Message Body */}
                {isBot ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-code:text-accent-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}

                {/* Copy button (bot messages only) */}
                {isBot && message.content && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="h-7 px-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        {copied ? (
                            <><Check className="h-3 w-3 mr-1" /> Copied</>
                        ) : (
                            <><Copy className="h-3 w-3 mr-1" /> Copy</>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}

/** Typing indicator shown while bot is generating */
export function TypingIndicator() {
    return (
        <div className="flex gap-3 px-4 py-5 bg-muted/30">
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-border/50">
                <AvatarFallback className="bg-accent text-accent-foreground">
                    <Bot className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 pt-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
        </div>
    )
}
