import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Supplier from "@/lib/models/supplier";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
    await connectToDB();
    const supplier = await Supplier.findById(params.id);
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(supplier);
}

export async function PATCH(request: Request, { params }: Params) {
    await connectToDB();
    const payload = await request.json();
    const supplier = await Supplier.findByIdAndUpdate(params.id, payload, { new: true });
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(supplier);
}

export async function DELETE(_req: Request, { params }: Params) {
    await connectToDB();
    const deleted = await Supplier.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}


