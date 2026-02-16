import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import FlexibleSavingModel from "@/src/features/savings/individual/models/flexibleSaving.model";
import IndividualSavingModel from "@/src/features/savings/individual/models/individualSaving.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);

        if(!session?.user?.email) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, {status: 401});
        }

        const userId = session.user._id;

        const regularHistoryPromise = IndividualSavingModel.find({
            userId: userId,
            isActive: false,
        }).select('campaignName amountSaved endDate').lean(); 

        const flexibleHistoryPromise = FlexibleSavingModel.find({
            userId: userId,
            isActive: false,
        }).select('campaignName amountSaved endDate').lean(); 

        const [regularHistory, flexibleHistory] = await Promise.all([
            regularHistoryPromise,
            flexibleHistoryPromise
        ]);

        const combinedHistory = [
            ...regularHistory.map(plan => ({
                ...plan,
                planType: 'regular' 
            })),
            ...flexibleHistory.map(plan => ({
                ...plan,
                planType: 'flexible' 
            }))
        ];

        combinedHistory.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
        
        if(combinedHistory.length === 0) {
            return NextResponse.json({
                success: true, 
                message: 'No history to show yet',
                campaign: []
            }, {status: 200});
        }
        
        return NextResponse.json({ 
            success: true,
            message: "Savings history fetched successfully",
            campaign: combinedHistory 
        }, {status: 200});

    } catch (error) {
        return NextResponse.json({ 
            success: false,
            message: "Internal server error" 
        }, {status: 500});
    }
}