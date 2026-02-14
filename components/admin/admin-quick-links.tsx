"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Activity, Trophy, ShoppingBag, FileText } from "lucide-react"

export function AdminQuickLinks() {
    return (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/health">
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-accent/20 hover:border-accent/40">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-primary mb-1">System Health</h3>
                            <p className="text-sm text-muted-foreground">Database stats and performance</p>
                        </div>
                        <Activity className="h-8 w-8 text-accent" />
                    </div>
                </Card>
            </Link>
            <Link href="/admin/analytics">
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-accent/20 hover:border-accent/40">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-primary mb-1">Analytics Dashboard</h3>
                            <p className="text-sm text-muted-foreground">User engagement metrics</p>
                        </div>
                        <Trophy className="h-8 w-8 text-accent" />
                    </div>
                </Card>
            </Link>
            <Link href="/admin/rewards">
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-accent/20 hover:border-accent/40">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-primary mb-1">Rewards Store</h3>
                            <p className="text-sm text-muted-foreground">Manage rewards and redemptions</p>
                        </div>
                        <ShoppingBag className="h-8 w-8 text-accent" />
                    </div>
                </Card>
            </Link>
            <Link href="/admin/naac-reports">
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-accent/20 hover:border-accent/40 bg-accent/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-primary mb-1">NAAC Reports</h3>
                            <p className="text-sm text-muted-foreground">Generate accreditation PDFs</p>
                        </div>
                        <FileText className="h-8 w-8 text-accent" />
                    </div>
                </Card>
            </Link>
        </div>
    )
}
