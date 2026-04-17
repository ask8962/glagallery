"use client"

import type React from "react"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getFirebase, googleProvider } from "@/lib/firebase"
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import type { UserProfile } from "@/lib/types"
import { isAdminEmail } from "@/lib/config"

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  needs2FA: boolean // true if 2FA enabled but not verified this session
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  needs2FA: false,
  signIn: async () => { },
  signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth, db } = getFirebase()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needs2FA, setNeeds2FA] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) {
        setProfile(null)
        setLoading(false)
        return
      }

      // --- Dynamic Tenant Routing ---
      // We automatically route users to their organizations based on their email.
      const domain = u.email?.split("@")[1] || ""
      let targetOrgId = "" 
      
      try {
         const res = await fetch(`/api/auth/resolve-domain?domain=${domain}`)
         if (res.ok) {
             const data = await res.json()
             if (data.orgId) targetOrgId = data.orgId
         }
      } catch (e) {
         console.warn("Domain resolution failed", e)
      }

      const userRef = doc(db, "users", u.uid)
      const snap = await getDoc(userRef)

      const base: UserProfile = {
        uid: u.uid,
        name: u.displayName || "Student",
        email: u.email || "",
        role: isAdminEmail(u.email || "") ? "admin" : "student",
        organizationId: targetOrgId,
        photoURL: u.photoURL || undefined,
        // Initialize gamification
        points: 0,
        level: 1,
        badges: [],
        streak: 0,
        lastActive: null,
        // Initialize profile enhancements
        followers: [],
        following: [],
        privacySettings: {
          profileVisibility: "public",
          showEmail: false,
          showActivity: true,
          allowFollowRequests: true,
        },
      }

      if (!snap.exists()) {
        await setDoc(userRef, base, { merge: true })
        setProfile(base)
      } else {
        const data = snap.data() as UserProfile
        const role = isAdminEmail(u.email || "") ? "admin" : (data.role ?? "student")
        const finalProfile = { ...data, role }

        // Backfill or update organizationId for users based on strict domain matching
        if (finalProfile.organizationId !== targetOrgId) {
           finalProfile.organizationId = targetOrgId
        }

        // Initialize gamification if not present
        if (finalProfile.points === undefined) {
          finalProfile.points = 0
          finalProfile.level = 1
          finalProfile.badges = []
          finalProfile.streak = 0
          finalProfile.lastActive = null
        }

        // sync role if changed
        if (
            finalProfile.role !== data.role || 
            finalProfile.points === undefined ||
            !data.organizationId
        ) {
          await setDoc(userRef, finalProfile, { merge: true })
        }
        setProfile(finalProfile)

        // Update streak on login (do this asynchronously)
        import("@/lib/gamification").then(({ updateStreak }) => {
          updateStreak(u.uid)
        })
      }

      setLoading(false)

      // Check if 2FA is required
      const snapData = snap.exists() ? (snap.data() as UserProfile) : null
      if (snapData?.twoFactorEnabled) {
        // Check if 2FA cookie exists (we check via an API call since cookies are httpOnly)
        try {
          const res = await fetch("/api/auth/check-2fa", { method: "GET" })
          const data = await res.json()
          if (!data.verified) {
            setNeeds2FA(true)
          }
        } catch {
          // If check fails, assume 2FA needed for safety
          setNeeds2FA(true)
        }
      }

      // Initialize presence system when user signs in
      import("@/lib/presence").then(({ initializePresence }) => {
        initializePresence(u.uid)
      })
    })
    return () => unsub()
  }, [auth, db])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      loading,
      needs2FA,
      signIn: async () => {
        const { auth } = getFirebase()
        try {
          const result = await signInWithPopup(auth, googleProvider)
          const signedInUser = result.user

          // We removed the hardcoded @gla restriction here so you can login with Gmail.
        } catch (error: any) {
          // Re-throw the error to be handled by the UI
          throw error
        }
      },
      signOut: async () => {
        const { auth } = getFirebase()
        // Clean up presence before signing out
        if (user) {
          const { cleanupPresence } = await import("@/lib/presence")
          cleanupPresence()
        }
        // Clear 2FA state
        setNeeds2FA(false)
        await fbSignOut(auth)
      },
    }),
    [user, profile, loading, needs2FA],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
