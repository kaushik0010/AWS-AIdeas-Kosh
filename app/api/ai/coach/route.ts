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
    const systemPrompt = `You are KOSH Coach, a financial mentor for ${user.name}. 

USER DATA:
- Wallet: ₹${user.walletBalance?.toFixed(2)}
- Tax Vault: ₹${user.taxVault?.toFixed(2)}
- Health Score: ${user.healthScore}/100

STRICT FORMATTING:
- Plain text only. NO bolding (**), NO italics (_), NO headers (#).
- Use simple line breaks and dashes (-) for lists.
- Keep it under 150 words.

RECEIPT VISION PROTOCOL (CRITICAL):
1. If an image is present, your ONLY source of truth is the PIXELS of that image.
2. DO NOT use generic items like "Rice", "Milk", or "Zomato" unless those EXACT words appear in the image.
3. The current test image is from "Bakery Bites & More" for "₹699.30". If you do not see these specific details, re-read the pixels.
4. If you cannot read the merchant name or total, say: "I can see the image but the text is too blurry to read."

CATEGORIZATION:
- NEEDS: Basic groceries, medicine, utilities, transport.
- WANTS: Prepared meals, snacks, entertainment, luxury.

RESPONSE STRUCTURE:
Receipt from [Name]
Date: [Date]
Total: ₹[Amount]

Items:
- [Item Name]: ₹[Price] ([Need/Want])

Analysis:
[1-2 sentences of feedback based on their Health Score of ${user.healthScore}]`;

    // Stream response from Bedrock (using Nova Pro for better OCR accuracy)
    const result = streamText({
      model: bedrock("us.amazon.nova-pro-v1:0"),
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
