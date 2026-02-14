"use client"

import { Button } from "@/components/ui/button"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h2 className="text-2xl font-bold">Critical Error</h2>
                <p className="text-muted-foreground">The application encountered a critical error.</p>
                <Button onClick={() => reset()}>Try again</Button>
            </body>
        </html>
    )
}
