"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Club } from "@/lib/types"

export function ClubVerificationDashboard() {
    const { db } = getFirebase()
    const { user } = useAuth()
    const [clubs, setClubs] = useState<Club[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen for clubs with pending verification or recently processed
        // Note: In a real app we might verify indexes exist.
        // We'll fetch all clubs and filter client side for now to avoid index issues with complex queries 
        // unless the list is huge. 
        // Ideally: query(collection(db, "clubs"), where("verification.status", "in", ["pending", "verified", "rejected"]))

        // Let's try fetching just pending ones for the main view to be efficient if possible.
        // Actually, asking for "verification.status" != "unverified" is hard in Firestore.
        // So let's just listen to "clubs" and filter. Assuming < 100 clubs locally.
        const q = query(
            collection(db, "clubs"),
            orderBy("updatedAt", "desc")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Club[] = []
            snapshot.forEach((doc) => {
                const data = doc.data() as Club
                if (data.verification && data.verification.status !== "unverified") {
                    items.push({ ...data, id: doc.id })
                }
            })
            setClubs(items)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching clubs:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [db])

    async function handleAction(clubId: string, action: "approve" | "reject") {
        try {
            // Prompt for rejection reason
            let rejectionReason = ""
            if (action === "reject") {
                const reason = window.prompt("Enter rejection reason:")
                if (!reason) return // Cancel if no reason
                rejectionReason = reason
            }

            const token = await user?.getIdToken()
            const res = await fetch("/api/clubs/verify/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    clubId,
                    action,
                    rejectionReason: action === "reject" ? rejectionReason : undefined
                }),
            })

            if (!res.ok) throw new Error("Failed to process request")

            toast.success(action === "approve" ? "Club verified" : "Request rejected")
        } catch (error) {
            console.error(error)
            toast.error("Failed to process request")
        }
    }

    if (loading) return (
        <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )

    // Use type safe access
    const pendingClubs = clubs.filter(c => c.verification?.status === "pending")
    const historyClubs = clubs.filter(c => ["verified", "rejected"].includes(c.verification?.status || ""))

    return (
        <Card>
            <CardHeader>
                <CardTitle>Club Verification</CardTitle>
                <CardDescription>Review and approve new club registrations</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pending">
                    <TabsList>
                        <TabsTrigger value="pending">Pending ({pendingClubs.length})</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="mt-4 space-y-4">
                        {pendingClubs.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No pending requests</p>
                        ) : (
                            pendingClubs.map(club => (
                                <div key={club.id} className="flex items-start justify-between p-4 border rounded-lg bg-card shadow-sm">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-lg">{club.name}</h4>
                                            <Badge variant="outline">{club.category}</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p>Registration No: <span className="font-medium text-foreground">{club.verification?.registrationNumber}</span></p>
                                            <p>Submitted: {club.verification?.submittedAt ? new Date(club.verification.submittedAt).toLocaleDateString() : 'N/A'}</p>
                                        </div>

                                        {club.verification?.documents && club.verification.documents.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {club.verification.documents.map((doc, i) => (
                                                    <a
                                                        key={i}
                                                        href={doc}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs flex items-center gap-1 bg-secondary px-2 py-1 rounded hover:bg-secondary/80"
                                                    >
                                                        <Download className="h-3 w-3" /> Document {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleAction(club.id, "reject")}>
                                            <X className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                        <Button size="sm" onClick={() => handleAction(club.id, "approve")}>
                                            <Check className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-4 space-y-4">
                        {historyClubs.map(club => (
                            <div key={club.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-semibold">{club.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={club.verification?.status === "verified" ? "default" : "destructive"}>
                                            {club.verification?.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {club.verification?.verifiedAt ? new Date(club.verification.verifiedAt).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                    {club.verification?.status === 'rejected' && club.verification.rejectionReason && (
                                        <p className="text-sm text-destructive mt-1">Reason: {club.verification.rejectionReason}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
