'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { 
  CalendarIcon, 
  ClockIcon, 
  UsersIcon, 
  WalletIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  PlusIcon,
  DollarSign,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import axios, { AxiosError } from "axios";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateCampaignFormComponent from "./CreateCampaignFormComponent";
import { toast } from "sonner";
import { ApiResponse } from "@/src/features/auth/types/apiResponse";


const GroupMainSectionComponent = ({ data }: { data: GroupPageData }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [expandedCampaignDetails, setExpandedCampaignDetails] = useState<CampaignDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { group, activeCampaign, userRole } = data;

  const [open, setOpen] = useState(false);

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [distributeDialogOpen, setDistributeDialogOpen] = useState(false);

  const searchParams = useSearchParams();
  const campaignIdFromUrl = searchParams.get('campaign');

  const campaign = activeCampaign as GroupPageData["activeCampaign"];
  const userId = session?.user?._id;
  const isAdmin = userRole === 'admin';

  const isMember = data.members.some((m: any) => m._id === userId);

  const today = new Date();
  const dayOfMonth = today.getDate();
  const campaignEndDate = expandedCampaignDetails?.endDate;
  const isCampaignEnded = campaignEndDate ? today > new Date(campaignEndDate) : false;
  const savingsDay = expandedCampaignDetails?.savingsDay;

  const isLate = savingsDay !== undefined && dayOfMonth > savingsDay;
  const amountPerMonth = expandedCampaignDetails?.amountPerMonth ?? 0;
  const penaltyAmount = expandedCampaignDetails?.penaltyAmount ?? 0;

  const penaltyApplied = isLate ? penaltyAmount : 0;
  const totalAmount = amountPerMonth + penaltyApplied;


  const isCampaignParticipant = expandedCampaignDetails?.participants.some((p: any) => p._id === userId);
  const participantId = isCampaignParticipant ? userId : undefined;

  const adminId = data.group.admin._id;


  if (!campaign) {
    return (
      <div className="p-4 max-w-3xl mx-auto w-full">
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center bg-gray-50/50 dark:bg-gray-800/30">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
            >
              <path d="M12 2v4" />
              <path d="m16.2 7.8 2.9-2.9" />
              <path d="M18 12h4" />
              <path d="m16.2 16.2 2.9 2.9" />
              <path d="M12 18v4" />
              <path d="m7.8 16.2-2.9 2.9" />
              <path d="M6 12H2" />
              <path d="m7.8 7.8-2.9-2.9" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No Active Campaign
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {isAdmin 
              ? "Start a new savings campaign for your group" 
              : "Only admins can create new campaigns"}
          </p>

          {isAdmin ? (

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="default"
                  className="px-6 py-3 cursor-pointer"
                  size="lg"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white p-0">
                <DialogTitle></DialogTitle>
                  <CreateCampaignFormComponent groupId={group._id} />

              </DialogContent>
            </Dialog>
            
          ) : (
            <Button 
              variant="ghost" 
              className="text-gray-500 cursor-pointer"
              onClick={() => router.push('/groups')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Browse Other Groups
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Calculate campaign progress (0-100)
  const progress = Math.min(
    100,
    (Date.now() - new Date(campaign.startDate).getTime()) /
      (campaign.durationInMonths * 30 * 24 * 60 * 60 * 1000) * 100
  );

  // expandable campaign details
  const handleExpand = async () => {
    const isExpanding = !expanded;
    setExpanded(isExpanding);

    router.push( 
      isExpanding ? `/groups/${group._id}?campaign=${campaign._id}` 
      : `/groups/${group._id}`
    )

    if(!expandedCampaignDetails && !loadingDetails) {
      try {
        setLoadingDetails(true);
        const response = await axios.get(`/api/savings/group/${group._id}/${campaign._id}`);
        setExpandedCampaignDetails(response.data.campaignDetails)

      } catch (error) {
        console.error("Failed to fetch campaign details", error)
      } finally {
        setLoadingDetails(false);
      }
    }
  }

  const handleMonthlyContribution = 
    async (groupId: string, campaignId: string, userId: string, amountPaid: number) => {
      try {
        setLoadingId(userId);
        setLoadingDetails(true);
        const response = await axios.patch(`/api/savings/group/${groupId}/${campaignId}/contribute`, {
          userId,
          amountPaid
        });
        toast.success(response.data.message || "Monthly amount paid successfully");
        router.refresh();

      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        let errorMessage = axiosError.response?.data.message || 'Failed to pay, please try again!';
        toast.error(errorMessage);
      } finally {
        setLoadingId(null);
        setLoadingDetails(false);
      }
  }

  const handleSavingsDistribution = async (groupId: string, campaignId: string) => {
    try {
      setLoadingId(adminId);
      setLoadingDetails(true);
      const response = await axios.post(`/api/savings/group/${groupId}/${campaignId}/distribute`);
      toast.success(response.data.message || "Savings distributed successfully");
      router.refresh();

    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      let errorMessage = axiosError.response?.data.message || 'Failed to distribute, please try again!';
      toast.error(errorMessage);
    } finally {
      setLoadingId(null);
      setLoadingDetails(false);
    }
  }


  return (
    <div className="p-4 max-w-3xl mx-auto w-full space-y-4">
      <h2 className="text-lg font-semibold">Campaign Info</h2>
      
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4" />
                <span>Name</span>
              </div>
              <p className="font-medium">{campaign.campaignName}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>Status</span>
              </div>
              <div>
                <Badge 
                  variant={
                    campaign.status === 'completed' ? 'default' : 'secondary'
                  }
                >
                  {campaign.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4" />
                <span>Started</span>
              </div>
              <p className="font-medium">
                {new Date(campaign.startDate).toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>Duration</span>
              </div>
              <p className="font-medium">
                {campaign.durationInMonths} month(s)
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {Math.round(progress)}% completed
            </p>
          </div>

          {/* Expandable Section */}
          {expanded && expandedCampaignDetails && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <InfoIcon className="h-4 w-4" />
                Detailed Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Participants:</span>
                    <span className="font-medium">{expandedCampaignDetails.participants?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Savings Day:</span>
                    <span className="font-medium">{expandedCampaignDetails.savingsDay} of each month</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Penalty:</span>
                    <span className="font-medium">
                      ${expandedCampaignDetails.penaltyAmount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">End Date:</span>
                    <span className="font-medium">{new Date(expandedCampaignDetails.endDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Monthly Amount:</span>
                    <span className="font-medium">
                      ${expandedCampaignDetails.amountPerMonth?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Total Saved:</span>
                    <span className="font-medium">
                      ${expandedCampaignDetails.totalSaved?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              {isMember && isCampaignParticipant && (
                <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="default"
                      className="px-6 py-3 w-full cursor-pointer"
                      size="lg"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Pay Monthly Amount
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white p-0">
                    <DialogTitle></DialogTitle>
                    <DialogDescription className="text-center text-sm">
                      You are paying <strong>${totalAmount}</strong>, please continue
                    </DialogDescription>
                    <DialogFooter>
                      <div className="p-4 mx-auto space-x-3">
                        <DialogClose asChild>
                          <Button variant="secondary" disabled={loadingDetails} className="cursor-pointer border">Cancel</Button>
                        </DialogClose>
                        {participantId && (
                          <Button
                            disabled={loadingDetails}
                            className="cursor-pointer"
                            onClick={() => handleMonthlyContribution(group._id, campaign._id, participantId, totalAmount)}
                          >
                            {loadingId === participantId ? (
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            ): (
                              "Pay"
                            )}
                          </Button>
                        )}
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {isAdmin && (
                <div>
                  <Dialog open={distributeDialogOpen} onOpenChange={setDistributeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="px-6 py-3 w-full cursor-pointer bg-green-500 hover:bg-green-600 text-white"
                        size="lg"
                        disabled={!isCampaignEnded}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Distribute Savings
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white p-0">
                      <DialogTitle></DialogTitle>
                      <DialogDescription className="text-center text-sm">
                        You are distributing <strong>${expandedCampaignDetails.totalSaved}</strong> among {expandedCampaignDetails.participants.length} participants, please continue
                      </DialogDescription>
                      <DialogFooter>
                        <div className="p-4 mx-auto space-x-3">
                          <DialogClose asChild>
                            <Button variant="secondary" disabled={loadingDetails} className="cursor-pointer border">Cancel</Button>
                          </DialogClose>
                          {adminId && (
                            <Button
                              disabled={loadingDetails}
                              className="cursor-pointer"
                              onClick={() => handleSavingsDistribution(group._id, campaign._id)}
                            >
                              {loadingId === adminId ? (
                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                              ): (
                                "Distribute"
                              )}
                            </Button>
                          )}
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant={expanded ? "secondary" : "default"}
              onClick={handleExpand}
              className="flex-1 md:flex-none cursor-pointer w-full"
              disabled={loadingDetails}
            >
              {expanded ? (
                <>
                  <ChevronUpIcon className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="h-4 w-4 mr-2" />
                  View Campaign Details
                </>
              )}
            </Button>
        
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupMainSectionComponent;