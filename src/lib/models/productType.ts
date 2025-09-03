import mongoose, { Document, Model, Schema } from "mongoose";

export interface ProductType extends Document {
    business: Schema.Types.ObjectId;
    title: string;
    jsonSchema: Record<string, any>; // JSON Schema for attributes
    createdAt: Date;
    updatedAt: Date;
}

const ProductTypeSchema = new Schema<ProductType>({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    title: { type: String, required: true, trim: true },
    jsonSchema: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

ProductTypeSchema.index({ business: 1, title: 1 }, { unique: true });

const ProductTypeModel: Model<ProductType> = mongoose.models.ProductType || mongoose.model<ProductType>("ProductType", ProductTypeSchema);

export default ProductTypeModel;


