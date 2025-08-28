## Small-Scale Retail ERP – Next.js + MongoDB

Single-tenant app with multi-business support (per-user selection). Tracks product stock in/out, records sales and expenses, and reports profit. Built with Next.js App Router and MongoDB.

See full scope in `scope.md`. Detailed execution plan in `NEXT_STEPS.md`.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- MongoDB (Mongoose ODM)
- Auth: NextAuth (Credentials, JWT sessions)
- Charts: Recharts

## Features (MVP)

- Multi-business data scoping via `businessId` and Business Switcher
- Products with variants (SKU/size/color), stock and low-stock indicators
- Suppliers and Purchase Orders; receive to increase stock
- Sales recording; decreases stock with validation (no backorders)
- Expenses CRUD
- Dashboard KPIs and charts (sales, expenses, low stock)

Planned per `scope.md`:

- Inventory ledger + snapshot with moving average cost
- Sales lifecycle (draft/confirm/deliver/cancel)
- Invoices (HTML print) with per-business numbering; Payments (record-only)
- Profit and stock valuation reports; audit logging

## Project Structure

- `src/app` – App Router routes and pages
- `src/app/api` – API route handlers
- `src/lib/models` – Mongoose models
- `src/lib` – DB connection, business helpers
- `src/auth.ts` – NextAuth config
- `src/middleware.ts` – Route protection
- `scope.md` – Product scope and architecture
- `NEXT_STEPS.md` – Task registry and plan

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```bash
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"
NEXTAUTH_SECRET="your-strong-secret"
NEXTAUTH_URL="http://localhost:3000"
```

3. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – run production build
- `npm run lint` – run ESLint

## Authentication and Access

- Credentials login (email/password). See `src/auth.ts`.
- Middleware protects `/dashboard` and `/api`.
- Select current business via the header switcher; APIs require membership.

## API Highlights

- Businesses: `GET/POST /api/businesses`, `POST /api/businesses/select`
- Products: `GET/POST /api/products`, `PATCH/DELETE /api/products/[id]`, `POST /api/products/stock`
- Suppliers: `GET/POST /api/suppliers`, `GET/PATCH/DELETE /api/suppliers/[id]`
- Purchase Orders: `GET/POST /api/purchase-orders`, `GET/PATCH/PUT/DELETE /api/purchase-orders/[id]`
- Sales: `GET/POST /api/sales`
- Expenses: `GET/POST /api/expenses`, `GET/PATCH/DELETE /api/expenses/[id]`

Upcoming (per scope): invoices, payments, reports, audit.

## Roles

- Admin: full access (owner of a business)
- Members: `admin | staff | viewer` per business
- Future: global Admin, Moderator/Staff enforcement and fine-grained permissions

## Development Notes

- All data is scoped by `business` on models and by cookie-selected business in APIs.
- Some indexes are being adjusted to per-business uniqueness (see `NEXT_STEPS.md`).

## Deployment

- Deploy on Vercel; set `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` in project settings.

## Roadmap (short)

- Inventory ledger/snapshot + moving average cost
- Sales statuses, invoices, payments
- Profit and stock valuation reports
- Audit log and validation with Zod
