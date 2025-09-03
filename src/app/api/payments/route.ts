import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDB from "@/lib/mongodb";
import { requireBusinessAccess } from "@/lib/business";
import Payment from "@/lib/models/payment";
import Invoice from "@/lib/models/invoice";

export async function POST(request: Request) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { invoiceId, amount, method, paidAt, notes } = body as { invoiceId: string; amount: number; method: "cash" | "bank" | "other"; paidAt?: string | Date; notes?: string };
    if (!invoiceId || typeof amount !== "number" || amount <= 0 || !method) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await mongoose.startSession();
    try {
        let paymentDoc: any;
        await session.withTransaction(async () => {
            const invoice = await Invoice.findOne({ _id: invoiceId, business: businessId }).session(session);
            if (!invoice) throw new Error("Invoice not found");
            paymentDoc = await Payment.create([{ business: businessId, invoice: invoice._id, amount, method, paidAt: paidAt ? new Date(paidAt) : new Date(), notes }], { session }).then(d => d[0]);
            invoice.amountPaid = (invoice.amountPaid || 0) + amount;
            await invoice.save({ session });
        });
        return NextResponse.json(paymentDoc, { status: 201 });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 400 });
    } finally {
        await session.endSession();
    }
}


