"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase"
import { AuditLog } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { UserCheck, Settings, Key, ShieldAlert } from "lucide-react"

export default function SuperAdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        try {
            const { db } = getFirebase()
            // Fetch latest 50 logs
            const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(50))
            const logsSnap = await getDocs(q)
            setLogs(logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)))
        } catch (error) {
            console.error("Failed to load audit logs:", error)
        } finally {
            setLoading(false)
        }
    }

    const getIconForAction = (action: string) => {
        if (action.includes("TENANT_IMPERSONATION")) return <UserCheck className="h-4 w-4 text-purple-500" />
        if (action.includes("SETTINGS_UPDATE")) return <Settings className="h-4 w-4 text-blue-500" />
        if (action.includes("AUTHENTICATION")) return <Key className="h-4 w-4 text-green-500" />
        return <ShieldAlert className="h-4 w-4 text-amber-500" />
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground mt-1">Immutable security tracking for all global operations.</p>
                </div>
            </div>

            <Card className="overflow-hidden border shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Timestamp</th>
                                <th className="px-6 py-4 font-medium">Action</th>
                                <th className="px-6 py-4 font-medium">Performed By</th>
                                <th className="px-6 py-4 font-medium">Target Org</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading audit records...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No recent audit trails found.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="bg-card hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                        </td>
                                        <td className="px-6 py-4 font-medium whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getIconForAction(log.action)}
                                                {log.action}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{log.performedByEmail}</td>
                                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{log.targetOrgId || "Global"}</td>
                                        <td className="px-6 py-4 max-w-md truncate" title={log.details}>{log.details}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
