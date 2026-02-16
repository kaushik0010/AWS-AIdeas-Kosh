import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, {params}: {params: {groupId: string}}) {
    await dbConnect();

    try {
        const session = await getServerSession(authOptions);
        if(!session || !session?.user.email) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, {status: 401});
        }

        const userId = session?.user._id;
        const {groupId} = await params;
        const user = await UserModel.findById(userId);
        if(!user || !user.isEmailVerified) {
            return NextResponse.json({
                success: false,
                message: 'User not verified',
            }, {status: 403});
        }

        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return NextResponse.json(
                { success: false, message: "Invalid group ID" },
                { status: 400 }
            );
        }

        const group = await GroupModel.findById(groupId);
        if(!group) {
            return NextResponse.json({
                success: false,
                message: 'Group not found'
            }, {status: 404});
        }

        if(group.admin.toString() === userId) {
            return NextResponse.json({
                success: false,
                message: 'Admin cannot join their own group'
            }, {status: 400});
        }

        const existingMembership = await GroupMembershipModel.findOne({
            userId,
            groupId,
            status: "active"
        })

        if(existingMembership) {
            return NextResponse.json({
                success: false,
                message: 'User already a group member or has pending request'
            }, {status: 404});
        }

        const memberCount = await GroupMembershipModel.countDocuments({
            groupId,
            status: {$in: ["active", "pending"]}
        })

        if(memberCount >= group.maxGroupSize) {
            return NextResponse.json({
                success: false,
                message: 'Group is full'
            }, {status: 400});
        }

        if(group.criteria && group.criteria.minimumWalletBalance !== undefined) {
            if(user.walletBalance < group.criteria.minimumWalletBalance) {
                return NextResponse.json({
                    success: false,
                    message: 'User does not meet group criteria'
                }, {status: 404});
            }
        }

        const isPublic = group.groupType === 'public'

        const rejectedMember = await GroupMembershipModel.findOne({
            groupId, 
            userId,
            status: {$in: ["rejected", "left"]}
        });

        let newMembership;

        if(rejectedMember) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const requestCountInYear = rejectedMember.requestHistory.filter(
                (date) => date > oneYearAgo
            ).length;

            if(requestCountInYear >= 3) {
                return NextResponse.json({
                    success: false,
                    message: "Maximum re-request limit of 3 reached for this year"
                }, {status: 429})
            }

            rejectedMember.status = isPublic ? 'active' : 'pending';
            rejectedMember.requestHistory = [...(rejectedMember.requestHistory || []), new Date()];
            rejectedMember.joinedAt = isPublic ? new Date() : undefined;
            await rejectedMember.save();

            newMembership = rejectedMember;
        } else {
            newMembership = await GroupMembershipModel.create({
                userId,
                groupId,
                role: "member",
                status: isPublic ? 'active' : 'pending',
                joinedAt: isPublic ? new Date : undefined,
                requestHistory: [new Date()]
            });
        }


        return NextResponse.json({
            success: true,
            message: isPublic ? 'Joined group successfully' : 'Join request sent (pending approval)',
            membership: newMembership
        });


    } catch (error) {
        console.error("Group join error:", error);
        return NextResponse.json({ 
            message: "Internal server error" 
        }, { status: 500 });
    }
}