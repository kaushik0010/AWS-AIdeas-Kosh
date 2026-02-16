import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/src/features/auth/lib/dbConnect";
import UserModel from "@/src/features/auth/models/user.model";
import GroupModel from "@/src/features/savings/groups/models/group.model";
import GroupMembershipModel from "@/src/features/savings/groups/models/groupMembership.model";
import FlexibleSavingModel from "@/src/features/savings/individual/models/flexibleSaving.model";
import IndividualSavingModel from "@/src/features/savings/individual/models/individualSaving.model";
import WalletTopUpModel from "@/src/features/savings/individual/models/walletTopUp.model";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";

export async function getDashboardData() {
  noStore();
  try {
    await dbConnect();
    GroupModel;
    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    if (!userId) {
      throw new Error("User not authenticated.");
    }

    const [user, activeRegularCampaign, activeFlexibleCampaign, savingsHistory, joinedGroups, walletData] = await Promise.all([
      UserModel.findById(userId).select('name email walletBalance').lean(),
      IndividualSavingModel.findOne({ userId, isActive: true }).lean(),
      FlexibleSavingModel.findOne({ userId, isActive: true }).lean(),
      IndividualSavingModel.find({ userId, isActive: false }).sort({ endDate: -1 }).lean(),
      GroupMembershipModel.find({ userId, status: 'active' }).populate({
        path: 'groupId',
        select: 'groupName'
      }).lean(),
      WalletTopUpModel.find({ userId }).sort({ date: -1 }).limit(5).lean(),
    ]);

    // pagination for wallet history
    const totalTopUps = await WalletTopUpModel.countDocuments({ userId });

    return {
      user,
      activeRegularCampaign,
      activeFlexibleCampaign,
      savingsHistory,
      joinedGroups,
      walletHistory: {
        topups: walletData,
        totalPages: Math.ceil(totalTopUps / 5),
      },
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return {
      user: null,
      activeRegularCampaign: null,
      activeFlexibleCampaign: null,
      savingsHistory: [],
      joinedGroups: [],
      walletHistory: { topups: [], totalPages: 1 },
    };
  }
}