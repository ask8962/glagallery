import { type AcademicResource } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FileText, DownloadCloud, ExternalLink, ThumbsUp, Clock, FileType, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/context/auth-context"

interface ResourceCardProps {
    resource: Partial<AcademicResource>
    onDelete?: (id: string) => void
}

export function ResourceCard({ resource, onDelete }: ResourceCardProps) {
    const { profile, user } = useAuth()
    
    // Check if current user is admin/super_admin or the original author
    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
    const isAuthor = user?.uid === resource.authorUid
    const canDelete = isAdmin || isAuthor
    
    const getIcon = () => {
        switch (resource.type) {
            case "notes": return <FileText className="h-5 w-5 text-blue-500" />
            case "pyq": return <DownloadCloud className="h-5 w-5 text-red-500" />
            case "book": return <BookOpen className="h-5 w-5 text-green-500" />
            default: return <FileType className="h-5 w-5 text-orange-500" />
        }
    }

    const getTypeColor = () => {
        switch (resource.type) {
            case "notes": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "pyq": return "bg-red-500/10 text-red-500 border-red-500/20"
            case "book": return "bg-green-500/10 text-green-500 border-green-500/20"
            default: return "bg-orange-500/10 text-orange-500 border-orange-500/20"
        }
    }

    return (
        <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
            <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted/50 border">
                        {getIcon()}
                    </div>
                    <div>
                        <h3 className="font-semibold line-clamp-1" title={resource.title}>
                            {resource.title}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{resource.subject}</span>
                            <span>•</span>
                            <span>{resource.semester}</span>
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className={getTypeColor()}>
                    {resource.type?.toUpperCase()}
                </Badge>
            </CardHeader>

            <CardContent className="flex-grow pb-3">
                {resource.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground italic">No description provided.</p>
                )}
            </CardContent>

            <CardFooter className="pt-3 border-t bg-muted/20 flex-col gap-3">
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">By {resource.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {resource.createdAt ? formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true }) : "recently"}
                    </div>
                </div>
                
                <div className="flex items-center justify-between w-full gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-9 rounded-full gap-2" asChild>
                        <a href={resource.driveLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Open in Drive
                        </a>
                    </Button>
                    
                    {canDelete && onDelete && (
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                            onClick={() => onDelete(resource.id!)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    )
}
