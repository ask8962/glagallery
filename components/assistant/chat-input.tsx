"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSend: () => void
    isLoading: boolean
    disabled?: boolean
}

export function ChatInput({ value, onChange, onSend, isLoading, disabled }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const MAX_CHARS = 2000

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = "auto"
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
        }
    }, [value])

    // Focus textarea on mount
    useEffect(() => {
        textareaRef.current?.focus()
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (value.trim() && !isLoading && !disabled) {
                onSend()
            }
        }
    }

    const canSend = value.trim().length > 0 && !isLoading && !disabled && value.length <= MAX_CHARS

    return (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
            <div className="mx-auto max-w-3xl">
                <div className="relative flex items-end gap-2 rounded-xl border bg-card shadow-sm focus-within:ring-2 focus-within:ring-accent/50 transition-shadow">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask GLA Bot anything about campus..."
                        disabled={isLoading || disabled}
                        rows={1}
                        className={cn(
                            "flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none",
                            "placeholder:text-muted-foreground/60",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "min-h-[44px] max-h-[200px]"
                        )}
                    />
                    <div className="flex items-center gap-2 pr-3 pb-3">
                        {value.length > 0 && (
                            <span className={cn(
                                "text-[10px] tabular-nums",
                                value.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground/50"
                            )}>
                                {value.length}/{MAX_CHARS}
                            </span>
                        )}
                        <Button
                            size="sm"
                            onClick={onSend}
                            disabled={!canSend}
                            className="h-8 w-8 p-0 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                    GLA Bot can make mistakes. Verify important info with official sources.
                </p>
            </div>
        </div>
    )
}
