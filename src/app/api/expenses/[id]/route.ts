import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Expense from "@/lib/models/expense";
import { requireBusiness } from "@/lib/business";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
    await connectToDB();
    const businessId = await requireBusiness();
    const expense = await Expense.findOne({ _id: params.id, business: businessId });
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
}

export async function PATCH(request: Request, { params }: Params) {
    await connectToDB();
    const businessId = await requireBusiness();
    const payload = await request.json();
    const expense = await Expense.findOneAndUpdate({ _id: params.id, business: businessId }, payload, { new: true });
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
}

export async function DELETE(_req: Request, { params }: Params) {
    await connectToDB();
    const businessId = await requireBusiness();
    const deleted = await Expense.findOneAndDelete({ _id: params.id, business: businessId });
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}


