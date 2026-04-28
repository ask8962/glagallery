/**
 * Structured Data (JSON-LD) for SEO
 * 
 * Provides rich snippets in Google search results.
 * Add this component to your layout.tsx
 */

export function OrganizationSchema() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "GLA Gallery",
        alternateName: "CampusHub Gallery",
        url: "https://campushub.pro",
        logo: "https://campushub.pro/logo.png",
        description: "The official platform for CampusHub students to share campus memories, register for hackathons, and track upcoming events.",
        sameAs: [
            "https://github.com/ask8962/glagallery"
        ],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: "support@gla.ac.in"
        }
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}

export function WebsiteSchema() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "GLA Gallery",
        url: "https://campushub.pro",
        potentialAction: {
            "@type": "SearchAction",
            target: "https://campushub.pro/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}

export function EducationalOrganizationSchema() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "CampusHub",
        url: "https://www.gla.ac.in",
        logo: "https://campushub.pro/logo.png",
        address: {
            "@type": "PostalAddress",
            streetAddress: "17km Stone, NH-2",
            addressLocality: "Mathura",
            addressRegion: "Uttar Pradesh",
            postalCode: "281406",
            addressCountry: "IN"
        }
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}

interface EventSchemaProps {
    name: string
    description: string
    startDate: string
    endDate?: string
    location: string
    imageUrl?: string
    url: string
}

export function EventSchema({ name, description, startDate, endDate, location, imageUrl, url }: EventSchemaProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Event",
        name,
        description,
        startDate,
        endDate: endDate || startDate,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
            "@type": "Place",
            name: location,
            address: {
                "@type": "PostalAddress",
                addressLocality: "Mathura",
                addressRegion: "Uttar Pradesh",
                addressCountry: "IN"
            }
        },
        image: imageUrl || "https://campushub.pro/og-image.png",
        organizer: {
            "@type": "Organization",
            name: "CampusHub",
            url: "https://www.gla.ac.in"
        },
        url
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}

interface BreadcrumbSchemaProps {
    items: { name: string; url: string }[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url
        }))
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}
