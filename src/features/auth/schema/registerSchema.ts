import {z} from "zod";

export const registerSchema = z.object({
    name: z.string().min(2, {message: "Name must be atleast 2 characters long"}),
    email: z.string().email({message: "Please enter a valid email address"}),
    password: z.string().min(6, {message: "Password must be atleast 6 characters long"})
});