import mongoose, {Schema, Document, Types} from "mongoose";

export interface WalletTopUp extends Document {
    userId: Types.ObjectId;
    amount: number;
    date: Date;
    status: "success" | "failed";
}

const walletTopUpSchema = new Schema<WalletTopUp>({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        enum: ["success", "failed"], 
        default: "success" 
    },
});


const WalletTopUpModel = 
    (mongoose.models.WalletTopUp as mongoose.Model<WalletTopUp>) || 
    mongoose.model<WalletTopUp>("WalletTopUp", walletTopUpSchema);

export default WalletTopUpModel;