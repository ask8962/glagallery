import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, ArrowRight } from "lucide-react"

const meta: Meta<typeof Button> = {
    title: "UI/Button",
    component: Button,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "select",
            options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
        },
        size: {
            control: "select",
            options: ["default", "sm", "lg", "icon"],
        },
    },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        children: "Button",
    },
}

export const Destructive: Story = {
    args: {
        variant: "destructive",
        children: "Delete",
    },
}

export const Outline: Story = {
    args: {
        variant: "outline",
        children: "Outline",
    },
}

export const Secondary: Story = {
    args: {
        variant: "secondary",
        children: "Secondary",
    },
}

export const Ghost: Story = {
    args: {
        variant: "ghost",
        children: "Ghost",
    },
}

export const Link: Story = {
    args: {
        variant: "link",
        children: "Link Button",
    },
}

export const Small: Story = {
    args: {
        size: "sm",
        children: "Small",
    },
}

export const Large: Story = {
    args: {
        size: "lg",
        children: "Large",
    },
}

export const WithIcon: Story = {
    render: () => (
        <Button>
            <Mail className="mr-2 h-4 w-4" /> Login with Email
        </Button>
    ),
}

export const IconOnly: Story = {
    args: {
        size: "icon",
        children: <ArrowRight className="h-4 w-4" />,
    },
}

export const Loading: Story = {
    render: () => (
        <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
        </Button>
    ),
}

export const Disabled: Story = {
    args: {
        disabled: true,
        children: "Disabled",
    },
}
