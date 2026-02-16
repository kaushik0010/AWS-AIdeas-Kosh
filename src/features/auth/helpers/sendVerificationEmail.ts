import VerificationEmail from "../emails/VerificationEmail";
import { resend } from "../lib/resend";
import { ApiResponse } from "../types/apiResponse"

export async function sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string
): Promise<ApiResponse> {
    try {
        await resend.emails.send({
            from: 'KOSH <noreply@kaushik010.xyz>',
            to: email,
            subject: 'KOSH | Verification code',
            react: VerificationEmail({name, otp:verificationToken}),
        });
        return {
            success: true,
            message: "Verification email sent successfully"
        }

    } catch (emailError) {
        console.error("Error sending verification email", emailError)
        return {
            success: false,
            message: "Failed to send verification email"
        }
    }
}
