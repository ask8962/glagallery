"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Command } from "cmdk"
import { useAuth } from "@/context/auth-context"
import {
    Calendar,
    Users,
    Trophy,
    User,
    Search,
    Moon,
    Sun,
    Home,
    Building2,
    Gift,
    Settings,
    LogOut,
    Plus,
    Sparkles,
    GraduationCap,
    Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandMenuProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
    const router = useRouter()
    const { user, profile, signOut } = useAuth()
    const { theme, setTheme } = useTheme()
    const [search, setSearch] = React.useState("")

    const runCommand = React.useCallback((command: () => void) => {
        onOpenChange(false)
        command()
    }, [onOpenChange])

    // Navigation items
    const navigationItems = [
        { icon: Home, label: "Home", href: "/" },
        { icon: Calendar, label: "Events", href: "/events" },
        { icon: Building2, label: "Clubs", href: "/clubs" },
        { icon: Trophy, label: "Hackathons", href: "/hackathons" },
        { icon: Gift, label: "Rewards Store", href: "/rewards" },
        { icon: GraduationCap, label: "Academic Calendar", href: "/calendar" },
    ]

    // Admin items (only for admins)
    const adminItems = profile?.role === "admin" || profile?.role === "super_admin" ? [
        { icon: Settings, label: "Admin Dashboard", href: "/admin" },
    ] : []

    // Quick actions
    const quickActions = user ? [
        { icon: User, label: "My Profile", action: () => router.push("/profile") },
        { icon: LogOut, label: "Sign Out", action: () => signOut() },
    ] : []

    // Theme toggle
    const themeAction = {
        icon: theme === "dark" ? Sun : Moon,
        label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        action: () => setTheme(theme === "dark" ? "light" : "dark"),
    }

    return (
        <Command.Dialog
            open={open}
            onOpenChange={onOpenChange}
            label="Global Command Menu"
            className={cn(
                "fixed inset-0 z-50",
                "flex items-start justify-center pt-[20vh]",
                "bg-black/50 backdrop-blur-sm"
            )}
        >
            <div className="w-full max-w-lg bg-background border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Command.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Search or type a command..."
                        className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground"
                    />
                    <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center gap-1 rounded bg-muted font-mono text-[10px] font-medium text-muted-foreground">
                        ESC
                    </kbd>
                </div>

                {/* Command List */}
                <Command.List className="max-h-[300px] overflow-y-auto p-2">
                    <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                        No results found.
                    </Command.Empty>

                    {/* Navigation Group */}
                    <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {navigationItems.map((item) => (
                            <Command.Item
                                key={item.href}
                                value={item.label}
                                onSelect={() => runCommand(() => router.push(item.href))}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-accent data-[selected=true]:bg-accent"
                            >
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                                <span>{item.label}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>

                    {/* Admin Group */}
                    {adminItems.length > 0 && (
                        <Command.Group heading="Admin" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            {adminItems.map((item) => (
                                <Command.Item
                                    key={item.href}
                                    value={item.label}
                                    onSelect={() => runCommand(() => router.push(item.href))}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-accent data-[selected=true]:bg-accent"
                                >
                                    <item.icon className="h-4 w-4 text-muted-foreground" />
                                    <span>{item.label}</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    {/* Quick Actions Group */}
                    <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {/* Theme Toggle */}
                        <Command.Item
                            value={themeAction.label}
                            onSelect={() => runCommand(themeAction.action)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-accent data-[selected=true]:bg-accent"
                        >
                            <themeAction.icon className="h-4 w-4 text-muted-foreground" />
                            <span>{themeAction.label}</span>
                        </Command.Item>

                        {/* User Actions */}
                        {quickActions.map((item) => (
                            <Command.Item
                                key={item.label}
                                value={item.label}
                                onSelect={() => runCommand(item.action)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-accent data-[selected=true]:bg-accent"
                            >
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                                <span>{item.label}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                </Command.List>

                {/* Footer Hint */}
                <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        <span>Quick navigation</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">↑</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">↓</kbd>
                        <span className="ml-1">to navigate</span>
                    </div>
                </div>
            </div>
        </Command.Dialog>
    )
}
