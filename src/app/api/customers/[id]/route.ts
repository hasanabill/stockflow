import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Customer from "@/lib/models/customer";
import { requireBusiness, requireBusinessAccess } from "@/lib/business";
import { handleValidationError, validateRequest } from "@/lib/validation/helpers";
import { auth } from "@/auth";
import { z } from "zod";

const CustomerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: any) {
  await connectToDB();
  const businessId = await requireBusiness();
  const doc = await Customer.findOne({ _id: params.id, business: businessId });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(request: Request, { params }: any) {
  try {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write", "customers");
    const payload = validateRequest(CustomerUpdateSchema, await request.json());
    const session = await auth();
    const updated = await Customer.findOneAndUpdate({ _id: params.id, business: businessId }, { ...payload, updatedBy: session?.user?.id || null }, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return handleValidationError(error);
  }
}

export async function DELETE(_req: Request, { params }: any) {
  await connectToDB();
  const { businessId } = await requireBusinessAccess("write", "customers");
  const deleted = await Customer.findOneAndDelete({ _id: params.id, business: businessId });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}


