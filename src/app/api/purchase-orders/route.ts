import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import PurchaseOrder from "@/lib/models/purchaseOrder";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";
import { PurchaseOrderCreateSchema } from "@/lib/validation/schemas";
import { validateRequestBody, handleValidationError } from "@/lib/validation/helpers";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const pos = await PurchaseOrder.find({ business: businessId }).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json(pos);
}

export async function POST(request: Request) {
    try {
        await connectToDB();
        const { businessId } = await requireBusinessAccess("write", "purchasing");

        // Validate request body with Zod
        const validatedData = await validateRequestBody(PurchaseOrderCreateSchema, request);
        const { reference, supplier, expectedDeliveryDate, items, notes } = validatedData;

        const subtotal = items.reduce((s, it) => s + (it.quantityOrdered * it.unitCost), 0);
        const tax = 0; // Default tax for now
        const total = subtotal + tax;

        const po = await PurchaseOrder.create({
            reference,
            supplier,
            expectedDeliveryDate,
            items: items.map(i => ({
                ...i,
                quantityReceived: 0,
                lineTotal: i.quantityOrdered * i.unitCost
            })),
            subtotal,
            tax,
            total,
            status: "ordered",
            notes,
            business: businessId
        });

        return NextResponse.json(po, { status: 201 });
    } catch (error) {
        return handleValidationError(error);
    }
}


