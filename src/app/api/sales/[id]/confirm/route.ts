import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Sale from "@/lib/models/sale";
import { requireBusinessAccess } from "@/lib/business";
import { postSale } from "@/lib/services/inventory";
import { auth } from "@/auth";
import { logActivity } from "@/lib/audit/logger";

export async function POST(_req: Request, { params }: any) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write", "sales");
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
    const session = await auth();
    if (session?.user?.id) {
        await logActivity({ businessId, userId: session.user.id, entity: "Sale", entityId: String(sale._id), action: "confirm", after: sale });
    }
    return NextResponse.json(sale);
}


