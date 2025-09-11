import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import { requireBusiness } from "@/lib/business";
import Invoice from "@/lib/models/invoice";
import Sale from "@/lib/models/sale";
import { z } from "zod";

const InvoiceQuerySchema = z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
    status: z.enum(["unpaid", "partially_paid", "paid"]).optional(),
});

export async function GET(request: Request) {
    await connectToDB();
    const businessId = await requireBusiness();
    const { searchParams } = new URL(request.url);

    const queryValidation = InvoiceQuerySchema.safeParse({
        limit: searchParams.get("limit"),
        offset: searchParams.get("offset"),
        status: searchParams.get("status"),
    });

    if (!queryValidation.success) {
        return NextResponse.json(
            { error: "Invalid query parameters", details: queryValidation.error.issues },
            { status: 400 }
        );
    }

    const { limit, offset, status } = queryValidation.data;

    try {
        // Build filter based on status
        let filter: any = { business: businessId };

        if (status) {
            if (status === "unpaid") {
                filter.amountPaid = 0;
            } else if (status === "partially_paid") {
                filter.amountPaid = { $gt: 0, $lt: { $multiply: ["$amount", 1] } };
            } else if (status === "paid") {
                filter.$expr = { $eq: ["$amountPaid", "$amount"] };
            }
        }

        // Fetch invoices with populated sale data
        const invoices = await Invoice.find(filter)
            .populate("sale")
            .sort({ issuedAt: -1 })
            .limit(limit)
            .skip(offset)
            .lean();

        // Get total count for pagination
        const total = await Invoice.countDocuments(filter);

        // Transform data for frontend
        const transformedInvoices = invoices.map(invoice => ({
            _id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            issuedAt: invoice.issuedAt,
            amount: invoice.amount,
            amountPaid: invoice.amountPaid,
            balance: invoice.amount - invoice.amountPaid,
            customer: "Walk-in", // TODO: Add customer support later
            saleId: (invoice.sale as any)?._id,
            status: invoice.amount === invoice.amountPaid ? "paid" :
                   invoice.amountPaid > 0 ? "partially_paid" : "unpaid"
        }));

        return NextResponse.json({
            invoices: transformedInvoices,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch invoices" },
            { status: 500 }
        );
    }
}
