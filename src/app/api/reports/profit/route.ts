import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDB from "@/lib/mongodb";
import { requireBusiness } from "@/lib/business";
import InventoryLedger from "@/lib/models/inventoryLedger";
import Sale from "@/lib/models/sale";
import Expense from "@/lib/models/expense";

export async function GET(request: Request) {
    await connectToDB();
    const businessId = await requireBusiness();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to) : new Date();

    // Revenue = sum of delivered sales totals in period
    const deliveredSales = await Sale.aggregate([
        { $match: { business: new Types.ObjectId(businessId), status: "delivered", createdAt: { $gte: fromDate, $lte: toDate } } },
        { $group: { _id: null, revenue: { $sum: "$total" } } }
    ]);
    const revenue = deliveredSales[0]?.revenue || 0;

    // COGS = sum of |delta| * averageCostAtPosting for SALE ledger entries in period
    const saleLedger = await InventoryLedger.aggregate([
        { $match: { business: new Types.ObjectId(businessId), sourceType: "SALE", createdAt: { $gte: fromDate, $lte: toDate } } },
        { $group: { _id: null, cogs: { $sum: { $multiply: [ { $abs: "$delta" }, { $ifNull: ["$averageCostAtPosting", 0] } ] } } } }
    ]);
    const cogs = saleLedger[0]?.cogs || 0;

    // Expenses in period
    const expensesAgg = await Expense.aggregate([
        { $match: { business: new Types.ObjectId(businessId), date: { $gte: fromDate, $lte: toDate } } },
        { $group: { _id: null, expenses: { $sum: "$amount" } } }
    ]);
    const expenses = expensesAgg[0]?.expenses || 0;

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    return NextResponse.json({ from: fromDate, to: toDate, revenue, cogs, grossProfit, expenses, netProfit });
}


