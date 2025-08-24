import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Product from "@/models/product";

export async function GET() {
    await connectToDB();
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json(products);
}

export async function POST(request: Request) {
    await connectToDB();
    const { name, sku, price } = await request.json();
    if (!name || !sku || typeof price !== "number") {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    try {
        const created = await Product.create({ name, sku, price, stock: 0 });
        return NextResponse.json(created, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}


