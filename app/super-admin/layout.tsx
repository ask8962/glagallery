"use client"

import { SuperAdminGuard } from "@/components/super-admin/super-admin-guard"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Building2, Briefcase, UserCog, ShieldCheck } from "lucide-react"

const sidebarItems = [
    { name: "Metrics Dashboard", href: "/super-admin", icon: LayoutDashboard },
    { name: "Organizations", href: "/super-admin/organizations", icon: Building2 },
    { name: "CRM & Billing", href: "/super-admin/billing", icon: Briefcase },
    { name: "Tenant Imperonation", href: "/super-admin/support", icon: UserCog },
    { name: "Audit Logs", href: "/super-admin/audit", icon: ShieldCheck },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <SuperAdminGuard>
            <div className="flex min-h-screen bg-background text-foreground">
                {/* Fixed Sidebar */}
                <aside className="fixed top-0 left-0 h-screen w-64 border-r bg-card shadow-sm z-50 p-4">
                    <div className="mb-8 mt-2 px-2">
                        <Link href="/">
                            <h2 className="text-2xl font-black tracking-tighter text-primary">CampOS HQ.</h2>
                        </Link>
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mt-1">Super Admin</p>
                    </div>

                    <nav className="space-y-1">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon
                            
                            return (
                                <Link key={item.name} href={item.href}>
                                    <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        isActive 
                                        ? "bg-primary text-primary-foreground shadow-md" 
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}>
                                        <Icon className="h-5 w-5" />
                                        {item.name}
                                    </span>
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                {/* Main Content wrapper */}
                <main className="flex-1 ml-64 p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-6xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </SuperAdminGuard>
    )
}
