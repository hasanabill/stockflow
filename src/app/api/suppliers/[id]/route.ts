import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Supplier from "@/lib/models/supplier";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
    await connectToDB();
    const businessId = await requireBusiness();
    const supplier = await Supplier.findOne({ _id: params.id, business: businessId });
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(supplier);
}

export async function PATCH(request: Request, { params }: Params) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const payload = await request.json();
    const supplier = await Supplier.findOneAndUpdate({ _id: params.id, business: businessId }, payload, { new: true });
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(supplier);
}

export async function DELETE(_req: Request, { params }: Params) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const deleted = await Supplier.findOneAndDelete({ _id: params.id, business: businessId });
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}


