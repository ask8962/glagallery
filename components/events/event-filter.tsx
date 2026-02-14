"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface EventFilterProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    selectedCategory: string
    setSelectedCategory: (category: string) => void
}

export function EventFilter({
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
}: EventFilterProps) {
    const categories = [
        "all",
        "tech",
        "cultural",
        "sports",
        "workshop",
        "seminar",
        "hackathon",
        "other"
    ]

    return (
        <div className="bg-card border rounded-lg p-4 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events, venues, or tags..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filter */}
                <div className="w-full md:w-48">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Category" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="capitalize">
                                    {cat === "all" ? "All Categories" : cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Clear Filters */}
                {(searchQuery || selectedCategory !== "all") && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setSearchQuery("")
                            setSelectedCategory("all")
                        }}
                        title="Clear Filters"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
