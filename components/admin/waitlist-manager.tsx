"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, UserMinus, Bell, Loader2 } from "lucide-react"
import { getFirebase } from "@/lib/firebase"
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore"
import { toast } from "sonner"

interface WaitlistManagerProps {
    eventId: string
    eventTitle: string
}

interface WaitlistUser {
    uid: string
    name: string
    email: string
    position: number
}

export function WaitlistManager({ eventId, eventTitle }: WaitlistManagerProps) {
    const [waitlist, setWaitlist] = useState<WaitlistUser[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        fetchWaitlist()
    }, [eventId])

    const fetchWaitlist = async () => {
        try {
            const { db } = getFirebase()
            const eventDoc = await getDoc(doc(db, "events", eventId))

            if (eventDoc.exists()) {
                const eventData = eventDoc.data()
                const waitlistIds: string[] = eventData.waitlist || []

                // Fetch user details for each waitlist entry
                const users: WaitlistUser[] = []
                for (let i = 0; i < waitlistIds.length; i++) {
                    const userDoc = await getDoc(doc(db, "users", waitlistIds[i]))
                    if (userDoc.exists()) {
                        users.push({
                            uid: userDoc.id,
                            name: userDoc.data().name || "Unknown",
                            email: userDoc.data().email || "",
                            position: i + 1
                        })
                    }
                }
                setWaitlist(users)
            }
        } catch (error) {
            console.error("Failed to fetch waitlist:", error)
        } finally {
            setLoading(false)
        }
    }

    const removeFromWaitlist = async (uid: string) => {
        setProcessing(uid)
        try {
            const { db } = getFirebase()
            await updateDoc(doc(db, "events", eventId), {
                waitlist: arrayRemove(uid)
            })
            toast.success("User removed from waitlist")
            fetchWaitlist()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setProcessing(null)
        }
    }

    const promoteFromWaitlist = async (uid: string) => {
        setProcessing(uid)
        try {
            // Call the registration API to create a ticket for this user
            // This would require an admin-specific API endpoint
            toast.info("Promotion feature coming soon - manually register user for now")
        } finally {
            setProcessing(null)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Waitlist - {eventTitle}
                </CardTitle>
                <Badge variant="outline">{waitlist.length} waiting</Badge>
            </CardHeader>
            <CardContent>
                {waitlist.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                        No users on waitlist
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">#</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {waitlist.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell className="font-mono text-muted-foreground">
                                        {user.position}
                                    </TableCell>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={processing === user.uid}
                                            onClick={() => promoteFromWaitlist(user.uid)}
                                        >
                                            <Bell className="h-4 w-4 mr-1" />
                                            Promote
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={processing === user.uid}
                                            onClick={() => removeFromWaitlist(user.uid)}
                                        >
                                            {processing === user.uid ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <UserMinus className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
