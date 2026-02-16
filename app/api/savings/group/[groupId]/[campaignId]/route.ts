import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import GroupCampaignModel from "@/src/features/savings/groups/models/groupCampaign.model";
import { isValidObjectId } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    {params}: {params: {groupId: string, campaignId: string}}
) {
    await dbConnect();

    try {
        const session = await getServerSession(authOptions);
        if(!session || !session?.user?.email) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized",
            }, {status: 401});
        }

        const user = await UserModel.findOne({ email: session.user.email });
        if(!user || !user.isEmailVerified) {
            return NextResponse.json({
                success: false,
                message: "User not found or email not verified"
            }, {status: 403});
        }

        const {groupId, campaignId} = await params;

        if(!isValidObjectId(groupId) || !isValidObjectId(campaignId)) {
            return NextResponse.json({
                success: false,
                message: "Invalid group id or campaign id"
            }, {status: 400});
        }

        const campaign = await GroupCampaignModel.findOne({
            _id: campaignId,
            groupId,
        }).populate("participants", "name email")

        if(!campaign) {
            return NextResponse.json({
                success: false,
                message: "Campaign not found"
            }, {status: 404});
        }

        return NextResponse.json({
            success: true,
            message: "Campaign details fetched successfully",
            campaignDetails: campaign
        }, {status: 200});

    } catch (error) {
        console.error('Error fetching campaign details', error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, {status: 500})
    }
}