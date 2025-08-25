import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Product from "@/lib/models/product";
import { requireBusiness } from "@/lib/business";

export async function POST(request: Request) {
    await connectToDB();
    const businessId = await requireBusiness();
    const { sku, quantity } = await request.json();
    if (!sku || typeof quantity !== "number" || quantity <= 0) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const product = await Product.findOne({ "variants.sku": sku, business: businessId });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const variant = product.variants.find(v => v.sku === sku);
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    variant.stockQuantity += quantity;
    await product.save();
    return NextResponse.json({ ok: true, stock: variant.stockQuantity });
}


