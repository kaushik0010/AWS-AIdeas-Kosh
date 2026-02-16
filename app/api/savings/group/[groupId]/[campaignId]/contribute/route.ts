import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import ContributionModel from "@/src/features/savings/groups/models/contribution.model";
import GroupCampaignModel from "@/src/features/savings/groups/models/groupCampaign.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import { endOfDay, setDate, startOfDay, subDays } from "date-fns";
import { isValidObjectId } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";


export async function PATCH(
    request: NextRequest, 
    {params}: {params: {groupId: string; campaignId: string}}
) {
    try {
        await dbConnect();

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

        const userId = session?.user._id;
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
        })

        if(!campaign) {
            return NextResponse.json({
                success: false,
                message: "Campaign not found"
            }, {status: 404});
        }

        const { 
            startDate, 
            endDate, 
            savingsDay, 
            amountPerMonth, 
            penaltyAmount, 
            participants, 
            status 
        } = campaign;

        const member = await GroupMembershipModel.findOne({
            groupId,
            userId,
            status: "active"
        })

        if(!member) {
            return NextResponse.json({
                success: false,
                message: "You are not member of this group"
            }, {status: 403});
        }

        if(!participants.some((p) => p.toString() === userId?.toString())) {
            return NextResponse.json({
                success: false,
                message: "You are not participant of this campaign"
            }, {status: 403});
        }

        const body = await request.json();
        const { amountPaid } = body;

        if (typeof amountPaid !== "number" || amountPaid <= 0) {
            return NextResponse.json({ 
                success: false,
                message: "Invalid amountPaid",
            }, { status: 400 });
        }

        const today = new Date();

        if (today > endDate) {
            return NextResponse.json({
                success: false,
                message: "This campaign has ended. Contributions are closed."
            }, { status: 400 });
        }

        const currentMonth = today.getMonth() + 1; 
        const currentYear = today.getFullYear();

        const contribution = await ContributionModel.findOne({
            campaignId,
            groupId,
            userId,
            month: currentMonth,
            year: currentYear,
        })

        if(!contribution) {
            return NextResponse.json({
                success: false,
                message: "No contribution scheduled for this month yet."
            }, {status: 404});
        }

        if (contribution.status === "paid") {
            return NextResponse.json({
                success: false,
                message: "You have already paid for this month."
            }, { status: 400 });
        }

        // const { scheduledDate } = contribution;

        // function getDaysInMonth(year: number, monthIndex: number): number {
        //     return new Date(year, monthIndex + 1, 0).getDate();
        // }

        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const validSavingsDay = Math.min(savingsDay, daysInMonth);
        const windowStart = subDays(new Date(currentYear, currentMonth - 1, validSavingsDay), 10);
        const windowEnd = new Date(currentYear, currentMonth - 1, validSavingsDay);

        windowStart.setHours(0, 0, 0, 0);
        windowEnd.setHours(23, 59, 59, 999);

        if (today < windowStart) {
            return NextResponse.json({
                success: false,
                message: `Payment window for this month opens on ${windowStart.toDateString()}`,
            }, { status: 400 });
        }


        let isLate = today > windowEnd;
        let penaltyApplied = isLate ? penaltyAmount : 0;
        let totalAmount = amountPerMonth + penaltyApplied;

        const expectedAmount = totalAmount; 

        if (typeof amountPaid !== "number" || amountPaid <= 0) {
            return NextResponse.json({
                success: false,
                message: "Invalid amount provided.",
            }, { status: 400 });
        }

        if (amountPaid > expectedAmount) {
            return NextResponse.json({
                success: false,
                message: `Overpayment detected. Expected: $${expectedAmount}, but received: $${amountPaid}.`,
            }, { status: 400 });
        }

        if (amountPaid < expectedAmount) {
            return NextResponse.json({
                success: false,
                message: `Insufficient amount. Expected: $${expectedAmount}, but received: $${amountPaid}.`,
            }, { status: 400 });
        }


        if(user.walletBalance < expectedAmount) {
            return NextResponse.json({
                success: false,
                message: "Insufficient wallet balance, please add amount to your wallet first",
            }, {status: 400})
        }

        user.walletBalance -= expectedAmount;

        await user.save();

        contribution.amountPaid = expectedAmount;
        contribution.isLate = isLate;
        contribution.penaltyApplied = penaltyApplied;
        contribution.status = "paid";
        contribution.paidOn = today;
        
        await contribution.save();

        await GroupCampaignModel.updateOne(
            { _id: campaign._id },
            { $inc: { totalSaved: expectedAmount } }
        );


        if(status === "scheduled" && today >= startOfDay(startDate) && today <= endOfDay(endDate)) {
            campaign.status = "ongoing";
        }
        await campaign.save();

        return NextResponse.json({
            success: true,
            message: "Contribution successful",
            contribution
        }, {status: 200})

    } catch (error) {
        console.error("Contribution failed", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error",
        }, {status: 500});
    }
}