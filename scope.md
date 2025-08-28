## Small-Scale Multi-Tenant Retail ERP — Project Scope and Implementation Plan

### Purpose

Build a focused, small-scale ERP for retail businesses starting with clothing, with the ability to add more business lines (e.g., gadgets) later. The system tracks incoming/outgoing products, records money in (sales payments) and money out (expenses), and reports profit. Data is strictly isolated per business (tenant) while allowing an Admin to view all businesses.

### Audience

Owner-operator (Admin) and trusted team members (Moderator, Staff) running one or more businesses within the same application instance.

## Decisions and Assumptions

- Single MongoDB database (soft isolation) with strict per-business scoping via `businessId` on all documents.
- Products support flexible custom attributes using a JSON-schema-driven approach (no variant matrix initially).
- One warehouse/location (no multi-warehouse).
- No tax/VAT handling initially (all prices are tax-inclusive or tax-agnostic).
- Block backorders: cannot confirm sales with insufficient stock.
- Invoices are rendered as HTML for browser printing; PDF export can rely on “Print to PDF”.
- Payments are recorded manually (no payment gateways).
- Profit recognition on delivery of the sale.
- Default numbering format: `INV-YYYY-000001`, `PO-YYYY-000001`. Can be configured later per business.

## Roles and Access Model

- **Admin (global)**: Full access to all businesses and data. Manage businesses and memberships.
- **Moderator (per business)**: Full access within assigned business. Can manage products, purchasing, sales, invoices, payments, expenses, and staff assignments within that business.
- **Staff (per business)**: Limited to creating/confirming sales, generating invoices, setting delivery/cancel, searching stock, and (optionally) creating customers. No purchasing, no product type/schema editing, no expenses, no user management.

Enforcement:

- Session includes `userId` and the currently selected `businessId` (chosen via a selector UI). Admin can switch to any business; Moderator/Staff are restricted to assigned businesses.
- Service-layer guards validate the caller’s role and ensure all queries are scoped by `businessId`.

## Architecture Overview

- **Frontend**: Next.js 15 App Router, TypeScript, Tailwind CSS, react-hook-form + Zod, TanStack Query where client-side fetching/mutations are needed.
- **Backend**: Next.js Route Handlers + Server Actions, service layer encapsulating business logic and MongoDB transactions.
- **Database**: MongoDB Atlas with Mongoose ODM. Transactions ensure consistency across ledger and inventory snapshot.
- **Auth**: NextAuth.js (email/password or OAuth). Session stores `userId` and selected `businessId`.
- **Files**: No external storage required at MVP (HTML invoices). Optional S3/R2 later for persisted PDFs.
- **Observability**: Structured logs, request IDs, and Sentry for error tracking.

## Multi-Tenancy and Data Isolation

- Every document includes `businessId` and is only accessible to members of that business (except Admin).
- All reads/writes go through services that inject and validate `businessId`.
- Route handlers refuse requests where the entity’s `businessId` does not match the session business.

## Domain Model (Collections)

All collections include audit fields: `createdAt`, `createdBy`, `updatedAt`, `updatedBy` where applicable.

- **User**: Global users; fields: email, name, image, isActive.
- **Business**: Tenant; fields: name, slug, status, createdBy.
- **Membership**: Link `userId` to `businessId` with `role` in {ADMIN, MODERATOR, STAFF}.
- **ProductType**: Per-business JSON Schema for custom attributes (e.g., Clothing, Gadget).
- **Product**: Base fields: `sku`, `name`, `typeId?`, `attributes` (free-form per schema), `unit` (pcs/pair/etc.), `defaultPrice?`, `defaultCost?`, `isActive`.
- **Supplier**: Name, contact info.
- **Customer**: Name, contact info.
- **PurchaseOrder (PO)**: `poNumber`, `supplierId`, `status` in {draft, ordered, partially_received, received, canceled}, `items[{productId, qty, unitCost}]`, expectedDate?.
- **GoodsReceipt (GRN)**: For posted receipts against a PO, `items[{productId, qty, unitCost?}]`, `receivedAt`.
- **InventoryLedger**: Immutable stock movements with `delta` (+/-), `sourceType` (PO, GRN, SALE, SALE_CANCEL, ADJUSTMENT, RETURN), `sourceId`, and costing snapshots.
- **InventorySnapshot**: Per product snapshot: `onHand`, `allocated` (optional), `available`, `averageCost`.
- **Sale**: `status` in {draft, confirmed, delivered, canceled}, `items[{productId, qty, unitPrice, discount?}]`, totals.
- **Invoice**: `invoiceNumber`, `issuedAt`, `amount`, `amountPaid`, `saleId`, optional `htmlSnapshot`.
- **Payment**: Linked to `invoiceId`: amount, method, paidAt.
- **Expense**: category, description?, amount, date.
- **SequenceCounter**: Per-business counters for `invoice`, `po`, `order`, `grn`.
- **ActivityLog**: Who did what: `userId`, `entity`, `entityId`, `action`, `before`, `after`, `at`.

