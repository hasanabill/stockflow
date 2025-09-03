import mongoose, { Document, Model, Schema } from "mongoose";

export interface ProductVariant {
    sku: string;
    size?: string;
    color?: string;
    stockQuantity: number;
    reorderLevel?: number;
    barcode?: string;
}

export interface Product extends Document {
    name: string;
    category?: string;
    brand?: string;
    description?: string;
    costPrice?: number;
    salePrice?: number;
    attributes?: Record<string, any>;
    variants: ProductVariant[];
    defaultSupplier?: mongoose.Types.ObjectId | null;
    business: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const VariantSchema = new Schema<ProductVariant>({
    sku: { type: String, required: true, trim: true },
    size: { type: String },
    color: { type: String },
    stockQuantity: { type: Number, required: true, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    barcode: { type: String },
}, { _id: false });

const ProductSchema = new Schema<Product>({
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    brand: { type: String, trim: true },
    description: { type: String },
    costPrice: { type: Number, min: 0 },
    salePrice: { type: Number, min: 0 },
    attributes: { type: Schema.Types.Mixed },
    variants: { type: [VariantSchema], default: [] },
    defaultSupplier: { type: Schema.Types.ObjectId, ref: "Supplier", default: null },
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
}, { timestamps: true });

// Helpful indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ business: 1 });
// Ensure variant SKU is unique per business
ProductSchema.index({ business: 1, "variants.sku": 1 }, { unique: true, sparse: true });

const ProductModel: Model<Product> = mongoose.models.Product || mongoose.model<Product>("Product", ProductSchema);

export default ProductModel;


