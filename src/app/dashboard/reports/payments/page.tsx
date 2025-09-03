"use client";
import { useEffect, useState } from "react";

type Row = { _id: { period: string; method?: string }; amount: number; count: number };

export default function PaymentsSummaryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");
  const [byMethod, setByMethod] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/reports/payments?granularity=${granularity}&byMethod=${byMethod}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows);
        setTotal(data.total);
      }
      setLoading(false);
    })();
  }, [granularity, byMethod]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Payments Summary</h1>
      <div className="flex items-center gap-3">
        <label className="text-sm">Granularity</label>
        <select className="px-2 py-2 rounded border" value={granularity} onChange={(e) => setGranularity(e.target.value as any)}>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
        <label className="text-sm inline-flex items-center gap-2">
          <input type="checkbox" checked={byMethod} onChange={(e) => setByMethod(e.target.checked)} /> Group by method
        </label>
      </div>
      <div className="rounded card p-4">
        <div className="text-sm text-gray-600">Total Received</div>
        <div className="text-xl font-semibold">{total.toFixed(2)}</div>
      </div>
      <div className="overflow-hidden rounded card">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="text-left p-3">Period</th>
              {byMethod && <th className="text-left p-3">Method</th>}
              <th className="text-left p-3">Count</th>
              <th className="text-left p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={byMethod ? 4 : 3}>Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={byMethod ? 4 : 3}>No data</td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3">{r._id.period}</td>
                  {byMethod && <td className="p-3">{r._id.method}</td>}
                  <td className="p-3">{r.count}</td>
                  <td className="p-3">{Number(r.amount).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


