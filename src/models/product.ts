import mongoose, { Document, Model, Schema } from "mongoose";

export interface Product extends Document {
    name: string;
    sku: string;
    price: number;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema<Product> = new mongoose.Schema({
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
}, {
    timestamps: true
});

const Product: Model<Product> = mongoose.models.Product || mongoose.model<Product>("Product", ProductSchema);

export default Product;


