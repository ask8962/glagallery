"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase"
import { Organization } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Plus, Settings } from "lucide-react"

export default function SuperAdminOrganizations() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)

    const [isProvisionOpen, setIsProvisionOpen] = useState(false)
    const [newOrgName, setNewOrgName] = useState("")
    const [newOrgDomain, setNewOrgDomain] = useState("")
    const [newOrgSlug, setNewOrgSlug] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

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

    const handleProvisionTenant = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newOrgName || !newOrgDomain || !newOrgSlug) return

        setIsSubmitting(true)
        try {
            const { db } = getFirebase()
            await addDoc(collection(db, "organizations"), {
                name: newOrgName,
                domain: newOrgDomain,
                slug: newOrgSlug,
                status: "active",
                branding: { primaryColor: "#0F172A" },
                createdAt: new Date().toISOString()
            })
            setIsProvisionOpen(false)
            setNewOrgName("")
            setNewOrgDomain("")
            setNewOrgSlug("")
            fetchOrganizations()
        } catch (error) {
            console.error("Error provisioning tenant:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                    <p className="text-muted-foreground mt-1">Manage global college tenants, subdomains, and branding.</p>
                </div>
                
                <Dialog open={isProvisionOpen} onOpenChange={setIsProvisionOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Provision New Tenant
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Provision New Tenant</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleProvisionTenant} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="orgName">Organization Name</Label>
                                <Input 
                                    id="orgName" 
                                    placeholder="e.g. Amity University" 
                                    value={newOrgName}
                                    onChange={(e) => setNewOrgName(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="orgDomain">Primary Domain</Label>
                                <Input 
                                    id="orgDomain" 
                                    placeholder="e.g. amity.edu" 
                                    value={newOrgDomain}
                                    onChange={(e) => setNewOrgDomain(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="orgSlug">Subdomain Slug</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        id="orgSlug" 
                                        placeholder="amity" 
                                        value={newOrgSlug}
                                        onChange={(e) => setNewOrgSlug(e.target.value)}
                                        required 
                                        className="flex-1"
                                    />
                                    <span className="text-muted-foreground text-sm">.campushub.pro</span>
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Provisioning..." : "Create Tenant"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                    <p className="text-muted-foreground">Loading tenants...</p>
                ) : organizations.length === 0 ? (
                    <p className="text-muted-foreground">No organizations found.</p>
                ) : (
                    organizations.map((org) => (
                        <Card key={org.id} className="shadow-sm hover:shadow-md transition-shadow relative overflow-hiddenGroup">
                            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold" style={{ backgroundColor: org.branding?.primaryColor || '#000' }}>
                                            {org.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{org.name}</CardTitle>
                                            <CardDescription className="text-xs font-mono">{org.domain}</CardDescription>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                                        org.status === "suspended" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                    }`}>
                                        {org.status || "Active"}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 text-sm">
                                <div className="flex justify-between items-center text-muted-foreground mb-4">
                                    <span>Subdomain: <span className="font-medium text-foreground">{org.slug}.campushub.pro</span></span>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full gap-2 text-xs"
                                    onClick={() => {
                                        import("sonner").then(({ toast }) => {
                                            toast.info("Tenant management dashboard coming soon.")
                                        })
                                    }}
                                >
                                    <Settings className="h-3.5 w-3.5" /> Manage Tenant
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
