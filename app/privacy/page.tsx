import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Privacy Policy | CampusHub",
  description: "Privacy Policy for CampusHub - Learn how we collect, use, and protect your data.",
}

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: `We collect information you provide directly to us, including:
      
• **Account Information**: When you sign in with your GLA email via Google, we receive your name, email address, and profile photo.
• **User Content**: Photos, videos, comments, and other content you upload or post.
• **Usage Data**: Information about how you interact with our platform, including pages visited and features used.
• **Device Information**: Browser type, operating system, and device identifiers.`,
    },
    {
      title: "2. How We Use Your Information",
      content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Send you notifications about activity on your posts
• Display your content to other authenticated GLA users
• Analyze usage patterns to enhance user experience
• Prevent fraud and abuse
• Comply with legal obligations`,
    },
    {
      title: "3. Information Sharing",
      content: `We do not sell your personal information. We may share your information:

• **With other GLA users**: Your profile, posts, and comments are visible to authenticated users
• **With service providers**: Firebase (Google) for authentication and storage
• **For legal reasons**: When required by law or to protect rights`,
    },
    {
      title: "4. Data Storage & Security",
      content: `Your data is stored securely using:

• **Firebase/Google Cloud**: Industry-standard encryption and security
• **HTTPS**: All data transmitted is encrypted
• **Access Controls**: Strict Firestore security rules limit data access
• **GLA Email Restriction**: Only verified CampusHub emails can access the platform`,
    },
    {
      title: "5. Your Rights",
      content: `You have the right to:

• **Access**: View all your personal data
• **Delete**: Request deletion of your account and associated data
• **Export**: Download your data
• **Opt-out**: Disable email notifications in settings`,
    },
    {
      title: "6. Data Retention",
      content: `We retain your data as long as your account is active. Stories are automatically deleted after 24 hours. You can delete your posts and comments at any time. Account deletion requests will be processed within 30 days.`,
    },
    {
      title: "7. Reward Campaign Data",
      content: `When you participate in reward campaigns, we additionally collect:

• **Phone Number**: For verifying identity and preventing duplicate claims
• **IP Address**: Logged at claim time for fraud prevention
• **User-Agent**: Browser and device information for security analysis
• **Claim Timestamp**: Server-generated timestamp of your claim

This data is used exclusively for verified reward distribution and anti-fraud detection.`,
    },
    {
      title: "8. Updates to This Policy",
      content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification.`,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-6">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Privacy Policy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: February 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
          <p className="text-muted-foreground text-lg">
            CampusHub ("we", "our", or "us") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, and safeguard your information
            when you use our platform.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="border-b pb-8 last:border-0">
              <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
              <div className="text-muted-foreground whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 p-6 bg-muted/50 rounded-xl">
          <h2 className="text-lg font-semibold mb-2">Questions?</h2>
          <p className="text-muted-foreground mb-4">
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <a href="mailto:ganukalp70@gmail.com" className="text-accent hover:underline">
            ganukalp70@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}
