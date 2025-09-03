import mongoose, { Document, Model, Schema } from "mongoose";

export interface InventorySnapshot extends Document {
    business: Schema.Types.ObjectId;
    product: Schema.Types.ObjectId;
    variantSku?: string;
    onHand: number;
    averageCost: number;
    updatedAt: Date;
}

const InventorySnapshotSchema = new Schema<InventorySnapshot>({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String },
    onHand: { type: Number, required: true, default: 0, min: 0 },
    averageCost: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: { createdAt: false, updatedAt: true } });

InventorySnapshotSchema.index({ business: 1, product: 1, variantSku: 1 }, { unique: true });

const InventorySnapshotModel: Model<InventorySnapshot> = mongoose.models.InventorySnapshot || mongoose.model<InventorySnapshot>("InventorySnapshot", InventorySnapshotSchema);

export default InventorySnapshotModel;


