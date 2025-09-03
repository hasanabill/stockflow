import mongoose, { Document, Model, Schema } from "mongoose";

export type PaymentMethod = "cash" | "bank" | "other";

export interface Payment extends Document {
    business: Schema.Types.ObjectId;
    invoice: Schema.Types.ObjectId;
    amount: number;
    method: PaymentMethod;
    paidAt: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<Payment>({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true, enum: ["cash", "bank", "other"] },
    paidAt: { type: Date, required: true },
    notes: { type: String },
}, { timestamps: true });

PaymentSchema.index({ business: 1, invoice: 1, paidAt: -1 });

const PaymentModel: Model<Payment> = mongoose.models.Payment || mongoose.model<Payment>("Payment", PaymentSchema);

export default PaymentModel;


