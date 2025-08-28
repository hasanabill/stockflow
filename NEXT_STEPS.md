## Implementation Next Steps (derived from scope.md)

This is a prioritized, actionable checklist to complete the application per `scope.md`. Each section lists concrete tasks, acceptance criteria, and key files to touch.

## Task Registry (machine-readable)

How to use:

- Each task has a unique `id`. Ask: "run <id>" or provide a list to batch.
- Do not change ids; add new ones if needed.

```yaml
version: 1
tasks:
  - id: T0.1
    name: Scope expense by-id routes to business
    depends_on: []
    files:
      - src/app/api/expenses/[id]/route.ts
    endpoints:
      - GET /api/expenses/[id]
      - PATCH /api/expenses/[id]
      - DELETE /api/expenses/[id]
    acceptance:
      - Accessing an expense from another business returns 404/403.
  - id: T0.2
    name: Per-business unique indexes (Supplier, PO ref, Variant SKU)
    depends_on: []
    files:
      - src/lib/models/supplier.ts
      - src/lib/models/purchaseOrder.ts
      - src/lib/models/product.ts
    acceptance:
      - Same supplier name/PO reference/SKU can exist in different businesses.
  - id: T0.3
    name: Enforce role-based write access
    depends_on: []
    files:
      - src/lib/business.ts
      - src/app/api/**
    acceptance:
      - Non-members and viewers cannot mutate business data.
  - id: T1.1
    name: Create InventoryLedger and InventorySnapshot models
    depends_on: []
    files:
      - src/lib/models/inventoryLedger.ts
      - src/lib/models/inventorySnapshot.ts
    acceptance:
      - Models created with proper indexes.
  - id: T1.2
    name: Implement inventory service with transactions
    depends_on: [T1.1]
    files:
      - src/lib/services/inventory.ts
    acceptance:
      - postReceipt and postSale update ledger+snapshot atomically.
  - id: T1.3
    name: Replace direct stock mutations with service calls
    depends_on: [T1.2]
    files:
      - src/app/api/products/stock/route.ts
      - src/app/api/sales/route.ts
      - src/app/api/purchase-orders/[id]/route.ts
    acceptance:
      - All stock changes go through inventory service.
  - id: T2.1
    name: Enhance PO receipt endpoint with partial receipts and costing
    depends_on: [T1.2]
    files:
      - src/app/api/purchase-orders/[id]/route.ts
    acceptance:
      - Partial receipts supported; moving average cost updates.
  - id: T2.2
    name: Add GoodsReceipt record (optional)
    depends_on: [T2.1]
    files:
      - src/lib/models/goodsReceipt.ts
    acceptance:
      - GRN persisted for audit (optional).
  - id: T3.1
    name: Extend Sale model with status field
    depends_on: []
    files:
      - src/lib/models/sale.ts
    acceptance:
      - Sale has status: draft|confirmed|delivered|canceled.
  - id: T3.2
    name: Split sales endpoints (create/confirm/deliver/cancel)
    depends_on: [T3.1, T1.2]
    files:
      - src/app/api/sales/route.ts
      - src/app/api/sales/[id]/confirm/route.ts
      - src/app/api/sales/[id]/deliver/route.ts
      - src/app/api/sales/[id]/cancel/route.ts
    acceptance:
      - Confirm validates stock; deliver marks completion; cancel restores stock if confirmed.
  - id: T3.3
    name: Update Sales UI with actions and statuses
    depends_on: [T3.2]
    files:
      - src/app/dashboard/sales/page.tsx
    acceptance:
      - UI can confirm/deliver/cancel; shows status.
  - id: T4.1
    name: Add SequenceCounter model and helper
    depends_on: []
    files:
      - src/lib/models/sequenceCounter.ts
      - src/lib/utils/counters.ts
    acceptance:
      - Atomic `$inc` counter per business key.
  - id: T4.2
    name: Add Invoice model and create endpoint
    depends_on: [T4.1, T3.2]
    files:
      - src/lib/models/invoice.ts
      - src/app/api/invoices/[saleId]/create/route.ts
    acceptance:
      - Invoice created with unique invoiceNumber per business.
  - id: T4.3
    name: Printable HTML invoice page
    depends_on: [T4.2]
    files:
      - src/app/dashboard/invoices/[id]/print/page.tsx
    acceptance:
      - Clean print view renders invoice for browser print.
  - id: T4.4
    name: Payment model and API (record-only)
    depends_on: [T4.2]
    files:
      - src/lib/models/payment.ts
      - src/app/api/payments/route.ts
    acceptance:
      - Payments recorded and invoice `amountPaid` updates.
  - id: T5.1
    name: Profit report API and page
    depends_on: [T3.2, T4.2]
    files:
      - src/app/api/reports/profit/route.ts
      - src/app/dashboard/reports/profit/page.tsx
    acceptance:
      - Net profit = revenue − COGS − expenses for period.
  - id: T5.2
    name: Sales summary report
    depends_on: [T3.2]
    files:
      - src/app/api/reports/sales/route.ts
      - src/app/dashboard/reports/sales/page.tsx
    acceptance:
      - Aggregates by day/week/month.
  - id: T5.3
    name: Stock valuation report
    depends_on: [T1.2]
    files:
      - src/app/api/reports/stock/route.ts
      - src/app/dashboard/reports/stock/page.tsx
    acceptance:
      - Sum of `onHand * averageCost` from snapshots.
  - id: T6.1
    name: Add ProductType and attributes validation (Option A)
    depends_on: []
    files:
      - src/lib/models/productType.ts
      - src/app/api/product-types/route.ts
      - src/lib/validation/productAttributes.ts
    acceptance:
      - Products validated against ProductType schema.
  - id: T6.2
    name: Add attributes bag to Product and UI (Option B)
    depends_on: []
    files:
      - src/lib/models/product.ts
      - src/app/dashboard/products/page.tsx
    acceptance:
      - Extra fields (gsm/grade/etc.) saved and shown.
  - id: T7.1
    name: ActivityLog model and emit logs
    depends_on: []
    files:
      - src/lib/models/activityLog.ts
      - src/lib/audit/logger.ts
    acceptance:
      - Mutations write structured audit entries.
  - id: T8.1
    name: Add Zod validation to APIs
    depends_on: []
    files:
      - src/lib/validation/**
      - src/app/api/**
    acceptance:
      - All inputs validated; clear errors returned.
  - id: T8.2
    name: Strengthen requireBusinessAccess across routes
    depends_on: []
    files:
      - src/lib/business.ts
      - src/app/api/**
    acceptance:
      - Read/write checks and role mapping enforced.
  - id: T9.1
    name: Dashboard KPIs use reports (accurate profit)
    depends_on: [T5.1]
    files:
      - src/app/dashboard/DashboardClient.tsx
    acceptance:
      - Profit uses delivered revenue − COGS − expenses API.
  - id: T9.2
    name: Invoices list page
    depends_on: [T4.2]
    files:
      - src/app/dashboard/invoices/page.tsx
    acceptance:
      - Lists invoices with print action.
  - id: T9.3
    name: Enhanced stock page (search/filters/low-stock)
    depends_on: []
    files:
      - src/app/dashboard/stock/page.tsx
    acceptance:
      - Search by SKU/name; low-stock view available.
  - id: T10.1
    name: Unit tests (counters, costing, guards, permissions)
    depends_on: [T1.2, T4.1]
    files:
      - tests/unit/**
    acceptance:
      - All unit tests pass locally.
  - id: T10.2
    name: Integration tests (PO receive, sale confirm/cancel)
    depends_on: [T2.1, T3.2]
    files:
      - tests/integration/**
    acceptance:
      - Key integration scenarios are green.
  - id: T10.3
    name: E2E smoke (sale→invoice→deliver→profit)
    depends_on: [T4.3, T5.1]
    files:
      - tests/e2e/**
    acceptance:
      - E2E path passes in CI.
  - id: T11.1
    name: Configure env and deploy
    depends_on: []
    files:
      - vercel config / env
    acceptance:
      - App deployed with proper env vars and monitoring.
```

