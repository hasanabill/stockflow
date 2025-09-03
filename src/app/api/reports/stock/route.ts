import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import { requireBusiness } from "@/lib/business";
import InventorySnapshot from "@/lib/models/inventorySnapshot";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const rows = await InventorySnapshot.aggregate([
        { $match: { business: new (require("mongoose").Types.ObjectId)(businessId) } },
        { $project: { product: 1, variantSku: 1, onHand: 1, averageCost: 1, value: { $multiply: ["$onHand", "$averageCost"] } } },
        { $sort: { value: -1 } },
    ]);
    const totalValue = rows.reduce((s: number, r: any) => s + (r.value || 0), 0);
    return NextResponse.json({ totalValue, rows });
}


