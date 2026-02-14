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

// Helper: Find org by exact subdomain/slug matching
async function findOrgBySlug(slug: string): Promise<Organization | null> {
    try {
        const { db } = getFirebase()
        const q = query(
            collection(db, "organizations"),
            where("slug", "==", slug),
            limit(1)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
            const orgDoc = snap.docs[0]
            return { id: orgDoc.id, ...orgDoc.data() } as Organization
        }
    } catch (e) {
        console.error("Error finding org by slug:", e)
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

                // Strategy 1: Attempt to load from subdomain (Guest / Standard flow)
                if (typeof window !== "undefined") {
                    const hostname = window.location.hostname;
                    const baseDomains = ['campushub.pro', 'localhost'];

                    const isBaseDomain = baseDomains.some(d => hostname === d || hostname === `www.${d}`);

                    if (!isBaseDomain) {
                        // Attempt to extract the subdomain part (e.g. 'gla.campos.in' -> 'gla')
                        const activeBaseDomain = baseDomains.find(d => hostname.endsWith(d));
                        if (activeBaseDomain) {
                            const slug = hostname.replace(`.${activeBaseDomain}`, '');
                            if (slug && slug !== 'www') {
                                const subdomainOrg = await findOrgBySlug(slug);
                                if (subdomainOrg) {
                                    setOrganization(subdomainOrg);
                                    setLoading(false);
                                    return;
                                }
                            }
                        }
                    }
                }

                // Strategy 2: User explicitly belongs to an organization (from profile)
                if (profile?.organizationId) {
                    const orgDoc = await getDoc(doc(db, "organizations", profile.organizationId))
                    if (orgDoc.exists()) {
                        setOrganization({ id: orgDoc.id, ...orgDoc.data() } as Organization)
                        setLoading(false)
                        return
                    }
                }

                // Strategy 3: If no org in profile or URL, try to infer from user's email domain
                if (user?.email) {
                    const impliedOrg = await findOrgByDomain(user.email)
                    if (impliedOrg) {
                        setOrganization(impliedOrg)
                        setLoading(false)
                        return
                    }

                    // Strict segregation: If email is generic (doesn't end in .ac.in / .edu.in),
                    // they belong to the public global pool, NOT the default college.
                    const domain = user.email.split('@')[1]
                    if (domain && !domain.endsWith('.ac.in') && !domain.endsWith('.edu.in')) {
                        setOrganization({
                            id: "org_public_global",
                            name: "Global Community",
                            slug: "global",
                            domain: "public",
                            status: "active"
                        } as Organization)
                        setLoading(false)
                        return
                    }
                }

                // Fallback: Default to GLA organization for college-domain users without a registered org, or unauthenticated guests
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
