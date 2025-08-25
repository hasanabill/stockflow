import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Expense from "@/lib/models/expense";

export async function GET() {
    await connectToDB();
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 }).limit(500);
    return NextResponse.json(expenses);
}

export async function POST(request: Request) {
    await connectToDB();
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { date, category, amount, description, supplier } = body as { date?: string | Date; category: string; amount: number; description?: string; supplier?: string };
    if (!category || typeof amount !== "number") {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const expense = await Expense.create({ date: date ? new Date(date) : undefined, category, amount, description, supplier });
    return NextResponse.json(expense, { status: 201 });
}


