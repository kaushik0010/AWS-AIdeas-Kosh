import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import ContributionModel from "@/src/features/savings/groups/models/contribution.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupCampaignModel from "@/src/features/savings/groups/models/groupCampaign.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, {params}: {params: {groupId: string}}) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if(!session || !session?.user.email) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized"
            }, {status: 401});
        }

        const userId = new mongoose.Types.ObjectId(session?.user._id);
        const {groupId} = await params;

        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return NextResponse.json({ 
                message: "Invalid groupId" 
            }, { status: 400 });
        }

        const group = await GroupModel.findById(groupId);
        if(!group) {
            return NextResponse.json({
                success: false,
                message: "Group not found"
            }, {status: 404})
        }

        if(group.admin.toString() !== userId.toString()) {
            return NextResponse.json({
                success: false,
                message: "Only group admin can delete the group"
            }, {status: 403})
        }

        // if any campaign is active
        const activeCampaign = await GroupCampaignModel.findOne({
            groupId,
            status: {$in: ["ongoing", "scheduled"]}
        })

        if(activeCampaign) {
            return NextResponse.json({
                success: false,
                message: "Cannot delete group with ongoing/ scheduled campaigns"
            }, {status: 400})
        }


        // if distributions are completed
        const unDistributed = await GroupCampaignModel.findOne({
            groupId,
            status: "completed",
            isDistributed: false
        })

        if(unDistributed) {
            return NextResponse.json({
                success: false,
                message: "All completed campaigns savings must be distributed before group deletion"
            }, {status: 400})
        }

        // mongoose transactions for data integrity
        const sessionDb = await mongoose.startSession();
        sessionDb.startTransaction();

        try {
            // delete contributions
            await ContributionModel.deleteMany({groupId}, {session: sessionDb})

            // delete campaigns
            await GroupCampaignModel.deleteMany({groupId}, {session: sessionDb})

            // delete memberships
            await GroupMembershipModel.deleteMany({groupId}, {session: sessionDb})

            // delete group
            await GroupModel.deleteOne({_id: groupId}, {session: sessionDb})

            await sessionDb.commitTransaction();
            sessionDb.endSession();

            return NextResponse.json({
                success: true,
                message: "Group deleted successfully"
            }, {status: 200})

        } catch (error) {
            await sessionDb.abortTransaction();
            sessionDb.endSession()
            return NextResponse.json({
                success: false,
                message: "Failed to delete group"
            }, {status: 500})
        }

    } catch (error) {
        return NextResponse.json({
            success: true,
            message: "Internal server error"
        }, {status: 500})
    }
}