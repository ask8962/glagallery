import type { Meta, StoryObj } from "@storybook/react"
import { EventCard } from "@/components/events/event-card"
import { Event } from "@/lib/types"

const baseEvent = {
    id: "demo-event-1",
    title: "GLA Tech Fest 2026",
    shortDescription: "Annual technology festival featuring workshops, hackathons, and keynotes from industry leaders.",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Technology",
    bannerURL: "",
    venueName: "AB-1 Auditorium",
    venueType: "Indoor",
    isFree: true,
    price: 0,
} as unknown as Event

const meta: Meta<typeof EventCard> = {
    title: "App/EventCard",
    component: EventCard,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div style={{ width: "350px" }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof meta>

export const FreeUpcoming: Story = {
    args: {
        event: baseEvent,
    },
}

export const PaidEvent: Story = {
    args: {
        event: {
            ...baseEvent,
            title: "Premium Workshop: AI/ML",
            isFree: false,
            price: 299,
            category: "Workshop",
        },
    },
}

export const EndedEvent: Story = {
    args: {
        event: {
            ...baseEvent,
            title: "Hackathon 2025 (Past)",
            startDate: new Date("2025-12-01").toISOString(),
            endDate: new Date("2025-12-02").toISOString(),
            category: "Hackathon",
        },
    },
}

export const OnlineEvent: Story = {
    args: {
        event: {
            ...baseEvent,
            title: "Virtual Career Fair",
            venueName: "",
            venueType: "Online",
            category: "Career",
        },
    },
}
