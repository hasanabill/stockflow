import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import PurchaseOrder from "@/lib/models/purchaseOrder";
import Product from "@/lib/models/product";
import { requireBusiness } from "@/lib/business";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
    await connectToDB();
    const businessId = await requireBusiness();
    const po = await PurchaseOrder.findOne({ _id: params.id, business: businessId });
    if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(po);
}

export async function PATCH(request: Request, { params }: Params) {
    await connectToDB();
    const businessId = await requireBusiness();
    const body = await request.json();
    const updated = await PurchaseOrder.findOneAndUpdate({ _id: params.id, business: businessId }, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
}

// Mark received and increase stock
export async function PUT(request: Request, { params }: Params) {
    await connectToDB();
    const businessId = await requireBusiness();
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { status, items } = body as { status?: string; items?: Array<{ product: string; variantSku: string; quantityReceived: number }> };

    const po = await PurchaseOrder.findOne({ _id: params.id, business: businessId });
    if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (status === "received" || status === "received".toUpperCase()) {
        // Increase product stock per received quantities
        if (Array.isArray(items)) {
            for (const it of items) {
                const product = await Product.findById(it.product);
                if (!product) continue;
                const variant = product.variants.find(v => v.sku === it.variantSku);
                if (!variant) continue;
                variant.stockQuantity += Math.max(0, it.quantityReceived || 0);
                await product.save();
            }
        } else {
            // fallback to PO's own items
            for (const it of po.items) {
                const product = await Product.findById(it.product);
                if (!product) continue;
                const variant = product.variants.find(v => v.sku === it.variantSku);
                if (!variant) continue;
                variant.stockQuantity += Math.max(0, it.quantityReceived || 0);
                await product.save();
            }
        }
        po.status = "received";
        po.receivedDate = new Date();
        await po.save();
        return NextResponse.json(po);
    }

    return NextResponse.json({ error: "Unsupported operation" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: Params) {
    await connectToDB();
    const deleted = await PurchaseOrder.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}


