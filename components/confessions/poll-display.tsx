"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import type { PollOption } from "@/lib/types"

interface PollDisplayProps {
    confessionId: string
    options: PollOption[]
    expiresAt?: string
}

export function PollDisplay({ confessionId, options: initialOptions, expiresAt }: PollDisplayProps) {
    const { user } = useAuth()
    const [options, setOptions] = useState(initialOptions)
    const [voting, setVoting] = useState(false)

    const isExpired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false
    const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0)
    
    // Check if current user has voted
    const userVotedOptionId = user 
        ? options.find(opt => opt.voterUids?.includes(user.uid))?.id 
        : null

    const handleVote = async (optionId: string) => {
        if (!user) {
            toast.error("Please sign in to vote")
            return
        }
        if (isExpired) {
            toast.error("This poll has expired")
            return
        }
        if (userVotedOptionId) {
            toast.error("You have already voted")
            return
        }
        if (voting) return

        setVoting(true)
        try {
            // Note: In a full implementation, this needs its own API route or a specific handler in the patch route.
            // For this UI mockup, we'll simulate the optimistic update.
            // await fetch(`/api/confessions/${confessionId}/poll/${optionId}`, { method: 'POST', body: JSON.stringify({ userId: user.uid }) })
            
            setOptions(prev => prev.map(opt => {
                if (opt.id === optionId) {
                    return {
                        ...opt,
                        votes: (opt.votes || 0) + 1,
                        voterUids: [...(opt.voterUids || []), user.uid]
                    }
                }
                return opt
            }))
            
            toast.success("Vote cast!")
        } catch (error) {
            toast.error("Failed to cast vote")
        } finally {
            setVoting(false)
        }
    }

    return (
        <div className="my-4 space-y-2">
            {options.map((option) => {
                const percent = totalVotes > 0 ? Math.round(((option.votes || 0) / totalVotes) * 100) : 0
                const isSelected = option.id === userVotedOptionId
                const showResults = !!userVotedOptionId || isExpired

                return (
                    <button
                        key={option.id}
                        onClick={() => handleVote(option.id)}
                        disabled={!!userVotedOptionId || isExpired || voting}
                        className={`
                            relative w-full overflow-hidden rounded-lg border p-3 text-left transition-all
                            ${showResults ? "bg-muted/30" : "hover:bg-muted/50 cursor-pointer"}
                            ${isSelected ? "border-blue-500 ring-1 ring-blue-500/50" : ""}
                        `}
                    >
                        {/* Progress Bar background (only shows if voted or expired) */}
                        {showResults && (
                            <div 
                                className={`absolute left-0 top-0 h-full opacity-20 transition-all duration-500 ${isSelected ? "bg-blue-500" : "bg-muted-foreground"}`}
                                style={{ width: `${percent}%` }}
                            />
                        )}

                        <div className="relative flex justify-between items-center z-10">
                            <span className={`text-sm ${isSelected ? "font-semibold" : ""}`}>
                                {option.text}
                            </span>
                            {showResults && (
                                <span className="text-sm font-medium text-muted-foreground ml-4">
                                    {percent}%
                                </span>
                            )}
                        </div>
                    </button>
                )
            })}
            
            <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                <span>{totalVotes} votes</span>
                {expiresAt && (
                    <span>
                        {isExpired ? "Poll ended" : `Ends ${new Date(expiresAt).toLocaleDateString()}`}
                    </span>
                )}
            </div>
        </div>
    )
}
