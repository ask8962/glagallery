import { Skeleton } from "@/components/ui/skeleton"

export function ClubsSkeleton() {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden">
                    {/* Cover Image */}
                    <div className="relative h-32">
                        <Skeleton className="h-full w-full rounded-none" />
                        {/* Logo */}
                        <div className="absolute -bottom-8 left-4">
                            <Skeleton className="h-16 w-16 rounded-xl border-4 border-background" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="pt-10 pb-4 px-4 space-y-3">
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>

                        {/* Description */}
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />

                        {/* Members */}
                        <div className="flex items-center gap-2 pt-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
