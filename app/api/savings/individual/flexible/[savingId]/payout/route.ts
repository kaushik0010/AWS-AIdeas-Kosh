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

        // ✅ 2. Check ownership
        if(!saving.userId.equals(userId)) {
            return NextResponse.json({
                success: false,
                message: "Not authorized for this plan"
            }, {status: 403})
        }

        const user = await UserModel.findById(userId)
        if(!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, {status: 404})
        }

        // ✅ 3. Check if the plan is ready for payout
        const today = new Date();

        // This logic correctly checks for two failure conditions:
        // 1. !saving.isActive: The payout has *already* happened.
        // 2. saving.endDate > today: The campaign has *not finished* yet.
        if(!saving.isActive || saving.endDate > today) {
            return NextResponse.json({
                success: false,
                message: "Campaign is not yet completed or has already been paid out"
            }, {status: 400})
        }

        // ✅ 4. Perform the transaction
        user.walletBalance += saving.amountSaved;
        saving.isActive = false; // Mark the plan as completed

        // Save both documents
        await user.save();
        await saving.save();

        return NextResponse.json({
            success: true,
            message: "Payout successful"
        }, {status: 200})

    } catch (error) {
        console.error(error);
        return NextResponse.json({ 
            success: false,
            message: "Something went wrong" 
        }, { status: 500 });
    }
}