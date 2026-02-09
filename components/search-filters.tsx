"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { X, Search, Filter, Calendar as CalendarIcon, User, Hash, Image as ImageIcon, Video } from "lucide-react"
import { format } from "date-fns"
import type { SearchFilters } from "@/lib/search"
import {
  getHashtagSuggestions,
  getUserSuggestions,
  getSearchHistory,
  clearSearchHistory,
} from "@/lib/search"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onSearch: () => void
  tags?: string[]
}

export function SearchFiltersComponent({
  filters,
  onFiltersChange,
  onSearch,
  tags = [],
}: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || "")
  const [showFilters, setShowFilters] = useState(false)
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([])
  const [userSuggestions, setUserSuggestions] = useState<any[]>([])
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false)
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState(getSearchHistory())

  // Update search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, query: searchQuery })
      
      // Get suggestions
      if (searchQuery.startsWith("#")) {
        const hashtag = searchQuery.slice(1)
        if (hashtag.length > 0) {
          getHashtagSuggestions(hashtag).then(setHashtagSuggestions)
          setShowHashtagSuggestions(true)
        } else {
          setShowHashtagSuggestions(false)
        }
      } else if (searchQuery.startsWith("@")) {
        const username = searchQuery.slice(1)
        if (username.length > 0) {
          getUserSuggestions(username).then(setUserSuggestions)
          setShowUserSuggestions(true)
        } else {
          setShowUserSuggestions(false)
        }
      } else {
        setShowHashtagSuggestions(false)
        setShowUserSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters, onFiltersChange])

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag]
    onFiltersChange({ ...filters, tags: newTags })
  }

  const handleHashtagSelect = (hashtag: string) => {
    const currentHashtags = filters.hashtags || []
    const hashtagWithHash = hashtag.startsWith("#") ? hashtag : `#${hashtag}`
    if (!currentHashtags.includes(hashtagWithHash)) {
      onFiltersChange({
        ...filters,
        hashtags: [...currentHashtags, hashtagWithHash],
      })
    }
    setSearchQuery("")
    setShowHashtagSuggestions(false)
  }

  const handleUserSelect = (user: any) => {
    onFiltersChange({ ...filters, userId: user.uid })
    setSearchQuery("")
    setShowUserSuggestions(false)
  }

  const handleHistorySelect = (item: any) => {
    setSearchQuery(item.query)
    if (item.filters) {
      onFiltersChange(item.filters)
    }
    onSearch()
  }

  const clearFilters = () => {
    onFiltersChange({
      query: "",
      tags: [],
      hashtags: [],
      mediaType: "all",
      userId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: "newest",
    })
    setSearchQuery("")
  }

  const hasActiveFilters =
    (filters.tags && filters.tags.length > 0) ||
    (filters.hashtags && filters.hashtags.length > 0) ||
    filters.mediaType !== "all" ||
    filters.userId ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.sortBy !== "newest"

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search memories, #hashtags, @users, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch()
            }
          }}
          className="pl-10 pr-10"
        />
        
        {/* Hashtag Suggestions */}
        {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
            {hashtagSuggestions.map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => handleHashtagSelect(hashtag)}
                className="w-full text-left px-4 py-2 hover:bg-accent flex items-center gap-2"
              >
                <Hash className="h-4 w-4" />
                <span>{hashtag}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* User Suggestions */}
        {showUserSuggestions && userSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
            {userSuggestions.map((user) => (
              <button
                key={user.uid}
                onClick={() => handleUserSelect(user)}
                className="w-full text-left px-4 py-2 hover:bg-accent flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span>{user.name}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Search History */}
        {searchQuery === "" && searchHistory.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
            <div className="p-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Recent Searches</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearSearchHistory()
                  setSearchHistory([])
                }}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
            <Separator />
            <ScrollArea className="h-48">
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistorySelect(item)}
                  className="w-full text-left px-4 py-2 hover:bg-accent flex items-center gap-2"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{item.query}</span>
                </button>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {[
                    filters.tags?.length || 0,
                    filters.hashtags?.length || 0,
                    filters.mediaType !== "all" ? 1 : 0,
                    filters.userId ? 1 : 0,
                    filters.dateFrom ? 1 : 0,
                    filters.dateTo ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div>
                <Label>Media Type</Label>
                <Select
                  value={filters.mediaType || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      mediaType: value as "image" | "video" | "all",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images Only</SelectItem>
                    <SelectItem value="video">Videos Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sort By</Label>
                <Select
                  value={filters.sortBy || "newest"}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      sortBy: value as "newest" | "oldest" | "popular",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {filters.dateFrom
                            ? format(filters.dateFrom, "MMM d, yyyy")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={filters.dateFrom}
                          onSelect={(date) =>
                            onFiltersChange({ ...filters, dateFrom: date })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {filters.dateTo
                            ? format(filters.dateTo, "MMM d, yyyy")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={filters.dateTo}
                          onSelect={(date) =>
                            onFiltersChange({ ...filters, dateTo: date })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Tags */}
        {tags.map((tag) => (
          <Button
            key={tag}
            variant={filters.tags?.includes(tag) ? "default" : "outline"}
            size="sm"
            onClick={() => handleTagToggle(tag)}
          >
            {tag}
          </Button>
        ))}

        {/* Active Hashtags */}
        {filters.hashtags?.map((hashtag) => (
          <Badge
            key={hashtag}
            variant="secondary"
            className="flex items-center gap-1"
          >
            <Hash className="h-3 w-3" />
            {hashtag}
            <button
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  hashtags: filters.hashtags?.filter((h) => h !== hashtag),
                })
              }
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Active User Filter */}
        {filters.userId && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            User filter active
            <button
              onClick={() => onFiltersChange({ ...filters, userId: undefined })}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
    </div>
  )
}
