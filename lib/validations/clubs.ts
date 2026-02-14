import { z } from "zod"

export const clubRequestSchema = z.object({
    clubName: z.string().min(2, "Club name must be at least 2 characters").max(100, "Club name too long"),
    category: z.enum(["Technical", "Cultural", "Sports", "Literary", "Social", "Other"]),
    vision: z.string().min(20, "Please provide a more detailed vision (at least 20 characters)").max(1000, "Vision too long"),
    proposedLogoURL: z.string().url().optional().or(z.literal("")),
})

export type ClubRequestInput = z.infer<typeof clubRequestSchema>
