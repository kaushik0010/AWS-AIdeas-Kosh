import mongoose, { Schema, Document, models, model } from "mongoose";

export interface FlexibleSaving extends Document {
    userId: mongoose.Types.ObjectId;
    campaignName: string;
    frequency: "daily" | "weekly" | "bi-weekly"; 
    amountPerContribution: number; 
    duration: number; 
    totalAmount: number;
    amountSaved: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const flexibleSavingSchema: Schema<FlexibleSaving> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    campaignName: {
        type: String,
        required: [true, "Campaign Name is required"],
    },
    frequency: {
        type: String,
        enum: ["daily", "weekly", "bi-weekly"],
        required: true,
    },
    amountPerContribution: {
        type: Number,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    amountSaved: {
        type: Number,
        default: 0,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

flexibleSavingSchema.index({ userId: 1, isActive: 1 });

const FlexibleSavingModel = 
    (models.FlexibleSaving as mongoose.Model<FlexibleSaving>) || 
    model<FlexibleSaving>("FlexibleSaving", flexibleSavingSchema);

export default FlexibleSavingModel;