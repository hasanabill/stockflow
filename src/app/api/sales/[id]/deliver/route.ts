import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Sale from "@/lib/models/sale";
import { requireBusinessAccess } from "@/lib/business";

type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const sale = await Sale.findOne({ _id: params.id, business: businessId });
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (sale.status !== "confirmed") return NextResponse.json({ error: "Only confirmed sales can be delivered" }, { status: 400 });
    sale.status = "delivered";
    await sale.save();
    return NextResponse.json(sale);
}


