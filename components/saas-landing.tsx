"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Zap, Users, GraduationCap, Building2, BarChart3, Mail, MessageCircleQuestion, CheckCircle, Loader2, FileText, Sparkles, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function SaasLanding() {
  const [formData, setFormData] = useState({
    collegeName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    estimatedStudents: "",
    slug: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ subdomain: string } | null>(null)

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.collegeName || !formData.contactName || !formData.contactEmail) {
      toast.error("Please fill in required fields")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setSuccess({ subdomain: data.subdomain })
      toast.success("Your campus portal is live!")
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const autoSlug = formData.collegeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-accent selection:text-black overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen opacity-30" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px] mix-blend-screen opacity-30" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/5 backdrop-blur-xl bg-black/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-black" />
            </div>
            <span className="text-lg font-bold">CampusHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#features">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hidden sm:inline-flex">Features</Button>
            </Link>
            <Link href="#onboard">
              <Button size="sm" className="bg-accent text-black hover:bg-accent/90 rounded-full font-semibold">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-24 px-4 md:px-6 max-w-[90rem] mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8 max-w-5xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-accent backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
            </span>
            CampusHub 3.0 • Now accepting new institutions
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-black tracking-tighter leading-[0.95] text-white">
            The Multi-Tenant <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-200 to-amber-500">
              Campus OS.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-medium">
            Centralize events, automate hackathons, track student engagement, and generate <strong className="text-white">NAAC/NBA accreditation reports</strong> seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="#onboard">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-14 px-8 text-lg rounded-full font-semibold shadow-[0_0_40px_-10px_rgba(250,204,21,0.5)] transition-all hover:scale-105">
                Register Your College <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full font-medium border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all">
                Explore Features
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" /> Free to start</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" /> Live in 2 min</span>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-4 md:px-6 max-w-[90rem] mx-auto border-t border-white/5">
        <div className="text-center mb-20 space-y-6">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">Everything your campus needs.</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">Replace fragmented WhatsApp groups, messy Google Forms, and manual spreadsheets with one unified, premium platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Building2, title: "White-Label Subdomains", desc: "Get your own dedicated portal (e.g., gla.campushub.pro) with custom branding and exclusive access." },
            { icon: Zap, title: "Automated Hackathons", desc: "Manage team formations, project submissions, and judge scoring with our built-in hackathon engine." },
            { icon: ShieldCheck, title: "Verified Credentials", desc: "Issue cryptographic certificates for event participation, seamlessly building student portfolios." },
            { icon: Users, title: "Club CRM", desc: "Empower student clubs to manage members, send broadcasts, and track budgets independently." },
            { icon: FileText, title: "NAAC Report Generator", desc: "1-click generation of NAAC and NBA formatted PDF reports for extracurricular activities — Criterion 3.4 ready." },
            { icon: Sparkles, title: "Gamification Engine", desc: "Points, levels, leaderboards, and badges to drive student engagement organically." },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 backdrop-blur-sm group"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-lg">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Self-serve Onboarding Form */}
      <section id="onboard" className="relative z-10 py-24 px-4 md:px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 md:p-12 rounded-[2rem] bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl"
        >
          {success ? (
            <div className="text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold">You&apos;re Live! 🎉</h2>
              <p className="text-gray-400">Your campus portal has been provisioned. Share this link with your team:</p>
              <div className="flex items-center justify-center gap-2 bg-black/40 rounded-xl p-4 border border-accent/30">
                <Globe className="h-5 w-5 text-accent" />
                <a
                  href={`https://${success.subdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent font-mono text-lg hover:underline"
                >
                  {success.subdomain}
                </a>
              </div>
              <p className="text-sm text-gray-500">
                Our team will reach out within 24 hours at your email to help with DNS and branding setup.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <Building2 className="h-10 w-10 text-accent mx-auto mb-4" />
                <h2 className="text-3xl font-bold">Register Your College</h2>
                <p className="text-gray-400 mt-2">Get your own branded campus portal in under 2 minutes. Free to start.</p>
              </div>

              <form onSubmit={handleOnboard} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">College Name *</Label>
                    <Input
                      placeholder="e.g. CampusHub"
                      value={formData.collegeName}
                      onChange={e => setFormData({ ...formData, collegeName: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">Subdomain Slug</Label>
                    <div className="flex items-center gap-0">
                      <Input
                        placeholder={autoSlug || "your-college"}
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-r-none"
                      />
                      <span className="px-3 py-2 bg-white/5 border border-l-0 border-white/10 rounded-r-md text-xs text-gray-500 whitespace-nowrap">
                        .campushub.pro
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">Your Name *</Label>
                    <Input
                      placeholder="e.g. Dr. Sharma"
                      value={formData.contactName}
                      onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">Email *</Label>
                    <Input
                      type="email"
                      placeholder="admin@college.edu"
                      value={formData.contactEmail}
                      onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">Phone (optional)</Label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={formData.contactPhone}
                      onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">Estimated Students</Label>
                    <Input
                      placeholder="e.g. 5000"
                      value={formData.estimatedStudents}
                      onChange={e => setFormData({ ...formData, estimatedStudents: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-accent text-black hover:bg-accent/90 text-base font-semibold rounded-xl shadow-[0_0_30px_-5px_rgba(250,204,21,0.4)] transition-all hover:shadow-[0_0_40px_-5px_rgba(250,204,21,0.6)]"
                >
                  {submitting ? (
                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating your portal...</>
                  ) : (
                    <>Launch My Campus Portal <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>

                <p className="text-xs text-gray-600 text-center">
                  By registering, you agree to our Terms of Service. Your portal will be instantly provisioned on our platform.
                </p>
              </form>
            </>
          )}
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-24 px-4 md:px-6 max-w-4xl mx-auto border-t border-white/5">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            { q: "How much does CampusHub cost?", a: "We offer a free tier for colleges with up to 500 students. For larger institutions, plans start at ₹25,000/year. Contact us for enterprise pricing." },
            { q: "How long does setup take?", a: "Your portal is provisioned instantly. DNS configuration for a custom subdomain takes 5-10 minutes. Full branding customization can be done within 24 hours." },
            { q: "Can we use our own college domain?", a: "Yes! You can either use a subdomain (e.g., gla.campushub.pro) or point your own domain (e.g., events.gla.ac.in) via a CNAME record." },
            { q: "Is student data secure?", a: "Absolutely. All data is stored on Google Firebase with encryption at rest. Each tenant's data is fully isolated. We comply with Indian IT Act and data protection guidelines." },
            { q: "Does CampusHub support NAAC accreditation?", a: "Yes — this is our core differentiator. The platform auto-generates NAAC Criterion 3.4 reports in PDF format with event participation, club activity, and student engagement data." },
            { q: "Can clubs and departments manage independently?", a: "Yes. Each club gets its own admin panel to manage members, post events, and send broadcasts. Department heads get analytics dashboards." },
          ].map((faq, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="group p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
            >
              <summary className="cursor-pointer text-base font-medium flex items-center justify-between list-none">
                {faq.q}
                <span className="text-accent group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">{faq.a}</p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* Support / Contact */}
      <section className="relative z-10 py-24 px-4 md:px-6 max-w-4xl mx-auto text-center">
        <div className="p-12 rounded-[3rem] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 backdrop-blur-xl">
          <MessageCircleQuestion className="h-12 w-12 text-accent mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Help?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Whether you need custom integrations, enterprise pricing, or help migrating your existing data, our team is ready to assist.
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-3 text-lg font-medium bg-white/5 px-6 py-3 rounded-full border border-white/10">
              <Mail className="h-5 w-5 text-accent" />
              <a href="mailto:admin@campushub.pro" className="hover:text-accent transition-colors">
                admin@campushub.pro
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-2">We typically reply within 2 hours.</p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-8 text-center text-gray-500 text-sm border-t border-white/5">
        <p>© {new Date().getFullYear()} CampusHub. All rights reserved. | <a href="mailto:admin@campushub.pro" className="hover:text-accent">admin@campushub.pro</a></p>
      </footer>
    </div>
  )
}
