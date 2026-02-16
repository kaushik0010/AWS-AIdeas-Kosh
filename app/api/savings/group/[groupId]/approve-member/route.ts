import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, {params}: {params: {groupId: string}}) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session || !session?.user.email) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, {status: 401});
        }

        const adminId = new mongoose.Types.ObjectId(session?.user._id);
        const {groupId} = await params;
        const {userId, action} = await request.json()

        if(!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json({
                message: 'Invalid IDs'
            }, {status: 400});
        }

        const group = await GroupModel.findById(groupId);

        if(!group) {
            return NextResponse.json({
                success: false,
                message: 'Group not found'
            }, {status: 404});
        }

        if(!group.admin.equals(adminId)) {
            return NextResponse.json({
                success: false,
                message: 'Only group admin can approve or reject'
            }, {status: 403});
        }

        const membership = await GroupMembershipModel.findOne({groupId, userId});
        if(!membership) {
            return NextResponse.json({
                success: false,
                message: 'Membership not found'
            }, {status: 404});
        }

        if(action === "approve") {
            if(membership.status === "active") {
                return NextResponse.json({
                    success: false,
                    message: 'User already approved'
                }, {status: 400});
            }

            membership.status = "active";
            membership.joinedAt = new Date();
            await membership.save();

            return NextResponse.json({
                success: true,
                message: "User approved successfully"
            }, {status: 200});
        }

        if(action === "reject") {
            if(membership.status === "rejected") {
                return NextResponse.json({
                    success: false,
                    message: 'User already rejected'
                }, {status: 400});
            }

            membership.status = "rejected";
            await membership.save();

            return NextResponse.json({
                success: true,
                message: 'User rejected successfully'
            }, {status: 200});
        }

        return NextResponse.json({
            message: "Invalid action"
        }, {status: 400});

    } catch (error: any) {
        console.error("Approve/Reject route error:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            error: error.message
        }, {status: 500});
    }
}