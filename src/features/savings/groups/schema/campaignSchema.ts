import * as z from'zod';

export const campaignSchema = z.object({
    campaignName: z.string().min(2, "Campaign Name must be atleast 2 chars"),
    startDate: z.coerce.date(),
    durationInMonths: z.coerce.number().min(1, "Campaign duration must be atleast 1 month"),
    savingsDay: z.coerce.number().min(1, "Savings day cant be less than 1").max(31, "Savings day cant be greater than 31"),
    amountPerMonth: z.coerce.number(),
    penaltyAmount: z.coerce.number().min(0, "Can't be negative")
}).refine(
    (data) => data.penaltyAmount <= data.amountPerMonth*0.4,
    {
        message: "Penalty amount cannot exceed 40% of monthly amount",
        path: ["penaltyAmount"]
    }
);

