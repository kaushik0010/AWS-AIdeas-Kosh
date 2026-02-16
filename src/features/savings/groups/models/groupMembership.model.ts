import mongoose, {Schema, Document, Types} from "mongoose";

export interface GroupMembership extends Document {
    userId: Types.ObjectId;
    groupId: Types.ObjectId;
    role: "admin" | "member";
    status: "pending" | "active" | "rejected" | "left";
    joinedAt: Date | undefined;
    requestHistory: Date[];
    leftAt: Date;
}

const groupMembershipSchema: Schema<GroupMembership> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "active", "rejected", "left"],
        default: "pending",
    },
    joinedAt: {
        type: Date,
        default: undefined,
    },
    requestHistory: {
        type: [Date],
        default: [],
    },
    leftAt: {
        type: Date,
        default: null,
    }
}, { timestamps: true });

groupMembershipSchema.index({ userId: 1, status: 1});
groupMembershipSchema.index({ groupId: 1, status: 1});

const GroupMembershipModel = 
    (mongoose.models.GroupMembership as mongoose.Model<GroupMembership>) ||
    mongoose.model<GroupMembership>("GroupMembership", groupMembershipSchema)

export default GroupMembershipModel;