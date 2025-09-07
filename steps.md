## Remaining (maybe)

S1 — Replace require() in reports with ObjectId imports
- deps: none
- files: `src/app/api/reports/*/route.ts`
- AC: use `import { Types } from "mongoose"; new Types.ObjectId(businessId)`; no require() usage

S2 — Populate createdBy/updatedBy on create/update APIs
- deps: none
- files: all mutating routes under `src/app/api/**`
- AC: createdBy set on create; updatedBy set on update using `auth()` user.id

S3 — Add Purchase Order create/order endpoints
- deps: none
- files: `src/app/api/purchase-orders/route.ts` (POST), `src/app/api/purchase-orders/[id]/route.ts` (PUT order)
- AC: server computes subtotal/total; status transitions: draft→ordered

S4 — Wire sales UI actions for deliver and cancel
- deps: none
- files: `src/app/dashboard/sales/page.tsx`
- AC: buttons call `/api/sales/[id]/deliver` and `/api/sales/[id]/cancel` and refresh list

S5 — Invoices list UI
- deps: none
- files: `src/app/dashboard/invoices/page.tsx`
- AC: lists invoices; print action links to `/dashboard/invoices/[id]/print`

S6 — Payments create UI
- deps: S5
- files: `src/app/dashboard/invoices/page.tsx` or a modal component
- AC: form posts to `/api/payments`; invoice.amountPaid reflects new total

S7 — Customers page: search + pagination
- deps: none
- files: `src/app/dashboard/customers/page.tsx`, `/api/customers`
- AC: client-side search; simple pagination (limit/skip)

S8 — Use Membership collection in access checks
- deps: none
- files: `src/lib/business.ts`
- AC: membership lookup replaces `Business.members` checks; behavior unchanged

S9 — Rate limit sensitive routes (optional)
- deps: none
- files: `src/middleware.ts`
- AC: throttle `/api/auth/*`, `/api/invoices/*` with simple token bucket or fixed window

S10 — Env validation at startup
- deps: none
- files: `src/lib/config/env.ts`
- AC: throws clear error if `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` missing

S11 — Seed script
- deps: S10
- files: `scripts/seed.ts`
- AC: creates admin user, sample businesses, products, one PO→receipt, one sale→invoice→payment

S12 — Observability: Sentry (optional)
- deps: none
- files: `src/lib/observability/sentry.ts`, hook into route errors
- AC: DSN-driven init; server errors captured in prod

S13 — Normalize API error shapes
- deps: none
- files: all API routes
- AC: errors return `{ error, details? }`; use `handleValidationError`

S14 — Loading and error states in dashboard pages
- deps: none
- files: `src/app/dashboard/**/page.tsx`
- AC: show spinners/skeletons and error banners

S15 — TanStack Query provider (optional per scope)
- deps: none
- files: `src/lib/providers/query.tsx`, root layout
- AC: client lists/mutations favor Query provider

S16 — ProductType/attributes (defer or minimal)
- deps: S15 (if using)
- files: product forms + `/api/product-types`
- AC: optional attributes capture if a type is selected; basic validation

How to use
- Tell me: `run S<number>` (e.g., `run S1`). I’ll apply the edits and verify.
