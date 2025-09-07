import { ReactNode } from "react";
import { auth, signOut } from "@/auth";
import Link from "next/link";
import BusinessSwitcher from "@/app/components/BusinessSwitcher";

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
      <header className="border-b card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">
              StockFlow
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
              <Link href="/dashboard/customers" className="hover:underline">
                Customers
              </Link>
              <Link href="/dashboard/expenses" className="hover:underline">
                Expenses
              </Link>
              <Link href="/dashboard/suppliers" className="hover:underline">
                Suppliers
              </Link>
            </nav>
            <BusinessSwitcher />
          </div>
          <form action={doSignOut}>
            <button type="submit" className="btn btn-outline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
