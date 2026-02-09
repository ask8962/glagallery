import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
    GraduationCap,
    Mail,
    MapPin,
    Clock,
    BookOpen,
    BadgeCheck
} from "lucide-react"

type FacultyCardProps = {
    name: string
    email: string
    photoURL?: string
    department: string
    designation: string
    cabinNumber?: string
    officeHours?: string
    subjects?: string[]
    isVerified?: boolean
}

export function FacultyCard({
    name,
    email,
    photoURL,
    department,
    designation,
    cabinNumber,
    officeHours,
    subjects = [],
    isVerified = true,
}: FacultyCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-accent/20">
                        <AvatarImage src={photoURL} alt={name} />
                        <AvatarFallback className="text-lg bg-accent/10 text-accent">
                            {name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg truncate">{name}</h3>
                            {isVerified && (
                                <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" />
                            )}
                        </div>
                        <p className="text-accent font-medium">{designation}</p>
                        <Badge variant="secondary" className="mt-1">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {department}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${email}`} className="hover:text-accent truncate">
                        {email}
                    </a>
                </div>

                {cabinNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{cabinNumber}</span>
                    </div>
                )}

                {officeHours && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{officeHours}</span>
                    </div>
                )}

                {subjects.length > 0 && (
                    <div className="pt-2 border-t">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <BookOpen className="h-3 w-3" />
                            <span>Subjects</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {subjects.slice(0, 4).map((subject, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                    {subject}
                                </Badge>
                            ))}
                            {subjects.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                    +{subjects.length - 4} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
