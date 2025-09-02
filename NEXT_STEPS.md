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
    depends_on: [T1.2, T0.3]
    files:
      - src/app/api/products/stock/route.ts
      - src/app/api/sales/route.ts
      - src/app/api/purchase-orders/[id]/route.ts
    acceptance:
      - All stock changes go through inventory service.
  - id: T2.1
    name: Enhance PO receipt endpoint with partial receipts and costing
    depends_on: [T1.2, T0.3]
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
    depends_on: [T3.1, T1.2, T0.3]
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
    depends_on: [T4.1, T3.2, T0.3]
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
  - id: T5.4
    name: Payments received summary report
    depends_on: [T4.4]
    files:
      - src/app/api/reports/payments/route.ts
      - src/app/dashboard/reports/payments/page.tsx
    acceptance:
      - Aggregates payments by period (and optionally by method).
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
    depends_on: [T13.1]
    files:
      - src/lib/business.ts
      - src/app/api/**
    acceptance:
      - Read/write checks and role mapping enforced.
      - Staff limited to: sales (create/confirm/deliver/cancel), invoices, payments, stock search.
      - Staff cannot: purchasing (PO/receipts), product type/schema edits, expenses, user/membership management.
  - id: T9.1
    name: Dashboard KPIs use reports (accurate profit)
    depends_on: [T5.1, T13.1]
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
  - id: T12.1
    name: Create Customer model and API
    depends_on: []
    files:
      - src/lib/models/customer.ts
      - src/app/api/customers/route.ts
      - src/app/api/customers/[id]/route.ts
    acceptance:
      - Customer CRUD with business scoping; used in sales.
  - id: T12.2
    name: Add Customer UI pages
    depends_on: [T12.1]
    files:
      - src/app/dashboard/customers/page.tsx
    acceptance:
      - Customer list, create, edit, delete UI.
  - id: T13.1
    name: Fix role model mismatch (scope vs current)
    depends_on: []
    files:
      - src/lib/models/Business.ts
      - src/lib/business.ts
      - src/models/user.ts
    acceptance:
      - Roles match scope: ADMIN, MODERATOR, STAFF (not admin/staff/viewer).
  - id: T13.2
    name: Add global Admin role support
    depends_on: [T13.1]
    files:
      - src/models/user.ts
      - src/lib/business.ts
      - src/app/api/businesses/route.ts
    acceptance:
      - Global Admin can access all businesses; separate from business owners.
  - id: T13.3
    name: Add Membership model (separate from Business.members)
    depends_on: [T13.1]
    files:
      - src/lib/models/membership.ts
    acceptance:
      - Separate Membership collection as per scope.md domain model.
  - id: T14.1
    name: Add Business slug and status fields
    depends_on: []
    files:
      - src/lib/models/Business.ts
    acceptance:
      - Business has slug (for URLs) and status fields as per scope.
  - id: T14.2
    name: Add audit fields to all models
    depends_on: []
    files:
      - src/lib/models/*.ts
    acceptance:
      - All models have createdAt, createdBy, updatedAt, updatedBy.
  - id: T14.3
    name: Normalize status enums per scope (PO/Sale)
    depends_on: []
    files:
      - src/lib/models/purchaseOrder.ts
      - src/lib/models/sale.ts
    acceptance:
      - PurchaseOrder status includes 'partially_received' and uses 'canceled'.
      - Sale status strings match: draft|confirmed|delivered|canceled.
  - id: T15.1
    name: Add AJV for dynamic ProductType validation
    depends_on: [T6.1, T8.1]
    files:
      - package.json
      - src/lib/validation/productAttributes.ts
    acceptance:
      - Product attributes validated against JSON Schema dynamically.
  - id: T15.2
    name: Add rate limiting to sensitive routes
    depends_on: []
    files:
      - src/middleware.ts
      - src/app/api/auth/**
      - src/app/api/invoices/**
    acceptance:
      - Auth and invoice generation routes are rate limited.
  - id: T16.1
    name: Add Sentry error tracking
    depends_on: []
    files:
      - package.json
      - src/lib/observability/sentry.ts
    acceptance:
      - Production errors tracked in Sentry.
  - id: T16.2
    name: Add structured logging with request IDs
    depends_on: []
    files:
      - src/lib/observability/logger.ts
      - src/middleware.ts
    acceptance:
      - All logs include request ID and businessId context.
  - id: T17.1
    name: Add data seeding script
    depends_on: [T13.1, T12.1]
    files:
      - scripts/seed.ts
    acceptance:
      - Admin user, sample businesses, products, transactions created.
  - id: T17.2
    name: Add environment validation
    depends_on: []
    files:
      - src/lib/config/env.ts
    acceptance:
      - Required env vars validated at startup.
  - id: T18.1
    name: Add TanStack Query for client-side data fetching
    depends_on: []
    files:
      - package.json
      - src/lib/providers/query.tsx
    acceptance:
      - Client-side caching and mutations use TanStack Query.
  - id: T18.2
    name: Add react-hook-form + Zod to forms
    depends_on: []
    files:
      - package.json
      - src/app/dashboard/**/page.tsx
    acceptance:
      - All forms use react-hook-form with Zod validation.
  - id: T19.1
    name: Add proper error boundaries
    depends_on: []
    files:
      - src/app/error.tsx
      - src/app/global-error.tsx
    acceptance:
      - Graceful error handling with user-friendly messages.
  - id: T19.2
    name: Add loading states and skeletons
    depends_on: []
    files:
      - src/app/dashboard/**/page.tsx
      - src/app/components/LoadingSkeleton.tsx
    acceptance:
      - All pages show loading states during data fetching.
  - id: T20.1
    name: Add proper TypeScript strict mode
    depends_on: []
    files:
      - tsconfig.json
      - src/**/*.ts
    acceptance:
      - No TypeScript errors in strict mode.
  - id: T20.2
    name: Add ESLint rules for code quality
    depends_on: []
    files:
      - eslint.config.mjs
    acceptance:
      - Consistent code style and best practices enforced.
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
  - Route: `/(dashboard)/invoices/[id]/print` rendering clean HTML and print CSS.
  - Files: `src/app/dashboard/invoices/[id]/print/page.tsx`.
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

