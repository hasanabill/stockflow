import mongoose, { Document, Model, Schema } from "mongoose";

export interface SaleItem {
    product: mongoose.Types.ObjectId;
    variantSku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

export interface Sale extends Document {
    date: Date;
    items: SaleItem[];
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SaleItemSchema = new Schema<SaleItem>({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const SaleSchema = new Schema<Sale>({
    date: { type: Date, default: Date.now },
    items: { type: [SaleItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String },
}, { timestamps: true });

SaleSchema.index({ date: -1 });

const SaleModel: Model<Sale> = mongoose.models.Sale || mongoose.model<Sale>("Sale", SaleSchema);

export default SaleModel;


