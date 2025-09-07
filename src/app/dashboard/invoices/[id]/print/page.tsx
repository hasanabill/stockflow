import connectToDB from "@/lib/mongodb";
import { requireBusiness } from "@/lib/business";
import Invoice from "@/lib/models/invoice";
import Sale from "@/lib/models/sale";
import Business from "@/lib/models/Business";

export default async function InvoicePrintPage({ params }: any) {
    await connectToDB();
    const businessId = await requireBusiness();
    const invoice = await Invoice.findOne({ _id: params.id, business: businessId }).lean();
    if (!invoice) {
        return (
            <main className="p-8">
                <p>Invoice not found.</p>
            </main>
        );
    }

    const sale = await Sale.findOne({ _id: invoice.sale, business: businessId }).lean();
    const business = await Business.findById(businessId).lean();

    const issuedAt = new Date(invoice.issuedAt).toLocaleDateString();

    return (
        <main className="invoice">
            <style>{`
                @media print {
                    @page { size: A4; margin: 16mm; }
                    .no-print { display: none !important; }
                }
                body { color: #111; }
                .invoice { max-width: 800px; margin: 0 auto; padding: 24px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
                header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px 0; }
                h2 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; }
                table { width: 100%; border-collapse: collapse; }
                thead th { text-align: left; border-bottom: 1px solid #e5e7eb; padding: 8px; font-weight: 600; font-size: 12px; }
                tbody td { padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
                .totals { margin-top: 16px; display: grid; gap: 4px; justify-content: end; font-size: 14px; }
                .kvs { font-size: 12px; color: #4b5563; }
                .actions { margin: 16px 0; }
                .btn { display: inline-block; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 12px; }
            `}</style>

            <div className="actions no-print">
                <button className="btn" onClick={() => { if (typeof window !== "undefined") window.print(); }}>Print</button>
            </div>

            <header>
                <div>
                    <h1>Invoice {invoice.invoiceNumber}</h1>
                    <div className="kvs">Date: {issuedAt}</div>
                    <div className="kvs">Business: {business?.name ?? ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    {/* Placeholder for logo or address */}
                    <div className="kvs">Amount: {Number(invoice.amount).toFixed(2)}</div>
                    <div className="kvs">Paid: {Number(invoice.amountPaid).toFixed(2)}</div>
                </div>
            </header>

            <section>
                <h2>Items</h2>
                <table>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale?.items?.map((it, idx) => (
                            <tr key={idx}>
                                <td>{it.variantSku}</td>
                                <td>{it.quantity}</td>
                                <td>{Number(it.unitPrice).toFixed(2)}</td>
                                <td>{Number(it.lineTotal).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="totals">
                <div>Subtotal: {Number(sale?.subtotal ?? 0).toFixed(2)}</div>
                <div>Discount: {Number(sale?.discount ?? 0).toFixed(2)}</div>
                <div>Tax: {Number(sale?.tax ?? 0).toFixed(2)}</div>
                <div><strong>Grand Total: {Number(sale?.total ?? 0).toFixed(2)}</strong></div>
            </section>

            <footer style={{ marginTop: 24 }}>
                <p className="kvs">Thank you for your business.</p>
            </footer>
        </main>
    );
}


