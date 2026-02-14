import type { Meta, StoryObj } from "@storybook/react"
import { Input } from "@/components/ui/input"
import { Search, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Input> = {
    title: "UI/Input",
    component: Input,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        type: "text",
        placeholder: "Type something...",
        className: "w-[300px]",
    },
}

export const Email: Story = {
    args: {
        type: "email",
        placeholder: "Email address",
        className: "w-[300px]",
    },
}

export const Password: Story = {
    args: {
        type: "password",
        placeholder: "Password",
        className: "w-[300px]",
    },
}

export const Number: Story = {
    args: {
        type: "number",
        placeholder: "Quantity",
        className: "w-[300px]",
    },
}

export const Disabled: Story = {
    args: {
        type: "text",
        placeholder: "Disabled input",
        disabled: true,
        className: "w-[300px]",
    },
}

export const File: Story = {
    args: {
        type: "file",
        className: "w-[300px]",
    },
}

export const WithLabel: Story = {
    render: () => (
        <div className="grid w-[300px] max-w-sm items-center gap-1.5">
            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
            </label>
            <Input type="email" id="email" placeholder="Email" />
        </div>
    ),
}

export const WithButton: Story = {
    render: () => (
        <div className="flex w-[300px] max-w-sm items-center space-x-2">
            <Input type="email" placeholder="Email" />
            <Button type="submit">Subscribe</Button>
        </div>
    ),
}

export const SearchInput: Story = {
    render: () => (
        <div className="relative w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="pl-9" />
        </div>
    ),
}
