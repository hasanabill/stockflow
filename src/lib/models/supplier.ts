import mongoose, { Document, Model, Schema } from "mongoose";

export interface Supplier extends Document {
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

const SupplierSchema = new Schema<Supplier>({
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
}, { timestamps: true });

SupplierSchema.index({ name: 1 }, { unique: true });
SupplierSchema.index({ business: 1 });

const SupplierModel: Model<Supplier> = mongoose.models.Supplier || mongoose.model<Supplier>("Supplier", SupplierSchema);

export default SupplierModel;


