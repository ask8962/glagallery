import { Metadata } from "next"
import { adminDb } from "@/lib/firebase-admin"
import ClubProfileClient from "./client"

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    try {
        const { id } = await props.params
        const doc = await adminDb.collection("clubs").doc(id).get()
        const data = doc.data()

        if (!data) {
            return {
                title: "Club Not Found | GLA Gallery",
            }
        }

        const title = `${data.name} | GLA Gallery Clubs`
        const description = data.description?.substring(0, 160) || `Check out ${data.name} at CampusHub.`
        const imageUrl = data.coverImageURL || data.logoURL || "/placeholder.svg"

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
        console.error("Error generating club metadata:", error)
        return {
            title: "Club Profile | GLA Gallery",
        }
    }
}

export default function ClubPage() {
    return <ClubProfileClient />
}
