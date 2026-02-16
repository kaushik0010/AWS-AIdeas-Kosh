import dbConnect from "@/src/features/auth/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import UserModel from "@/src/features/auth/models/user.model";
import mongoose from "mongoose";
import IndividualSavingModel from "@/src/features/savings/individual/models/individualSaving.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import ContributionModel from "@/src/features/savings/groups/models/contribution.model";
import GroupCampaignModel from "@/src/features/savings/groups/models/groupCampaign.model";
import WalletTopUpModel from "@/src/features/savings/individual/models/walletTopUp.model";

export async function DELETE(request: NextRequest) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions);

        if(!session || !session?.user.email) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized"
            }, {status: 401});
        }

        const user = await UserModel.findOne({ email: session?.user.email });

        if(!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, {status: 404});
        }

        const userId = new mongoose.Types.ObjectId(session?.user._id);

        const activeIndividualSavings = await IndividualSavingModel.findOne({
            userId,
            isActive: true
        });

        if(activeIndividualSavings) {
            return NextResponse.json({
                success: false,
                message: "Cannot delete account with active individual savings."
            }, {status: 400});
        }

        const isAdminOfGroup = await GroupModel.exists({admin: userId});
        if(isAdminOfGroup) {
            return NextResponse.json({
                success: false,
                message: "Delete groups first before deleting your account"
            }, {status: 400});
        }

        const isMemberOfGroups = await GroupMembershipModel.find({
            userId,
            status: {$in: ["pending", "active"]}
        });

        if(isMemberOfGroups.length > 0) {
            return NextResponse.json({
                success: false,
                message: "Leave all groups first before deleting account"
            }, {status: 400});
        }

        const activeCampaigns = await ContributionModel.find({
            userId,
            status: {$in: ["pending"]}
        })

        if(activeCampaigns.length > 0) {
            return NextResponse.json({
                success: false,
                message: "Complete or leave your ongoing/scheduled campaigns first"
            }, {status: 400});
        }

        const undisbursedCampaigns = await GroupCampaignModel.find({
            participants: userId,
            isDistributed: false,
            status: "completed"
        });

        if(undisbursedCampaigns.length > 0) {
            return NextResponse.json({
                success: false,
                message: "Wait until group savings are distributed before deleting account"
            }, {status: 400})
        }

        const sessionDb = await mongoose.startSession();
        sessionDb.startTransaction();

        try {
            await WalletTopUpModel.deleteMany({userId}).session(sessionDb);

            await IndividualSavingModel.deleteMany({userId}).session(sessionDb);

            await GroupMembershipModel.deleteMany({userId}).session(sessionDb);

            await ContributionModel.deleteMany({userId}).session(sessionDb);

            // removing users from participants array in campaign
            await GroupCampaignModel.updateMany(
                {participants: userId},
                {$pull: {participants: userId}}
            ).session(sessionDb)

            await UserModel.deleteOne({_id: userId}).session(sessionDb);

            await sessionDb.commitTransaction();
            sessionDb.endSession();

            return NextResponse.json({
                success: false,
                message: "Account deleted successfully"
            }, {status: 200})

        } catch (error) {
            await sessionDb.abortTransaction();
            sessionDb.endSession();
            return NextResponse.json({
                success: false,
                message: "Failed to delete user account"
            }, {status: 500})
        }

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, {status: 500})
    }
}