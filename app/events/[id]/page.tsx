import { Metadata } from "next"
import { adminDb } from "@/lib/firebase-admin"
import EventDetailClient from "./client"

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    try {
        const { id } = await props.params
        const doc = await adminDb.collection("events").doc(id).get()
        const data = doc.data()

        if (!data) {
            return {
                title: "Event Not Found | CampusHub",
            }
        }

        const title = `${data.title} | CampusHub`
        const description = data.description?.substring(0, 160) || `Join us for ${data.title} at CampusHub.`
        const imageUrl = data.imageUrl || "/placeholder.svg" // Fallback to a default generic image if omitted

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [{ url: imageUrl }],
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [imageUrl],
            },
        }
    } catch (error) {
        console.error("Error generating event metadata:", error)
        return {
            title: "Event Details | CampusHub",
        }
    }
}

export default function EventPage() {
    return <EventDetailClient />
}
