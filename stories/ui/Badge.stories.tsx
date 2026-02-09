import type { Meta, StoryObj } from "@storybook/react"
import { Badge } from "@/components/ui/badge"

const meta: Meta<typeof Badge> = {
    title: "UI/Badge",
    component: Badge,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "select",
            options: ["default", "secondary", "destructive", "outline"],
        },
    },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        children: "Badge",
    },
}

export const Secondary: Story = {
    args: {
        variant: "secondary",
        children: "Secondary",
    },
}

export const Destructive: Story = {
    args: {
        variant: "destructive",
        children: "Destructive",
    },
}

export const Outline: Story = {
    args: {
        variant: "outline",
        children: "Outline",
    },
}

export const Status: Story = {
    render: () => (
        <div className="flex gap-2">
            <Badge className="bg-green-500">Active</Badge>
            <Badge className="bg-yellow-500">Pending</Badge>
            <Badge className="bg-red-500">Closed</Badge>
        </div>
    ),
}

export const WithCount: Story = {
    render: () => (
        <div className="flex gap-2">
            <Badge>12 New</Badge>
            <Badge variant="secondary">99+</Badge>
        </div>
    ),
}

export const EventCategories: Story = {
    render: () => (
        <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Tech</Badge>
            <Badge variant="outline">Cultural</Badge>
            <Badge variant="outline">Sports</Badge>
            <Badge variant="outline">Workshop</Badge>
        </div>
    ),
}
