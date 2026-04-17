"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"
import { getFirebase } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore"
import { Organization } from "@/lib/types"

interface OrgContextType {
    organization: Organization | null
    loading: boolean
}

const OrganizationContext = createContext<OrgContextType>({ organization: null, loading: true })

// Helper: Tries to automatically determine the org based on user's email domain
async function findOrgByDomain(email: string): Promise<Organization | null> {
    const domain = email.split('@')[1]
    if (!domain) return null

    try {
        const { db } = getFirebase()
        const q = query(
            collection(db, "organizations"),
            where("domain", "==", domain),
            limit(1)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
            const orgDoc = snap.docs[0]
            return { id: orgDoc.id, ...orgDoc.data() } as Organization
        }
    } catch (e) {
        console.error("Error finding org by domain:", e)
    }
    return null
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth()
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadOrg() {
            setLoading(true)

            try {
                const { db } = getFirebase()

                // Strategy 1: User explicitly belongs to an organization (from profile)
                if (profile?.organizationId) {
                    const orgDoc = await getDoc(doc(db, "organizations", profile.organizationId))
                    if (orgDoc.exists()) {
                        setOrganization({ id: orgDoc.id, ...orgDoc.data() } as Organization)
                        setLoading(false)
                        return
                    }
                }

                // Strategy 2: If no org in profile, try to infer from email domain
                if (user?.email) {
                    const impliedOrg = await findOrgByDomain(user.email)
                    if (impliedOrg) {
                        setOrganization(impliedOrg)
                        setLoading(false)
                        return
                    }
                }

                // Fallback: Default to GLA organization for guests
                const defaultOrgDoc = await getDoc(doc(db, "organizations", "org_gla_university_001"))
                if (defaultOrgDoc.exists()) {
                    setOrganization({ id: defaultOrgDoc.id, ...defaultOrgDoc.data() } as Organization)
                    setLoading(false)
                    return
                }

                // Ultimate Fallback: No organization found
                setOrganization(null)

            } catch (error) {
                console.error("Failed to load organization", error)
            } finally {
                setLoading(false)
            }
        }

        // We run loadOrg if user state resolves.
        // If user is null, we can still load a "default" org using subdomain mapping in Next.js,
        // but for now we'll wait for auth. (Or you can use window.location.hostname logic here)
        loadOrg()

    }, [profile?.organizationId, user?.email])

    return (
        <OrganizationContext.Provider value={{ organization, loading }}>
            {children}
        </OrganizationContext.Provider>
    )
}

export const useOrganization = () => useContext(OrganizationContext)