### 0) Quick safety and tenancy fixes

- [ ] Scope by-id expense routes to the current business
  - Update `GET/PATCH/DELETE /api/expenses/[id]` to verify `business` matches selected `businessId`.
  - Acceptance: Accessing an expense from another business returns 404/403.
  - Files: `src/app/api/expenses/[id]/route.ts`.
- [ ] Enforce per-business uniqueness for key indexes
  - Supplier: change unique index from `{ name: 1 }` → `{ business: 1, name: 1 }`.
  - PurchaseOrder: change unique index from `{ reference: 1 }` → `{ business: 1, reference: 1 }`.
  - Product variant SKU: change unique index from `{ "variants.sku": 1 }` → `{ business: 1, "variants.sku": 1 }`.
  - Acceptance: Same supplier name/PO reference/SKU can exist in different businesses without conflicts.
  - Files: `src/lib/models/supplier.ts`, `src/lib/models/purchaseOrder.ts`, `src/lib/models/product.ts`.
- [ ] Enforce role-based write access
  - Use `requireBusinessAccess("write")` in write endpoints (POST/PATCH/PUT/DELETE) to block viewers.
  - Acceptance: Non-members and viewer role cannot mutate business data.
  - Files: All write handlers under `src/app/api/**`.

### 1) Inventory backbone (ledger + snapshot) with transactions

