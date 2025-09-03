import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import PurchaseOrder from "@/lib/models/purchaseOrder";
import { postReceipt } from "@/lib/services/inventory";
import GoodsReceipt from "@/lib/models/goodsReceipt";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";
import { auth } from "@/auth";
import { logActivity } from "@/lib/audit/logger";

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
    const { businessId } = await requireBusinessAccess("write", "purchasing");
    const body = await request.json();
    const updated = await PurchaseOrder.findOneAndUpdate({ _id: params.id, business: businessId }, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
}

// Mark received and increase stock
export async function PUT(request: Request, { params }: Params) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write", "purchasing");
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { items } = body as { status?: string; items?: Array<{ product: string; variantSku: string; quantityReceived: number }> };

    const po = await PurchaseOrder.findOne({ _id: params.id, business: businessId });
    if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Determine receipt lines: provided items or receive remaining for all lines
    const lines = Array.isArray(items)
        ? items
        : po.items.map(i => ({ product: String(i.product), variantSku: i.variantSku, quantityReceived: (i.quantityOrdered - i.quantityReceived) }));

    let anyReceived = false;
    const grnItems: Array<{ product: string; variantSku: string; quantityReceived: number; unitCost?: number }> = [];
    for (const it of lines) {
        if (!it || !it.product || !it.variantSku) continue;
        const poLine = po.items.find(li => String(li.product) === String(it.product) && li.variantSku === it.variantSku);
        if (!poLine) continue;
        const remaining = Math.max(0, poLine.quantityOrdered - poLine.quantityReceived);
        const requested = Math.max(0, it.quantityReceived || 0);
        const qty = Math.min(remaining, requested);
        if (qty <= 0) continue;
        const unitCost = poLine.unitCost ?? 0;
        await postReceipt({ businessId, productId: String(it.product), variantSku: it.variantSku, quantity: qty, unitCost });
        poLine.quantityReceived += qty;
        anyReceived = true;
        grnItems.push({ product: String(it.product), variantSku: it.variantSku, quantityReceived: qty, unitCost });
    }

    if (!anyReceived) {
        return NextResponse.json({ error: "No receivable quantities provided" }, { status: 400 });
    }

    const allReceived = po.items.every(li => li.quantityReceived >= li.quantityOrdered);
    if (allReceived) {
        po.status = "received";
        po.receivedDate = new Date();
    } else {
        po.status = "partially_received";
    }
    await po.save();

    const sessionUser = await auth();
    if (sessionUser?.user?.id) {
        await logActivity({ businessId, userId: sessionUser.user.id, entity: "PurchaseOrder", entityId: String(po._id), action: "receive", after: po });
    }

    // Persist optional GRN for audit
    try {
        await GoodsReceipt.create({ business: businessId, purchaseOrder: po._id, items: grnItems, receivedAt: new Date() });
    } catch {
        // non-fatal
    }
    return NextResponse.json(po);
}

export async function DELETE(_req: Request, { params }: Params) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write", "purchasing");
    const deleted = await PurchaseOrder.findOneAndDelete({ _id: params.id, business: businessId });
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}


