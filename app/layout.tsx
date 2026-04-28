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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://campushub.pro"),
  title: {
    default: "CampOS | Campus Operating System",
    template: "%s | CampOS",
  },
  description:
    "The official platform for your university to manage clubs, register for hackathons, and track upcoming events.",
  keywords: ["University", "Campus OS", "Hackathons", "Events", "Student Community"],
  authors: [{ name: "Anukalp Gupta", url: "https://github.com/ask8962" }],
  creator: "Anukalp Gupta",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://campushub.pro",
    title: "CampOS | Campus Operating System",
    description: "Manage clubs, join hackathons, and explore campus life.",
    siteName: "CampOS",
    images: [
      {
        url: "/og-image.png", // We'll need to ensure this exists or use a default
        width: 1200,
        height: 630,
        alt: "CampOS Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampOS | Campus Operating System",
    description: "The holistic operating system for your campus.",
    creator: "@campushubpro",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
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
