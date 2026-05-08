"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "./theme-toggle"
import { NotificationCenter } from "./notification-center"
import { Menu, X, ChevronDown, Rocket, Users, ShoppingBag, PlusCircle, Search as SearchIcon, Trophy, Calendar, Command, Bot, Flame, BookOpen } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useConfig } from "@/context/config-context"
import { CommandMenu } from "@/components/command-menu"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { user, profile, signIn, signOut, loading } = useAuth()
  const { config } = useConfig()
  const pathname = usePathname()
  const isAdmin = profile?.role === "admin"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)

  // Mounted check to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcut listener for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandMenuOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const navGroups = [
    {
      label: "Explore",
      icon: <Rocket className="h-4 w-4 mr-2" />,
      items: [
        { href: "/search", label: "Search", icon: <SearchIcon className="h-4 w-4 mr-2" /> },
        { href: "/confessions", label: "Confessions", icon: <Flame className="h-4 w-4 text-orange-500 mr-2" /> },
        { href: "/resources", label: "Study Materials", icon: <BookOpen className="h-4 w-4 text-blue-500 mr-2" /> },
      ]
    },
    {
      label: "Community",
      icon: <Users className="h-4 w-4 mr-2" />,
      items: [
        { href: "/clubs", label: "Clubs", icon: null },
        { href: "/events", label: "Events", icon: <Calendar className="h-4 w-4 mr-2" /> },
        { href: "/hackathons", label: "Hackathons", icon: <Trophy className="h-4 w-4 mr-2" /> },
        { href: "/calendar", label: "Academic Calendar", icon: <Calendar className="h-4 w-4 mr-2" /> },
      ]
    }
  ]

  // Don't render complex auth UI until mounted to match server/client
  if (!mounted) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Basic Static Shell for SEO/Structure */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="relative h-9 w-9 overflow-hidden rounded-md ring-1 ring-border shadow-sm">
                  <Image src={config.logoUrl || "/logo.png"} alt={`${config.name} Logo`} fill className="object-cover" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">{config.name}</span>
                </div>
              </Link>
            </div>
            {/* Placeholder for actions to prevent layout shift */}
            <div className="w-24"></div>
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Left Section: Brand & Desktop Nav */}
          <div className="flex items-center gap-8">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
              <div className="relative h-9 w-9 overflow-hidden rounded-md ring-1 ring-border shadow-sm">
                <Image
                  src={config.logoUrl || "/logo.png"}
                  alt={`${config.name} Logo`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">{config.name}</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">

              {/* Dropdown Groups */}
              {navGroups.map((group) => (
                <DropdownMenu key={group.label}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 px-3 gap-1 hover:bg-accent/50 data-[state=open]:bg-accent/50">
                      {group.label}
                      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 p-1">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">{group.label}</DropdownMenuLabel>
                    {group.items.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center cursor-pointer">
                          {item.icon}
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}





            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2">

            {/* Search / Command Menu Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandMenuOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-3 text-muted-foreground hover:text-foreground"
            >
              <SearchIcon className="h-4 w-4" />
              <span className="text-sm">Search</span>
              <kbd className="pointer-events-none ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              <ThemeToggle />
              {user && <NotificationCenter />}
            </div>

            <div className="h-6 w-px bg-border/50 mx-1 hidden sm:block" />

            {!loading && !user && (
              <Button
                onClick={async () => {
                  try {
                    await signIn()
                  } catch (error: any) {
                    alert(error.message || 'Sign in failed')
                  }
                }}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                Sign in
              </Button>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-border transition-all pl-0 pr-0 overflow-hidden">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL ?? undefined} alt="Profile" />
                      <AvatarFallback>{user.displayName?.[0] ?? "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">Profile</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer" onClick={() => signOut()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden ml-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border bg-background/95 backdrop-blur-md overflow-hidden"
            >
              <div className="py-4 space-y-4 px-2">

                {/* Mobile Groups */}
                {navGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</h4>
                    {group.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${pathname === item.href ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"}`}
                      >
                        {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ))}





                {/* Mobile User Actions */}
                <div className="pt-2 border-t border-border/50 flex flex-col gap-2 px-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Command Menu */}
      <CommandMenu open={commandMenuOpen} onOpenChange={setCommandMenuOpen} />
    </header>
  )
}
