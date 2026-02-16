import {z} from "zod";

export const updateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    walletTopUp: z.coerce.number().min(0, "Wallet amount must be 0 or more"),
})