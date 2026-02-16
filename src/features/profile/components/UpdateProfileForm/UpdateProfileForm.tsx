'use client'

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import axios, { AxiosError } from "axios"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { updateProfileSchema } from "../../schema/updateProfileSchema"
import { ApiResponse } from "@/src/features/auth/types/apiResponse"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Loader2, Mail, User, Wallet } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type updateProfileValues = z.infer<typeof updateProfileSchema>

const UpdateProfileForm = () => {
    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<updateProfileValues>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            name: "",
            walletTopUp: 0,
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('/api/user/me');
                setUserData(response.data);
                form.reset({
                    name: response.data.name,
                    walletTopUp: 0
                });
            } catch (error) {
                toast.error("Failed to fetch profile data");
            }
        };

        fetchProfile();
    }, [form]);

    const onSubmit = async (data: updateProfileValues) => {
        setIsLoading(true);
        try {
            const response = await axios.patch('/api/user/update', data);
            toast.success(response.data.message || "Profile updated successfully");
            setUserData(response.data.user);
            form.reset({
                name: response.data.user.name,
                walletTopUp: 0
            });
            router.refresh();
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            let errorMessage = axiosError.response?.data.message || 'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    if (!userData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Update Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="border-b">
                    <div className="flex items-center space-x-3">
                        <User className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="text-2xl font-bold">Update Profile</CardTitle>
                            <p className="text-sm text-muted-foreground">Manage your account details</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Email (Read-only) */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm font-medium">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email Address
                                </label>
                                <div className="flex items-center h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                                    {userData.email}
                                </div>
                                <FormDescription>
                                    Contact support to change your email
                                </FormDescription>
                            </div>

                            {/* Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            <User className="h-4 w-4 mr-2" />
                                            Full Name
                                        </FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="Enter your full name" 
                                                {...field} 
                                                className="h-10"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Current Wallet Balance */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm font-medium">
                                    <Wallet className="h-4 w-4 mr-2" />
                                    Current Balance
                                </label>
                                <div className="flex items-center h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                                    ${userData.walletBalance.toFixed(2)}
                                </div>
                            </div>

                            {/* Wallet Top-up */}
                            <FormField
                                control={form.control}
                                name="walletTopUp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            <DollarSign className="h-4 w-4 mr-2" />
                                            Add Funds
                                        </FormLabel>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                step="1"
                                                {...field}
                                                className="h-10 pl-8"
                                            />
                                        </div>
                                        <FormDescription>
                                            Enter the amount you want to add to your wallet
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Submit Button */}
                            <Button 
                                type="submit" 
                                className="w-full mt-4 h-10 cursor-pointer"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Profile'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

export default UpdateProfileForm
