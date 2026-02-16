import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import FlexibleSavingModel from "@/src/features/savings/individual/models/flexibleSaving.model";
import { isValidObjectId } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, {params}: {params: {savingId: string}}) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session || !session?.user.email) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized"
            }, {status: 401})
        }

        const {savingId} = await params;
        const userId = session?.user._id;

        if(!isValidObjectId(savingId)) {
            return NextResponse.json({
                success: false,
                message: "Invalid saving plan ID"
            }, {status: 400});
        }

        // ✅ 1. Find the flexible saving plan
        const saving = await FlexibleSavingModel.findById(savingId);
        if(!saving) {
            return NextResponse.json({
                success: false,
                message: "Flexible saving plan not found"
            }, {status: 404})
        }

        if(!saving.userId.equals(userId)) {
            return NextResponse.json({
                success: false,
                message: "You are not authorized to contribute to this plan"
            }, {status: 403})
        }

        if(!saving.isActive) {
            return NextResponse.json({
                success: false,
                message: "This savings plan has already ended"
            }, {status: 400})
        }

        // ✅ 2. NEW: Frequency-based contribution check
        const now = new Date();
        const lastContributionDate = new Date(saving.updatedAt); // 'updatedAt' tracks the last contribution
        const frequency = saving.frequency;

        // Normalize dates to the start of the day to prevent time-of-day issues
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastContributionStart = new Date(lastContributionDate.getFullYear(), lastContributionDate.getMonth(), lastContributionDate.getDate());

        let nextEligibleDate = new Date(lastContributionStart.getTime());

        // Calculate the next eligible contribution date based on frequency
        if (frequency === "daily") {
            nextEligibleDate.setDate(lastContributionStart.getDate() + 1);
        } else if (frequency === "weekly") {
            nextEligibleDate.setDate(lastContributionStart.getDate() + 7);
        } else if (frequency === "bi-weekly") {
            nextEligibleDate.setDate(lastContributionStart.getDate() + 14);
        }

        // Check if today is before the next eligible date
        if (todayStart.getTime() < nextEligibleDate.getTime()) {
            return NextResponse.json({
                success: false,
                message: `You can make your next ${frequency} contribution on ${nextEligibleDate.toDateString()}`
            }, {status: 400});
        }

        // ✅ 3. Check against 'amountPerContribution'
        const user = await UserModel.findById(userId);
        if(!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, {status: 404})
        }

        const body = await request.json()
        const { amountPaid } = body;

        if(user.walletBalance < saving.amountPerContribution) {
            return NextResponse.json({
                success: false,
                message: "Insufficient wallet balance, please update your wallet balance"
            }, {status: 400})
        }

        // ✅ 4. Validate the 'amountPaid' against 'amountPerContribution'
        if(typeof amountPaid !== "number" || amountPaid <= 0 || amountPaid !== saving.amountPerContribution) {
            return NextResponse.json({
                success: false,
                message: `Invalid amount, Expected: $${saving.amountPerContribution}, Received $${amountPaid}`
            }, {status: 400});
        }

        // ✅ 5. Perform the transaction
        user.walletBalance -= saving.amountPerContribution;
        saving.amountSaved += saving.amountPerContribution;

        // Check if this contribution completes the plan
        if (saving.amountSaved >= saving.totalAmount) {
            saving.isActive = false;
        }

        // Save both documents
        await user.save();
        await saving.save(); // This automatically updates the 'updatedAt' timestamp for our next check

        return NextResponse.json({
            success: true, // ✅ Fixed this from 'false' in your template
            message: "Contribution successful"
        }, {status: 200})

    } catch (error) {
        console.error(error);
        return NextResponse.json({ 
            success: false,
            message: "Something went wrong" 
        }, { status: 500 });
    }
}