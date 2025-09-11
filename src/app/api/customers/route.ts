import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Customer from "@/lib/models/customer";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";
import { validateRequestBody, handleValidationError } from "@/lib/validation/helpers";
import { z } from "zod";
import { auth } from "@/auth";

const CustomerCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  await connectToDB();
  const businessId = await requireBusiness();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") || 50)));
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));

  const filter: any = { business: businessId };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { name: rx },
      { email: rx },
      { phone: rx },
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ name: 1 }).skip(offset).limit(limit),
    Customer.countDocuments(filter),
  ]);

  return NextResponse.json({
    customers,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + customers.length < total,
    },
  });
}

export async function POST(request: Request) {
  try {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write", "customers");
    const body = await validateRequestBody(CustomerCreateSchema, request);
    const session = await auth();
    const created = await Customer.create({ ...body, business: businessId, createdBy: session?.user?.id || null });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleValidationError(error);
  }
}


