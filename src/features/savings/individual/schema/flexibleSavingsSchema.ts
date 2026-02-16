import z from "zod";

export const flexibleSavingsSchema = z.object({
    campaignName: z.string().min(3, "Campaign name must be at least 3 characters"),
    frequency: z.enum(["daily", "weekly", "bi-weekly"]),
    amountPerContribution: z.number().min(1, "Amount must be at least $1"),
    duration: z.number().min(1, "Duration must be at least 1"),
});