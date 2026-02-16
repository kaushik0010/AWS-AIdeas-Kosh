import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";


export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "johndoe@abc.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: any): Promise<any> {
                await dbConnect()
                try {
                    const user = await UserModel.findOne({
                        email: credentials.identifier
                    })

                    if(!user) {
                        throw new Error("No user found with this email")
                    }

                    if(!user.isEmailVerified) {
                        throw new Error("Please verify your account")
                    }
                    
                    const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password)
                    if(isPasswordCorrect) {
                        return user
                    } else {
                        throw new Error("Incorrect Password")
                    }

                } catch (error: any) {
                    throw new Error(error);
                }
            }
        })
    ],
    callbacks: {
         async session({ session, token }) {
            if(token) {
                session.user._id = token._id
                session.user.isEmailVerified = token.isEmailVerified
                session.user.name = token.name
            }
            return session
        },
        async jwt({ token, user}) {
            if(user) {
                token._id = user._id?.toString()
                token.isEmailVerified = user.isEmailVerified
                token.name = user.name 
            }
            return token
        }
    },
    pages: {
        signIn: '/login'
    },
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 7,
    },
    jwt: {
        maxAge: 60 * 60 * 24 * 7,
    },
    secret: process.env.NEXTAUTH_SECRET
}