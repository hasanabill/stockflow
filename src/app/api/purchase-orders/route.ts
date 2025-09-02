import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import PurchaseOrder from "@/lib/models/purchaseOrder";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const pos = await PurchaseOrder.find({ business: businessId }).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json(pos);
}

export async function POST(request: Request) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { reference, supplier, expectedDate, items, tax = 0, notes } = body as any;
    if (!reference || !supplier || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const subtotal = items.reduce((s: number, it: any) => s + (it.quantityOrdered * it.unitCost), 0);
    const total = subtotal + Number(tax || 0);
    const po = await PurchaseOrder.create({ reference, supplier, expectedDate, items: items.map((i: any) => ({ ...i, quantityReceived: i.quantityReceived || 0, lineTotal: i.quantityOrdered * i.unitCost })), subtotal, tax, total, status: "ordered", notes, business: businessId });
    return NextResponse.json(po, { status: 201 });
}


