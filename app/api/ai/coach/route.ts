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

    // Note: Images are sent via experimental_attachments in the message format
    // The Vercel AI SDK automatically converts base64 data URLs to the proper format
    // for Bedrock's vision API. Images should be sent as:
    // { url: 'data:image/jpeg;base64,...', contentType: 'image/png', name: 'receipt.png' }
    // The SDK handles the conversion to Bedrock's expected format internally.

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

STRICT VISION RESET (CRITICAL):
- If the user asks a question without uploading a NEW image, DO NOT mention receipts, merchants, or items from previous turns.
- Treat every turn as a fresh visual state. Do not reference past images.
- If no image is attached to the current message, skip the "RECEIPT ANALYSIS" section entirely.
- Only output the "Receipt from..." block if a valid image was processed in the CURRENT message.

RECEIPT VISION PROTOCOL (ONLY IF IMAGE IS PRESENT):
1. If an image is present, your ONLY source of truth is the PIXELS of that image.
2. Look for specific text patterns like "Total", "₹", merchant names, or dates to anchor your reading.
3. If you can identify at least the Merchant Name OR the Total Amount, proceed with the analysis.
4. Only use the "I can see the image but the text is too blurry to read" fallback if you cannot identify ANY financial data at all.
5. DO NOT use generic items like "Rice", "Milk", or "Zomato" unless those EXACT words appear in the image.
6. Do not invent or hallucinate receipt data. Only report what you can actually see.
7. If an item name is partially cut off but the price is clear, list it with your best estimate based on the visible pixels.

CATEGORIZATION (ONLY FOR RECEIPTS):
- NEEDS: Basic groceries, medicine, utilities, transport.
- WANTS: Prepared meals, snacks, entertainment, luxury.

TRUTHFUL HEALTH SCORE LOGIC:
- The Health Score ONLY changes based on:
  * -10 for late group payments
  * -5 if wallet balance < ₹1,000
  * +10 for a 3-month saving streak
- NEVER tell the user that buying medicine or groceries increases their score. That is FALSE.
- NEVER tell the user that spending on "needs" improves their score. That is FALSE.
- Only consistent saving and timely payments improve the score.

HEALTH SCORE EXPLANATION:
- If the user asks about their score, look ONLY at the injected "USER DATA" (Health Score: ${user.healthScore}/100).
- Explain the score based on their saving history and payment behavior, NOT their spending categories.
- Example: "Your score is ${user.healthScore}/100. This reflects your saving consistency and payment timeliness."

RESPONSE STRUCTURE (ONLY IF IMAGE IS PRESENT):
Receipt from [Name]
Date: [Date]
Total: ₹[Amount]

Items:
- [Item Name]: ₹[Price] ([Need/Want])

Analysis:
[1-2 sentences of feedback. Do NOT claim that spending on needs improves their Health Score.]

RESPONSE STRUCTURE (IF NO IMAGE):
[Answer the user's question directly. Do not mention receipts or past images. Focus on their wallet balance, tax vault, or general financial advice.]`;

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
