import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "content" | "page" | "hero"
    text?: string
}

export function LoadingSpinner({ className, size = "content", text, ...props }: LoadingSpinnerProps) {
    const sizeClasses = {
        content: "h-6 w-6",
        page: "h-12 w-12",
        hero: "h-16 w-16",
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-4 text-muted-foreground",
                size === "page" && "min-h-[60vh]",
                className
            )}
            {...props}
        >
            <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
            {text && <p className="text-sm font-medium animate-pulse">{text}</p>}
        </div>
    )
}
