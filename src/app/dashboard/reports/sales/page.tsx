"use client";
import { useEffect, useState } from "react";

type Row = { _id: string; count: number; total: number };

export default function SalesSummaryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/reports/sales?granularity=${granularity}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows);
      }
      setLoading(false);
    })();
  }, [granularity]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sales Summary</h1>
      <div className="flex items-center gap-2">
        <label className="text-sm">Granularity</label>
        <select
          className="px-2 py-2 rounded border"
          value={granularity}
          onChange={(e) => setGranularity(e.target.value as any)}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
      <div className="overflow-hidden rounded card">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="text-left p-3">Period</th>
              <th className="text-left p-3">Orders</th>
              <th className="text-left p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={3}>Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={3}>No data</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="p-3">{r._id}</td>
                  <td className="p-3">{r.count}</td>
                  <td className="p-3">{Number(r.total).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


