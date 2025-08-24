import mongoose, { Document, Model, Schema } from "mongoose";

type UserRole =  "admin" | "moderator";

interface User extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<User> = new mongoose.Schema({
    name: { type: String, required: true }, 
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin", enum: ["admin", "moderator"] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true
});


const User: Model<User> = mongoose.models.User || mongoose.model<User>("User", UserSchema);

export default User;