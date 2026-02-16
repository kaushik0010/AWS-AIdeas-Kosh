// app/groups/[groupId]/actions.ts

import { unstable_noStore as noStore } from 'next/cache';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import mongoose from 'mongoose';

// Import all necessary models
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import GroupCampaignModel from "@/src/features/savings/groups/models/groupCampaign.model";

// This type definition is now correct because we will feed it clean, parsed data.
type PopulatedMember = {
    _id: string;
    userId?: {
        _id: string;
        name: string;
    };
    role: "admin" | "member";
};

/**
 * Fetches all data for the group details page in parallel.
 */
export async function getGroupPageData(groupId: string): Promise<GroupPageData | null> {
    noStore();
    await dbConnect();

    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    if (!userId) {
        throw new Error("User not authenticated.");
    }

    // --- Database Queries ---
    const groupPromise = GroupModel.findById(groupId).populate<{ admin: { _id: string, name: string } }>('admin', 'name').lean();
    const membersPromise = GroupMembershipModel.find({ groupId, status: 'active' }).populate<{ userId: { _id: string, name: string } }>('userId', 'name').lean();
    const userMembershipPromise = GroupMembershipModel.findOne({ groupId, userId }).lean();
    const activeCampaignPromise = GroupCampaignModel.findOne({ groupId, status: { $in: ["scheduled", "ongoing"] } }).select('campaignName startDate durationInMonths status').lean();

    const [group, members, userMembership, activeCampaign] = await Promise.all([
        groupPromise,
        membersPromise,
        userMembershipPromise,
        activeCampaignPromise,
    ]);

    if (!group) {
        return null;
    }

    const isAdmin = group.admin && group.admin._id.toString() === userId.toString();

    // --- Data Processing ---
    let pendingMembers: PopulatedMember[] = [];
    if (isAdmin) {
        const rawPendingMembers = await GroupMembershipModel.find({ groupId, status: 'pending' })
            .populate<{ userId: { _id: string, name: string } }>('userId', 'name')
            .lean();
        pendingMembers = JSON.parse(JSON.stringify(rawPendingMembers));
    }

    const remainingSeats = group.maxGroupSize - members.length;

    const cleanMembers: PopulatedMember[] = JSON.parse(JSON.stringify(members));

    const userRole = isAdmin ? 'admin' : (userMembership?.status === 'active' ? 'member' : null);

    const formattedMembers = cleanMembers
        .filter(member => member.userId)
        .map(member => ({
            _id: member.userId!._id,
            name: member.userId!.name,
            role: member.role,
        }));
    
    const formattedPendingMembers = pendingMembers
        .filter(member => member.userId)
        .map(member => ({
            _id: member.userId!._id,
            name: member.userId!.name,
        }));

    return {
        // Clean all data before returning to ensure no complex types are passed
        group: JSON.parse(JSON.stringify(group)),
        members: formattedMembers,
        pendingMembers: formattedPendingMembers,
        userRole,
        userMembershipStatus: userMembership?.status || null,
        activeCampaign: JSON.parse(JSON.stringify(activeCampaign)),
        isFull: members.length >= group.maxGroupSize,
        remainingSeats: remainingSeats > 0 ? remainingSeats : 0,
    };
}