### 12) Customer management (in scope)

- [ ] Create Customer model and API
  - Fields: `business`, `name`, `email?`, `phone?`, `address?`, `notes?`, `isActive`.
  - Endpoints: `GET/POST /api/customers`, `GET/PATCH/DELETE /api/customers/[id]`.
  - Files: `src/lib/models/customer.ts`, `src/app/api/customers/route.ts`, `src/app/api/customers/[id]/route.ts`.
- [ ] Add Customer UI pages
  - Customer list, create, edit, delete UI.
  - Files: `src/app/dashboard/customers/page.tsx`.

### 13) Role model fixes (scope mismatch)

- [ ] Fix role model mismatch (scope vs current)
  - Current: `admin | staff | viewer` in Business model
  - Scope: `ADMIN | MODERATOR | STAFF` in separate Membership model
  - Files: `src/lib/models/Business.ts`, `src/lib/business.ts`, `src/models/user.ts`.
- [ ] Add global Admin role support
  - Global Admin can access all businesses; separate from business owners.
  - Files: `src/models/user.ts`, `src/lib/business.ts`, `src/app/api/businesses/route.ts`.
- [ ] Add Membership model (separate from Business.members)
  - Separate Membership collection as per scope.md domain model.
  - Files: `src/lib/models/membership.ts`.

### 14) Model completeness (scope requirements)

- [ ] Add Business slug and status fields
  - Business has slug (for URLs) and status fields as per scope.
  - Files: `src/lib/models/Business.ts`.
