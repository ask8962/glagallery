import type { Meta, StoryObj } from "@storybook/react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const meta: Meta<typeof Checkbox> = {
    title: "UI/Checkbox",
    component: Checkbox,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: () => <Checkbox />,
}

export const WithLabel: Story = {
    render: () => (
        <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
    ),
}

export const WithText: Story = {
    render: () => (
        <div className="items-top flex space-x-2">
            <Checkbox id="terms1" />
            <div className="grid gap-1.5 leading-none">
                <label
                    htmlFor="terms1"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Accept terms and conditions
                </label>
                <p className="text-sm text-muted-foreground">
                    You agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    ),
}

export const Disabled: Story = {
    render: () => (
        <div className="flex items-center space-x-2">
            <Checkbox id="terms2" disabled />
            <Label htmlFor="terms2">Disabled checkbox</Label>
        </div>
    ),
}

export const Checked: Story = {
    render: () => (
        <div className="flex items-center space-x-2">
            <Checkbox id="terms3" checked />
            <Label htmlFor="terms3">Checked checkbox</Label>
        </div>
    ),
}
