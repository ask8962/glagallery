import type { Meta, StoryObj } from "@storybook/react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const meta: Meta<typeof LoadingSpinner> = {
    title: "UI/LoadingSpinner",
    component: LoadingSpinner,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        size: {
            control: "select",
            options: ["content", "page", "hero"],
        },
    },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        size: "content",
    },
}

export const WithText: Story = {
    args: {
        text: "Loading...",
    },
}

export const PageSize: Story = {
    args: {
        size: "page",
        text: "Loading page content...",
    },
}

export const HeroSize: Story = {
    args: {
        size: "hero",
        text: "Initializing app...",
    },
}