- [ ] Create `InventoryLedger` and `InventorySnapshot` models
  - Ledger fields: `business`, `productId`, optional `variantSku`, `delta`, `sourceType` (PO/GRN/SALE/SALE_CANCEL/ADJUSTMENT/RETURN), `sourceId`, `averageCostAtPosting`, `unitCostAtPosting`, `createdAt`.
  - Snapshot fields: `business`, `productId`, optional `variantSku`, `onHand`, `averageCost`, `updatedAt`.
  - Indexes: ledger `{ business, productId, createdAt }`; snapshot `{ business, productId, variantSku }` unique.
  - Files: `src/lib/models/inventoryLedger.ts`, `src/lib/models/inventorySnapshot.ts`.
- [ ] Implement a transaction-safe inventory service
  - Function: `postReceipt(businessId, productId, variantSku, qty, unitCost)`
    - Writes ledger `+qty`, recalculates moving average cost, updates snapshot.
  - Function: `postSale(businessId, productId, variantSku, qty)`
    - Validates sufficient stock; writes ledger `-qty` with `averageCostAtPosting`, updates snapshot.
  - Wrap in MongoDB session/transaction.
  - Files: `src/lib/services/inventory.ts`.
- [ ] Replace direct stock mutations with service calls
  - `POST /api/products/stock` → call `postReceipt`.
  - Sales creation → call `postSale` (or in confirm step if adding statuses; see section 3).
  - PO receipt (see section 2) → call `postReceipt` per line.
  - Acceptance: Stock changes are reflected in ledger and snapshot; errors rollback atomically.
  - Files: `src/app/api/products/stock/route.ts`, `src/app/api/sales/route.ts`, `src/app/api/purchase-orders/[id]/route.ts`.

### 2) Purchasing receive flow (GRN) and moving average cost

- [ ] Enhance PO receipt endpoint
  - Support partial receipts: accept received items array `{ product, variantSku, quantityReceived }` and increment only those.
  - For each received line: `postReceipt` with `unitCost` from PO line; recompute moving average.
  - Update PO status to `partially_received` or `received`; set `receivedDate`.
  - Acceptance: Multiple receipts against the same PO correctly update stock and costs.
  - Files: `src/app/api/purchase-orders/[id]/route.ts`.
- [ ] Optional: add a simple GRN record
  - Create `GoodsReceipt` model or embed receipt entries in PO for audit.
  - Files: `src/lib/models/goodsReceipt.ts` (optional), PO schema update.

### 3) Sales lifecycle and fulfillment

- [ ] Extend Sale model with statuses
  - Add `status: 'draft'|'confirmed'|'delivered'|'canceled'`.
  - Files: `src/lib/models/sale.ts`.
- [ ] Split sales endpoints
  - `POST /api/sales` creates a draft sale (no stock impact).
  - `POST /api/sales/:id/confirm` validates stock and calls `postSale` per line.
  - `POST /api/sales/:id/deliver` marks delivered (recognition point for revenue/COGS in reports).
  - `POST /api/sales/:id/cancel` reverses with compensating ledger if already confirmed.
  - Acceptance: Confirm fails on insufficient stock; deliver marks completion; cancel restores stock when needed.
  - Files: `src/app/api/sales/route.ts` (split or add nested routes), new handlers under `src/app/api/sales/[id]/`.
- [ ] Update Sales UI
  - Add actions for confirm/deliver/cancel and reflect statuses.
  - Files: `src/app/dashboard/sales/page.tsx`.

### 4) Invoicing and payments

- [ ] Add `SequenceCounter` model and helper
  - Per business `{ key: 'invoice'|'po'|'order'|'grn', value }`; atomic `$inc` with session.
  - Files: `src/lib/models/sequenceCounter.ts`, `src/lib/utils/counters.ts`.
- [ ] Add `Invoice` model and API
  - Fields: `business`, `saleId`, `invoiceNumber`, `issuedAt`, `amount`, `amountPaid`, optional `htmlSnapshot`.
  - Endpoint: `POST /api/invoices/:saleId/create` increments counter and persists invoice.
  - Files: `src/lib/models/invoice.ts`, `src/app/api/invoices/[saleId]/create/route.ts`.
- [ ] Printable HTML invoice page
  - Route: `/(dashboard)/[businessId]/invoices/[id]/print` rendering clean HTML and print CSS.
  - Files: `src/app/dashboard/[businessId]/invoices/[id]/print/page.tsx` (or adapt current layout).
