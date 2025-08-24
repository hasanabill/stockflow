import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Product from "@/models/product";

export async function POST(request: Request) {
    await connectToDB();
    const { sku, quantity } = await request.json();
    if (!sku || typeof quantity !== "number" || quantity <= 0) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const product = await Product.findOne({ sku });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    product.stock += quantity;
    await product.save();
    return NextResponse.json({ ok: true, stock: product.stock });
}


