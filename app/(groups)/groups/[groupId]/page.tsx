import GroupDetailsComponent from '@/src/features/savings/groups/components/GroupDetails'
import React, { Suspense } from 'react'
import { getGroupPageData } from './actions';
import { notFound } from 'next/navigation';

export const metadata = {
  title: "KOSH | Group Details",
};

const PageSkeleton = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

const GroupDetails = async ({ params }: { params: { groupId: string } }) => {
  const {groupId} = await params;
  const data = await getGroupPageData(groupId);

  if(!data) {
    notFound();
  }
  return (
    <Suspense fallback={<PageSkeleton />}>
      <GroupDetailsComponent initialData={data} />
    </Suspense >
  )
}

export default GroupDetails
