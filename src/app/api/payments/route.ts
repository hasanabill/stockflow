import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDB from "@/lib/mongodb";
import { requireBusinessAccess } from "@/lib/business";
import Payment from "@/lib/models/payment";
import Invoice from "@/lib/models/invoice";
import { PaymentCreateSchema } from "@/lib/validation/schemas";
import { validateRequestBody, handleValidationError } from "@/lib/validation/helpers";

export async function POST(request: Request) {
    try {
        await connectToDB();
        const { businessId } = await requireBusinessAccess("write", "payments");
        
        // Validate request body with Zod
        const validatedData = await validateRequestBody(PaymentCreateSchema, request);
        const { invoice, amount, method, paidAt, notes } = validatedData;

        const session = await mongoose.startSession();
        try {
            let paymentDoc: any;
            await session.withTransaction(async () => {
                const invoiceDoc = await Invoice.findOne({ _id: invoice, business: businessId }).session(session);
                if (!invoiceDoc) throw new Error("Invoice not found");
                paymentDoc = await Payment.create([{ 
                    business: businessId, 
                    invoice: invoiceDoc._id, 
                    amount, 
                    method, 
                    paidAt: paidAt ? new Date(paidAt) : new Date(), 
                    notes 
                }], { session }).then(d => d[0]);
                invoiceDoc.amountPaid = (invoiceDoc.amountPaid || 0) + amount;
                await invoiceDoc.save({ session });
            });
            return NextResponse.json(paymentDoc, { status: 201 });
        } finally {
            await session.endSession();
        }
    } catch (error) {
        return handleValidationError(error);
    }
}


