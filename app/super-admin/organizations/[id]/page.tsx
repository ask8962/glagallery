"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, collection, getCountFromServer, query, where } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase"
import { Organization } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Save, ShieldAlert, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function TenantManagementPage() {
    const params = useParams()
    const router = useRouter()
    const orgId = params.id as string

    const [org, setOrg] = useState<Organization | null>(null)
    const [userCount, setUserCount] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Form states
    const [name, setName] = useState("")
    const [domain, setDomain] = useState("")
    const [slug, setSlug] = useState("")
    const [primaryColor, setPrimaryColor] = useState("#000000")
    const [status, setStatus] = useState<"active" | "suspended">("active")

    useEffect(() => {
        if (!orgId) return
        fetchData()
    }, [orgId])

    const fetchData = async () => {
        try {
            const { db } = getFirebase()
            
            // Fetch Organization
            const orgRef = doc(db, "organizations", orgId)
            const orgSnap = await getDoc(orgRef)
            
            if (orgSnap.exists()) {
                const data = { id: orgSnap.id, ...orgSnap.data() } as Organization
                setOrg(data)
                setName(data.name)
                setDomain(data.domain)
                setSlug(data.slug)
                setPrimaryColor(data.branding?.primaryColor || "#000000")
                setStatus(data.status || "active")
            } else {
                toast.error("Organization not found")
                router.push("/super-admin/organizations")
                return
            }

            // Fetch User Count
            const usersRef = collection(db, "users")
            const q = query(usersRef, where("organizationId", "==", orgId))
            const countSnap = await getCountFromServer(q)
            setUserCount(countSnap.data().count)

        } catch (error) {
            console.error("Failed to load tenant data:", error)
            toast.error("Failed to load tenant details")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { db } = getFirebase()
            const orgRef = doc(db, "organizations", orgId)
            
            await updateDoc(orgRef, {
                name,
                domain,
                slug,
                status,
                branding: { primaryColor }
            })
            
            toast.success("Tenant updated successfully")
            fetchData() // Refresh data
        } catch (error) {
            console.error("Error saving tenant:", error)
            toast.error("Failed to update tenant")
        } finally {
            setIsSaving(false)
        }
    }

    const toggleStatus = async () => {
        const newStatus = status === "active" ? "suspended" : "active"
        if (newStatus === "suspended" && !confirm("Are you sure you want to suspend this tenant? Students will not be able to log in.")) {
            return
        }

        try {
            const { db } = getFirebase()
            const orgRef = doc(db, "organizations", orgId)
            await updateDoc(orgRef, { status: newStatus })
            setStatus(newStatus)
            toast.success(`Tenant ${newStatus === "active" ? "activated" : "suspended"}`)
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Failed to update status")
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading tenant details...</div>
    }

    if (!org) return null

    return (
        <div className="space-y-8 pb-12 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/super-admin/organizations">
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                                status === "suspended" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                            }`}>
                                {status}
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-1 font-mono text-sm">{org.domain} • {org.slug}.campushub.pro</p>
                    </div>
                </div>
                
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Students & faculty under this tenant</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                        <CardDescription>Update the core identity of the university.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input 
                                id="name" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain">Primary Email Domain</Label>
                            <Input 
                                id="domain" 
                                value={domain} 
                                onChange={(e) => setDomain(e.target.value)} 
                                placeholder="e.g. gla.ac.in"
                            />
                            <p className="text-[10px] text-muted-foreground">Used for automatic user routing on sign-up.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Subdomain Slug</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="slug" 
                                    value={slug} 
                                    onChange={(e) => setSlug(e.target.value)} 
                                    className="flex-1"
                                />
                                <span className="text-muted-foreground text-sm font-mono">.campushub.pro</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {/* Branding */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Branding</CardTitle>
                            <CardDescription>Customize how the platform looks for this tenant.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="color">Primary Brand Color</Label>
                                <div className="flex items-center gap-3">
                                    <Input 
                                        type="color" 
                                        id="color" 
                                        value={primaryColor} 
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-16 h-10 p-1 cursor-pointer"
                                    />
                                    <Input 
                                        value={primaryColor} 
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="flex-1 font-mono uppercase"
                                    />
                                </div>
                            </div>
                            <div className="p-4 rounded-lg border flex items-center gap-4 bg-card mt-4">
                                <div className="h-10 w-10 rounded-md flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor }}>
                                    {name.substring(0, 1).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold" style={{ color: primaryColor }}>Preview Button</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className={status === "suspended" ? "border-green-500/50" : "border-red-500/50"}>
                        <CardHeader>
                            <CardTitle className={status === "suspended" ? "text-green-500" : "text-red-500"}>Access Control</CardTitle>
                            <CardDescription>
                                {status === "suspended" 
                                    ? "This tenant is currently suspended. Students cannot log in." 
                                    : "Suspending a tenant immediately blocks all access for associated users."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                variant={status === "suspended" ? "default" : "destructive"} 
                                className="w-full gap-2"
                                onClick={toggleStatus}
                            >
                                {status === "suspended" ? (
                                    <><CheckCircle2 className="h-4 w-4" /> Reactivate Tenant</>
                                ) : (
                                    <><ShieldAlert className="h-4 w-4" /> Suspend Tenant</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
