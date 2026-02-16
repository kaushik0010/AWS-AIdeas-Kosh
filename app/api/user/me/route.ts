import dbConnect from "@/src/features/auth/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import UserModel from "@/src/features/auth/models/user.model";
import { NextResponse } from "next/server";

export async function GET(request: Request) {

    try {
        await dbConnect();

        const session = await getServerSession(authOptions);

        if(!session || !session.user?.email) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, {status: 401});
        }

        const user = await UserModel.findOne({ 
            email: session?.user.email }
        ).select("email name walletBalance");

        if(!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, {status: 404});
        }

        return NextResponse.json(user);
    } catch (error:any) {
        console.error(error);
        return NextResponse.json({
            success: false,
            message: 'Internal server error'
        }, {status: 500});
    }
}