### Indexing (Minimum)

- `products`: unique `{ businessId: 1, sku: 1 }`, `{ businessId: 1, name: 1 }`, partial indexes on hot attributes (e.g., `attributes.size`).
- `inventorySnapshot`: unique `{ businessId: 1, productId: 1 }`.
- `inventoryLedger`: `{ businessId: 1, productId: 1, createdAt: -1 }`.
- `purchaseOrders`: unique `{ businessId: 1, poNumber: 1 }`, and `{ businessId: 1, status: 1, createdAt: -1 }`.
- `sales`: `{ businessId: 1, status: 1, createdAt: -1 }`.
- `invoices`: unique `{ businessId: 1, invoiceNumber: 1 }`.
- `payments`: `{ businessId: 1, invoiceId: 1 }`.
- `expenses`: `{ businessId: 1, date: -1 }`.
- `activityLogs`: `{ businessId: 1, entity: 1, entityId: 1, at: -1 }`.

## Costing Method

Use moving average cost per product per business.

- On GRN receipt: `newAvg = ((oldQty * oldAvg) + (receivedQty * unitCost)) / (oldQty + receivedQty)`; update `onHand += receivedQty`.
- On sale confirmation: ensure `available >= qty` (block backorders). COGS = `qty * averageCostAtPosting`. Reduce stock accordingly.
- On cancellation of confirmed sale: write compensating ledger entries to restore stock.

## Core Workflows

### 1) Product Types and Products

1. Moderator creates a `ProductType` with a JSON Schema for attributes. Example: Clothing schema includes size, color, GSM, grade.
2. Product create/edit forms are generated from the schema.
3. Product documents store base fields + `attributes` that conform to the type schema.
4. Search by SKU/name and filter by attributes.

### 2) Purchasing and Restocking

1. Create PO (draft) with supplier and items (qty, unitCost).
2. Mark as Ordered (locks quantities and price for receipt).
3. Receive goods (partial allowed) via GRN:
   - Post positive `delta` to `InventoryLedger` per line.
   - Update `InventorySnapshot` onHand and recompute `averageCost` using moving average.
   - Update PO status to `partially_received` or `received`.

### 3) Sales, Invoice, Delivery

1. Staff builds a Sale (draft) by searching products and adding items.
2. Confirm Sale:
   - Validate sufficient stock for each line.
   - Post negative `delta` to `InventoryLedger` per line with `averageCostAtPosting`.
   - Update `InventorySnapshot` to reduce onHand (and allocated if used).
   - Compute totals: subtotal, discount, grandTotal (no tax).
3. Generate Invoice (HTML):
   - Increment per-business invoice counter to get `invoiceNumber`.
   - Render HTML invoice for printing (print stylesheet).
   - Store invoice metadata; optionally store HTML snapshot.
4. Delivery and status updates:
   - Mark Delivered: set Sale status to delivered.
   - Cancel confirmed sale: reverse stock via compensating ledger and set status to canceled.
5. Record Payments: attach payments to invoice (cash/bank/other). Support partial payments.

### 4) Expenses

1. Add expenses with category, description, amount, date.
2. Reports aggregate expenses by period and category.

### 5) Stock Search and Availability

1. Stock page shows on-hand and available quantities by product.
2. Filters: by name/SKU and by attributes (e.g., size/color for clothing).
3. Low-stock indicators and optional reorder threshold field on product.

### 6) Audit Trail

- Every mutating action records an `ActivityLog` with before/after snapshots and actor information.

## Profit and Reporting

### Revenue, COGS, Profit

- Recognize revenue and COGS when a sale is marked Delivered.
- Revenue: sum of `sale.totals.grandTotal` for delivered sales in period.
- COGS: sum of `|delta| * averageCostAtPosting` from SALE ledger entries tied to those sales.
- Gross Profit = Revenue − COGS.
- Expenses: sum of expenses in period.
- Net Profit = Gross Profit − Expenses.

