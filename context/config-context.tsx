"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { PlatformConfig } from "@/lib/types"
import { useOrganization } from "./organization-context"

const defaultConfig: PlatformConfig = {
    name: "CampusHub",
    tagline: "The Multi-Tenant Campus Operating System",
    description: "CampOS is the ultimate institutional framework for extracurricular management. Centralize events, automate hackathons, track student engagement, and generate verifiable NAAC/NBA accreditation reports seamlessly.",
    logoUrl: "https://ui-avatars.com/api/?name=CampOS&background=0D1117&color=fff&size=512&font-size=0.33",
    contactAddress: "CampOS Headquarters, Mathura, UP, India",
    contactPhone: "+91-5662-250900", // Defaulting to something acceptable
    contactEmail: "team@campushub.pro",
    officialWebsiteUrl: "https://main.campushub.pro",
}

type ConfigContextType = {
    config: PlatformConfig
    isLoading: boolean
}

const ConfigContext = createContext<ConfigContextType>({
    config: defaultConfig,
    isLoading: true,
})

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<PlatformConfig>(defaultConfig)
    const [isLoading, setIsLoading] = useState(true)
    const { organization } = useOrganization()

    useEffect(() => {
        // Listen for real-time updates to the platform settings
        const docRef = organization?.id
            ? doc(db, "organizations", organization.id, "settings", "platform")
            : doc(db, "settings", "platform")

        const unsubscribe = onSnapshot(
            docRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setConfig({ ...defaultConfig, ...docSnap.data() } as PlatformConfig)
                }
                setIsLoading(false)
            },
            (error) => {
                console.error("Error fetching platform config:", error)
                setIsLoading(false) // Fallback to default config on error
            }
        )

        return () => unsubscribe()
    }, [organization?.id])

    return (
        <ConfigContext.Provider value={{ config, isLoading }}>
            {children}
        </ConfigContext.Provider>
    )
}

export function useConfig() {
    return useContext(ConfigContext)
}
