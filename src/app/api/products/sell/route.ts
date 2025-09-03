import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Product from "@/lib/models/product";
import { requireBusinessAccess } from "@/lib/business";
import { postSale } from "@/lib/services/inventory";

export async function POST(request: Request) {
    try {
        await connectToDB();
        const { businessId } = await requireBusinessAccess("write", "sales");
        const { sku, quantity } = await request.json();
        if (!sku || typeof quantity !== "number" || quantity <= 0) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }
        const product = await Product.findOne({ "variants.sku": sku, business: businessId });
        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
        const variant = product.variants.find(v => v.sku === sku);
        if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

        await postSale({ businessId, productId: String(product._id), variantSku: sku, quantity });
        return NextResponse.json({ ok: true });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}


