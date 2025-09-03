import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Sale from "@/lib/models/sale";
import Product from "@/lib/models/product";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";
import { SaleCreateSchema } from "@/lib/validation/schemas";
import { validateRequestBody, handleValidationError } from "@/lib/validation/helpers";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const sales = await Sale.find({ business: businessId }).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json(sales);
}

export async function POST(request: Request) {
    try {
        await connectToDB();
        const { businessId, role } = await requireBusinessAccess("write", "sales");
        
        // Validate request body with Zod
        const validatedData = await validateRequestBody(SaleCreateSchema, request);
        const { customer, items, notes } = validatedData;
        
        // Compute totals
        const subtotal = items.reduce((s, item) => s + (item.quantity * item.unitPrice), 0);
        const discount = 0; // Default discount for now
        const tax = 0; // Default tax for now
        const total = Math.max(0, subtotal - discount + tax);

        // Persist the sale as DRAFT (no stock impact)
        const saleItems = items.map(i => ({
            product: i.product,
            variantSku: i.variantSku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.quantity * i.unitPrice,
        }));

        const sale = await Sale.create({
            customer,
            items: saleItems,
            subtotal,
            discount,
            tax,
            total,
            notes,
            status: "draft",
            business: businessId,
        });

        return NextResponse.json(sale, { status: 201 });
    } catch (error) {
        return handleValidationError(error);
    }
}