- [ ] Add audit fields to all models
  - All models have `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
  - Files: `src/lib/models/*.ts`.

### 15) Advanced validation and security

- [ ] Add AJV for dynamic ProductType validation
  - Product attributes validated against JSON Schema dynamically.
  - Files: `package.json`, `src/lib/validation/productAttributes.ts`.
- [ ] Add rate limiting to sensitive routes
  - Auth and invoice generation routes are rate limited.
  - Files: `src/middleware.ts`, `src/app/api/auth/**`, `src/app/api/invoices/**`.

### 16) Observability and monitoring

- [ ] Add Sentry error tracking
  - Production errors tracked in Sentry.
  - Files: `package.json`, `src/lib/observability/sentry.ts`.
- [ ] Add structured logging with request IDs
  - All logs include request ID and businessId context.
  - Files: `src/lib/observability/logger.ts`, `src/middleware.ts`.

### 17) Development and deployment tools

- [ ] Add data seeding script
  - Admin user, sample businesses, products, transactions created.
  - Files: `scripts/seed.ts`.
- [ ] Add environment validation
  - Required env vars validated at startup.
  - Files: `src/lib/config/env.ts`.

### 18) Frontend architecture (scope requirements)

- [ ] Add TanStack Query for client-side data fetching
  - Client-side caching and mutations use TanStack Query.
  - Files: `package.json`, `src/lib/providers/query.tsx`.
- [ ] Add react-hook-form + Zod to forms
  - All forms use react-hook-form with Zod validation.
  - Files: `package.json`, `src/app/dashboard/**/page.tsx`.

### 19) User experience improvements

- [ ] Add proper error boundaries
  - Graceful error handling with user-friendly messages.
  - Files: `src/app/error.tsx`, `src/app/global-error.tsx`.
- [ ] Add loading states and skeletons
  - All pages show loading states during data fetching.
  - Files: `src/app/dashboard/**/page.tsx`, `src/app/components/LoadingSkeleton.tsx`.

### 20) Code quality and standards

- [ ] Add proper TypeScript strict mode
  - No TypeScript errors in strict mode.
  - Files: `tsconfig.json`, `src/**/*.ts`.
- [ ] Add ESLint rules for code quality
  - Consistent code style and best practices enforced.
  - Files: `eslint.config.mjs`.

## Notes and Decisions

- Profit recognition at delivery; no backorders.
- No VAT/tax logic; tax fields can remain 0 for now.
- Single warehouse; variant matrix currently present—can keep for MVP, or refactor to attribute-only later.

## Suggested sequencing (timeline)

1. Safety and tenancy fixes (0.5–1 day)
2. Role model fixes and Customer management (1–2 days)
3. Model completeness and audit fields (0.5–1 day)
4. Inventory backbone with transactions (3–5 days)
5. PO receipt and moving average (1–2 days)
6. Sales lifecycle + invoices + payments (4–6 days)
7. Reporting (2–3 days)
8. Product attributes/product types (2–4 days; optional now)
9. Audit logging (2–3 days)
10. Frontend architecture improvements (2–3 days)
11. Observability and monitoring (1–2 days)
12. Development tools and seeding (1–2 days)
13. UX improvements and code quality (ongoing)
14. Validation/tests/polish (ongoing)

## Key Missing Items Identified

### Critical Gaps (Must Fix)
1. **Customer Management**: No Customer model or UI (required for sales)
2. **Role Model Mismatch**: Current `admin/staff/viewer` vs scope `ADMIN/MODERATOR/STAFF`
3. **Missing Membership Model**: Scope requires separate Membership collection
4. **Global Admin Role**: No support for global Admin accessing all businesses
5. **Audit Fields**: Missing `createdBy`, `updatedBy` on all models
6. **Business Fields**: Missing `slug` and `status` fields

### Architecture Gaps
1. **Frontend Stack**: Missing TanStack Query and react-hook-form (per scope)
2. **Validation**: No AJV for dynamic ProductType validation
3. **Observability**: No Sentry, structured logging, or request IDs
4. **Security**: No rate limiting on sensitive routes
5. **Error Handling**: No error boundaries or proper loading states

### Development Experience
1. **Data Seeding**: No script to create sample data
2. **Environment Validation**: No startup validation of required env vars
3. **Code Quality**: TypeScript not in strict mode, basic ESLint rules
4. **Testing**: No test setup or structure

### UI/UX Gaps
1. **Customer Pages**: No customer management UI
2. **Loading States**: No skeletons or loading indicators
3. **Error Boundaries**: No graceful error handling
4. **Form Validation**: No client-side validation with Zod

These additions bring the total task count from 43 to 67 tasks, ensuring complete alignment with scope.md requirements.
