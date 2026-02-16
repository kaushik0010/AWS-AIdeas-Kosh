import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";

export async function POST(request: Request) {
    await dbConnect();
    
    try {
        const {email, code} = await request.json()

        const decodedEmail = decodeURIComponent(email)
        const user = await UserModel.findOne({email: decodedEmail})

        if(!user) {
            return Response.json({
            success: false,
            message: 'User not found'
            },
            {
                status: 500
            })
        }

        const isCodeValid = user.verificationToken === code
        const isCodeNotExpired = new Date(user.verificationTokenExpiry) > new Date();

        if(isCodeValid && isCodeNotExpired) {
            user.isEmailVerified = true
            await user.save();
            return Response.json({
            success: true,
            message: 'User Verified successfully'
            },
            {
                status: 200
            })
        } else if(!isCodeNotExpired) {
            return Response.json({
            success: false,
            message: 'Verification code has expired, '
            },
            {
                status: 400
            })
        } else {
            return Response.json({
            success: false,
            message: 'Invalid verification code'
            },
            {
                status: 400
            })
        }

    } catch (error) {
        console.error('Error verifying user', error);
        return Response.json({
            success: false,
            message: 'Error verifying user'
        },
        {
            status: 500
        })
    }
}