- [ ] Add `Payment` model and API (record-only)
  - Fields: `business`, `invoiceId`, `amount`, `method`, `paidAt`, `notes?`.
  - Endpoint: `POST /api/payments` to record payments and update `amountPaid`.
  - Files: `src/lib/models/payment.ts`, `src/app/api/payments/route.ts`.

### 5) Reporting

- [ ] Profit report API and page
  - Revenue: sum of delivered sales totals in period.
  - COGS: sum of `|delta| * averageCostAtPosting` for SALE ledger entries linked to those sales.
  - Net Profit = Revenue − COGS − Expenses.
  - Endpoint: `GET /api/reports/profit?from&to`.
  - Files: `src/app/api/reports/profit/route.ts`, `src/app/dashboard/reports/profit/page.tsx`.
- [ ] Sales summary report (by day/week/month)
  - Endpoint: `GET /api/reports/sales?granularity=day&from&to`.
  - Files: `src/app/api/reports/sales/route.ts`, `src/app/dashboard/reports/sales/page.tsx`.
- [ ] Stock valuation report
  - Use snapshots: sum `onHand * averageCost`.
  - Endpoint: `GET /api/reports/stock`.
  - Files: `src/app/api/reports/stock/route.ts`, `src/app/dashboard/reports/stock/page.tsx`.

### 6) Products: attributes and/or product types (optional for MVP)

- Option A (per scope): schema-driven attributes
  - [ ] Add `ProductType` model with JSON Schema; add `attributes` to Product.
  - [ ] Validate attributes with AJV; generate forms on UI.
  - Files: `src/lib/models/productType.ts`, `src/app/api/product-types/route.ts`, product pages.
- Option B (keep current variants; add attributes bag)
  - [ ] Add `attributes: Record<string, any>` to Product for gsm/grade/etc.
  - [ ] UI inputs for attributes; optional indexing on hot attributes.
  - Files: `src/lib/models/product.ts`, `src/app/dashboard/products/page.tsx`.

### 7) Audit logging

- [ ] Add `ActivityLog` model and logger
  - Log `userId`, `businessId`, `entity`, `entityId`, `action`, `before`, `after`, `at`.
  - Wrap in service to emit logs on create/update/confirm/receive/deliver/cancel.
  - Files: `src/lib/models/activityLog.ts`, `src/lib/audit/logger.ts`.
- [ ] Display timelines in UI (optional in MVP)
  - Files: dedicated components or per-entity pages.

### 8) Validation, permissions, and resilience

- [ ] Add Zod schemas for all API payloads; centralize input parsing.
  - Files: `src/lib/validation/**` used by route handlers.
- [ ] Strengthen `requireBusinessAccess` usage across routes (read/write checks + role mapping).
  - Files: `src/lib/business.ts`, all API handlers.
- [ ] Add rate limiting to sensitive routes (auth, invoice generation) if needed.

### 9) UI/UX updates

- [ ] Dashboard KPIs: compute Profit using delivered revenue − COGS − expenses.
  - Files: `src/app/dashboard/DashboardClient.tsx` (fetch reports instead of raw sums for accuracy).
- [ ] Add invoices list page and print action.
  - Files: `src/app/dashboard/invoices/page.tsx`.
- [ ] Enhance stock page with SKU/name search and attribute filters; low-stock view.
  - Files: `src/app/dashboard/stock/page.tsx`.

### 10) Testing

- [ ] Unit tests
  - Counters increment atomically; moving average correctness; stock guards; role permissions.
- [ ] Integration tests
  - PO receive updates snapshot+ledger; sale confirm reduces stock and records COGS; cancel restores stock.
- [ ] E2E smoke
  - Create sale → confirm → invoice → deliver → profit reflects.
  - Files: `tests/**` (set up Jest/Vitest + Playwright as preferred).

### 11) Deployment and configuration

- [ ] Ensure env vars: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (and optional `SENTRY_DSN`).
- [ ] Deploy to Vercel (Node runtime for server actions and print view).
- [ ] Configure production logging and Sentry.

## Notes and Decisions

- Profit recognition at delivery; no backorders.
- No VAT/tax logic; tax fields can remain 0 for now.
- Single warehouse; variant matrix currently present—can keep for MVP, or refactor to attribute-only later.

## Suggested sequencing (timeline)

1. Safety and tenancy fixes (0.5–1 day)
2. Inventory backbone with transactions (3–5 days)
3. PO receipt and moving average (1–2 days)
4. Sales lifecycle + invoices + payments (4–6 days)
5. Reporting (2–3 days)
6. Product attributes/product types (2–4 days; optional now)
7. Audit logging (2–3 days)
8. Validation/tests/polish (ongoing)
