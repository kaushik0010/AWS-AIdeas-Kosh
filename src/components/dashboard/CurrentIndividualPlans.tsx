'use client'

import axios, { AxiosError } from "axios";
import { useState } from "react";
import { DataTable } from "./individual-savings-table/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ApiResponse } from "@/src/features/auth/types/apiResponse";
import { DollarSign, Loader2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { columns as regularColumns } from "./individual-savings-table/columns";
import { flexibleColumns } from "./flexible-savings-table/columns";

type Props = {
  initialRegularCampaign: RegularCampaign | null;
  initialFlexibleCampaign: FlexibleCampaign | null;
};

const CurrentIndividualPlans = ({ initialRegularCampaign, initialFlexibleCampaign }: Props) => {
  const [planType, setPlanType] = useState<'regular' | 'flexible'>(
        initialRegularCampaign ? 'regular' : 'flexible' // Default to the one that exists
    );
    
    const [isLoading, setIsLoading] = useState(false);
    const [payDialogOpen, setPayDialogOpen] = useState(false);
    const [collectDialogOpen, setCollectDialogOpen] = useState(false);
    const router = useRouter();

    const campaign = planType === 'regular' ? initialRegularCampaign : initialFlexibleCampaign;

    if (!campaign) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Savings Plans</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No active saving plans</p>
                </CardContent>
            </Card>
        );
    }

    const isPlanEnded = new Date() > new Date(campaign.endDate);
    const progress = (campaign.amountSaved / campaign.totalAmount) * 100;
    
    // Handle different amount fields
    const amountToPay = planType === 'regular' 
        ? (campaign as RegularCampaign).amountPerMonth 
        : (campaign as FlexibleCampaign).amountPerContribution;

    const columns = planType === 'regular' ? regularColumns : flexibleColumns;

    const handlePay = async () => {
      const apiPath = planType === 'regular' 
            ? `individual`
            : `individual/flexible`;

        try {
            setIsLoading(true);
            const response = await axios.patch(`/api/savings/${apiPath}/${campaign._id}/contribute`, {
                amountPaid: amountToPay // Send the correct amount
            });
            toast.success(response.data.message || "Contribution successful");
            router.refresh();
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            let errorMessage = axiosError.response?.data.message || 'Failed to pay, please try again!';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
            setPayDialogOpen(false);
        }
    }

    const handlePayout = async () => {
      const apiPath = planType === 'regular' 
            ? `individual`
            : `individual/flexible`;

        try {
            setIsLoading(true);
            const response = await axios.patch(`/api/savings/${apiPath}/${campaign._id}/payout`);
            toast.success(response.data.message || "Payout successful");
            router.refresh();
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            let errorMessage = axiosError.response?.data.message || 'Failed to credit savings';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
            setCollectDialogOpen(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg md:text-xl">
                        Your Active Saving Plan
                    </CardTitle>
                    {/* Select dropdown */}
                    <Select value={planType} onValueChange={(value) => setPlanType(value as 'regular' | 'flexible')}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                            {initialRegularCampaign && <SelectItem value="regular">Regular</SelectItem>}
                            {initialFlexibleCampaign && <SelectItem value="flexible">Flexible</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border mb-6">
                    <DataTable columns={columns as any} data={[campaign]} />
                </div>

                {/* Progress Bar */}
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            Saved: ${campaign.amountSaved.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                            Target: ${campaign.totalAmount.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Pay Button */}
                    <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" className="w-full gap-2 cursor-pointer">
                                <DollarSign className="h-4 w-4" />
                                Pay Contribution (${amountToPay})
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-white">
                            <DialogHeader>
                                <DialogTitle className="text-gray-900">Confirm Payment</DialogTitle>
                                <DialogDescription className="text-gray-600">
                                    You are about to add ${amountToPay} to your savings plan.
                                </DialogDescription>
                            </DialogHeader>
                            {/* ... Pay Dialog Content ... */}
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button 
                                        variant="default" 
                                        className="cursor-pointer" 
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button 
                                    onClick={handlePay} 
                                    disabled={isLoading} 
                                    className="cursor-pointer"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Payment"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Collect Button */}
                    <Dialog open={collectDialogOpen} onOpenChange={setCollectDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="success" className="w-full gap-2 cursor-pointer" disabled={!isPlanEnded}>
                                <DollarSign className="h-4 w-4" />
                                Collect Savings (${campaign.amountSaved.toFixed(2)})
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-white">
                            <DialogHeader>
                                <DialogTitle className="text-gray-900">Confirm Collection</DialogTitle>
                                <DialogDescription className="text-gray-600">
                                {isPlanEnded ? (
                                    `Your total savings of $${campaign.amountSaved.toFixed(2)} will be credited to your account.`
                                ) : (
                                    `Your savings plan ends on ${format(new Date(campaign.endDate), 'PPP')}. You can only collect after the end date.`
                                )}
                                </DialogDescription>
                            </DialogHeader>
                            {/* ... Collect Dialog Content (checks isPlanEnded) ... */}
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button 
                                        className="cursor-pointer" 
                                        variant="default" 
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                {isPlanEnded && (
                                    <Button 
                                        variant="success" 
                                        onClick={handlePayout} 
                                        disabled={isLoading} 
                                        className="cursor-pointer"
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Collection"}
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}

export default CurrentIndividualPlans
