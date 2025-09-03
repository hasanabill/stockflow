import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Sale from "@/lib/models/sale";
import { requireBusinessAccess } from "@/lib/business";
import { postSale } from "@/lib/services/inventory";

type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const sale = await Sale.findOne({ _id: params.id, business: businessId });
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (sale.status !== "draft") return NextResponse.json({ error: "Only draft sales can be confirmed" }, { status: 400 });

    try {
        for (const item of sale.items) {
            await postSale({ businessId, productId: String(item.product), variantSku: item.variantSku, quantity: item.quantity });
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 400 });
    }

    sale.status = "confirmed";
    await sale.save();
    return NextResponse.json(sale);
}


