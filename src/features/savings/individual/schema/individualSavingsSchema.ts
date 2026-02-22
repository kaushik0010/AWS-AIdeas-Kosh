import * as z from 'zod';

export const individualSavingsSchema = z.object({
    campaignName: z.string().min(2, "Campaign name is required"),
    amountPerMonth: z.coerce.number().min(1, 'Amount must be at least ₹1'),
    duration: z.coerce.number().min(1, 'Duration must be at least 1 month'),
});