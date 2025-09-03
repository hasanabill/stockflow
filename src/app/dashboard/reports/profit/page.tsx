"use client";
import { useEffect, useState } from "react";

type ProfitResponse = {
  from: string;
  to: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
};

export default function ProfitReportPage() {
  const [data, setData] = useState<ProfitResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/reports/profit`);
      if (res.ok) setData(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!data) return <div className="p-6">No data</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Profit Report</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Revenue" value={data.revenue} />
        <Card title="COGS" value={data.cogs} />
        <Card title="Gross Profit" value={data.grossProfit} />
        <Card title="Expenses" value={data.expenses} />
        <Card title="Net Profit" value={data.netProfit} />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded card p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xl font-semibold">{value.toFixed(2)}</div>
    </div>
  );
}


