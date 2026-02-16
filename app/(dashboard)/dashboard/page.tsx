import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardData } from './actions';
import { Suspense } from 'react';
import UserInfo from '@/src/components/dashboard/UserInfo';
import WalletHistory from '@/src/components/dashboard/WalletHistory';
import CurrentIndividualPlans from '@/src/components/dashboard/CurrentIndividualPlans';
import StartIndividualSavingButton from '@/src/components/dashboard/StartIndividualSavingButton';
import JoinedGroups from '@/src/components/dashboard/JoinedGroups';
import SavingsHistory from '@/src/components/dashboard/SavingsHistory';
import DeleteAccountButton from '@/src/components/dashboard/DeleteAccountButton';

export const metadata = {
  title: "KOSH | Dashboard",
};

const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
    <div className="space-y-6">
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[250px] w-full rounded-xl" />
      <Skeleton className="h-[250px] w-full rounded-xl" />
    </div>
  </div>
);

const Dashboard = async () => {
  const {
    user,
    activeRegularCampaign,
    activeFlexibleCampaign,
    savingsHistory,
    joinedGroups,
    walletHistory,
  } = await getDashboardData();

  // This function ensures the data is a plain object before sending to client components
  const serialize = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex mx-auto justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your savings and account activity
          </p>
        </div>
        <DeleteAccountButton />
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UserInfo user={serialize(user)} />
              <WalletHistory
                initialTopups={serialize(walletHistory.topups)}
                initialTotalPages={walletHistory.totalPages}
              />
            </div>
            <CurrentIndividualPlans 
              initialRegularCampaign={serialize(activeRegularCampaign)} 
              initialFlexibleCampaign={serialize(activeFlexibleCampaign)} 
            />
          </div>

          <div className="space-y-6">
            <StartIndividualSavingButton />
            <JoinedGroups initialGroups={serialize(joinedGroups)} />
            <SavingsHistory initialData={serialize(savingsHistory)} />
          </div>
        </div>
      </Suspense>
    </div>
  )
}

export default Dashboard