import mongoose, { Document, Model, Schema } from "mongoose";

export interface Invoice extends Document {
    business: Schema.Types.ObjectId;
    sale: Schema.Types.ObjectId;
    invoiceNumber: string;
    issuedAt: Date;
    amount: number;
    amountPaid: number;
    htmlSnapshot?: string;
    createdBy?: Schema.Types.ObjectId | null;
    updatedBy?: Schema.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const InvoiceSchema = new Schema<Invoice>({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    sale: { type: Schema.Types.ObjectId, ref: "Sale", required: true },
    invoiceNumber: { type: String, required: true },
    issuedAt: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, default: 0, min: 0 },
    htmlSnapshot: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

InvoiceSchema.index({ business: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ business: 1, sale: 1 });

const InvoiceModel: Model<Invoice> = mongoose.models.Invoice || mongoose.model<Invoice>("Invoice", InvoiceSchema);

export default InvoiceModel;


