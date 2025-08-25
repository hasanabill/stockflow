import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Product from "@/lib/models/product";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
    await connectToDB();
    const product = await Product.findById(params.id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
}

export async function PATCH(request: Request, { params }: Params) {
    await connectToDB();
    const payload = await request.json();
    const product = await Product.findByIdAndUpdate(params.id, payload, { new: true });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: Params) {
    await connectToDB();
    const deleted = await Product.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}


