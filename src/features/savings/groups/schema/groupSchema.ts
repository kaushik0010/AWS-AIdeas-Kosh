import * as z from 'zod';

export const groupSchema = z.object({
    groupName: z.string().min(2, "Group name must be atleast 2 chars"),
    description: z.string().min(2, "Description must be atleast 2 chars"),
    groupType: z.enum(["public", "private"], {
        required_error: "Group type is required",
    }),
    maxGroupSize: z.coerce.number().min(2, "Group size must be atleast 2"),
    criteria: z.object({
        minimumWalletBalance: z.coerce.number()
            .min(0, "Minimum balance can't be negative")
            .optional(),
    }).optional()
}).refine(
    (data) => 
        data.groupType !== "public" || !!data.criteria?.minimumWalletBalance,
    {
        message: "Public groups must have a minimum wallet balance defined",
        path: ["criteria", "minimumWalletBalance"],
    }
);
