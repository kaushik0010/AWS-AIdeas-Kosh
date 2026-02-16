import dbConnect from "@/src/features/auth/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import UserModel from "@/src/features/auth/models/user.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        GroupModel;

        const session = await getServerSession(authOptions);

        if(!session || !session.user?.email) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized"
            }, {status: 401})
        };

        const user = await UserModel.findOne({email: session.user.email});
        if(!user || !user.isEmailVerified) {
            return NextResponse.json({
                success: false,
                message: "User not found or email not verified"
            }, {status: 403});
        }

        const userId = session?.user._id;

        const groupMember = await GroupMembershipModel.find({
            userId,
            status: 'active'
        }).populate('groupId', 'groupName');

        if(!groupMember) {
            return NextResponse.json({
                success: false,
                message: "You're not member of any group, please join a group",
                groups: []
            }, {status: 200});
        }

        return NextResponse.json({
            success: true,
            message: "Your groups fetched successfully",
            groups: groupMember
        }, {status: 200})

    } catch (error: any) {
        console.error("Failed to fetch group list", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, {status: 500});
    }
}