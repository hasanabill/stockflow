import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Expense from "@/lib/models/expense";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
    await connectToDB();
    const expense = await Expense.findById(params.id);
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
}

export async function PATCH(request: Request, { params }: Params) {
    await connectToDB();
    const payload = await request.json();
    const expense = await Expense.findByIdAndUpdate(params.id, payload, { new: true });
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
}

export async function DELETE(_req: Request, { params }: Params) {
    await connectToDB();
    const deleted = await Expense.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}


