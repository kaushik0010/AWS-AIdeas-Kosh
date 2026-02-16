import mongoose, {Schema, Document} from "mongoose";

export interface User extends Document {
    name: string;
    email: string;
    password: string;
    verificationToken: string;
    verificationTokenExpiry: Date;
    isEmailVerified: boolean;
    walletBalance: number;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema: Schema<User> = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [/^[\w\.-]+@[\w\.-]+\.\w{2,}$/, 'please use a valid email address'],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    verificationToken: {
        type: String,
        required: [true, "Verification Token is required"],
    },
    verificationTokenExpiry: {
        type: Date,
        required: [true, "Verification Token expiry is required"],
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    walletBalance: {
        type: Number,
        default: 0,
    } 
}, 
    { timestamps: true }
);

const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>("User", userSchema)

export default UserModel;