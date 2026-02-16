import dbConnect from '@/src/features/auth/lib/dbConnect';
import UserModel from '@/src/features/auth/models/user.model';
import ListAllGroupsComponent from '@/src/features/savings/groups/components/ListAllGroupsComponent'
import GroupModel from '@/src/features/savings/groups/models/group.model';
import React from 'react'

export const metadata = {
  title: "KOSH | Groups",
};

export const dynamic = 'force-dynamic';

async function getFilteredGroups({ query, type, size }: { query: string; type: string; size: number; }) {
  await dbConnect();
  UserModel;

  const dbQuery:any = {};

  if(query) {
    dbQuery.$text = { $search: query };
  }
  if (type) {
    dbQuery.groupType = type;
  }
  if (size) {
    dbQuery.maxGroupSize = { $gte: size };
  }

  const groups = await GroupModel.find(dbQuery)
    .populate("admin", "name")
    .sort({ createdAt: -1 })
    .lean();

  return groups;
}

const ListAllGroups = async ({ 
  searchParams,
}: {
  searchParams?: {
    q?: string;
    type?: string;
    size?: string;
  };
}) => {

  const query = searchParams?.q || '';
  const type = searchParams?.type || '';
  const size = Number(searchParams?.size) || 0;

  // Fetch the pre-filtered groups
  const initialGroups = await getFilteredGroups({ query, type, size });

  return (
    <div>
      <ListAllGroupsComponent initialGroups={JSON.parse(JSON.stringify(initialGroups))} />
    </div>
  )
}

export default ListAllGroups
