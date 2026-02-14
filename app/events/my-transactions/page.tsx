"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { getFirebase } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Transaction } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Receipt, IndianRupee, ArrowLeft, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react"
import Link from "next/link"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
    created: { label: "Pending", variant: "outline", icon: Clock },
    successful: { label: "Paid", variant: "default", icon: CheckCircle },
    failed: { label: "Failed", variant: "destructive", icon: XCircle },
    refunded: { label: "Refunded", variant: "secondary", icon: RefreshCw },
}

export default function MyTransactionsPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [transactions, setTransactions] = useState<(Transaction & { id: string })[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/events/my-transactions")
        } else if (user) {
            fetchTransactions()
        }
    }, [user, authLoading])

    const fetchTransactions = async () => {
        try {
            const { db } = getFirebase()
            const txRef = collection(db, "transactions")
            const q = query(
                txRef,
                where("userId", "==", user!.uid),
                orderBy("createdAt", "desc")
            )
            const snapshot = await getDocs(q)

            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as (Transaction & { id: string })[]

            setTransactions(fetched)
        } catch (error) {
            console.error("Failed to fetch transactions:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatAmount = (paise: number) => {
        return `₹${(paise / 100).toFixed(2)}`
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch {
            return dateStr
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Link href="/events/my-tickets">
                    <Button variant="ghost" size="sm" className="mb-4 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Tickets
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Receipt className="h-8 w-8 text-primary" />
                    Payment History
                </h1>
                <p className="text-muted-foreground mt-2">
                    View all your event payment transactions
                </p>
            </div>

            {transactions.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Transactions Yet</h3>
                        <p className="text-muted-foreground mt-2">
                            Your payment history will appear here when you register for paid events.
                        </p>
                        <Link href="/events">
                            <Button className="mt-4">Browse Events</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {/* Summary Card */}
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="py-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Spent</p>
                                <p className="text-2xl font-bold flex items-center gap-1">
                                    <IndianRupee className="h-5 w-5" />
                                    {(transactions
                                        .filter(t => t.status === "successful")
                                        .reduce((sum, t) => sum + t.amount, 0) / 100
                                    ).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Transactions</p>
                                <p className="text-2xl font-bold">{transactions.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transactions List */}
                    {transactions.map((tx) => {
                        const config = statusConfig[tx.status] || statusConfig.created
                        const StatusIcon = config.icon

                        return (
                            <Card key={tx.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardHeader className="bg-muted/30 flex flex-row items-center justify-between py-3">
                                    <div className="flex items-center gap-2">
                                        <StatusIcon className="h-4 w-4" />
                                        <CardTitle className="text-base">
                                            {tx.receipt || tx.orderId}
                                        </CardTitle>
                                    </div>
                                    <Badge variant={config.variant}>
                                        {config.label}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">
                                                Event: <strong>{tx.eventId}</strong>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(tx.createdAt)}
                                            </p>
                                            {tx.paymentId && (
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    Payment ID: {tx.paymentId}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-primary">
                                                {formatAmount(tx.amount)}
                                            </p>
                                            <p className="text-xs text-muted-foreground uppercase">
                                                {tx.currency || "INR"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
