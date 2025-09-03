import mongoose, { Document, Model, Schema } from "mongoose";

export type InventorySourceType = "PO" | "GRN" | "SALE" | "SALE_CANCEL" | "ADJUSTMENT" | "RETURN";

export interface InventoryLedger extends Document {
    business: Schema.Types.ObjectId;
    product: Schema.Types.ObjectId;
    variantSku?: string;
    delta: number; // positive for receipts, negative for issues
    sourceType: InventorySourceType;
    sourceId: Schema.Types.ObjectId | string;
    averageCostAtPosting?: number; // for SALE entries
    unitCostAtPosting?: number; // for GRN entries
    createdAt: Date;
}

const InventoryLedgerSchema = new Schema<InventoryLedger>({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String },
    delta: { type: Number, required: true },
    sourceType: { type: String, required: true, enum: ["PO", "GRN", "SALE", "SALE_CANCEL", "ADJUSTMENT", "RETURN"] },
    sourceId: { type: Schema.Types.Mixed, required: true },
    averageCostAtPosting: { type: Number, min: 0 },
    unitCostAtPosting: { type: Number, min: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

InventoryLedgerSchema.index({ business: 1, product: 1, createdAt: -1 });

const InventoryLedgerModel: Model<InventoryLedger> = mongoose.models.InventoryLedger || mongoose.model<InventoryLedger>("InventoryLedger", InventoryLedgerSchema);

export default InventoryLedgerModel;


