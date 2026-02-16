import dbConnect from "@/src/features/auth/lib/dbConnect";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    await dbConnect();

    try {

        const listAllGroups = await GroupModel.find({})
            .populate("admin", "name email")
            .sort({ createdAt: -1 })
    

        if(listAllGroups.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Groups not found'
            }, {status: 404});
        }

        return NextResponse.json({
            success: true,
            message: "Groups fetched successfully",
            groups: listAllGroups,
        });

    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: "Internal Server Error" 
        }, { status: 500 });
    }
}