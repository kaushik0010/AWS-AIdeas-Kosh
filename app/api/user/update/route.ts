import dbConnect from "@/src/features/auth/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import UserModel from "@/src/features/auth/models/user.model";
import { NextResponse } from "next/server";
import WalletTopUpModel from "@/src/features/savings/individual/models/walletTopUp.model";

export async function PATCH(request: Request) {
    await dbConnect();

    try {
        const session = await getServerSession(authOptions);

        if(!session || !session.user?.email) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, {status: 401});
        }

        const {name, walletTopUp} = await request.json();
        let walletTopUpAmount = Number(walletTopUp || 0);
    
        const user = await UserModel.findOne({ email: session?.user.email });

        if(!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, {status: 404});
        }

        if(name) user.name = name;

        if(walletTopUpAmount) {
            if(walletTopUp && walletTopUp>0) {
                const newBalance = user.walletBalance + walletTopUpAmount;

                if(newBalance > 10000) {
                    return NextResponse.json({
                        success: false,
                        message: "Wallet limit exceeded ($10,000)"
                    }, { status: 400 })
                }

                user.walletBalance = newBalance;

                await WalletTopUpModel.create({
                    userId: user._id,
                    amount: walletTopUpAmount,
                    status: "success",
                    date: new Date(),
                });
            }
        }
        
        await user.save();

        return NextResponse.json({
            success: true,
            messasge: "User updated successfully",
            user: {
                name: user.name,
                email: user.email,
                walletBalance: user.walletBalance,
            },
        })

    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to update user"
        }, { status: 500 })
    }
}