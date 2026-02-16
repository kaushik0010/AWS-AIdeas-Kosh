import mongoose, {Schema, Document, Types} from "mongoose";

interface Criteria {
  minimumWalletBalance?: number;
}

export interface Group extends Document {
    groupName: string;
    description?: string;
    groupType: "public" | "private"
    admin: Types.ObjectId;
    maxGroupSize: number;
    criteria?: Criteria;
    createdAt: Date;
    updatedAt: Date;
}

const groupSchema: Schema<Group> = new Schema({
    groupName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    groupType: {
        type: String,
        enum: ["public", "private"],
        required: true,
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    maxGroupSize: {
        type: Number,
        required: true,
    },
    criteria: {
        minimumWalletBalance: { 
            type: Number,
            required: false 
        },
    }
}, {timestamps: true});

groupSchema.index({ groupName: 'text', description: 'text' }); // For text search
groupSchema.index({ groupType: 1 }); // For filtering by type
groupSchema.index({ maxGroupSize: 1 }); // For filtering by size

const GroupModel = 
    (mongoose.models.Group as mongoose.Model<Group>) ||
    mongoose.model<Group>("Group", groupSchema);

export default GroupModel;