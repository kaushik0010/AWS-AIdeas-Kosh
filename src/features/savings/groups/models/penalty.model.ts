import mongoose, { Schema, model, models, Document, Types } from "mongoose";

export interface Penalty extends Document {
    userId: Types.ObjectId;
    campaignId: Types.ObjectId;
    contributionId: Types.ObjectId;
    month: number;
    year: number;
    amount: number;
    reason: "late" | "missed" | "manual_adjustment";
    notes?: string;
}

const penaltySchema: Schema<Penalty> = new Schema({
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
    contributionId: { 
        type: Schema.Types.ObjectId, 
        ref: "Contribution", 
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
    amount: { 
        type: Number, 
        required: true 
    },
    reason: {
      type: String,
      enum: ["late", "missed", "manual_adjustment"],
      required: true,
    },
    notes: { type: String },
}, {timestamps: true});

penaltySchema.index({ userId: 1, campaignId: 1, month: 1, year: 1 });
penaltySchema.index({ campaignId: 1 });

const PenaltyModel = 
    (models.Penalty as mongoose.Model<Penalty>) ||
    model<Penalty>("Penalty", penaltySchema);

export default PenaltyModel;