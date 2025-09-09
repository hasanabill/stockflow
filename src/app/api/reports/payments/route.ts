import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDB from "@/lib/mongodb";
import { requireBusiness } from "@/lib/business";
import Payment from "@/lib/models/payment";

export async function GET(request: Request) {
    await connectToDB();
    const businessId = await requireBusiness();
    const { searchParams } = new URL(request.url);
    const granularity = searchParams.get("granularity") || "day"; // day|week|month
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to) : new Date();
    const byMethod = searchParams.get("byMethod") === "true";

    const dateExpr = granularity === "month"
        ? { $dateToString: { format: "%Y-%m", date: "$paidAt" } }
        : granularity === "week"
        ? { $dateToString: { format: "%G-%V", date: "$paidAt" } }
        : { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } };

    const match = { business: new Types.ObjectId(businessId), paidAt: { $gte: fromDate, $lte: toDate } };

    const groupId: any = { period: dateExpr };
    if (byMethod) groupId.method = "$method";

    const rows = await Payment.aggregate([
        { $match: match },
        { $group: { _id: groupId, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { "_id.period": 1, "_id.method": 1 } },
    ]);

    const total = rows.reduce((s: number, r: any) => s + (r.amount || 0), 0);
    return NextResponse.json({ granularity, from: fromDate, to: toDate, byMethod, total, rows });
}


