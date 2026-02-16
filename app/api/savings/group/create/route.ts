import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    await dbConnect();

    try {
        const session = await getServerSession(authOptions);

        if(!session || !session?.user?.email) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized",
            }, { status: 401 });
        }

        const user = await UserModel.findOne({ email: session.user.email });

        if(!user) {
            return NextResponse.json({
                success: false,
                message: "User not found",
            }, { status: 404 });
        }

        const {groupName, description, groupType, maxGroupSize, criteria} = await request.json();

        if (!groupName || !description || !groupType || !maxGroupSize) {
            return NextResponse.json({
                success: false,
                message: "All fields are required"
            }, {status: 400})
        }

        if(!["public", "private"].includes(groupType)) {
            return NextResponse.json({
                success: false,
                message: "Invalid group type"
            }, {status: 400})
        }

        const existingGroup = await GroupModel.findOne({groupName, admin: user._id})
        
        if(existingGroup) {
            return NextResponse.json({
                success: false,
                message: "You already have group with same name"
            }, {status: 400})
        }

        if (maxGroupSize < 2) {
            return NextResponse.json({
                success: false,
                message: "Group must have at least 2 members.",
            }, { status: 400 });
        }

        if(groupType === "public" && !criteria) {
            return NextResponse.json({
                success: false,
                message: "Public group must have a criteria of minimum wallet balance"
            }, {status: 400});
        }

        const newGroup = new GroupModel({
            groupName: groupName.trim(),
            description: description.trim(),
            groupType,
            admin: user._id,
            maxGroupSize,
            criteria: criteria || {},
        })
        await newGroup.save();

        const membership = new GroupMembershipModel({
            userId: user._id,
            groupId: newGroup._id,
            role: 'admin',
            status: 'active',
            joinedAt: new Date(),
        });

        await membership.save();

        return NextResponse.json({
            success: true,
            message: "Group Created successfully",
            groupId: newGroup._id,
        }, {status: 201});

    } catch (error) {
        console.error("Error creating group:", error);
        return NextResponse.json({ 
            success: false, 
            message: "Internal Server Error" 
        }, { status: 500 });
    }
}