import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { TwoFAGuard } from "@/components/two-fa-guard"
import { Navbar } from "@/components/navbar"
import SiteFooter from "@/components/site-footer"
import { ErrorBoundaryProvider } from "@/components/error-boundary-provider"
import { NotificationPermissionBanner } from "@/components/notification-permission-banner"
import { ScrollToTop } from "@/components/scroll-to-top"
import { Suspense } from "react"
import { Toaster } from "sonner"

import { OnboardingFlow } from "@/components/onboarding-flow"
import { ConfigProvider } from "@/context/config-context"
import { OrganizationProvider } from "@/context/organization-context"
import { SessionExpiredModal } from "@/components/auth/session-expired-modal"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.campushub.pro"),
  title: {
    default: "CampusHub | Free Study Materials, PYQs & Campus Events",
    template: "%s | CampusHub",
  },
  description:
    "The official platform for university students to share study materials, download PYQs, access class notes, manage clubs, and track upcoming events. Join CampusHub today.",
  keywords: ["CampusHub", "GLA University", "Study Materials", "Previous Year Questions", "PYQs", "Class Notes", "B.Tech Notes", "University Hackathons", "College Events", "Student Community", "College Resources"],
  authors: [{ name: "Anukalp Gupta", url: "https://github.com/ask8962" }],
  creator: "Anukalp Gupta",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.campushub.pro",
    title: "CampusHub | Free Study Materials, PYQs & Campus Events",
    description: "Share study materials, download PYQs, explore events, and connect with your campus community.",
    siteName: "CampusHub",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CampusHub Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusHub | Free Study Materials, PYQs & Campus Events",
    description: "Share study materials, download PYQs, explore events, and connect with your campus community.",
    creator: "@campushubpro",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="zW5pPDZ3q7D5q1IUK5CdLyvJVQFUbWu0Dr62YwYFfrs" />
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "CampusHub",
              url: "https://campushub.pro",
              logo: "https://campushub.pro/logo.png",
              description: "The official platform for CampusHub students to share campus memories, register for hackathons, and track upcoming events.",
              sameAs: ["https://github.com/ask8962/glagallery"]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "CampusHub",
              url: "https://campushub.pro",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://campushub.pro/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              name: "CampusHub",
              url: "https://www.gla.ac.in",
              address: {
                "@type": "PostalAddress",
                streetAddress: "17km Stone, NH-2",
                addressLocality: "Mathura",
                addressRegion: "Uttar Pradesh",
                postalCode: "281406",
                addressCountry: "IN"
              }
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch(e){}
})();
`.trim(),
          }}
        />
      </head>
      <body className={`font-sans ${inter.variable} ${jetbrainsMono.variable}`}>
        <ErrorBoundaryProvider>
          <AuthProvider>
            <OrganizationProvider>
              <ConfigProvider>
                <TwoFAGuard>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                    <Navbar />
                    <NotificationPermissionBanner />
                    <main className="pt-16">{children}</main>
                    <SiteFooter />
                    <OnboardingFlow />
                    <SessionExpiredModal />
                  </Suspense>
                </TwoFAGuard>
              </ConfigProvider>
            </OrganizationProvider>
          </AuthProvider>
        </ErrorBoundaryProvider>
        <ScrollToTop />
        <Toaster position="bottom-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