### Core Reports

- Profit (by month/period) per business.
- Sales summary (by day/week/month) and top products.
- Stock valuation (`onHand * averageCost`).
- Low stock list.
- Payments received summary.

## API Design (App Router)

- `POST /api/businesses` (Admin)
- `GET/POST /api/product-types`
- `GET/POST /api/products`, `PATCH /api/products/:id`
- `GET/POST /api/suppliers`, `GET/POST /api/customers`
- `POST /api/purchase-orders`, `POST /api/purchase-orders/:id/order`, `POST /api/purchase-orders/:id/receive`
- `POST /api/sales`, `POST /api/sales/:id/confirm`, `POST /api/sales/:id/deliver`, `POST /api/sales/:id/cancel`
- `POST /api/invoices/:saleId/create`
- `POST /api/payments`
- `GET/POST /api/expenses`
- `GET /api/reports/profit`, `GET /api/reports/sales`, `GET /api/reports/stock`, `GET /api/reports/expenses`

All endpoints:

- Derive `businessId` from the current session selection (Admin can override selection).
- Authorize role and membership.
- Validate input using Zod schemas.
- Call services that perform MongoDB transactions for stock/counters where needed.

## UI/UX Plan (Next.js App Router)

- Global business selector in the app header.
- `/(dashboard)/[businessId]/overview`: KPIs (today sales, low stock, stock value, profit this month).
- `/(dashboard)/[businessId]/products`: list/search; create/edit forms generated from ProductType schema.
- `/(dashboard)/[businessId]/purchase-orders`: list; create; receive (GRN).
- `/(dashboard)/[businessId]/stock`: availability and low stock.
- `/(dashboard)/[businessId]/sales`: list; create; confirm; deliver; cancel.
- `/(dashboard)/[businessId]/invoices`: list; view printable invoice.
- `/(dashboard)/[businessId]/customers` and `/suppliers`: basic CRUD.
- `/(dashboard)/[businessId]/expenses`: list/create.
- `/(dashboard)/[businessId]/reports/*`: profit, sales, stock valuation, expenses.
- `/(admin)/businesses`: manage businesses.
- `/(admin)/users`: manage memberships and roles.

### Invoice (Printable HTML)

- Dedicated print view: `/[businessId]/invoices/[invoiceId]/print` with print styles (A4, margins, page-break rules).
- Includes: business name/logo (optional), invoice number/date, customer info, items, totals, notes/footer.

## Validation and Security

- Never trust client-supplied `businessId`; derive from session business selection.
- Validate IDs to ensure the referenced entity’s `businessId` matches.
- Zod schemas for all inputs; `ajv` (or zod-bridge) for dynamic ProductType attribute validation.
- Rate-limit authentication and heavy routes (e.g., invoice generation).
- Use HTTPS in production; secure cookies for sessions.

## Sequence Counters

Atomic counter per business and key using `findOneAndUpdate` with `$inc` in a transaction.

```ts
await counters.findOneAndUpdate(
  { businessId, key: "invoice" },
  { $inc: { value: 1 }, $set: { updatedAt: new Date() } },
  { upsert: true, returnDocument: "after", session }
);
```

## Inventory Transaction Safety

- Wrap GRN postings and sale confirmations in a MongoDB session/transaction.
- Guard against insufficient stock during sale confirmation.
- Ledger is immutable; reversals use compensating entries.

## Error Handling and Observability

- Consistent error shapes returned by APIs with user-friendly messages.
- Sentry for server/runtime errors.
- Structured logs with request ID and `businessId` tagging.

## Data Seeding

- Admin user.
- Sample businesses (e.g., Clothing, Gadgets) to demonstrate multi-tenant behavior.
- Moderator and Staff memberships.
- Product types with example schemas (Clothing/Gadget).
- Sample products, suppliers, customers.
- Example PO → GRN, Sale → Invoice → Delivery, one Payment.
- A few expenses across categories.

## Configuration and Environment

