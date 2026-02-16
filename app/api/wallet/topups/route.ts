import dbConnect from "@/src/features/auth/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import WalletTopUpModel from "@/src/features/savings/individual/models/walletTopUp.model";
import UserModel from "@/src/features/auth/models/user.model";

export async function GET(req: NextRequest) {
    await dbConnect();

    try {

        const session = await getServerSession(authOptions);

        if(!session?.user?.email) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, {status: 401});
        }

        const user = await UserModel.findOne({ email: session.user.email })

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const {searchParams} = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "1", 10);
        const skip = (page - 1) * limit;

        const userTopups = await WalletTopUpModel.find({ userId: user._id })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalCount = await WalletTopUpModel.countDocuments({ userId: user._id });
        const totalPages = Math.ceil(totalCount / limit);

        if(!userTopups) {
            return NextResponse.json({ 
                success: false,
                message: "To see topup history please update your wallet balance first",
                topups: [],
                totalPages: 0,
                currentPage: 1
            }, {status: 200});
        }

        return NextResponse.json({ 
            success: true,
            message: "Wallet topup history fetched successfully",
            topups: userTopups,
            totalPages,
            currentPage: page
        }, {status: 200});
        
    } catch (error) {
        console.error("Error fetching top-up history", error);
        return NextResponse.json({ 
            success: false, 
            message: "Internal Server Error" 
        }, { status: 500 }
        );
    }
    
}