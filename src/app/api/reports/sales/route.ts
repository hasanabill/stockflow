import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import { requireBusiness } from "@/lib/business";
import Sale from "@/lib/models/sale";

export async function GET(request: Request) {
    await connectToDB();
    const businessId = await requireBusiness();
    const { searchParams } = new URL(request.url);
    const granularity = searchParams.get("granularity") || "day"; // day|week|month
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to) : new Date();

    const dateExpr = granularity === "month"
        ? { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
        : granularity === "week"
        ? { $dateToString: { format: "%G-%V", date: "$createdAt" } } // ISO week
        : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

    const rows = await Sale.aggregate([
        { $match: { business: new (require("mongoose").Types.ObjectId)(businessId), createdAt: { $gte: fromDate, $lte: toDate } } },
        { $group: { _id: dateExpr, count: { $sum: 1 }, total: { $sum: "$total" } } },
        { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({ granularity, from: fromDate, to: toDate, rows });
}


