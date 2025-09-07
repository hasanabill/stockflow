import connectToDB from "@/lib/mongodb";
import Business from "@/lib/models/Business";
import { auth } from "@/auth";
import BusinessListClient from "@/app/businesses/BusinessListClient";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  await connectToDB();
  const userId = session.user.id;
  const businesses = await Business.find({
    $or: [{ owner: userId }, { "members.user": userId }],
  })
    .select({ name: 1, description: 1 })
    .lean();

  const plain = (businesses || []).map((b: any) => ({
    _id: String(b._id),
    name: b.name as string,
    slug: b.slug as string,
    status: (b.status as string) || "active",
    description: (b.description as string) || "",
  }));

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Your businesses</h1>
        </div>
        <BusinessListClient businesses={plain} />
      </div>
    </div>
  );
}


