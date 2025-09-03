import mongoose, { Document, Model, Schema } from "mongoose";

export interface SequenceCounter extends Document {
    business: Schema.Types.ObjectId;
    key: string; // e.g., invoice, po, order, grn
    value: number;
    updatedAt: Date;
}

const SequenceCounterSchema = new Schema<SequenceCounter>({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    key: { type: String, required: true },
    value: { type: Number, required: true, default: 0 },
}, { timestamps: { createdAt: false, updatedAt: true } });

SequenceCounterSchema.index({ business: 1, key: 1 }, { unique: true });

const SequenceCounterModel: Model<SequenceCounter> = mongoose.models.SequenceCounter || mongoose.model<SequenceCounter>("SequenceCounter", SequenceCounterSchema);

export default SequenceCounterModel;


