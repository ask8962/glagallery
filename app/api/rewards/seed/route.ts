import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getUserFromRequest } from "@/lib/jwt-auth"
import { Timestamp } from "firebase-admin/firestore"

const SAMPLE_REWARDS = [
    {
        name: "Custom Profile Frame",
        description: "Exclusive animated profile frame to make your profile stand out",
        imageURL: "",
        category: "digital",
        pointsCost: 100,
        stock: null,
        isActive: true
    },
    {
        name: "Exclusive Badge - Gold Star",
        description: "A rare gold star badge displayed on your profile",
        imageURL: "",
        category: "digital",
        pointsCost: 200,
        stock: null,
        isActive: true
    },
    {
        name: "Dark Pro Theme",
        description: "Unlock the premium dark pro theme for the app",
        imageURL: "",
        category: "digital",
        pointsCost: 150,
        stock: null,
        isActive: true
    },
    {
        name: "GLA Stickers Pack",
        description: "High-quality vinyl GLA University stickers (pack of 5)",
        imageURL: "",
        category: "physical",
        pointsCost: 500,
        stock: 50,
        isActive: true
    },
    {
        name: "GLA T-Shirt",
        description: "Premium cotton t-shirt with GLA Gallery logo",
        imageURL: "",
        category: "physical",
        pointsCost: 1500,
        stock: 20,
        isActive: true
    },
    {
        name: "Priority Event Registration",
        description: "Get early access to register for popular events",
        imageURL: "",
        category: "privilege",
        pointsCost: 300,
        stock: null,
        isActive: true
    },
    {
        name: "Featured Profile (1 Week)",
        description: "Your profile appears in the featured section for 7 days",
        imageURL: "",
        category: "privilege",
        pointsCost: 400,
        stock: 10,
        isActive: true
    }
]

// POST - Seed sample rewards (Admin only)
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if admin
        const userDoc = await adminDb.collection("users").doc(user.uid).get()
        const userData = userDoc.data()
        if (userData?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        // Add sample rewards
        const batch = adminDb.batch()
        const addedRewards: string[] = []

        for (const reward of SAMPLE_REWARDS) {
            const docRef = adminDb.collection("rewards").doc()
            batch.set(docRef, {
                ...reward,
                createdAt: Timestamp.now()
            })
            addedRewards.push(reward.name)
        }

        await batch.commit()

        return NextResponse.json({
            success: true,
            message: `Seeded ${addedRewards.length} sample rewards`,
            rewards: addedRewards
        })
    } catch (error) {
        console.error("Error seeding rewards:", error)
        return NextResponse.json(
            { error: "Failed to seed rewards" },
            { status: 500 }
        )
    }
}
