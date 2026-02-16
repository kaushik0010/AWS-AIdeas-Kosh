'use client'

import { z } from "zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import axios, { AxiosError } from "axios"
import { toast } from "sonner"
import { ApiResponse } from "@/src/features/auth/types/apiResponse"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, DollarSign, Loader2, Target, Zap } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { individualSavingsSchema } from "../../schema/individualSavingsSchema"
import { flexibleSavingsSchema } from "../../schema/flexibleSavingsSchema"

// --- Zod Schema for the Regular (Monthly) Form ---
type RegularFormData = z.infer<typeof individualSavingsSchema>

// --- Zod Schema for the New Flexible Form ---
type FlexibleFormData = z.infer<typeof flexibleSavingsSchema>


//=================================================================
//  1. REGULAR (MONTHLY) CAMPAIGN FORM
//=================================================================
const RegularCampaignForm = () => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<RegularFormData>({
        resolver: zodResolver(individualSavingsSchema),
        defaultValues: {
            campaignName: "",
            amountPerMonth: 100,
            duration: 3
        }
    });

    const onSubmit = async (data: RegularFormData) => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/savings/individual/create', data);
            toast.success(response.data.message || 'Savings campaign started successfully!');
            router.replace('/dashboard');
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            let errorMessage = axiosError.response?.data.message || 'Failed to create savings campaign.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Campaign Name */}
                <FormField
                    control={form.control}
                    name="campaignName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Target className="h-4 w-4 mr-2" /> Goal Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Vacation Fund" {...field} className="h-10" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                {/* Monthly Amount */}
                <FormField
                    control={form.control}
                    name="amountPerMonth"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><DollarSign className="h-4 w-4 mr-2" /> Monthly Amount</FormLabel>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <Input type="number" min="1" step="1" {...field} className="h-10 pl-8"
                                    onChange={(e) => field.onChange(Number(e.target.value))} />
                            </div>
                            <Slider defaultValue={[100]} min={10} max={1000} step={10}
                                onValueChange={(value) => form.setValue("amountPerMonth", value[0])}
                                value={[form.watch("amountPerMonth")]}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Duration (Months) */}
                <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> Duration (Months)</FormLabel>
                            <Input type="number" min="1" max="36" {...field} placeholder="3" className="h-10"
                                onChange={(e) => field.onChange(Number(e.target.value))} />
                            <Slider defaultValue={[3]} min={1} max={24} step={1}
                                onValueChange={(value) => form.setValue("duration", value[0])}
                                value={[form.watch("duration")]}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-2">Your Savings Plan</h3>
                    <p className="text-sm">
                        Save <span className="font-semibold">${form.watch("amountPerMonth")}</span> monthly for <span className="font-semibold">{form.watch("duration")} months</span>
                    </p>
                    <p className="text-sm mt-1">
                        Total goal: <span className="font-semibold">${form.watch("amountPerMonth") * form.watch("duration")}</span>
                    </p>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full h-10" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Start Saving'}
                </Button>
            </form>
        </Form>
    );
}

//=================================================================
//  2. FLEXIBLE CAMPAIGN FORM (NEW)
//=================================================================
const FlexibleCampaignForm = () => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<FlexibleFormData>({
        resolver: zodResolver(flexibleSavingsSchema),
        defaultValues: {
            campaignName: "",
            frequency: "weekly",
            amountPerContribution: 25,
            duration: 12
        }
    });

    // Watch frequency to update labels dynamically
    const frequency = form.watch("frequency");
    
    // Dynamic labels
    let durationLabel: string;
    let durationUnit: string;
    switch(frequency) {
        case "daily": durationLabel = "Duration (Days)"; durationUnit = "days"; break;
        case "weekly": durationLabel = "Duration (Weeks)"; durationUnit = "weeks"; break;
        case "bi-weekly": durationLabel = "Duration (Bi-Weekly)"; durationUnit = "bi-weeks"; break;
        default: durationLabel = "Duration"; durationUnit = "periods";
    }

    const onSubmit = async (data: FlexibleFormData) => {
        setIsLoading(true);
        try {
            // ✅ Submit to the new flexible route
            const response = await axios.post('/api/savings/individual/flexible/create', data);
            toast.success(response.data.message || 'Flexible campaign started successfully!');
            router.replace('/dashboard');
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            let errorMessage = axiosError.response?.data.message || 'Failed to create campaign.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Campaign Name */}
                <FormField
                    control={form.control}
                    name="campaignName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Target className="h-4 w-4 mr-2" /> Goal Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Coffee Fund" {...field} className="h-10" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* ✅ Frequency (NEW) */}
                <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Zap className="h-4 w-4 mr-2" /> Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select a frequency" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>How often you'll save.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                {/* Amount per Contribution */}
                <FormField
                    control={form.control}
                    name="amountPerContribution"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><DollarSign className="h-4 w-4 mr-2" /> Amount per Contribution</FormLabel>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <Input type="number" min="1" step="1" {...field} className="h-10 pl-8"
                                    onChange={(e) => field.onChange(Number(e.target.value))} />
                            </div>
                            <Slider defaultValue={[25]} min={1} max={500} step={1}
                                onValueChange={(value) => form.setValue("amountPerContribution", value[0])}
                                value={[form.watch("amountPerContribution")]}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Duration (Dynamic) */}
                <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> {durationLabel}</FormLabel>
                            <Input type="number" min="1" max="100" {...field} placeholder="12" className="h-10"
                                onChange={(e) => field.onChange(Number(e.target.value))} />
                            <FormDescription>How many {durationUnit} you'll save for.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Summary (Dynamic) */}
                <div className="p-4 bg-blue-50 dark:bg-blue-800/20 rounded-lg">
                    <h3 className="font-medium mb-2">Your Flexible Plan</h3>
                    <p className="text-sm">
                        Save <span className="font-semibold">${form.watch("amountPerContribution")}</span> {form.watch("frequency")} for <span className="font-semibold">{form.watch("duration")} {durationUnit}</span>
                    </p>
                    <p className="text-sm mt-1">
                        Total goal: <span className="font-semibold">${form.watch("amountPerContribution") * form.watch("duration")}</span>
                    </p>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full h-10" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Start Flexible Plan'}
                </Button>
            </form>
        </Form>
    );
}

//=================================================================
//  3. MAIN COMPONENT WITH TABS
//=================================================================
const CampaignForm = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="border-b">
                    <div className="flex items-center space-x-3">
                        <Target className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="text-2xl font-bold">Create Savings Plan</CardTitle>
                            <p className="text-sm text-muted-foreground">Set up your personal savings goal</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Tabs defaultValue="regular" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="regular" className="cursor-pointer data-[state=inactive]:text-black">Regular</TabsTrigger>
                            <TabsTrigger value="flexible" className="cursor-pointer data-[state=inactive]:text-black">Flexible</TabsTrigger>
                        </TabsList>
                        <TabsContent value="regular" className="pt-4">
                            <RegularCampaignForm />
                        </TabsContent>
                        <TabsContent value="flexible" className="pt-4">
                            <FlexibleCampaignForm />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

export default CampaignForm;