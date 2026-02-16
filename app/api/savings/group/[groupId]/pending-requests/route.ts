import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";
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

        const userId = session?.user._id;
        const {groupId} = await params;

        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return NextResponse.json({ 
                success: false, 
                message: "Invalid group ID" 
            },{ status: 400 });
        }

        const group = await GroupModel.findById(groupId);
        if(!group) {
            return NextResponse.json({
                success: false,
                message: 'Group not found'
            }, {status: 404});
        }

        if(group.admin.toString() !== userId) {
            return NextResponse.json({
                success: false,
                message: "Only admin can see pending members",
            }, {status: 400});
        }

        const pendingMembers = await GroupMembershipModel.find({
            groupId,
            status: 'pending'
        }).populate('userId', 'name')
            .then((docs) => docs as unknown as GroupMemberPopulated[]);

        const formattedMembers = pendingMembers.map((member) => ({
            _id: member.userId._id,
            name: member.userId.name,
            groupId: member.groupId,
            role: member.role,
            status: member.status,
        }))

        return NextResponse.json({
            success: true,
            message: "Members fetched successfully",
            pendingMembers: formattedMembers
        }, {status: 200});

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Internal server error",
        }, {status: 500});
    }
}