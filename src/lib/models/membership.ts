import mongoose, { Document, Model, Schema } from "mongoose";

export interface Membership extends Document {
    business: Schema.Types.ObjectId;
    user: Schema.Types.ObjectId;
    role: "ADMIN" | "MODERATOR" | "STAFF";
    createdAt: Date;
    updatedAt: Date;
}

const MembershipSchema = new Schema<Membership>({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["ADMIN", "MODERATOR", "STAFF"], required: true },
}, { timestamps: true });

// Ensure a user has at most one membership per business
MembershipSchema.index({ business: 1, user: 1 }, { unique: true });
MembershipSchema.index({ user: 1 });
MembershipSchema.index({ business: 1 });

const MembershipModel: Model<Membership> = mongoose.models.Membership || mongoose.model<Membership>("Membership", MembershipSchema);

export default MembershipModel;


