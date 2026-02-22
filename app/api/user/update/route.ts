import dbConnect from "@/src/features/auth/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import UserModel from "@/src/features/auth/models/user.model";
import { NextResponse } from "next/server";
import { processIncomeDeposit } from "@/src/features/tax/services/taxTrapAgent.service";

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

        // Handle name update independently
        if(name) {
            user.name = name;
            await user.save();
        }

        // Handle wallet top-up through Tax Trap Agent
        if(walletTopUpAmount > 0) {
            const result = await processIncomeDeposit(
                (user._id as any).toString(),
                walletTopUpAmount
            );

            if (!result.success) {
                return NextResponse.json({
                    success: false,
                    message: result.error || "Failed to process income"
                }, { status: 400 });
            }

            // Refresh user data to get updated balances
            const updatedUser = await UserModel.findById(user._id as any);
            
            return NextResponse.json({
                success: true,
                message: "User updated successfully",
                user: {
                    name: updatedUser?.name,
                    email: updatedUser?.email,
                    walletBalance: updatedUser?.walletBalance,
                    taxVault: updatedUser?.taxVault,
                },
            });
        }
        
        // If only name was updated
        return NextResponse.json({
            success: true,
            message: "User updated successfully",
            user: {
                name: user.name,
                email: user.email,
                walletBalance: user.walletBalance,
                taxVault: user.taxVault,
            },
        });

    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to update user"
        }, { status: 500 })
    }
}