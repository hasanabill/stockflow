import { ReactNode } from "react";
import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/signin" });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">
              Fatema Fashion House
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="hover:underline">
                Overview
              </Link>
              <Link href="/dashboard/stock" className="hover:underline">
                Stock
              </Link>
              <Link href="/dashboard/sales" className="hover:underline">
                Sales
              </Link>
              <Link href="/dashboard/products" className="hover:underline">
                Products
              </Link>
            </nav>
          </div>
          <form action={doSignOut}>
            <button type="submit" className="text-sm border px-3 py-1 rounded">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
