import { sendVerificationEmail } from "@/src/features/auth/helpers/sendVerificationEmail";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    await dbConnect()

    try {
        const {name, email, password} = await request.json()
        const existingUserVerifiedByEmail = await UserModel.findOne({
            email,
            isEmailVerified: true
        })

        if(existingUserVerifiedByEmail) {
            return Response.json({
                success: false,
                message: "User already exists with this email",
            }, { status: 400})
        }

        const existingUserByEmail = await UserModel.findOne({email})

        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString()

        if(existingUserByEmail) {
            if(existingUserByEmail.isEmailVerified) {
                return Response.json({
                    success: false,
                    message: "User already exists with this email",
                }, { status: 400})
            } else {
                const hashedPassword = await bcrypt.hash(password, 10)
                existingUserByEmail.password = hashedPassword;
                existingUserByEmail.verificationToken = verificationToken;
                existingUserByEmail.verificationTokenExpiry = new Date(Date.now() + 3600000)
                await existingUserByEmail.save();
            }

        } else {
            const hashedPassword = await bcrypt.hash(password, 10)
            const tokenExpiryDate = new Date();
            tokenExpiryDate.setHours(tokenExpiryDate.getHours() + 1);
            const newUser = new UserModel({
                name,
                email,
                password: hashedPassword,
                verificationToken,
                verificationTokenExpiry: tokenExpiryDate,
                isEmailVerified: false,
                walletBalance: 0,
            })
            await newUser.save();
        }

        // send verification email
        const emailReponse = await sendVerificationEmail(
            email,
            name,
            verificationToken
        )

        if(!emailReponse.success) {
            return Response.json({
                success: false,
                message: emailReponse.message
            }, {status: 500})
        }

        return Response.json({
                success: true,
                message: "User registered successfully. Please verify your email"
            }, {status: 201})

    } catch (error) {
        console.error('Error registering user', error);
        return Response.json({
            success: false,
            message: 'Error registering user'
        },
        {
            status: 500
        }
    )
    }
}