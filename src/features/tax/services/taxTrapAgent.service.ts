import mongoose from "mongoose";
import UserModel from "../../auth/models/user.model";
import IncomeTransactionModel from "../../savings/individual/models/incomeTransaction.model";
import WalletTopUpModel from "../../savings/individual/models/walletTopUp.model";

// Type definitions
export interface TaxSplitResult {
    taxAmount: number;
    netAmount: number;
}

export interface IncomeProcessingResult {
    success: boolean;
    walletBalance: number;
    taxVault: number;
    transaction?: any;
    error?: string;
}

export interface TaxVaultAccessResult {
    allowed: boolean;
    message?: string;
}

/**
 * Calculate 15% tax split from income amount
 * @param amount - The total income amount
 * @returns Object containing taxAmount (15%) and netAmount (85%)
 */
export function calculateTaxSplit(amount: number): TaxSplitResult {
    const taxAmount = amount * 0.15;
    const netAmount = amount * 0.85;
    return { taxAmount, netAmount };
}

/**
 * Process income deposit with automatic tax withholding
 * Uses MongoDB transactions to ensure atomicity
 * @param userId - The user's ID
 * @param amount - The income amount to process
 * @returns Processing result with updated balances or error
 */
export async function processIncomeDeposit(
    userId: string,
    amount: number
): Promise<IncomeProcessingResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Validate amount
        if (amount <= 0) {
            throw new Error("Amount must be positive");
        }

        // Calculate tax split
        const { taxAmount, netAmount } = calculateTaxSplit(amount);

        // Find user
        const user = await UserModel.findById(userId).session(session);
        if (!user) {
            throw new Error("User not found");
        }

        // Check wallet limit (10 Lakhs INR)
        const newWalletBalance = user.walletBalance + netAmount;
        if (newWalletBalance > 1000000) {
            throw new Error("Wallet limit exceeded (₹10,00,000)");
        }

        // Update balances
        user.walletBalance = newWalletBalance;
        user.taxVault += taxAmount;
        await user.save({ session });

        // Create transaction record
        const transaction = await IncomeTransactionModel.create([{
            userId: user._id,
            totalAmount: amount,
            taxAmount,
            netAmount,
            status: "success",
            date: new Date()
        }], { session });

        // Create wallet top-up record for history visibility
        await WalletTopUpModel.create([{
            userId: user._id,
            amount: netAmount, // Record the net amount (85%) that went to wallet
            status: "success",
            date: new Date()
        }], { session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        return {
            success: true,
            walletBalance: user.walletBalance,
            taxVault: user.taxVault,
            transaction: transaction[0]
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return {
            success: false,
            walletBalance: 0,
            taxVault: 0,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

/**
 * Check if tax vault access is allowed (only in April)
 * @returns Access result with allowed flag and optional message
 */
export function checkTaxVaultAccess(): TaxVaultAccessResult {
    const currentMonth = new Date().getMonth(); // 0-11
    const isApril = currentMonth === 3; // April = 3

    if (isApril) {
        return { allowed: true };
    }

    return {
        allowed: false,
        message: "🔒 ACCESS DENIED. The Tax Agent has locked these funds until Tax Season."
    };
}
