import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import IndividualSavingModel from "@/src/features/savings/individual/models/individualSaving.model";
import { individualSavingsSchema } from "@/src/features/savings/individual/schema/individualSavingsSchema";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    await dbConnect();

    try {
        const session = await getServerSession(authOptions);

    if(!session || !session.user?.email) {
        return NextResponse.json({
            success: false,
            message: 'Unauthorized'
        }, {status: 401});
    }

    const user = await UserModel.findOne({ email: session.user.email });
    if(!user) {
        return NextResponse.json({ 
            success: false, 
            message: "User not found" 
        }, { status: 404 });
    }

    const body = await request.json();
    const parsed = individualSavingsSchema.safeParse(body);
    if(!parsed.success) {
        return NextResponse.json({ 
            success: false, 
            message: parsed.error.errors[0].message 
        }, { status: 400 });
    }

    const {campaignName, amountPerMonth, duration} = parsed.data;

    const activeCampaign = await IndividualSavingModel.findOne({
        userId: user._id,
        isActive: true
    });

    if(activeCampaign) {
        return NextResponse.json({
            success: false,
            message: "You already have an active savings campaign"
        }, { status: 400 });
    }

    if(user.walletBalance < amountPerMonth) {
        return NextResponse.json({ 
            success: false, 
            message: "Insufficient wallet balance" 
        }, { status: 400 });
    }

    user.walletBalance -= amountPerMonth;
    await user.save();

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);

    await IndividualSavingModel.create({
        userId: user._id,
        campaignName,
        amountPerMonth,
        duration,
        totalAmount: amountPerMonth * duration,
        amountSaved: amountPerMonth,
        startDate,
        endDate,
        isActive: true
    });

    return NextResponse.json({ 
        success: true, 
        message: "Savings campaign started successfully" 
    }, { status: 201 });

    } catch (error) {
        console.error("Error creating campaign:", error);
        return NextResponse.json({ 
            success: false, 
            message: "Internal Server Error" 
        }, { status: 500 });
    }
}