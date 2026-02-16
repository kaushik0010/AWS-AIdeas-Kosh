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

        const user = await UserModel.findById(userId)
        if(!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, {status: 404})
        }

        const today = new Date();

        if(!saving.isActive || saving.endDate > today) {
            return NextResponse.json({
                success: false,
                message: "Campaign not completed yet"
            }, {status: 400})
        }

        user.walletBalance += saving.amountSaved;
        await user.save();

        saving.isActive = false;
        await saving.save();

        return NextResponse.json({
            success: true,
            message: "Payout successful"
        }, {status: 200})

    } catch (error) {
        console.error(error);
        return NextResponse.json({ 
            error: "Something went wrong" 
        }, { status: 500 });
    }
}