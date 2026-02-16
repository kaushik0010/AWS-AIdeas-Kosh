import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupCampaignModel from "@/src/features/savings/groups/models/groupCampaign.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, {params}: {params: {groupId: string}}) {
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session) {
            return NextResponse.json({
                success: false,
                message: "Unauthorised"
            }, {status: 401})
        }

        const user = await UserModel.findOne({ email: session?.user.email })
        if(!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, {status: 404});
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
            }, {status: 404});
        }

        if(group.admin.toString() === userId.toString()) {
            return NextResponse.json({
                success: false,
                message: 'Instead of leaving please delete the group'
            }, {status: 400});
        }

        const isMember = await GroupMembershipModel.findOne({
            groupId,
            userId,
            status: "active"
        });

        if(!isMember) {
            return NextResponse.json({
                success: false,
                message: "You are not active member of this group"
            }, {status: 403});
        }

        const campaignParticipation = await GroupCampaignModel.findOne({
            groupId,
            status: {$in: ["ongoing", "scheduled"]},
            participants: userId
        })

        if(campaignParticipation) {
            return NextResponse.json({
                success: false,
                message: "You cannot leave the group while participating in an ongoing or scheduled campaign."
            }, {status: 403});
        }

        await GroupMembershipModel.findOneAndUpdate(
            {groupId, userId},
            {
                status: "left",
                leftAt: new Date()
            }
        );

        return NextResponse.json({
            success: true,
            message: "You have successfully left the group",
        }, {status: 200})

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, {status: 500})
    }
}