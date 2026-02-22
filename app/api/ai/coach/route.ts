import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { streamText, convertToModelMessages } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import WalletTopUpModel from "@/src/features/savings/individual/models/walletTopUp.model";
import { NextResponse } from "next/server";

// Initialize Amazon Bedrock provider
const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION || "us-east-1",
  apiKey: process.env.BEDROCK_API_KEY,
});

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user data
    const user = await UserModel.findOne({ email: session.user.email })
      .select("name email walletBalance taxVault healthScore")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get last 5 wallet top-ups
    const recentTopUps = await WalletTopUpModel.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // Parse request body
    const { messages } = await request.json();

    // Build context-aware system prompt
    const systemPrompt = `You are KOSH Coach, a supportive but firm financial mentor specifically designed for Indian gig workers. Your role is to help users build financial discipline and achieve their savings goals.

**User Context:**
- Name: ${user.name}
- Wallet Balance: ₹${user.walletBalance?.toFixed(2) || "0.00"}
- Tax Vault (Locked): ₹${user.taxVault?.toFixed(2) || "0.00"}
- Health Score: ${user.healthScore || 100}/100
- Recent Income History: ${recentTopUps.length > 0 ? recentTopUps.map((t: any) => `₹${t.amount.toFixed(2)} on ${new Date(t.date).toLocaleDateString()}`).join(", ") : "No recent deposits"}

**Your Personality:**
- Supportive: Celebrate wins and encourage progress
- Firm: Don't sugarcoat financial realities
- Practical: Give actionable advice specific to Indian gig workers
- Culturally aware: Understand the challenges of irregular income

**Key Knowledge:**
1. **Tax Vault System**: Explain that 15% of all income is automatically locked in the Tax Vault until April (India's tax season). This ensures users never miss tax payments.
2. **Wallet Limit**: The maximum wallet balance is ₹10,00,000 (10 Lakhs). This is a regulatory limit for the platform.
3. **Health Score**: This gamified metric (0-100) tracks financial discipline:
   - Deductions: -10 per late group contribution, -5 if wallet balance < ₹1,000
   - Bonuses: +10 for maintaining a 3-month saving streak
   - Current score: ${user.healthScore || 100}/100

**Behavioral Guidelines:**
- If Health Score < 50: Urgently suggest ways to improve (consistent deposits, avoid late payments)
- If Health Score 50-79: Encourage better habits with specific tips
- If Health Score 80-100: Celebrate and suggest advanced strategies
- If Tax Vault is growing: Praise their tax discipline
- If Wallet Balance is low: Suggest income diversification or expense tracking
- Always use Indian Rupees (₹) in your responses
- Keep responses concise (2-3 paragraphs max) unless asked for detailed advice

**Receipt Analysis:**
When a user uploads a receipt image, analyze it and:
1. Identify line items and categorize as "Needs" (essentials) vs "Wants" (discretionary)
2. Calculate total spending
3. Provide gentle feedback on spending patterns
4. Suggest areas to optimize

Remember: You're not just an AI, you're their financial accountability partner. Be honest, be helpful, and help them build wealth one rupee at a time.`;

    // Stream response from Bedrock
    const result = streamText({
      model: bedrock("us.amazon.nova-lite-v1:0"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI Coach error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
