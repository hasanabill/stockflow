import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Product from "@/lib/models/product";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const products = await Product.find({ business: businessId }).sort({ createdAt: -1 });
    return NextResponse.json(products);
}

export async function POST(request: Request) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { name, salePrice, costPrice, category, brand, description } = body as Record<string, unknown>;
    let { variants } = body as { variants?: Array<{ sku: string; size?: string; color?: string; stockQuantity?: number; reorderLevel?: number }> };

    // Backward compatibility for the older flat payload: { name, sku, price }
    const maybeRecord = body as Record<string, unknown>;
    if (!variants && (typeof maybeRecord.sku === "string" || typeof maybeRecord.price === "number")) {
        const sku = maybeRecord.sku as string | undefined;
        const price = typeof maybeRecord.price === "number" ? maybeRecord.price : undefined;
        if (!sku || price === undefined) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }
        variants = [{ sku, stockQuantity: 0 }];
    }

    if (!name || !Array.isArray(variants)) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    try {
        const created = await Product.create({ name, salePrice, costPrice, category, brand, description, variants, business: businessId });
        return NextResponse.json(created, { status: 201 });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}


