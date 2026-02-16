import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import ContributionModel from "@/src/features/savings/groups/models/contribution.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupCampaignModel from "@/src/features/savings/groups/models/groupCampaign.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest, 
    {params}: {params: {groupId: string, campaignId: string}}
) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if(!session || !session?.user?.email) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized",
        }, {status: 401});
    }

    const {groupId, campaignId} = await params;
    
    const userId = new mongoose.Types.ObjectId(session?.user._id);
    const groupObjectId = new mongoose.Types.ObjectId(groupId);
    const campaignObjectId = new mongoose.Types.ObjectId(campaignId);

    const sessionDb = await mongoose.startSession();
    sessionDb.startTransaction();

    try {
        const group = await GroupModel.findById(groupObjectId).session(sessionDb);
        if(!group) {
            return NextResponse.json({
                success: false,
                message: "Group not found"
            }, {status: 404});
        }

        if(!group.admin.equals(userId)) {
            return NextResponse.json({
                success: false,
                message: "Only group admin is allowed to distribute savings"
            }, {status: 403});
        }

        const campaign = await GroupCampaignModel.findById(campaignObjectId).session(sessionDb);
        if(!campaign) {
            return NextResponse.json({
                success: false,
                message: "Campaign not found"
            }, {status: 404});
        }

        if(!campaign.groupId.equals(groupObjectId)) {
            return NextResponse.json({
                success: false,
                message: "Campaign does not belong to the group"
            }, {status: 400});
        }

        if(campaign.isDistributed) {
            return NextResponse.json({
                success: false,
                message: "Distribution has already been made"
            }, {status: 400});
        }

        const now = new Date();
        if(campaign.endDate > now) {
            return NextResponse.json({
                success: false,
                message: "Campaign duration has not ended yet"
            }, {status: 400});
        }

        const participants = campaign.participants.map((id) => id.toString());
        const contributions = await ContributionModel.find({
            campaignId,
            userId: {$in: participants}
        }).session(sessionDb);

        const userContributionsMap: Record<string, number> = {};
        let penaltyRedistributionPool = 0;
        const fullyPaidUsers: Set<string> = new Set(participants);

        for (const uid of participants) {
            userContributionsMap[uid] = 0;
        }

        for(const contribution of contributions) {
            const uid = contribution.userId.toString();

            // if(!userContributionsMap[uid]) userContributionsMap[uid] = 0;
            // if(!userPenaltyMap[uid]) userPenaltyMap[uid] = 0;

            if(contribution.status === "paid") {
                // userContributionsMap[uid] += contribution.amountPaid;
                const baseContribution = contribution.amountPaid - contribution.penaltyApplied;
                userContributionsMap[uid] += baseContribution;
                penaltyRedistributionPool += contribution.penaltyApplied;
            } else {
                fullyPaidUsers.delete(uid);
            }

            // if(contribution.status !== "paid") {
            //     userPenaltyMap[uid] += contribution.amountPaid;
            // }
        }

        // for (const uid of participants) {
        //     const userContributions = contributions.filter((c) => c.userId.toString() === uid);
        //     const unpaid = userContributions.some((c) => c.status !== "paid");
        //     if(!unpaid) fullyPaidUsers.add(uid);
        // }

        // const penaltyRedistributionPool = Object.entries(userPenaltyMap)
        //     .filter(([uid, penalty]) => {
        //         const userContributions = contributions.filter((c) => c.userId.toString());
        //         const unpaid = userContributions.some((c) => c.status !== "paid");
        //         return unpaid && penalty > 0;
        //     })
        //     .reduce((acc, [_, penalty]) => acc+penalty, 0);
        
        const payoutMap: Record<string, number> = { ...userContributionsMap };
        const penaltyRedistributionMap: Record<string, number> = {};
        const eligibleReceivers = fullyPaidUsers.size;
        let bonusPerUser = 0;

        // for(const uid of participants) {
        //     const contributed = userContributionsMap[uid] || 0;
        //     const penalty = userPenaltyMap[uid] || 0;

        //     let finalPayout = contributed;
        //     if(penalty > 0) {
        //         finalPayout -= penalty;
        //     }

        //     payoutMap[uid] = finalPayout;
        // }

        // const bonusPerUser = eligibleReceivers > 0 ? 
        //     Math.floor(penaltyRedistributionPool / eligibleReceivers) : 0

        // const penaltyRedistributionMap: Record<string, number> = {};

        if (eligibleReceivers > 0 && penaltyRedistributionPool > 0) {
            // Use Math.floor to avoid floating point issues.
            bonusPerUser = Math.floor(penaltyRedistributionPool / eligibleReceivers);
        }

        // Distribute bonuses only to fully paid members
        for(const uid of fullyPaidUsers) {
            payoutMap[uid] += bonusPerUser;
            penaltyRedistributionMap[uid] = bonusPerUser;
        }

        // update wallet balance
        // for(const [uid, amount] of Object.entries(payoutMap)) {
        //     await UserModel.findByIdAndUpdate(uid, {
        //         $inc: {walletBalance: amount},
        //     }).session(sessionDb);
        // }

        const updatePromises = Object.entries(payoutMap).map(([uid, amount]) => {
            if (amount > 0) { // Only update if there is something to pay out
                return UserModel.findByIdAndUpdate(uid, {
                    $inc: { walletBalance: amount },
                }).session(sessionDb);
            }
            return Promise.resolve();
        });
        
        await Promise.all(updatePromises);

        campaign.isDistributed = true;
        campaign.status = "completed"
        campaign.distributionDetails = {
            distributedAt: new Date(),
            payoutPerUser: payoutMap,
            penaltyRedistributed: penaltyRedistributionMap,
        }

        await campaign.save({ session: sessionDb });
        await sessionDb.commitTransaction();

        return NextResponse.json({
            success: true,
            message: "Distribution successful",
        }, {status: 200});

    } catch (error: any) {
        await sessionDb.abortTransaction();
        return NextResponse.json({
            success: false,
            message: error.message || "Distribution failed"
        }, {status: 500})
    } finally {
        sessionDb.endSession();
    }
    
}