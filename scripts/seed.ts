/*
 Seed script to create:
 - Admin user (global admin)
 - One business, membership
 - One product, supplier, customer
 - One PO -> receive
 - One sale -> invoice -> payment
*/
import mongoose from "mongoose";
import connectToDB from "@/lib/mongodb";
import User from "@/models/user";
import Business from "@/lib/models/Business";
import Membership from "@/lib/models/membership";
import Supplier from "@/lib/models/supplier";
import Product from "@/lib/models/product";
import Customer from "@/lib/models/customer";
import PurchaseOrder from "@/lib/models/purchaseOrder";
import { postReceipt, postSale } from "@/lib/services/inventory";
import Sale from "@/lib/models/sale";
import { getNextSequence } from "@/lib/utils/counters";
import Invoice from "@/lib/models/invoice";
import Payment from "@/lib/models/payment";

async function main() {
  await connectToDB();
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    // Admin user
    const email = "admin@example.com";
    const password = "admin1234";
    let admin = await User.findOne({ email }).session(session);
    if (!admin) {
      admin = await User.create([{ name: "Admin", email, password, role: "ADMIN", isGlobalAdmin: true }], { session }).then(d => d[0]);
    }

    // Business
    const bizName = "Demo Clothing";
    const slug = bizName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    let biz = await Business.findOne({ slug }).session(session);
    if (!biz) {
      biz = await Business.create([{ name: bizName, slug, status: "active", owner: admin._id, members: [] }], { session }).then(d => d[0]);
    }

    // Membership
    const membership = await Membership.findOneAndUpdate({ business: biz._id, user: admin._id }, { role: "ADMIN" }, { upsert: true, new: true, session });

    // Supplier
    const supplier = await Supplier.findOneAndUpdate(
      { business: biz._id, name: "Acme Textiles" },
      { email: "sales@acme.test" },
      { upsert: true, new: true, session }
    );

    // Product
    const product = await Product.findOneAndUpdate(
      { business: biz._id, name: "T-Shirt" },
      { category: "Tops", variants: [{ sku: "TS-001", size: "M", color: "Black", stockQuantity: 0 }] },
      { upsert: true, new: true, session }
    );

    // Customer
    const customer = await Customer.findOneAndUpdate(
      { business: biz._id, name: "John Doe" },
      { email: "john@example.com" },
      { upsert: true, new: true, session }
    );

    // PO
    const po = await PurchaseOrder.create([
      {
        reference: "PO-0001",
        supplier: supplier._id,
        status: "ordered",
        expectedDate: new Date(),
        items: [{ product: product._id, variantSku: "TS-001", quantityOrdered: 10, quantityReceived: 0, unitCost: 5, lineTotal: 50 }],
        subtotal: 50,
        tax: 0,
        total: 50,
        business: biz._id,
      },
    ], { session }).then(d => d[0]);

    // Receive goods
    await postReceipt({ businessId: String(biz._id), productId: String(product._id), variantSku: "TS-001", quantity: 10, unitCost: 5 });
    po.status = "received";
    po.receivedDate = new Date();
    await po.save({ session });

    // Sale
    const sale = await Sale.create([
      {
        items: [{ product: product._id, variantSku: "TS-001", quantity: 2, unitPrice: 10, lineTotal: 20 }],
        subtotal: 20,
        total: 20,
        status: "draft",
        business: biz._id,
      },
    ], { session }).then(d => d[0]);

    // Confirm sale (reduces stock)
    for (const item of sale.items) {
      await postSale({ businessId: String(biz._id), productId: String(item.product), variantSku: item.variantSku, quantity: item.quantity, sourceId: String(sale._id) });
    }
    sale.status = "confirmed";
    await sale.save({ session });

    // Invoice
    const seq = await getNextSequence({ businessId: String(biz._id), key: "invoice", session });
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(seq).padStart(6, "0")}`;
    const invoice = await Invoice.create([
      { business: biz._id, sale: sale._id, invoiceNumber, issuedAt: new Date(), amount: sale.total, amountPaid: 0 },
    ], { session }).then(d => d[0]);

    // Payment
    await Payment.create([{ business: biz._id, invoice: invoice._id, amount: 20, method: "cash", paidAt: new Date() }], { session });
    invoice.amountPaid = 20;
    await invoice.save({ session });
  });
  await session.endSession();
}

main().then(() => {
  console.log("Seed complete");
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});


