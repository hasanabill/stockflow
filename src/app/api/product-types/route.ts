import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";
import ProductType from "@/lib/models/productType";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const types = await ProductType.find({ business: businessId }).sort({ title: 1 });
    return NextResponse.json(types);
}

export async function POST(request: Request) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { title, schema } = body as { title: string; schema: Record<string, any> };
    if (!title || !schema || typeof schema !== "object") {
        return NextResponse.json({ error: "Missing title or schema" }, { status: 400 });
    }
    try {
        const created = await ProductType.create({ business: businessId, title, jsonSchema: schema });
        return NextResponse.json(created, { status: 201 });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}


