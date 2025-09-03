import mongoose, { Document, Model, Schema } from "mongoose";

export type PurchaseOrderStatus = "draft" | "ordered" | "partially_received" | "received" | "cancelled";

export interface PurchaseOrderItem {
    product: mongoose.Types.ObjectId;
    variantSku: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitCost: number;
    lineTotal: number;
}

export interface PurchaseOrder extends Document {
    reference: string;
    supplier: mongoose.Types.ObjectId;
    status: PurchaseOrderStatus;
    expectedDate?: Date;
    receivedDate?: Date;
    items: PurchaseOrderItem[];
    subtotal: number;
    tax?: number;
    total: number;
    notes?: string;
    business: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema<PurchaseOrderItem>({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, required: true },
    quantityOrdered: { type: Number, required: true, min: 1 },
    quantityReceived: { type: Number, required: true, default: 0, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const PurchaseOrderSchema = new Schema<PurchaseOrder>({
    reference: { type: String, required: true, trim: true },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    status: { type: String, required: true, enum: ["draft", "ordered", "partially_received", "received", "cancelled"], default: "draft" },
    expectedDate: { type: Date },
    receivedDate: { type: Date },
    items: { type: [PurchaseOrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String },
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
}, { timestamps: true });

PurchaseOrderSchema.index({ business: 1, reference: 1 }, { unique: true });
PurchaseOrderSchema.index({ business: 1, status: 1 });
PurchaseOrderSchema.index({ business: 1 });

const PurchaseOrderModel: Model<PurchaseOrder> = mongoose.models.PurchaseOrder || mongoose.model<PurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);

export default PurchaseOrderModel;


