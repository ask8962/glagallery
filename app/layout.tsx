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
import { AchievementProvider } from "@/hooks/use-achievement"
import { AchievementOverlay } from "@/components/achievement-overlay"
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
  metadataBase: new URL("https://glagallery.vercel.app"),
  title: {
    default: "GLA Gallery | Campus Memories & Hackathons",
    template: "%s | GLA Gallery",
  },
  description:
    "The official platform for GLA University students to share campus memories, register for hackathons, and track upcoming events.",
  keywords: ["GLA University", "Campus Gallery", "Hackathons", "Events", "Student Community", "Mathura"],
  authors: [{ name: "Anukalp Gupta", url: "https://github.com/ask8962" }],
  creator: "Anukalp Gupta",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://glagallery.vercel.app",
    title: "GLA Gallery | Campus Memories & Hackathons",
    description: "Share memories, join hackathons, and explore campus life at GLA University.",
    siteName: "GLA Gallery",
    images: [
      {
        url: "/og-image.png", // We'll need to ensure this exists or use a default
        width: 1200,
        height: 630,
        alt: "GLA Gallery Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GLA Gallery | Campus Memories & Hackathons",
    description: "The official platform for GLA University students.",
    creator: "@glagallery",
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
              name: "GLA Gallery",
              url: "https://glagallery.vercel.app",
              logo: "https://glagallery.vercel.app/logo.png",
              description: "The official platform for GLA University students to share campus memories, register for hackathons, and track upcoming events.",
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
              name: "GLA Gallery",
              url: "https://glagallery.vercel.app",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://glagallery.vercel.app/search?q={search_term_string}",
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
              name: "GLA University",
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
                  <AchievementProvider>
                    <TwoFAGuard>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                      <Navbar />
                      <NotificationPermissionBanner />
                      <main className="pt-16">{children}</main>
                      <SiteFooter />
                      <AchievementOverlay />
                      <OnboardingFlow />
                    </Suspense>
                    </TwoFAGuard>
                  </AchievementProvider>
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
