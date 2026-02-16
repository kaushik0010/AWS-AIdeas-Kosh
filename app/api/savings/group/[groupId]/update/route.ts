import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, {params}: {params: {groupId: string}}) {
    await dbConnect();

    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user._id;

        if(!session || !session.user?.email) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, {status: 401});
        }

        const {groupId} = await params;

        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return NextResponse.json({ 
                success: false,
                message: "Invalid groupId" 
            }, { status: 400 });
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
                message: 'Only the admin can update this group'
            }, {status: 403});
        }

        const body = await request.json();
        const {
            groupName,
            description,
            groupType,
            maxGroupSize,
            criteria
        } = body;

        if(typeof groupName === 'string') group.groupName = groupName;
        if(typeof description === 'string') group.description = description;
        if(groupType === 'public' || groupType === 'private') group.groupType = groupType;
        if(typeof maxGroupSize === 'number') group.maxGroupSize = maxGroupSize;
        if(typeof criteria === 'object') {
            group.criteria = {
                ...group.criteria,
                ...criteria,
            };
        }

        if (groupType === "private" && !criteria) {
            group.criteria = {};
            }

        await group.save();

        return NextResponse.json({
            success: true,
            message: "Group updated successfully",
            updatedGroup: group,
        })
        
    } catch (error) {
        console.error("Group update failed", error);
        return NextResponse.json({
            success: false,
            message: "Public groups must have minimum balance criteria",
        }, {status: 500});
    }
}