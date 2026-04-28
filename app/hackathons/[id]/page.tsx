import { Metadata } from "next"
import { adminDb } from "@/lib/firebase-admin"
import HackathonDetailClient from "./client"

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    try {
        const { id } = await props.params
        const doc = await adminDb.collection("hackathons").doc(id).get()
        const data = doc.data()

        if (!data) {
            return {
                title: "Hackathon Not Found | CampusHub",
            }
        }

        const title = `${data.title} | CampusHub`
        const description = data.description?.substring(0, 160) || `Join this exciting hackathon at CampusHub.`
        const imageUrl = data.bannerURL || data.logoURL || "/placeholder.svg"

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
        console.error("Error generating hackathon metadata:", error)
        return {
            title: "Hackathon | CampusHub",
        }
    }
}

export default function HackathonPage() {
    return <HackathonDetailClient />
}
