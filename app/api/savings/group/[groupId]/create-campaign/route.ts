import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import ContributionModel from "@/src/features/savings/groups/models/contribution.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupCampaignModel from "@/src/features/savings/groups/models/groupCampaign.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import mongoose, { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, {params}: {params: {groupId: string}}) {

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

        const {groupId} = await params;
        const userId = session?.user._id;

        if(!mongoose.Types.ObjectId.isValid(groupId)) {
            return NextResponse.json({
                success: false,
                message: "Invalid groupId",
            }, {status: 400})
        }

        const group = await GroupModel.findById(groupId)
        if(!group) {
            return NextResponse.json({
                success: false,
                message: "Group not found"
            }, {status: 404});
        }

        if(group.admin.toString() !== userId) {
            return NextResponse.json({
                success: false,
                message: "Only admin can create a campaign",
            }, {status: 403});
        }

        const {
            campaignName,
            startDate,
            savingsDay,
            durationInMonths,
            amountPerMonth,
            penaltyAmount
        } = await request.json()

        if(
            !campaignName ||
            !startDate ||
            !savingsDay ||
            !durationInMonths ||
            !amountPerMonth ||
            !penaltyAmount
        ) {
            return NextResponse.json({
                success: false,
                message: "All fields are required"
            }, {status: 400})
        }

        if(
            typeof campaignName !== "string" ||
            typeof durationInMonths !== "number" ||
            typeof amountPerMonth !== "number" ||
            typeof penaltyAmount !== "number" ||
            typeof savingsDay !== "number"
        ) {
            return NextResponse.json({
                success: false,
                error: "Invalid field types"
            }, {status: 400});
        }

        const duplicateName = await GroupCampaignModel.findOne({ groupId, campaignName });
        if (duplicateName) {
            return NextResponse.json({
                success: false,
                error: "Campaign name already used in this group"
            }, { status: 400 });
        }

        const existingCampaign = await GroupCampaignModel.findOne({
            groupId,
            status: {$in: ["scheduled", "ongoing"]}
        });

        if(existingCampaign) {
            return NextResponse.json({ 
                success: false,
                error: "A campaign is already scheduled or ongoing for this group" 
            }, { status: 400 });
        }

        const today = new Date();
        const parsedStartDate = new Date(startDate);

        if(parsedStartDate <= today) {
            return NextResponse.json({
                success: false,
                error: "Start date cant be less than today's date"
            }, {status: 400});
        }

        if(savingsDay < 1 || savingsDay > 31) {
            return NextResponse.json({
                success: false,
                error: "Savings Date must be between 1 and 31"
            }, {status: 400});
        }

        // Helper to clamp invalid days (e.g., 31st in Sept → 30th)
        function getValidDayInMonth(year: number, month: number, desiredDay: number): number {
            const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
            return Math.min(desiredDay, lastDayOfMonth);
        }

        let scheduledDate = new Date(parsedStartDate);
        const startYear = scheduledDate.getFullYear();
        const startMonth = scheduledDate.getMonth();

        let day = getValidDayInMonth(startYear, startMonth, savingsDay);
        scheduledDate = new Date(startYear, startMonth, day);

        // If selected savings date is <= startDate (e.g. 30 Sep, savings day 30), push to next month
        if (scheduledDate <= parsedStartDate) {
            const nextMonthDate = new Date(startYear, startMonth + 1);
            const nextYear = nextMonthDate.getFullYear();
            const nextMonth = nextMonthDate.getMonth();
            day = getValidDayInMonth(nextYear, nextMonth, savingsDay);
            scheduledDate = new Date(nextYear, nextMonth, day);
        }

        // If scheduledDate is somehow still today or earlier, reject
        if (scheduledDate <= today) {
            return NextResponse.json({
                success: false,
                error: "First savings date must be after today"
            }, { status: 400 });
        }

        // 👉 Use the fallback day of the first valid contribution (e.g. 1st if 31st is invalid)
        const fallbackDay = scheduledDate.getDate();

        if(durationInMonths < 1) {
            return NextResponse.json({
                success: false,
                error: "Duration must be atleast 1 month"
            }, {status: 400});
        }

        const maxPenaltyAllowed = 0.4 * amountPerMonth;
        if(penaltyAmount > maxPenaltyAllowed) {
            return NextResponse.json({
                success: false,
                error: `Penalty amount cannot exceed 40% of monthly savings (Max: ₹${maxPenaltyAllowed})`,
            }, {status: 400});
        }

        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + durationInMonths);


        const newCampaign = await GroupCampaignModel.create({
            groupId,
            campaignName,
            startDate,
            endDate: end,
            savingsDay,
            durationInMonths,
            amountPerMonth,
            penaltyAmount,
            status: start > today ? "scheduled" : "ongoing",
            createdBy: userId,
            participants: [],
            totalSaved: 0,
            isDistributed: false,
            distributionDetails: undefined
        })

        const activeMembers = await GroupMembershipModel.find({
            groupId,
            status: "active"
        })

        const participantIds = activeMembers.map(member => member.userId);
        newCampaign.participants = participantIds;
        await newCampaign.save();

        const contributionEntries = [];
        for (const member of activeMembers) {
            for (let i = 0; i < durationInMonths; i++) {
                const baseDate = new Date(scheduledDate);
                baseDate.setMonth(baseDate.getMonth() + i);

                const year = baseDate.getFullYear();
                const month = baseDate.getMonth();

                const validDay = getValidDayInMonth(year, month, savingsDay);
                const contributionDate = new Date(year, month, validDay);

                contributionEntries.push({
                    userId: member.userId,
                    campaignId: newCampaign._id,
                    groupId: new mongoose.Types.ObjectId(groupId),
                    year,
                    month: month+1,
                    scheduledDate: contributionDate,
                    amountPaid: 0,
                    isLate: false,
                    penaltyApplied: 0,
                    paidOn: contributionDate,
                    status: "pending"
                });
            }
        }


        await ContributionModel.insertMany(contributionEntries);

        return NextResponse.json({
            success: true,
            message: "Campaign created successfully",
            campaign: newCampaign
        }, {status: 201})

    } catch (error) {
        console.error("Campaign creation failed", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error",
        }, {status: 500});
    }
}