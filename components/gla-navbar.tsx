"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/clubs", label: "Clubs" },
  { href: "/profile", label: "Profile" },
  { href: "/admin", label: "Admin" },
]

export default function GlaNavbar() {
  const pathname = usePathname()
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[hsl(var(--background))]/95 backdrop-blur border-b border-[hsl(var(--border))]">
      <nav className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-[hsl(var(--primary))]" aria-hidden />
            <span className="text-base md:text-lg font-semibold text-[hsl(var(--primary))]">CampOS</span>
          </Link>

          {/* Nav */}
          <ul className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={[
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                        : "text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <Link href="/events">
              <Button className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:opacity-90">
                View Events
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
