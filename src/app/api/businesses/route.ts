import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Business from "@/lib/models/Business";
import { auth } from "@/auth";
import { cookies } from "next/headers";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDB();
    const userId = session.user.id;
    const businesses = await Business.find({
        $or: [
            { owner: userId },
            { "members.user": userId },
        ]
    }).select({ name: 1, owner: 1, members: 1 }).lean();

    const cookieStore = await cookies();
    const selected = cookieStore.get("businessId")?.value || (businesses[0]?._id?.toString() ?? null);
    return NextResponse.json({ businesses, selectedBusinessId: selected });
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectToDB();
    const { name, description } = await request.json();
    if (!name || typeof name !== "string") return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const created = await Business.create({ name, description, owner: session.user.id, members: [{ user: session.user.id, role: "admin" }] });
    const res = NextResponse.json(created, { status: 201 });
    res.cookies.set("businessId", String(created._id), { path: "/", httpOnly: false });
    return res;
}


