import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Expense from "@/lib/models/expense";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";
import { ExpenseCreateSchema } from "@/lib/validation/schemas";
import { validateRequestBody, handleValidationError } from "@/lib/validation/helpers";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const expenses = await Expense.find({ business: businessId }).sort({ date: -1, createdAt: -1 }).limit(500);
    return NextResponse.json(expenses);
}

export async function POST(request: Request) {
    try {
        await connectToDB();
        const { businessId } = await requireBusinessAccess("write", "expenses");

        // Validate request body with Zod
        const validatedData = await validateRequestBody(ExpenseCreateSchema, request);
        const { description, amount, category, date, notes } = validatedData;

        const expense = await Expense.create({
            description,
            amount,
            category,
            date: date ? new Date(date) : new Date(),
            notes,
            business: businessId
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        return handleValidationError(error);
    }
}


