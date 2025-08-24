import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          title="Add to stock"
          href="/dashboard/stock"
          description="Receive new inventory and adjust quantities"
        />
        <Card
          title="Record sale"
          href="/dashboard/sales"
          description="Sell items and reduce available stock"
        />
        <Card
          title="Manage products"
          href="/dashboard/products"
          description="Create and edit product details"
        />
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a href={href} className="block rounded border p-4 hover:bg-white/5">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </a>
  );
}
