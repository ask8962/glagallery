import type { Meta, StoryObj } from "@storybook/react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const meta: Meta<typeof Avatar> = {
    title: "UI/Avatar",
    component: Avatar,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: () => (
        <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
        </Avatar>
    ),
}

export const Fallback: Story = {
    render: () => (
        <Avatar>
            <AvatarImage src="/broken-image.jpg" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
        </Avatar>
    ),
}

export const Sizes: Story = {
    render: () => (
        <div className="flex items-center gap-4">
            <Avatar className="h-6 w-6">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>XS</AvatarFallback>
            </Avatar>
            <Avatar className="h-8 w-8">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>MD</AvatarFallback>
            </Avatar>
            <Avatar className="h-16 w-16">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>LG</AvatarFallback>
            </Avatar>
            <Avatar className="h-24 w-24">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>XL</AvatarFallback>
            </Avatar>
        </div>
    ),
}

export const Group: Story = {
    render: () => (
        <div className="flex -space-x-3">
            <Avatar className="border-2 border-background">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>1</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-background">
                <AvatarImage src="https://github.com/vercel.png" />
                <AvatarFallback>2</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-background">
                <AvatarImage src="https://github.com/nextjs.png" />
                <AvatarFallback>3</AvatarFallback>
            </Avatar>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                +3
            </div>
        </div>
    ),
}
