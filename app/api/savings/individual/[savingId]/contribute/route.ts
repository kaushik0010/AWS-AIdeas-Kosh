import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import IndividualSavingModel from "@/src/features/savings/individual/models/individualSaving.model";
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
                message: "Invalid id"
            }, {status: 400});
        }

        const saving = await IndividualSavingModel.findById(savingId);
        if(!saving) {
            return NextResponse.json({
                success: false,
                message: "Individual saving plan not found"
            }, {status: 404})
        }

        if(!saving.userId.equals(userId)) {
            return NextResponse.json({
                success: false,
                message: "Not allowed"
            }, {status: 403})
        }

        if(!saving.isActive) {
            return NextResponse.json({
                success: false,
                message: "Savings plan already ended"
            }, {status: 400})
        }

        const now = new Date();
        const lastContributionMonth = new Date(saving.updatedAt).getMonth();
        const currentMonth = now.getMonth();

        const lastContributionYear = new Date(saving.updatedAt).getFullYear();
        const currentYear = now.getFullYear();

        const alreadyContributedThisMonth = currentMonth === lastContributionMonth && currentYear === lastContributionYear;

        if(alreadyContributedThisMonth) {
            return NextResponse.json({
                success: false,
                message: "Already saved this month"
            }, {status: 400})
        }

        const user = await UserModel.findById(userId);
        if(!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, {status: 404})
        }

        const body = await request.json()
        const { amountPaid } = body;

        if(user.walletBalance < saving.amountPerMonth) {
            return NextResponse.json({
                success: false,
                message: "Insufficient wallet balance, please update your wallet balance"
            }, {status: 400})
        }

        if(typeof amountPaid !== "number" || amountPaid <= 0 || amountPaid !== saving.amountPerMonth) {
            return NextResponse.json({
                success: false,
                message: `Invalid amount, Expected: $${saving.amountPerMonth}, Received $${amountPaid}`
            }, {status: 400});
        }

        user.walletBalance -= saving.amountPerMonth;
        await user.save();

        saving.amountSaved += saving.amountPerMonth;
        await saving.save();

        return NextResponse.json({
            success: false,
            message: "Contribution successful"
        }, {status: 200})

    } catch (error) {
        console.error(error);
        return NextResponse.json({ 
            error: "Something went wrong" 
        }, { status: 500 });
    }
}