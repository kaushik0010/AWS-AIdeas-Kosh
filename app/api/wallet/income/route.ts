import dbConnect from "@/src/features/auth/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import UserModel from "@/src/features/auth/models/user.model";
import { NextResponse } from "next/server";
import { z } from "zod";
import { processIncomeDeposit } from "@/src/features/tax/services/taxTrapAgent.service";

// Zod schema for income deposit validation
const incomeDepositSchema = z.object({
    amount: z.number()
        .positive("Amount must be positive")
        .max(100000, "Amount exceeds maximum limit")
});

export async function POST(request: Request) {
    await dbConnect();

    try {
        // 1. Authenticate user
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Parse and validate request
        const body = await request.json();
        const validation = incomeDepositSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid input",
                    errors: validation.error.errors
                },
                { status: 400 }
            );
        }

        // 3. Get user
        const user = await UserModel.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // 4. Process income through Tax Trap Agent
        const result = await processIncomeDeposit(
            (user._id as any).toString(),
            validation.data.amount
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.error },
                { status: 400 }
            );
        }

        // 5. Return success response
        return NextResponse.json({
            success: true,
            message: "Income processed successfully",
            data: {
                walletBalance: result.walletBalance,
                taxVault: result.taxVault,
                transaction: {
                    totalAmount: result.transaction?.totalAmount,
                    taxAmount: result.transaction?.taxAmount,
                    netAmount: result.transaction?.netAmount,
                    date: result.transaction?.date
                }
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Income processing error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
