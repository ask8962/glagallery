"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { eventSchema, EventFormData } from "@/lib/validations/events"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Loader2, CalendarIcon, MapPin, ImageIcon, Tag, DollarSign, Users } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import type { Event } from "@/lib/types"

interface CreateEventFormProps {
    initialData?: Event
}

export function CreateEventForm({ initialData }: CreateEventFormProps = {}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [submitting, setSubmitting] = useState(false)

    // Check if creating for a club
    const clubId = searchParams.get("clubId")
    const clubName = searchParams.get("clubName")

    // Default values for the form
    const form = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: initialData ? {
            title: initialData.title,
            description: initialData.description,
            shortDescription: initialData.shortDescription,
            bannerURL: initialData.bannerURL || "",
            startDate: initialData.startDate ? new Date(initialData.startDate as any).toISOString().slice(0, 16) : "",
            endDate: initialData.endDate ? new Date(initialData.endDate as any).toISOString().slice(0, 16) : "",
            registrationDeadline: initialData.registrationDeadline ? new Date(initialData.registrationDeadline as any).toISOString().slice(0, 16) : "",
            venueType: initialData.venueType as any,
            venueName: initialData.venueName || "",
            venueAddress: initialData.venueAddress || "",
            meetingLink: initialData.meetingLink || "",
            category: initialData.category as any,
            tags: initialData.tags,
            isFree: initialData.isFree,
            price: initialData.price || 0,
            capacity: initialData.capacity,
            allowedDomainsText: initialData.allowedDomains ? initialData.allowedDomains.join(", ") : "",
        } : {
            title: "",
            shortDescription: "",
            description: "",
            bannerURL: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80", // Default placeholder
            startDate: "",
            endDate: "",
            venueType: "on-campus",
            venueName: "",
            venueAddress: "",
            category: "other",
            tags: ["general"],
            isFree: true,
            price: 0,
            capacity: 50,
            allowedDomainsText: "",
        },
    })

    const isFree = form.watch("isFree")

    // Get the user from context to extract the token
    const { user } = useAuth()

    async function onSubmit(data: EventFormData) {
        setSubmitting(true)
        try {
            // Ensure user exists and get token
            if (!user) throw new Error("You must be logged in to create an event")
            const token = await user.getIdToken()

            const url = initialData ? `/api/events/${initialData.id}` : "/api/events"
            const method = initialData ? "PUT" : "POST"

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    hostedByClubId: clubId || undefined,
                    hostedByClubName: clubName || undefined,
                }),
            })

            const result = await res.json()

            if (!res.ok) throw new Error(result.error || "Failed to process event")

            toast.success(initialData ? "Event updated successfully!" : "Event created successfully!")
            router.push(`/events/${initialData ? initialData.id : result.eventId}`)
        } catch (error: any) {
            toast.error(error.message || "Something went wrong. Please try again.")
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">

                {/* 1. Basic Details */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-medium">Basic Details</h3>
                    </div>

                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. AI & Robotics Workshop" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="tech">Tech & Coding</SelectItem>
                                            <SelectItem value="cultural">Cultural & Arts</SelectItem>
                                            <SelectItem value="sports">Sports & Fitness</SelectItem>
                                            <SelectItem value="workshop">Workshop</SelectItem>
                                            <SelectItem value="seminar">Seminar / Talk</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="capacity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Capacity</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="50"
                                            {...field}
                                            onChange={e => field.onChange(parseInt(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* 2. Schedule */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-medium">Schedule</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date & Time</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Date & Time</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* 3. Venue */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-medium">Venue</h3>
                    </div>

                    <FormField
                        control={form.control}
                        name="venueType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Venue Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="on-campus">On Campus</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="venueName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Venue Name / Link</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Block 1, Room 204 OR Zoom Link" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* 4. Description & Media */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-medium">Details & Media</h3>
                    </div>

                    <FormField
                        control={form.control}
                        name="bannerURL"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Banner Image URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormDescription>Link to an image (Unsplash, etc.)</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="shortDescription"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Short Summary</FormLabel>
                                <FormControl>
                                    <Input placeholder="Brief hook for the card (max 200 chars)" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Detailed event information..."
                                        className="min-h-[150px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>Minimum 20 characters.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* 5. Pricing */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-medium">Pricing</h3>
                    </div>

                    <FormField
                        control={form.control}
                        name="isFree"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Free Event</FormLabel>
                                    <FormDescription>
                                        Attendees can register for free
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {!isFree && (
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ticket Price (₹)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="99"
                                            {...field}
                                            onChange={e => field.onChange(parseInt(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="allowedDomainsText"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Allowed Email Domains (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. gla.ac.in, amity.edu" {...field} />
                                </FormControl>
                                <FormDescription>Leave empty to allow all users within your organization.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" size="lg" disabled={submitting} className="min-w-[150px]">
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Save Changes" : "Publish Event"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
