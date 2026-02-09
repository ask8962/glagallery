"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search } from "lucide-react"

interface ManualCodeEntryProps {
    onVerify: (code: string) => Promise<void>
    disabled?: boolean
}

export function ManualCodeEntry({ onVerify, disabled }: ManualCodeEntryProps) {
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setLoading(true)
        try {
            await onVerify(code.trim().toUpperCase())
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                placeholder="Enter ticket code (e.g., GLA-ABC123)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={disabled || loading}
                className="font-mono uppercase"
            />
            <Button type="submit" disabled={disabled || loading || !code.trim()}>
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Search className="h-4 w-4" />
                )}
            </Button>
        </form>
    )
}
