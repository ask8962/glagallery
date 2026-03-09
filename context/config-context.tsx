"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { PlatformConfig } from "@/lib/types"

const defaultConfig: PlatformConfig = {
    name: "GLA Gallery",
    tagline: "The official campus event and community platform",
    description: "Join communities, attend events, and connect with people on campus.",
    logoUrl: "/logo.png",
    contactAddress: "17km Stone, NH-2, Mathura-Delhi Road, Mathura, UP 281406",
    contactPhone: "+91-5662-250900, 250909",
    contactEmail: "info@gla.ac.in",
    officialWebsiteUrl: "https://www.gla.ac.in",
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

    useEffect(() => {
        // Listen for real-time updates to the platform settings
        const unsubscribe = onSnapshot(
            doc(db, "settings", "platform"),
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
    }, [])

    return (
        <ConfigContext.Provider value={{ config, isLoading }}>
            {children}
        </ConfigContext.Provider>
    )
}

export function useConfig() {
    return useContext(ConfigContext)
}
