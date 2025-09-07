import mongoose, { Document, Model, Schema } from "mongoose";

export interface Customer extends Document {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    isActive: boolean;
    business: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema = new Schema<Customer>({
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
}, { timestamps: true });

CustomerSchema.index({ business: 1, name: 1 });
CustomerSchema.index({ business: 1 });

const CustomerModel: Model<Customer> = mongoose.models.Customer || mongoose.model<Customer>("Customer", CustomerSchema);

export default CustomerModel;


