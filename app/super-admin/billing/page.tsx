"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase"
import { BillingLead } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
    lead: "bg-gray-100 text-gray-800",
    contacted: "bg-blue-100 text-blue-800",
    pilot: "bg-purple-100 text-purple-800",
    negotiation: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    churned: "bg-red-100 text-red-800"
}

export default function SuperAdminBillingCRM() {
    const [leads, setLeads] = useState<BillingLead[]>([])
    const [loading, setLoading] = useState(true)

    const [isLeadOpen, setIsLeadOpen] = useState(false)
    const [newLeadOrgId, setNewLeadOrgId] = useState("")
    const [newLeadStatus, setNewLeadStatus] = useState("lead")
    const [newLeadValue, setNewLeadValue] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchLeads()
    }, [])

    const fetchLeads = async () => {
        try {
            const { db } = getFirebase()
            const crmSnap = await getDocs(collection(db, "billing_crm"))
            setLeads(crmSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BillingLead)))
        } catch (error) {
            console.error("Failed to load CRM leads:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newLeadOrgId) return

        setIsSubmitting(true)
        try {
            const { db } = getFirebase()
            await addDoc(collection(db, "billing_crm"), {
                orgId: newLeadOrgId,
                status: newLeadStatus,
                contractValue: Number(newLeadValue) || 0,
                createdAt: new Date().toISOString(),
                nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week
            })
            setIsLeadOpen(false)
            setNewLeadOrgId("")
            setNewLeadStatus("lead")
            setNewLeadValue("")
            fetchLeads()
        } catch (error) {
            console.error("Error adding lead:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing & CRM</h1>
                    <p className="text-muted-foreground mt-1">Track prospective colleges, active pilots, and deal flow.</p>
                </div>

                <Dialog open={isLeadOpen} onOpenChange={setIsLeadOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Lead
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Lead</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddLead} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="leadOrg">Organization Name</Label>
                                <Input 
                                    id="leadOrg" 
                                    placeholder="e.g. Parul University" 
                                    value={newLeadOrgId}
                                    onChange={(e) => setNewLeadOrgId(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="leadStatus">Pipeline Status</Label>
                                <Select value={newLeadStatus} onValueChange={setNewLeadStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lead">Lead</SelectItem>
                                        <SelectItem value="contacted">Contacted</SelectItem>
                                        <SelectItem value="pilot">Pilot</SelectItem>
                                        <SelectItem value="negotiation">Negotiation</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contractValue">Estimated Contract Value (₹)</Label>
                                <Input 
                                    id="contractValue" 
                                    type="number"
                                    placeholder="e.g. 50000" 
                                    value={newLeadValue}
                                    onChange={(e) => setNewLeadValue(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Adding..." : "Save Lead"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="overflow-hidden border shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Organization / Lead</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Contract Value</th>
                                <th className="px-6 py-4 font-medium">Renewal Date</th>
                                <th className="px-6 py-4 font-medium">Follow-Up</th>
                                <th className="px-6 py-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading CRM data...</td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No leads found in pipeline.</td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="bg-card hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium">Org: {lead.orgId}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[lead.status]}`}>
                                                {lead.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium">₹{lead.contractValue.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {lead.renewalDate ? new Date(lead.renewalDate).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">Edit</Button>
                                        </td>
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
