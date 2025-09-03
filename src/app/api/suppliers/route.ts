import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Supplier from "@/lib/models/supplier";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";
import { SupplierCreateSchema } from "@/lib/validation/schemas";
import { validateRequestBody, handleValidationError } from "@/lib/validation/helpers";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const suppliers = await Supplier.find({ business: businessId }).sort({ name: 1 }).limit(500);
    return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
    try {
        await connectToDB();
        const { businessId } = await requireBusinessAccess("write", "suppliers");

        // Validate request body with Zod
        const validatedData = await validateRequestBody(SupplierCreateSchema, request);
        const { name, contactPerson, email, phone, address, notes } = validatedData;

        const created = await Supplier.create({
            name,
            contactPerson,
            email,
            phone,
            address,
            notes,
            business: businessId
        });

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        return handleValidationError(error);
    }
}


