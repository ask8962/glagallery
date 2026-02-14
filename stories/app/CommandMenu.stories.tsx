import type { Meta, StoryObj } from "@storybook/react"
import { CommandMenu } from "@/components/command-menu"
import { useState } from "react"

/**
 * Global command palette accessible via ⌘K / Ctrl+K.
 * Features navigation, admin shortcuts, theme toggle, and user actions.
 * Requires `open` and `onOpenChange` props.
 */
const meta: Meta<typeof CommandMenu> = {
    title: "App/CommandMenu",
    component: CommandMenu,
    parameters: {
        layout: "fullscreen",
        nextjs: { appDirectory: true },
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
    args: {
        open: true,
        onOpenChange: () => { },
    },
}

export const Interactive: Story = {
    render: () => {
        const [open, setOpen] = useState(true)
        return (
            <div>
                <button
                    onClick={() => setOpen(true)}
                    style={{
                        padding: "8px 16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        cursor: "pointer",
                    }}
                >
                    Press ⌘K or click to open
                </button>
                <CommandMenu open={open} onOpenChange={setOpen} />
            </div>
        )
    },
}
