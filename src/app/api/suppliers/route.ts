import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Supplier from "@/lib/models/supplier";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const suppliers = await Supplier.find({ business: businessId }).sort({ name: 1 }).limit(500);
    return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { name, email, phone, address, notes, isActive } = body as Record<string, unknown>;
    if (!name || typeof name !== "string") {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    try {
        const created = await Supplier.create({ name, email, phone, address, notes, isActive, business: businessId });
        return NextResponse.json(created, { status: 201 });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}


