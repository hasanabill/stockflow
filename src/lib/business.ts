import { auth } from "@/auth";
import { cookies as nextCookies } from "next/headers";
import connectToDB from "@/lib/mongodb";
import Business from "@/lib/models/Business";
import User from "@/models/user";

export async function requireBusiness() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const cookieStore = await nextCookies();
    const businessId = cookieStore.get("businessId")?.value;
    if (!businessId) throw new Error("No business selected");
    await connectToDB();
    // Allow global admin to access any business
    const me = await User.findById(session.user.id).select({ isGlobalAdmin: 1 });
    const found = me?.isGlobalAdmin
        ? await Business.findById(businessId).select({ _id: 1 })
        : await Business.findOne({
            _id: businessId,
            $or: [
                { owner: session.user.id },
                { "members.user": session.user.id },
            ]
        }).select({ _id: 1 });
    if (!found) throw new Error("Forbidden");
    return String(found._id);
}

export async function requireBusinessAccess(mode: "read" | "write", resource?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const cookieStore = await nextCookies();
    const businessId = cookieStore.get("businessId")?.value;
    if (!businessId) throw new Error("No business selected");
    await connectToDB();
    const me = await User.findById(session.user.id).select({ isGlobalAdmin: 1 });
    const biz = await Business.findById(businessId).select({ owner: 1, members: 1 });
    if (!biz) throw new Error("Forbidden");
    if (me?.isGlobalAdmin) {
        return { businessId: String(businessId), role: "ADMIN" };
    }
    let role: "ADMIN" | "MODERATOR" | "STAFF" = "STAFF";
    if (session.user && String(biz.owner) === String(session.user.id)) role = "ADMIN";
    else {
        const foundMember = (biz.members as Array<{ user: unknown; role: "ADMIN" | "MODERATOR" | "STAFF" }>).find((m) => String(m.user) === String(session.user?.id));
        role = foundMember?.role || "STAFF";
    }

    // Check permissions based on role and resource
    if (role === "STAFF" && mode === "write") {
        const staffAllowedResources = [
            "sales", "invoices", "payments", "stock"
        ];
        if (!resource || !staffAllowedResources.some(r => resource.startsWith(r))) {
            throw new Error("Forbidden: Staff cannot perform write operations on this resource");
        }
    }

    return { businessId: String(businessId), role };
}

// Helper function for specific permission checks
export function hasPermission(role: "ADMIN" | "MODERATOR" | "STAFF", mode: "read" | "write", resource: string): boolean {
    // ADMIN can do everything
    if (role === "ADMIN") return true;

    // MODERATOR can do most things except user management
    if (role === "MODERATOR") {
        if (resource.startsWith("users") || resource.startsWith("memberships")) return false;
        return true;
    }

    // STAFF restrictions
    if (role === "STAFF") {
        if (mode === "write") {
            const staffAllowedResources = [
                "sales", "invoices", "payments", "stock"
            ];
            return staffAllowedResources.some(r => resource.startsWith(r));
        }
        // STAFF can read most things except sensitive data
        return !resource.startsWith("users") && !resource.startsWith("memberships");
    }

    return false;
}


