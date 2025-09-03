import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Product from "@/lib/models/product";
import ProductType from "@/lib/models/productType";
import { validateAttributes } from "@/lib/validation/productAttributes";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";
import { auth } from "@/auth";
import { logActivity } from "@/lib/audit/logger";
import { ProductCreateSchema } from "@/lib/validation/schemas";
import { validateRequestBody, handleValidationError } from "@/lib/validation/helpers";

export async function GET() {
    await connectToDB();
    const businessId = await requireBusiness();
    const products = await Product.find({ business: businessId }).sort({ createdAt: -1 });
    return NextResponse.json(products);
}

export async function POST(request: Request) {
    try {
        await connectToDB();
        const { businessId } = await requireBusinessAccess("write", "products");

        // Validate request body with Zod
        const validatedData = await validateRequestBody(ProductCreateSchema, request);
        const { name, salePrice, costPrice, category, brand, description, productType, attributes, variants } = validatedData;

        // Optional schema-driven attributes validation
        if (productType && attributes) {
            const pt = await ProductType.findOne({ _id: productType, business: businessId });
            if (!pt) return NextResponse.json({ error: "ProductType not found" }, { status: 400 });
            try {
                validateAttributes((pt as any).jsonSchema as any, attributes);
            } catch (e) {
                const message = e instanceof Error ? e.message : "Invalid attributes";
                return NextResponse.json({ error: message }, { status: 400 });
            }
        }

        const created = await Product.create({
            name,
            salePrice,
            costPrice,
            category,
            brand,
            description,
            attributes: attributes || undefined,
            variants,
            business: businessId
        });

        const session = await auth();
        if (session?.user?.id) {
            await logActivity({ businessId, userId: session.user.id, entity: "Product", entityId: String(created._id), action: "create", after: created });
        }

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        return handleValidationError(error);
    }
}


