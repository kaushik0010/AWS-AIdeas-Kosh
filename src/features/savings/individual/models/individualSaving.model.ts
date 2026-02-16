import mongoose, {Schema, Document} from "mongoose";

export interface IndividualSaving extends Document {
    userId: mongoose.Types.ObjectId;
    campaignName: string;
    amountPerMonth: number;
    duration: number;
    totalAmount: number;
    amountSaved: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const individualSavingSchema: Schema<IndividualSaving> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    campaignName: {
        type: String,
        required: [true, "Campaign Name is required"],
    },
    amountPerMonth: {
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
}, {timestamps: true});

individualSavingSchema.index({ userId: 1, isActive: 1 });

const IndividualSavingModel = 
    (mongoose.models.IndividualSaving as mongoose.Model<IndividualSaving>) || 
    mongoose.model<IndividualSaving>("IndividualSaving", individualSavingSchema);

export default IndividualSavingModel;