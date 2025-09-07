import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Customer from "@/lib/models/customer";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";
import { validateRequestBody, handleValidationError } from "@/lib/validation/helpers";
import { z } from "zod";

const CustomerCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  await connectToDB();
  const businessId = await requireBusiness();
  const customers = await Customer.find({ business: businessId }).sort({ name: 1 }).limit(1000);
  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  try {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write", "customers");
    const body = await validateRequestBody(CustomerCreateSchema, request);
    const created = await Customer.create({ ...body, business: businessId });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleValidationError(error);
  }
}


