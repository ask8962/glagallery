import type { Meta, StoryObj } from "@storybook/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Card> = {
    title: "UI/Card",
    component: Card,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: () => (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Card Content goes here.</p>
            </CardContent>
            <CardFooter>
                <Button>Action</Button>
            </CardFooter>
        </Card>
    ),
}

export const Simple: Story = {
    render: () => (
        <Card className="w-[350px] p-6">
            <p>Simple card with just content.</p>
        </Card>
    ),
}

export const WithImage: Story = {
    render: () => (
        <Card className="w-[350px] overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500" />
            <CardHeader>
                <CardTitle>Featured Event</CardTitle>
                <CardDescription>Jan 25, 2026</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Join us for an amazing campus event!</p>
            </CardContent>
        </Card>
    ),
}

export const Interactive: Story = {
    render: () => (
        <Card className="w-[350px] hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
                <CardTitle>Clickable Card</CardTitle>
                <CardDescription>Hover to see effect</CardDescription>
            </CardHeader>
            <CardContent>
                <p>This card has hover effects.</p>
            </CardContent>
        </Card>
    ),
}
