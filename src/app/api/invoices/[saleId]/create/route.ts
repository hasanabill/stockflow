import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDB from "@/lib/mongodb";
import { requireBusinessAccess } from "@/lib/business";
import Sale from "@/lib/models/sale";
import Invoice from "@/lib/models/invoice";
import type { Invoice as InvoiceDoc } from "@/lib/models/invoice";
import { getNextSequence } from "@/lib/utils/counters";

type Params = { params: { saleId: string } };

export async function POST(_req: Request, { params }: Params) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write");
    const sale = await Sale.findOne({ _id: params.saleId, business: businessId });
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    if (sale.status !== "confirmed" && sale.status !== "delivered") {
        return NextResponse.json({ error: "Invoice can be issued only for confirmed/delivered sales" }, { status: 400 });
    }

    const session = await mongoose.startSession();
    try {
        let created: InvoiceDoc | null = null;
        await session.withTransaction(async () => {
            const seq = await getNextSequence({ businessId, key: "invoice", session });
            const year = new Date().getFullYear();
            const padded = String(seq).padStart(6, "0");
            const invoiceNumber = `INV-${year}-${padded}`;
            created = await Invoice.create([{ business: businessId, sale: sale._id, invoiceNumber, issuedAt: new Date(), amount: sale.total, amountPaid: 0 }], { session }).then(d => d[0]);
        });
        return NextResponse.json(created, { status: 201 });
    } finally {
        await session.endSession();
    }
}


