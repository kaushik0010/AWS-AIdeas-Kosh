'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { History, RefreshCw } from 'lucide-react'
import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

const SavingsHistory = ({ initialData }: { initialData: Campaign[] }) => {
  const [campaigns, setCampaigns ] = useState<Campaign[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Card className="h-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <CardTitle className="text-lg md:text-xl">Savings History</CardTitle>
        </div>
        <Button
          variant="ghost"
          className='cursor-pointer'
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 min-h-[150px] text-center p-4">
            <History className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              You don't have any savings history yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
              <div>Plan</div>
              <div className="text-right">Amount</div>
              <div className="text-right">End Date</div>
            </div>
            {campaigns.map((campaign) => (
              <div
                key={campaign._id}
                className="grid grid-cols-2 gap-4 items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <div className="font-medium truncate">{campaign.campaignName}</div>
                  {new Date(campaign.endDate) < new Date() && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Completed
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between space-x-4">
                  <div className="font-medium text-sm">
                    ${campaign.amountSaved.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(campaign.endDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SavingsHistory
