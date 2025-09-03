import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Product from "@/lib/models/product";
import InventorySnapshot from "@/lib/models/inventorySnapshot";
import { requireBusinessAccess } from "@/lib/business";
import { postReceipt } from "@/lib/services/inventory";

export async function POST(request: Request) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const { sku, quantity, unitCost } = await request.json();
    if (!sku || typeof quantity !== "number" || quantity <= 0) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const product = await Product.findOne({ "variants.sku": sku, business: businessId });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const variant = product.variants.find(v => v.sku === sku);
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

    try {
        await postReceipt({ businessId, productId: String(product._id), variantSku: sku, quantity, unitCost: typeof unitCost === "number" ? unitCost : 0 });
        const snapshot = await InventorySnapshot.findOne({ business: businessId, product: product._id, variantSku: sku });
        return NextResponse.json({ ok: true, stock: snapshot?.onHand ?? null });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}


