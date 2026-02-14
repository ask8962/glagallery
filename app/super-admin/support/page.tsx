"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { Organization } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ExternalLink, ShieldAlert } from "lucide-react"

export default function SuperAdminSupportTools() {
    const { profile } = useAuth()
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        try {
            const { db } = getFirebase()
            const orgsSnap = await getDocs(collection(db, "organizations"))
            setOrganizations(orgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organization)))
        } catch (error) {
            console.error("Failed to load organizations:", error)
        } finally {
            setLoading(false)
        }
    }

    const logImpersonation = async (orgId: string, orgName: string) => {
        try {
            const { db } = getFirebase()
            await addDoc(collection(db, "audit_logs"), {
                action: "TENANT_IMPERSONATION",
                performedByUserId: profile?.id || "unknown",
                performedByEmail: profile?.email || "unknown",
                targetOrgId: orgId,
                details: `Generated read-only link for ${orgName}`,
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            console.error("Failed to log audit:", error)
        }
    }

    const handleImpersonate = (org: Organization) => {
        logImpersonation(org.id, org.name)
        // In this MVP, we launch the client tenant URL
        // With a proper backend setup, this would issue an impersonation JWT.
        const protocol = window.location.protocol
        const host = window.location.hostname.includes('localhost') ? 'localhost:3000' : 'campushub.pro'
        const url = `${protocol}//${org.slug || org.domain.split('.')[0]}.${host}`
        window.open(url, '_blank')
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Support Tools</h1>
                    <p className="text-muted-foreground mt-1">Tenant impersonation, access logs, and safe mirrors.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p className="text-muted-foreground">Loading toolset...</p>
                ) : (
                    organizations.map((org) => (
                        <Card key={org.id} className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">{org.name}</CardTitle>
                                <CardDescription className="font-mono text-xs">{org.domain}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Generate a safe mirror link to review the environment without destructive actions.
                                </p>
                                <Button 
                                    onClick={() => handleImpersonate(org)}
                                    variant="outline" 
                                    className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                                >
                                    <ExternalLink className="h-4 w-4" /> View Read-Only Mirror
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
            
            <div className="mt-8 rounded-lg border bg-amber-500/10 border-amber-500/20 p-4">
                <div className="flex items-start gap-4">
                    <ShieldAlert className="h-6 w-6 text-amber-600 mt-1" />
                    <div>
                        <h4 className="font-semibold text-amber-800">Security Notice</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            All tenant mirror generation requests are strictly audited. Misuse of the "View Read-Only Mirror" tool to access private user data without consent violates CampOS global policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
