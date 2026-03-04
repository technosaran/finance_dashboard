# How We Built FINCORE | Digital Wealth Hub

This document walks through the step-by-step journey of building FINCORE — an enterprise-grade financial tracking and portfolio management dashboard. Follow along to understand the design decisions, technology choices, and implementation steps.

## Table of Contents

1. [Project Planning](#1-project-planning)
2. [Setting Up the Project](#2-setting-up-the-project)
3. [Database Design with Supabase](#3-database-design-with-supabase)
4. [Authentication](#4-authentication)
5. [Building the Core UI](#5-building-the-core-ui)
6. [State Management with Context API](#6-state-management-with-context-api)
7. [Integrating Market Data APIs](#7-integrating-market-data-apis)
8. [Building Investment Modules](#8-building-investment-modules)
9. [Adding Quality Tooling](#9-adding-quality-tooling)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment](#11-deployment)
12. [Lessons Learned](#12-lessons-learned)

---

## 1. Project Planning

### Defining the Problem

The goal was to build a single dashboard where a user can:

- Track multiple bank accounts and transactions
- Monitor an investment portfolio (stocks, mutual funds, bonds, F&O, forex)
- See live market prices without switching between apps
- Analyse P&L across all asset classes

### Choosing the Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | File-based routing, server components, built-in API routes |
| Language | TypeScript (strict) | Catch errors at compile time, better IDE support |
| Database | Supabase (PostgreSQL) | Instant REST & Realtime API, built-in Row Level Security |
| UI | React 19 + Vanilla CSS | No framework overhead; full control over styling |
| Charts | Recharts | Composable, TypeScript-friendly chart library |
| Market Data | Yahoo Finance, MFAPI.in, Google Finance | Free, well-documented APIs for Indian markets |

---

## 2. Setting Up the Project

### Step 1 — Bootstrap Next.js

```bash
npx create-next-app@latest finance_dashboard \
  --typescript \
  --app \
  --no-tailwind \
  --eslint
cd finance_dashboard
```

### Step 2 — Install Core Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr recharts lucide-react
npm install -D jest @types/jest ts-jest jest-environment-jsdom \
              @testing-library/react @testing-library/jest-dom
```

### Step 3 — Configure Environment Variables

Create `.env.example` to document required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Copy and fill it in locally:

```bash
cp .env.example .env.local
```

### Step 4 — Set Up TypeScript Strict Mode

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

## 3. Database Design with Supabase

### Step 5 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Copy the **Project URL** and **Anon/Public key** into `.env.local`.

### Step 6 — Design the Schema

The schema is split into logical groups:

```
Core Finance
├── accounts          — Bank accounts, wallets
├── transactions      — Income / expense ledger
├── goals             — Savings goals
└── family_transfers  — Money sent to / received from family

Investments
├── stocks + stock_transactions
├── mutual_funds + mutual_fund_transactions
├── bonds + bond_transactions
├── fno_trades
└── forex_transactions

Supporting
├── watchlist         — Instruments to monitor
└── app_settings      — Per-user preferences
```

### Step 7 — Enable Row Level Security (RLS)

Every table has an RLS policy so users can only read and write their own data:

```sql
-- Example for the accounts table
alter table accounts enable row level security;

create policy "Users can manage their own accounts"
  on accounts for all
  using (auth.uid() = user_id);
```

See [docs/DATABASE.md](./docs/DATABASE.md) for the full schema and all policies.

---

## 4. Authentication

### Step 8 — Create the Supabase Client Helpers

Two helpers are needed — one for the browser and one for server-side code:

```typescript
// lib/supabaseClient.ts  (browser)
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
```

### Step 9 — Build the Auth Context

`app/components/AuthContext.tsx` wraps the whole app, listens to `onAuthStateChange`, and exposes `user`, `signIn`, `signUp`, and `signOut` helpers to every component.

### Step 10 — Protect Routes with Middleware

`middleware.ts` redirects unauthenticated users to `/login` and prevents authenticated users from seeing the login page:

```typescript
export async function middleware(request: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

---

## 5. Building the Core UI

### Step 11 — Create the Layout

```
app/
├── layout.tsx          ← Root layout (AuthContext, NotificationContext)
├── (auth)/login/       ← Login / register page
└── (dashboard)/        ← Protected area
    ├── layout.tsx       ← ClientLayout (sidebar + top bar)
    └── page.tsx         ← Dashboard home
```

### Step 12 — Build the Sidebar Navigation

`app/components/Sidebar.tsx` renders navigation links for every module. It uses `usePathname()` to highlight the active route and collapses on mobile.

### Step 13 — Design the Dashboard Home

`app/components/Dashboard.tsx` shows:
- Net worth card (sum of all account balances + portfolio value)
- Recent transactions list
- Goal progress bars
- Quick-action buttons

---

## 6. State Management with Context API

### Step 14 — Create the Finance Context

`app/components/FinanceContext.tsx` is the heart of the app. It:

1. Fetches all financial data from Supabase on mount.
2. Exposes CRUD helpers (`addTransaction`, `updateAccount`, etc.) to all pages.
3. Refreshes live market prices every 5 minutes.
4. Uses `??` (nullish coalescing) for all price/NAV fallbacks so legitimate `0` values are handled correctly.

```typescript
// Correct: 0 is a valid price, don't fall back to undefined
const currentNav = data.nav ?? 0;
```

---

## 7. Integrating Market Data APIs

### Step 15 — Create API Routes

All external API calls are proxied through Next.js API routes so the browser never calls third-party services directly (avoids CORS issues and hides any server-side logic):

```
app/api/
├── stocks/quote/route.ts     ← Yahoo Finance single quote
├── stocks/batch/route.ts     ← Yahoo Finance batch quotes
├── stocks/search/route.ts    ← Instrument search
├── mf/[isin]/route.ts        ← MFAPI.in NAV lookup
├── bonds/batch/route.ts      ← Bond batch quotes
├── forex/rate/route.ts       ← Google Finance forex rate
└── fno/batch/route.ts        ← F&O batch quotes
```

### Step 16 — Add Input Validation

Every API route validates its inputs before hitting an external service. A shared validation library lives in `lib/validators/input.ts`:

```typescript
// Example: validate that an ISIN is well-formed
export function validateISIN(isin: string): boolean {
  return /^[A-Z]{2}[A-Z0-9]{10}$/.test(isin);
}
```

The bond batch endpoint returns **HTTP 400** for any malformed ISIN before making a network request.

---

## 8. Building Investment Modules

Each investment type follows the same pattern:

### Step 17 — Stocks Module

1. `app/stocks/page.tsx` — Table of holdings with live prices, P&L columns
2. `app/components/AddStockModal.tsx` — Buy/sell form with symbol search
3. `app/api/stocks/` — Yahoo Finance proxy routes
4. `lib/services/stock-fetcher.ts` — Fetching logic, returns `0` when `previousClose` is unavailable

### Step 18 — Mutual Funds Module

1. `app/mutual-funds/page.tsx` — SIP tracker, NAV chart
2. Integration with `mfapi.in` for real-time NAV data
3. SIP transaction history with XIRR-based return calculation

### Step 19 — Bonds Module

1. ISIN-based search with yield-to-maturity calculation
2. `BondTransaction` records update account balances and create ledger entries on every purchase

### Step 20 — F&O Module

1. Position management with expiry tracking
2. Built-in Zerodha charge simulator (brokerage, STT, GST, stamp duty)
3. Equity curve chart using Recharts

---

## 9. Adding Quality Tooling

### Step 21 — ESLint

```bash
npm install -D eslint eslint-config-next
```

`eslint.config.mjs` extends `next/core-web-vitals` and `next/typescript`.

### Step 22 — Prettier

```bash
npm install -D prettier
```

`.prettierrc` enforces consistent formatting. Run `npm run format` before every commit.

### Step 23 — Husky + lint-staged

Pre-commit hooks run linting and formatting automatically:

```bash
npm install -D husky lint-staged
npx husky init
```

`.husky/pre-commit` runs `npx lint-staged` on every commit.

### Step 24 — Commitlint

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

`commitlint.config.mjs` enforces the [Conventional Commits](https://www.conventionalcommits.org/) specification.

---

## 10. Testing Strategy

### Step 25 — Configure Jest

`jest.config.ts` sets up `ts-jest` with Next.js path aliases (`@/`):

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};

export default config;
```

### Step 26 — Write Tests

Tests live in `__tests__/` mirroring the `lib/` and `app/` structure:

```
__tests__/
├── api/           ← API route handler tests
├── components/    ← React component / hook tests
├── utils/         ← Utility function tests
└── validators/    ← Input validation tests
```

Run the full suite:

```bash
npm test
```

Run with coverage:

```bash
npm run test:ci
```

---

## 11. Deployment

### Step 27 — Deploy to Vercel

1. Push the repository to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel dashboard.
4. Every push to `main` triggers an automatic deployment.

### Step 28 — Alternative: Cloudflare Pages

A `wrangler.toml` is included for Cloudflare Pages deployment via the Edge Runtime.

---

## 12. Lessons Learned

- **Use `??` not `||` for numeric fallbacks.** The value `0` is falsy in JavaScript, so `price || 0` would incorrectly replace a legitimate price of `0`. Always use `price ?? 0`.
- **Proxy all external API calls.** Calling Yahoo Finance or MFAPI directly from the browser breaks due to CORS. Proxy them through API routes.
- **RLS is non-negotiable.** Without Row Level Security, any authenticated user could read another user's financial data. Enable it from day one.
- **Validate inputs at the API boundary.** Reject malformed ISINs, symbols, and amounts before they reach external services or the database.
- **Keep state in Context, not components.** A single `FinanceContext` makes it easy to share data between unrelated pages without prop-drilling.

---

## Further Reading

- [README.md](./README.md) — Full project overview and quick-start guide
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — System design and data-flow diagrams
- [docs/DATABASE.md](./docs/DATABASE.md) — Full database schema and RLS policies
- [docs/API.md](./docs/API.md) — API endpoint reference
- [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) — Day-to-day development tasks
- [CONTRIBUTING.md](./CONTRIBUTING.md) — How to contribute to this project
