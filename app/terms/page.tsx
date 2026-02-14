import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Terms of Service | GLA Gallery",
  description: "Terms of Service for GLA Gallery - Rules and guidelines for using the platform.",
}

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: `By accessing or using GLA Gallery, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.

GLA Gallery is exclusively for students, faculty, and staff of GLA University with valid @gla.ac.in email addresses.`,
    },
    {
      title: "2. User Account",
      content: `• You must sign in using your official GLA University Google account
• You are responsible for all activity under your account
• You must not share your account credentials
• You must provide accurate profile information
• You must be at least 16 years old to use this service`,
    },
    {
      title: "3. Acceptable Use",
      content: `You agree NOT to:

• Post content that is illegal, harmful, threatening, abusive, or harassing
• Upload explicit or inappropriate content
• Share personal information of others without consent
• Impersonate other users or entities
• Spam, phish, or engage in fraudulent activities
• Attempt to hack or disrupt the platform
• Use automated tools to access the service
• Violate any applicable laws or regulations`,
    },
    {
      title: "4. Content Guidelines",
      content: `When uploading content, you agree that:

• You own or have rights to share the content
• Content does not infringe on others' intellectual property
• Photos/videos featuring other people have their consent
• Content is appropriate for a university community
• We may remove content that violates these guidelines`,
    },
    {
      title: "5. Intellectual Property",
      content: `• You retain ownership of content you upload
• By posting, you grant GLA Gallery a license to display your content
• The GLA Gallery platform, design, and code are protected by copyright
• GLA University logos and branding are property of GLA University`,
    },
    {
      title: "6. Content Moderation",
      content: `We reserve the right to:

• Remove content that violates our guidelines
• Hide or flag reported content pending review
• Suspend or terminate accounts for violations
• Cooperate with law enforcement when required
• Modify moderation policies as needed`,
    },
    {
      title: "7. Hackathon Participation",
      content: `For hackathon features:

• Teams must follow hackathon-specific rules
• Project submissions must be original work
• Judging decisions are final
• Prizes and recognition are at the organizer's discretion`,
    },
    {
      title: "8. Disclaimer",
      content: `GLA Gallery is provided "as is" without warranties. We do not guarantee:

• Continuous, uninterrupted service
• Accuracy of user-generated content
• Preservation of your content indefinitely
• Compatibility with all devices`,
    },
    {
      title: "9. Limitation of Liability",
      content: `GLA Gallery and its creator shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.`,
    },
    {
      title: "10. Reward Campaign Terms",
      content: `For reward campaigns:

• Each verified GLA student account is eligible for one reward claim only
• Reward amounts (₹30–₹50) are randomly generated on our servers and cannot be influenced
• Referral bonuses (₹10) are credited only after the referred user completes their claim
• Rewards flagged for suspicious activity will be reviewed before processing
• Creating multiple accounts to claim rewards is strictly prohibited and will result in disqualification
• We reserve the right to modify, suspend, or terminate any campaign at any time
• Reward payouts are subject to verification and administrative approval`,
    },
    {
      title: "11. Disclaimer",
      content: `⚠️ GLA Gallery is a personal project created by a student. It is NOT affiliated with, endorsed by, or sponsored by GLA University or any of its departments. Any rewards offered are personal initiatives and are not university-sanctioned.`,
    },
    {
      title: "12. Changes to Terms",
      content: `We may update these Terms of Service at any time. Continued use of the platform after changes constitutes acceptance of the new terms.`,
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
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Terms of Service</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: February 2026
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
          <p className="text-muted-foreground">
            For questions about these Terms, contact us at{" "}
            <a href="mailto:ganukalp70@gmail.com" className="text-accent hover:underline">
              ganukalp70@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
