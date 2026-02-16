import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupCampaignModel from "@/src/features/savings/groups/models/groupCampaign.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import { GroupMemberPopulated } from "@/types/GroupMember.types";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, {params}: {params: {groupId: string}}) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if(!session || !session?.user.email) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized',
            }, {status: 401});
        }

        const user = await UserModel.findOne({email: session.user.email});
        if(!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, {status: 404});
        }

        const userId = user._id;
        const {groupId} = await params;

        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return NextResponse.json(
                { success: false, message: "Invalid group ID" },
                { status: 400 }
            );
        }

        const group = await GroupModel.findById(groupId).populate('admin', 'name');
        if(!group) {
            return NextResponse.json({
                success: false,
                message: 'Group not found'
            }, {status: 404});
        }

        const activeMemberCount = (await GroupMembershipModel.countDocuments({
            groupId,
            status: "active"
        }));

        const members = await GroupMembershipModel.find({
            groupId,
            status: 'active'
        }).populate('userId', 'name')
            .then((docs) => docs as unknown as GroupMemberPopulated[]);

        const formattedMembers = members.map((member) => ({
            _id: member.userId._id,
            name: member.userId.name,
            role: member.role,
        }));

        const remainingSeats = group.maxGroupSize - activeMemberCount;

        let userRole: 'admin' | 'member' | null = null;

        if (group.admin.toString() === userId?.toString()) {
            userRole = 'admin'
        } else {
            const membership = await GroupMembershipModel.findOne({
                groupId,
                userId,
                status: "active"
            });

            if(membership) {
                userRole = 'member';
            }
        }

        const activeGroupCampaigns = await GroupCampaignModel.findOne({
            groupId,
            status: { $in: ["scheduled", "ongoing"] }
        })

        const activeCampaign = activeGroupCampaigns ? {
            _id: activeGroupCampaigns?._id,
            campaignName: activeGroupCampaigns?.campaignName,
            startDate: activeGroupCampaigns?.startDate,
            durationInMonths: activeGroupCampaigns?.durationInMonths,
            status: activeGroupCampaigns?.status
        } : null;

        return NextResponse.json({
            success: true,
            message: "Group details fetched successfully",
            _id: group._id,
            groupName: group.groupName,
            description: group.description,
            groupType: group.groupType,
            admin: group.admin,
            maxGroupSize: group.maxGroupSize,
            remainingSeats: remainingSeats > 0 ? remainingSeats : 0,
            criteria: group.criteria,
            isFull: remainingSeats <= 0,
            userRole,
            members: formattedMembers,
            activeCampaign
        });

    } catch (error: any) {
        console.error("Failed to fetch group details", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            error: error.message
        }, {status: 500});
    }
}