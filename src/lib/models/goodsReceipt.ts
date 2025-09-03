import mongoose, { Document, Model, Schema } from "mongoose";

export interface GoodsReceiptItem {
    product: Schema.Types.ObjectId;
    variantSku: string;
    quantityReceived: number;
    unitCost?: number;
}

export interface GoodsReceipt extends Document {
    business: Schema.Types.ObjectId;
    purchaseOrder: Schema.Types.ObjectId;
    items: GoodsReceiptItem[];
    receivedAt: Date;
    createdAt: Date;
}

const GoodsReceiptItemSchema = new Schema<GoodsReceiptItem>({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, required: true },
    quantityReceived: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, min: 0 },
}, { _id: false });

const GoodsReceiptSchema = new Schema<GoodsReceipt>({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    purchaseOrder: { type: Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
    items: { type: [GoodsReceiptItemSchema], required: true },
    receivedAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

GoodsReceiptSchema.index({ business: 1, purchaseOrder: 1, receivedAt: -1 });

const GoodsReceiptModel: Model<GoodsReceipt> = mongoose.models.GoodsReceipt || mongoose.model<GoodsReceipt>("GoodsReceipt", GoodsReceiptSchema);

export default GoodsReceiptModel;


