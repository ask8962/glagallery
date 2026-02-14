"use client"

import { motion } from "framer-motion"
import Hero from "@/components/hero"
import AboutSection from "@/components/about-section"
import EventsSection from "@/components/events-section"

import { Leaderboard } from "@/components/leaderboard"

import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"
import { SaasLanding } from "@/components/saas-landing"

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const { organization } = useOrganization()

  if (!organization) {
    return <SaasLanding />
  }

  const canViewContent = !authLoading && !!user

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* About Section */}
      <AboutSection />

      {/* Events Section */}
      <EventsSection />

      {/* Leaderboard Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
        className="py-20 bg-muted/30"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Leaderboard timeRange="week" />
        </div>
      </motion.section>




    </div>
  )
}
