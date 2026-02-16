import mongoose, { Schema, Document, Types } from "mongoose";

export interface IncomeTransaction extends Document {
    userId: Types.ObjectId;
    totalAmount: number;
    taxAmount: number;
    netAmount: number;
    date: Date;
    status: "success" | "failed";
    metadata?: {
        source?: string;
        description?: string;
    };
}

const incomeTransactionSchema = new Schema<IncomeTransaction>({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true
    },
    totalAmount: { 
        type: Number, 
        required: true,
        min: [0, "Amount must be positive"]
    },
    taxAmount: { 
        type: Number, 
        required: true,
        min: [0, "Tax amount must be positive"]
    },
    netAmount: { 
        type: Number, 
        required: true,
        min: [0, "Net amount must be positive"]
    },
    date: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    status: { 
        type: String, 
        enum: ["success", "failed"], 
        default: "success" 
    },
    metadata: {
        source: String,
        description: String
    }
});

const IncomeTransactionModel = (mongoose.models.IncomeTransaction as mongoose.Model<IncomeTransaction>) || 
    mongoose.model<IncomeTransaction>("IncomeTransaction", incomeTransactionSchema);

export default IncomeTransactionModel;
