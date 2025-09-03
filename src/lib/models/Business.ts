import mongoose, { Document, Model, Schema } from "mongoose";

export type BusinessRole = "ADMIN" | "MODERATOR" | "STAFF";

export interface BusinessMember {
    user: Schema.Types.ObjectId;
    role: BusinessRole;
}

export interface Business extends Document {
    name: string;
    description?: string;
    owner: Schema.Types.ObjectId;
    members: BusinessMember[];
    createdAt: Date;
    updatedAt: Date;
}

const MemberSchema = new Schema<BusinessMember>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["ADMIN", "MODERATOR", "STAFF"], required: true },
}, { _id: false });

const BusinessSchema = new Schema<Business>({
    name: { type: String, required: true, trim: true },
    description: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [MemberSchema], default: [] },
}, { timestamps: true });

BusinessSchema.index({ owner: 1 });
BusinessSchema.index({ name: 1 });

const BusinessModel: Model<Business> = mongoose.models.Business || mongoose.model<Business>("Business", BusinessSchema);

export default BusinessModel;


