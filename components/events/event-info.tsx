import { Event } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatEventDate } from "@/lib/events-util"
import { Calendar, Clock, MapPin, Globe, Mail, Phone } from "lucide-react"

interface EventInfoProps {
    event: Event
}

export function EventInfo({ event }: EventInfoProps) {
    return (
        <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content - Description */}
            <div className="md:col-span-2 space-y-6">
                {/* About Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>About This Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap">{event.description}</p>
                        </div>

                        {/* Tags */}
                        {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
                                {event.tags.map((tag) => (
                                    <span key={tag} className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Schedule Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Date & Time</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-medium">Starts</p>
                                <p className="text-sm text-muted-foreground">{formatEventDate(event.startDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-medium">Ends</p>
                                <p className="text-sm text-muted-foreground">{formatEventDate(event.endDate)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Organizer Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organizer</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={event.organizer?.photoURL} alt={event.organizer?.name} />
                            <AvatarFallback>{event.organizer?.name?.charAt(0) || "O"}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{event.organizer?.name || "Unknown Organizer"}</p>
                            {event.organizer?.email && (
                                <p className="text-sm text-muted-foreground">{event.organizer.email}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Location Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Venue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium">{event.venueName || event.venueType}</p>
                                {event.venueAddress && (
                                    <p className="text-sm text-muted-foreground">{event.venueAddress}</p>
                                )}
                            </div>
                        </div>
                        {event.meetingLink && (
                            <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5 text-primary" />
                                <a href={event.meetingLink} target="_blank" rel="noopener" className="text-sm text-primary hover:underline">
                                    Join Online
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
