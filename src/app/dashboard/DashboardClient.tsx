"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

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
type ProfitData = {
  from: string;
  to: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
};

export default function DashboardClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [prodRes, saleRes, expRes, profitRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/sales"),
        fetch("/api/expenses"),
        fetch("/api/reports/profit"),
      ]);
      setProducts(await prodRes.json());
      setSales(await saleRes.json());
      setExpenses(await expRes.json());
      setProfitData(await profitRes.json());
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

  // Use accurate profit data from reports API
  const revenue = profitData?.revenue || 0;
  const cogs = profitData?.cogs || 0;
  const grossProfit = profitData?.grossProfit || 0;
  const expenseTotal = profitData?.expenses || 0;
  const netProfit = profitData?.netProfit || 0;

  const now = new Date();

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

  // Expense categories (this month) - using local expenses data for detailed breakdown
  const expenseCategories = useMemo(() => {
    const byCat: Record<string, number> = {};
    expenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + (e.amount || 0);
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [expenses]);

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
          title="Revenue This Month"
          value={loading ? "-" : revenue.toFixed(2)}
        />
        <KpiCard
          title="Expenses This Month"
          value={loading ? "-" : expenseTotal.toFixed(2)}
        />
        <KpiCard title="Net Profit" value={loading ? "-" : netProfit.toFixed(2)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded card p-4">
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

        <div className="rounded card p-4">
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

        <div className="rounded card p-4 lg:col-span-2">
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
      <div className="rounded card p-4">
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
    <div className="rounded card p-4">
      <div className="text-sm muted">{title}</div>
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
