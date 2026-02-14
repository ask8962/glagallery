import { Skeleton } from "@/components/ui/skeleton"

export function EventsSkeleton() {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden">
                    {/* Image Placeholder */}
                    <Skeleton className="h-40 w-full rounded-none" />

                    {/* Content */}
                    <div className="p-4 space-y-3">
                        {/* Title */}
                        <Skeleton className="h-5 w-3/4" />

                        {/* Date & Location */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2">
                            <Skeleton className="h-8 w-20 rounded-md" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
