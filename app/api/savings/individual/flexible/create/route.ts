import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import FlexibleSavingModel from "@/src/features/savings/individual/models/flexibleSaving.model";
import { flexibleSavingsSchema } from "@/src/features/savings/individual/schema/flexibleSavingsSchema";
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
        const parsed = flexibleSavingsSchema.safeParse(body);
        if(!parsed.success) {
            return NextResponse.json({ 
                success: false, 
                message: parsed.error.errors[0].message 
            }, { status: 400 });
        }

        const { campaignName, frequency, amountPerContribution, duration } = parsed.data;

        const activeCampaign = await FlexibleSavingModel.findOne({
            userId: user._id,
            isActive: true
        });

        if(activeCampaign) {
            return NextResponse.json({
                success: false,
                message: "You already have an active flexible savings campaign"
            }, { status: 400 });
        }

        if(user.walletBalance < amountPerContribution) {
            return NextResponse.json({ 
                success: false, 
                message: "Insufficient wallet balance for the first contribution" 
            }, { status: 400 });
        }

        user.walletBalance -= amountPerContribution;
        await user.save();

        const startDate = new Date();
        let endDate = new Date(startDate);
        let totalAmount: number;

        switch (frequency) {
            case "daily":
                endDate.setDate(endDate.getDate() + duration); 
                totalAmount = amountPerContribution * duration;
                break;
            case "weekly":
                endDate.setDate(endDate.getDate() + (duration * 7)); 
                totalAmount = amountPerContribution * duration;
                break;
            case "bi-weekly":
                endDate.setDate(endDate.getDate() + (duration * 14)); 
                totalAmount = amountPerContribution * duration;
                break;
        }

        const amountSaved = amountPerContribution;

        await FlexibleSavingModel.create({
            userId: user._id,
            campaignName,
            frequency,
            amountPerContribution,
            duration,
            totalAmount,
            amountSaved,
            startDate,
            endDate,
            isActive: true
        });

        return NextResponse.json({ 
            success: true, 
            message: "Flexible savings campaign started successfully" 
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating flexible campaign:", error);
        return NextResponse.json({ 
            success: false, 
            message: "Internal Server Error" 
        }, { status: 500 });
    }
}