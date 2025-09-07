import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Product from "@/lib/models/product";
import { requireBusiness } from "@/lib/business";

export async function GET(_req: Request, { params }: any) {
    await connectToDB();
    const businessId = await requireBusiness();
    const product = await Product.findOne({ _id: params.id, business: businessId });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
}

export async function PATCH(request: Request, { params }: any) {
    await connectToDB();
    const businessId = await requireBusiness();
    const payload = await request.json();
    const product = await Product.findOneAndUpdate({ _id: params.id, business: businessId }, payload, { new: true });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: any) {
    await connectToDB();
    const businessId = await requireBusiness();
    const deleted = await Product.findOneAndDelete({ _id: params.id, business: businessId });
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}


