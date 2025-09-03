import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Sale from "@/lib/models/sale";
import Product from "@/lib/models/product";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const sales = await Sale.find({ business: businessId }).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json(sales);
}

export async function POST(request: Request) {
    await connectToDB();
    const { businessId, role } = await requireBusinessAccess("write");
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { items, discount = 0, tax = 0, notes } = body as { items: Array<{ productId: string; variantSku: string; quantity: number; unitPrice: number }>; discount?: number; tax?: number; notes?: string };
    if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    // Validate and compute totals
    let subtotal = 0;
    for (const item of items) {
        if (!item.productId || !item.variantSku || typeof item.quantity !== "number" || typeof item.unitPrice !== "number") {
            return NextResponse.json({ error: "Invalid item" }, { status: 400 });
        }
        if (item.quantity <= 0 || item.unitPrice < 0) {
            return NextResponse.json({ error: "Invalid quantity or price" }, { status: 400 });
        }
        subtotal += item.quantity * item.unitPrice;
    }
    const total = Math.max(0, subtotal - (discount || 0) + (tax || 0));

    // Persist the sale as DRAFT (no stock impact)
    const saleItems = items.map(i => ({
        product: i.productId,
        variantSku: i.variantSku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.quantity * i.unitPrice,
    }));

    const sale = await Sale.create({
        items: saleItems,
        subtotal,
        discount,
        tax,
        total,
        notes,
        status: "draft",
        business: businessId,
    });

    return NextResponse.json(sale, { status: 201 });
}


