"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Recharts for client-only rendering
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), {
  ssr: false,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), {
  ssr: false,
});
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), {
  ssr: false,
});
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), {
  ssr: false,
});
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), {
  ssr: false,
});
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), {
  ssr: false,
});

type Variant = {
  sku: string;
  size?: string;
  color?: string;
  stockQuantity: number;
  reorderLevel?: number;
};
type Product = { _id: string; name: string; variants: Variant[] };
type Sale = {
  _id: string;
  createdAt: string;
  items: {
    product: string;
    variantSku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  total: number;
};
type Expense = { _id: string; date: string; category: string; amount: number };

export default function DashboardClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [prodRes, saleRes, expRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/sales"),
        fetch("/api/expenses"),
      ]);
      setProducts(await prodRes.json());
      setSales(await saleRes.json());
      setExpenses(await expRes.json());
      setLoading(false);
    })();
  }, []);

  const totalStock = useMemo(
    () =>
      products.reduce(
        (sum, p) =>
          sum + p.variants.reduce((s, v) => s + (v.stockQuantity || 0), 0),
        0
      ),
    [products]
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  ).getTime();

  const monthSalesTotal = useMemo(
    () =>
      sales
        .filter(
          (s) =>
            new Date(s.createdAt).getTime() >= monthStart &&
            new Date(s.createdAt).getTime() <= monthEnd
        )
        .reduce((sum, s) => sum + (s.total || 0), 0),
    [sales, monthStart, monthEnd]
  );

  const monthExpensesTotal = useMemo(
    () =>
      expenses
        .filter((e) => {
          const t = new Date(e.date).getTime();
          return t >= monthStart && t <= monthEnd;
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses, monthStart, monthEnd]
  );

  const profit = useMemo(
    () => monthSalesTotal - monthExpensesTotal,
    [monthSalesTotal, monthExpensesTotal]
  );

  // Sales trend (daily totals for this month)
  const salesTrend = useMemo(() => {
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const base: Record<string, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      base[d.toString()] = 0;
    }
    sales.forEach((s) => {
      const d = new Date(s.createdAt);
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        base[d.getDate().toString()] += s.total || 0;
      }
    });
    return Object.keys(base).map((day) => ({
      day,
      total: Number(base[day].toFixed(2)),
    }));
  }, [sales]);

  // Top selling products (by quantity across all sales)
  const topSelling = useMemo(() => {
    const qtyByProduct: Record<string, number> = {};
    sales.forEach((s) =>
      s.items.forEach((i) => {
        qtyByProduct[i.product] =
          (qtyByProduct[i.product] || 0) + (i.quantity || 0);
      })
    );
    const nameById: Record<string, string> = Object.fromEntries(
      products.map((p) => [p._id, p.name])
    );
    return Object.entries(qtyByProduct)
      .map(([productId, qty]) => ({
        name: nameById[productId] || productId.slice(-5),
        qty,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, products]);

  // Expense categories (this month)
  const expenseCategories = useMemo(() => {
    const byCat: Record<string, number> = {};
    expenses.forEach((e) => {
      const t = new Date(e.date).getTime();
      if (t >= monthStart && t <= monthEnd) {
        byCat[e.category] = (byCat[e.category] || 0) + (e.amount || 0);
      }
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [expenses, monthStart, monthEnd]);

  // Low stock variants
  const lowStockVariants = useMemo(() => {
    const rows: {
      product: string;
      sku: string;
      size?: string;
      color?: string;
      stock: number;
      reorder?: number;
    }[] = [];
    products.forEach((p) =>
      p.variants.forEach((v) => {
        const threshold = v.reorderLevel ?? 5;
        if ((v.stockQuantity || 0) <= threshold) {
          rows.push({
            product: p.name,
            sku: v.sku,
            size: v.size,
            color: v.color,
            stock: v.stockQuantity || 0,
            reorder: v.reorderLevel,
          });
        }
      })
    );
    return rows;
  }, [products]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Stock"
          value={loading ? "-" : totalStock.toString()}
        />
        <KpiCard
          title="Sales This Month"
          value={loading ? "-" : monthSalesTotal.toFixed(2)}
        />
        <KpiCard
          title="Expenses This Month"
          value={loading ? "-" : monthExpensesTotal.toFixed(2)}
        />
        <KpiCard title="Profit" value={loading ? "-" : profit.toFixed(2)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded border p-4">
          <div className="font-medium mb-2">Sales Trend (This Month)</div>
          <div className="h-64">
            {typeof window === "undefined" ? null : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={salesTrend}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded border p-4">
          <div className="font-medium mb-2">Top Selling Products</div>
          <div className="h-64">
            {typeof window === "undefined" ? null : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSelling}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-15}
                    height={60}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="qty" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded border p-4 lg:col-span-2">
          <div className="font-medium mb-2">
            Expense Categories (This Month)
          </div>
          <div className="h-64">
            {typeof window === "undefined" ? null : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Low stock */}
      <div className="rounded border p-4">
        <div className="font-medium mb-2">Low Stock Alerts</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5">
              <tr>
                <th className="text-left p-2">Product</th>
                <th className="text-left p-2">SKU</th>
                <th className="text-left p-2">Size</th>
                <th className="text-left p-2">Color</th>
                <th className="text-left p-2">Stock</th>
                <th className="text-left p-2">Reorder</th>
              </tr>
            </thead>
            <tbody>
              {lowStockVariants.length === 0 ? (
                <tr>
                  <td className="p-2" colSpan={6}>
                    All good! No low stock.
                  </td>
                </tr>
              ) : (
                lowStockVariants.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{row.product}</td>
                    <td className="p-2">{row.sku}</td>
                    <td className="p-2">{row.size || "-"}</td>
                    <td className="p-2">{row.color || "-"}</td>
                    <td className="p-2">{row.stock}</td>
                    <td className="p-2">{row.reorder ?? 5}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded border p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
];
