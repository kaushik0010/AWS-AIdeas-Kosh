import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import FlexibleSavingModel from "@/src/features/savings/individual/models/flexibleSaving.model";
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

        const campaign = await FlexibleSavingModel.findOne({
            userId: session?.user._id,
            isActive: true,
        })
        
        if(!campaign) {
            return NextResponse.json({
                success: false,
                message: 'You dont have any active plans'
            }, {status: 200});
        }
        
        return NextResponse.json({ 
            success: true,
            message: "Active plan fetched successfully",
            campaign 
        }, {status: 200});

    } catch (error) {
        return NextResponse.json({ 
            success: false,
            message: "Internal server error" 
        }, {status: 500});
    }
}