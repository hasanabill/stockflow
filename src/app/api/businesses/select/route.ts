import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectToDB from "@/lib/mongodb";
import Business from "@/lib/models/Business";

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { businessId } = await request.json();
    if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
    await connectToDB();
    const found = await Business.findOne({ _id: businessId, $or: [{ owner: session.user.id }, { "members.user": session.user.id }] });
    if (!found) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("businessId", String(businessId), { path: "/", httpOnly: false });
    return res;
}