- `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- Optional: `SENTRY_DSN`.
- Optional future: `STORAGE_BUCKET` and credentials for persistent PDFs.

## Testing Strategy

- Unit tests: sequence counters, moving average cost, stock guards, role permissions.
- Integration tests: PO receive updates snapshot and ledger; sale confirm reduces stock and records COGS; cancel reverses correctly.
- E2E smoke (Playwright): create sale → confirm → invoice → deliver → profit appears in report.

## Deployment

- Vercel (Node runtime for server actions and invoice rendering).
- MongoDB Atlas shared cluster.
- Protect environment variables; enable production logging and Sentry.

## Acceptance Criteria (MVP)

- Business selector with enforced role-based scoping.
- Products: CRUD with schema-driven attributes; search by SKU/name and attributes.
- Purchasing: PO → GRN updates stock and average cost.
- Sales: draft → confirm (stock check) → invoice (HTML) → deliver/cancel with correct ledger effects.
- Payments: record against invoice; totals update.
- Expenses: CRUD and reflected in profit report.
- Reports: profit (period), sales summary, stock valuation, low stock.
- Audit logging visible per entity.
- No backorders allowed.

## Roadmap — Phase 2 and Beyond

- Returns/RMAs: customer returns that restore stock and adjust profit.
- Supplier payments and payables tracking.
- CSV import/export for products and transactions.
- Fine-grained permissions and custom roles.
- Email invoices and automated PDF storage (S3/R2).
- Attribute index tuning and advanced search UX.
- Optional variant matrix (size/color grid) if needed later.

## Implementation Plan and Milestones

### Milestone 1: Foundations (Auth, Multi-tenancy, RBAC)

- NextAuth setup, session management, and role-based middleware.
- Models for User, Business, Membership.
- Admin UI to create businesses and assign roles.
- Global business selector and session persistence.

### Milestone 2: Product Types and Products

- ProductType CRUD with JSON Schema validation.
- Dynamic product forms from schema; Product CRUD.
- Product search with SKU/name and attribute filters.
- Indexes for product search and uniqueness.

### Milestone 3: Purchasing and Inventory

- PO CRUD → mark Ordered.
- GRN posting with transactions: ledger entries, snapshot updates, moving average cost.
- PO status transitions and partial receipts.
- Stock pages showing on-hand and available.

### Milestone 4: Sales, Invoices, Delivery

- Sale draft → confirm with stock validation and ledger postings.
- Invoice number allocation and HTML print view.
- Delivery and cancel flows with correct ledger effects.
- Payments recording against invoices.

### Milestone 5: Expenses and Reporting

- Expense CRUD and categories.
- Reports: profit (period), sales summary, stock valuation, low stock.
- Overview dashboard KPIs.

### Milestone 6: Audit, QA, and Deployment

- Activity log for key entities and UI timeline.
- Automated tests (unit/integration/E2E smoke).
- Production deployment (Vercel + Atlas), monitoring, and error tracking.

## Sample ProductType Schemas (JSON Schema)

```json
{
  "title": "Clothing",
  "type": "object",
  "properties": {
    "size": { "type": "string", "enum": ["XS", "S", "M", "L", "XL", "XXL"] },
    "color": { "type": "string" },
    "gsm": { "type": "number", "minimum": 0 },
    "grade": { "type": "string", "enum": ["A", "B", "C"] },
    "material": { "type": "string" }
  },
  "required": ["size", "color"],
  "additionalProperties": true
}
```

```json
{
  "title": "Gadget",
  "type": "object",
  "properties": {
    "brand": { "type": "string" },
    "model": { "type": "string" },
    "warrantyMonths": { "type": "integer", "minimum": 0 }
  },
  "required": ["brand", "model"],
  "additionalProperties": true
}
```

## Example Invoice HTML Structure (Print View)

```html
<main class="invoice">
  <header>
    <h1>Invoice INV-2025-000001</h1>
    <p>Date: 2025-01-05</p>
    <p>Business: Clothing Co.</p>
  </header>
  <section class="customer">
    <h2>Customer</h2>
    <p>Name: John Doe</p>
  </section>
  <table class="items">
    <thead>
      <tr>
        <th>SKU</th>
        <th>Name</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>TS-001</td>
        <td>T-Shirt</td>
        <td>2</td>
        <td>500</td>
        <td>1000</td>
      </tr>
    </tbody>
  </table>
  <section class="totals">
    <p>Subtotal: 1000</p>
    <p>Discount: 0</p>
    <p><strong>Grand Total: 1000</strong></p>
  </section>
  <footer>
    <p>Thank you for your business.</p>
  </footer>
</main>
```

## Glossary

- **Backorder**: Selling items not currently in stock. This system blocks sale confirmation if stock is insufficient.
- **COGS**: Cost of goods sold; computed from moving average cost at the time of posting.
- **GRN**: Goods Receipt Note; records receipt of goods against a PO.
- **Ledger (Inventory)**: Immutable record of stock movements; used to audit and reconstruct stock changes.
