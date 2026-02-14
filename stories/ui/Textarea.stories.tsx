import type { Meta, StoryObj } from "@storybook/react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const meta: Meta<typeof Textarea> = {
    title: "UI/Textarea",
    component: Textarea,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        placeholder: "Type your message here...",
        className: "w-[300px]",
    },
}

export const WithLabel: Story = {
    render: () => (
        <div className="grid w-[300px] gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea placeholder="Type your message here." id="message" />
        </div>
    ),
}

export const WithText: Story = {
    render: () => (
        <div className="grid w-[300px] gap-1.5">
            <Label htmlFor="message-2">Your message</Label>
            <Textarea placeholder="Type your message here." id="message-2" />
            <p className="text-sm text-muted-foreground">
                Your message will be copied to the support team.
            </p>
        </div>
    ),
}

export const WithButton: Story = {
    render: () => (
        <div className="grid w-[300px] gap-2">
            <Textarea placeholder="Type your message here." />
            <Button>Send message</Button>
        </div>
    ),
}

export const Disabled: Story = {
    args: {
        placeholder: "This textarea is disabled",
        disabled: true,
        className: "w-[300px]",
    },
}
