"use client"

import type React from "react"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getFirebase, googleProvider } from "@/lib/firebase"
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import type { UserProfile } from "@/lib/types"
import { isAdminEmail } from "@/lib/config"

import { useInactivityTimer } from "@/hooks/use-inactivity-timer"

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  needs2FA: boolean // true if 2FA enabled but not verified this session
  sessionExpired: boolean
  sessionExpiryReason: "inactivity" | "invalid_token" | "concurrent_login" | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  needs2FA: false,
  sessionExpired: false,
  sessionExpiryReason: null,
  signIn: async () => { },
  signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth, db } = getFirebase()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needs2FA, setNeeds2FA] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [sessionExpiryReason, setSessionExpiryReason] = useState<"inactivity" | "invalid_token" | "concurrent_login" | null>(null)

  // Inactivity Timer
  useInactivityTimer({
    timeoutMs: 30 * 60 * 1000, // 30 minutes
    isActive: !!user && !sessionExpired,
    onTimeout: async () => {
      console.log("Session expired due to inactivity")
      setSessionExpiryReason("inactivity")
      setSessionExpired(true)
      const { signOut: fbSignOut } = await import("firebase/auth")
      await fbSignOut(auth)
    },
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) {
        setProfile(null)
        setLoading(false)
        // If not manually triggered by session expiration, maybe token invalidated
        return
      }

      // Reset session expiration on fresh login
      setSessionExpired(false)
      setSessionExpiryReason(null)

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

        // 🎉 Send welcome email to new users (fire-and-forget)
        fetch("/api/welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: u.displayName || "Student", email: u.email }),
        }).catch((err) => console.warn("Welcome email failed:", err))
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

      // 🔐 Send login alert email — only once per session (not on refresh)
      const alertKey = `login_alert_sent_${u.uid}`
      if (!sessionStorage.getItem(alertKey)) {
        sessionStorage.setItem(alertKey, "true")
        try {
          const ua = navigator.userAgent
          // Detect browser name
          let browserName = "Unknown Browser"
          if (ua.includes("Edg/")) browserName = "Microsoft Edge"
          else if (ua.includes("OPR/") || ua.includes("Opera")) browserName = "Opera"
          else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browserName = "Google Chrome"
          else if (ua.includes("Firefox/")) browserName = "Mozilla Firefox"
          else if (ua.includes("Safari/") && !ua.includes("Chrome")) browserName = "Safari"

          // Detect OS
          let osName = "Unknown OS"
          if (ua.includes("Windows NT 10")) osName = "Windows 10/11"
          else if (ua.includes("Windows")) osName = "Windows"
          else if (ua.includes("Mac OS X")) osName = "macOS"
          else if (ua.includes("Android")) osName = "Android"
          else if (ua.includes("iPhone") || ua.includes("iPad")) osName = "iOS"
          else if (ua.includes("Linux")) osName = "Linux"

          fetch("/api/auth/login-alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: u.displayName || "User",
              email: u.email,
              browser: browserName,
              os: osName,
            }),
          }).catch((err) => console.warn("Login alert email failed:", err))
        } catch (alertErr) {
          console.warn("Login alert detection failed:", alertErr)
        }
      }

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
      sessionExpired,
      sessionExpiryReason,
      signIn: async () => {
        // Redirect to the new authentication page instead of direct Google Auth
        window.location.href = "/auth/login";
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
    [user, profile, loading, needs2FA, sessionExpired, sessionExpiryReason],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
