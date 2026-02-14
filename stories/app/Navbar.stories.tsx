import type { Meta, StoryObj } from "@storybook/react"
import { Navbar } from "@/components/navbar"

/**
 * The main navigation bar component used across all pages.
 * Features: logo, dropdown nav groups (Explore, Community), search/command trigger (⌘K),
 * theme toggle, notifications, user avatar dropdown, and responsive mobile menu.
 *
 * Note: Navbar depends on AuthContext and next-themes.
 * In Storybook, these are mocked via decorators.
 */
const meta: Meta<typeof Navbar> = {
    title: "App/Navbar",
    component: Navbar,
    parameters: {
        layout: "fullscreen",
        nextjs: { appDirectory: true },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div style={{ minHeight: "200px" }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithScrollPadding: Story = {
    decorators: [
        (Story) => (
            <div>
                <Story />
                <div style={{ paddingTop: "80px", padding: "2rem" }}>
                    <h1>Page Content</h1>
                    <p>The navbar is fixed at the top with backdrop blur.</p>
                </div>
            </div>
        ),
    ],
}
