import { auth } from "@/auth";
import { cookies as nextCookies } from "next/headers";
import connectToDB from "@/lib/mongodb";
import Business from "@/lib/models/Business";

export async function requireBusiness() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const cookieStore = await nextCookies();
    const businessId = cookieStore.get("businessId")?.value;
    if (!businessId) throw new Error("No business selected");
    await connectToDB();
    const found = await Business.findOne({
        _id: businessId,
        $or: [
            { owner: session.user.id },
            { "members.user": session.user.id },
        ]
    }).select({ _id: 1 });
    if (!found) throw new Error("Forbidden");
    return String(found._id);
}

export async function requireBusinessAccess(mode: "read" | "write") {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const cookieStore = await nextCookies();
    const businessId = cookieStore.get("businessId")?.value;
    if (!businessId) throw new Error("No business selected");
    await connectToDB();
    const biz = await Business.findById(businessId).select({ owner: 1, members: 1 });
    if (!biz) throw new Error("Forbidden");
    let role: "admin" | "staff" | "viewer" = "viewer";
    if (session.user && String(biz.owner) === String(session.user.id)) role = "admin";
    else {
        const foundMember = (biz.members as Array<{ user: unknown; role: "admin" | "staff" | "viewer" }>).find((m) => String(m.user) === String(session.user?.id));
        role = foundMember?.role || "viewer";
    }
    if (mode === "write" && role === "viewer") {
        const err = new Error("Forbidden");
        throw err;
    }
    return { businessId: String(businessId), role };
}


