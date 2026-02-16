import mongoose, { Schema, model, models, Document, Types } from "mongoose";

export interface Contribution extends Document {
    userId: Types.ObjectId;
    campaignId: Types.ObjectId;
    groupId: Types.ObjectId;
    month: number;
    year: number;
    scheduledDate: Date;
    amountPaid: number;
    isLate: boolean;
    penaltyApplied: number;
    paidOn: Date;
    status: "pending" | "paid" | "failed";
}

const contributionSchema: Schema<Contribution> = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    campaignId: { 
        type: Schema.Types.ObjectId, 
        ref: "GroupCampaign", 
        required: true 
    },
    groupId: { 
        type: Schema.Types.ObjectId, 
        ref: "Group",
        required: true
    },
    month: { 
        type: Number, 
        required: true 
    },
    year: { 
        type: Number, 
        required: true 
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    amountPaid: { 
        type: Number, 
        required: true 
    },
    isLate: { 
        type: Boolean, 
        default: false 
    },
    penaltyApplied: { 
        type: Number, 
        default: 0 
    },
    paidOn: { 
        type: Date, 
        required: true 
    },
    status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "paid"
    }
}, {timestamps: true});

contributionSchema.index({ userId: 1, campaignId: 1, month: 1, year: 1 }, { unique: true });
contributionSchema.index({ campaignId: 1 });

const ContributionModel = 
    (models.Contribution as mongoose.Model<Contribution>) ||
    model<Contribution>("Contribution", contributionSchema);

export default ContributionModel;
