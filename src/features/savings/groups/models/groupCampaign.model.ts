import mongoose, { Schema, model, models, Document, Types } from "mongoose";

interface DistributionDetails {
    distributedAt: Date;
    payoutPerUser: Record<string, number>;
    penaltyRedistributed: Record<string, number>;
}

export interface GroupCampaign extends Document {
    groupId: Types.ObjectId;
    campaignName: string;
    startDate: Date;
    endDate: Date;
    savingsDay: number;
    durationInMonths: number;
    amountPerMonth: number;
    penaltyAmount: number;
    createdBy: Types.ObjectId;
    status: "scheduled" | "ongoing" | "completed" | "cancelled";
    participants: Types.ObjectId[];
    totalSaved: number;
    isDistributed: boolean;
    distributionDetails?: DistributionDetails;
    createdAt: Date;
    updatedAt: Date;
}

const distributionDetailsSchema = new Schema<DistributionDetails>(
    {
        distributedAt: { type: Date, required: true },
        payoutPerUser: {
            type: Map,
            of: Number, // actual payout each user received (base + bonus - penalty)
            required: true,
        },
        penaltyRedistributed: {
            type: Map,
            of: Number, // bonus per user from penalty pool
            required: true,
        }
    },
    { _id: false }
);

const groupCampaignSchema: Schema<GroupCampaign> = new Schema({
    groupId: { 
        type: Schema.Types.ObjectId, 
        ref: "Group", 
        required: true, 
    },
    campaignName: { 
        type: String, 
        required: true 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    savingsDay: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 31 
    },
    durationInMonths: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    amountPerMonth: { 
        type: Number, 
        required: true 
    },
    penaltyAmount: { 
        type: Number, 
        required: true 
    },
    createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    participants: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    ],
    totalSaved: {
        type: Number,
        default: 0
    },
    isDistributed: {
        type: Boolean,
        default: false,
    },
    distributionDetails: {
        type: distributionDetailsSchema,
        default: undefined
    }
}, {timestamps: true});

groupCampaignSchema.index({ groupId: 1, status: 1, startDate: -1 });

const GroupCampaignModel = 
    (models.GroupCampaign as mongoose.Model<GroupCampaign>) ||
    model<GroupCampaign>("GroupCampaign", groupCampaignSchema);

export default GroupCampaignModel;