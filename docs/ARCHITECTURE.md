# FINCORE Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Data Flow](#data-flow)
4. [Component Hierarchy](#component-hierarchy)
5. [State Management](#state-management)
6. [Database Design](#database-design)
7. [Security Architecture](#security-architecture)
8. [Performance Optimization](#performance-optimization)

---

## System Overview

FINCORE is a full-stack financial management application built on modern web technologies with a focus on real-time data, type safety, and user security.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  Context API │  │ Local Cache  │      │
│  │  Components  │←→│  (Finance,   │←→│  (5 min TTL) │      │
│  │              │  │   Auth, etc) │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Next.js API │  │   Middleware │  │  Server      │      │
│  │    Routes    │  │  (Auth, CORS)│  │  Components  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES LAYER                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Supabase   │  │ Yahoo Finance│  │   MFAPI.in   │      │
│  │ (PostgreSQL  │  │  (Stocks)    │  │ (Mutual      │      │
│  │  + Auth)     │  │              │  │  Funds)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Patterns

### 1. Context-Based State Management

FINCORE uses React Context API for global state management, avoiding heavy dependencies like Redux.

**Key Contexts**:

```typescript
// AuthContext: User authentication and session
├── User state
├── Login/Logout methods
├── Session management
└── Protected route logic

// FinanceContext: Core financial data
├── Accounts, Stocks, MFs, Bonds, F&O, Forex
├── CRUD operations for all entities
├── Automatic data refresh (5 min intervals)
├── Batch API calls for efficiency
└── Optimistic UI updates

// NotificationContext: User feedback
├── Toast notifications
├── Error messages
└── Success confirmations
```

### 2. Server Components + Client Components

FINCORE follows Next.js App Router best practices:

```typescript
// Server Components (default)
// app/stocks/page.tsx
export default function StocksPage() {
  return <StocksClient />; // Client component for interactivity
}

// Client Components (marked with 'use client')
// app/stocks/StocksClient.tsx
'use client';
export default function StocksClient() {
  const { stocks, addStock } = useFinance();
  // Interactive UI with hooks
}
```

### 3. API Route Handlers

All external API calls are proxied through Next.js API routes for security:

```typescript
// app/api/stocks/batch/route.ts
export async function POST(request: Request) {
  const { symbols } = await request.json();

  // Server-side call to Yahoo Finance
  const data = await fetchYahooQuotes(symbols);

  return Response.json({ data });
}
```

**Benefits**:

- Hides API keys from client
- Centralizes error handling
- Implements rate limiting
- Enables response transformation

### 4. Row-Level Security (RLS)

All database queries are secured with Supabase RLS policies:

```sql
-- Example policy: Users can only see their own stocks
CREATE POLICY "Users can view own stocks"
ON stocks FOR SELECT
USING (auth.uid() = user_id);
```

---

## Data Flow

### Reading Data (Stocks Example)

```
User opens Stocks page
       ↓
StocksClient mounts
       ↓
useFinance() provides stocks array
       ↓
FinanceContext checks last refresh time
       ↓
If stale (>5 min), calls refreshStockPrices()
       ↓
Batches all stock symbols
       ↓
POST /api/stocks/batch with symbols
       ↓
API route fetches from Yahoo Finance
       ↓
Returns price data
       ↓
FinanceContext updates stocks with new prices
       ↓
Component re-renders with fresh data
```

### Writing Data (Adding Stock Example)

```
User clicks "Add Stock" button
       ↓
Modal opens with form
       ↓
User submits: { symbol, quantity, buyPrice }
       ↓
addStock() called from FinanceContext
       ↓
Optimistic UI update (instant feedback)
       ↓
Supabase INSERT query
       ↓
If success: Keep optimistic update
If error: Rollback + show error toast
       ↓
refreshStockPrices() to fetch live price
```

---

## Component Hierarchy

### Application Structure

```
App Root (layout.tsx)
├── AuthContext Provider
│   └── ClientLayout (authenticated wrapper)
│       ├── NotificationContext Provider
│       │   └── FinanceContext Provider
│       │       ├── Sidebar (navigation)
│       │       └── Page Content
│       │           ├── Dashboard
│       │           ├── Accounts
│       │           ├── Ledger
│       │           ├── Stocks
│       │           ├── Mutual Funds
│       │           ├── Bonds
│       │           ├── F&O
│       │           ├── Forex
│       │           ├── Goals
│       │           └── Family Transfers
│       └── Login/Signup (unauthenticated)
```

### Component Types

**1. Layout Components**

- `ClientLayout`: Wrapper for authenticated pages
- `Sidebar`: Navigation menu
- `ErrorBoundary`: Error handling wrapper

**2. Page Components**

- Server components that render client components
- Example: `app/stocks/page.tsx` → `StocksClient.tsx`

**3. Modal Components**

- `AddStockModal`, `AddTransactionModal`, etc.
- Reusable dialog patterns

**4. Shared Components**

- `SkeletonLoader`: Loading states
- Form inputs, buttons, cards

---

## State Management

### FinanceContext Architecture

The `FinanceContext` is the heart of the application, managing all financial data.

#### State Structure

```typescript
interface FinanceState {
  // Core entities
  accounts: Account[];
  stocks: Stock[];
  mutualFunds: MutualFund[];
  bonds: Bond[];
  fnoTrades: FnOTrade[];
  forexTransactions: ForexTransaction[];
  goals: Goal[];
  familyTransfers: FamilyTransfer[];
  transactions: Transaction[];

  // Metadata
  appSettings: AppSettings;
  isLoading: boolean;
  lastRefresh: Date | null;

  // CRUD methods for each entity
  addAccount, updateAccount, deleteAccount, ...
  addStock, updateStock, deleteStock, ...

  // Data refresh methods
  refreshStockPrices();
  refreshMutualFundNAVs();
  refreshBondPrices();
  refreshAll();
}
```

#### Refresh Strategy

```typescript
useEffect(() => {
  // Initial load
  loadAllData();

  // Auto-refresh every 5 minutes
  const interval = setInterval(
    () => {
      refreshAll();
    },
    5 * 60 * 1000
  );

  return () => clearInterval(interval);
}, []);
```

#### Optimistic Updates

```typescript
async function addStock(stock: NewStock) {
  const tempId = `temp-${Date.now()}`;
  const optimisticStock = { ...stock, id: tempId };

  // 1. Immediate UI update
  setStocks((prev) => [...prev, optimisticStock]);

  try {
    // 2. Database insert
    const { data, error } = await supabase.from('stocks').insert(stock).select().single();

    if (error) throw error;

    // 3. Replace temp with real data
    setStocks((prev) => prev.map((s) => (s.id === tempId ? data : s)));

    showNotification('Stock added successfully', 'success');
  } catch (error) {
    // 4. Rollback on error
    setStocks((prev) => prev.filter((s) => s.id !== tempId));
    showNotification('Failed to add stock', 'error');
  }
}
```

---

## Database Design

### Entity Relationship Diagram

```
┌──────────────┐
│    users     │ (Supabase Auth)
└──────┬───────┘
       │
       │ 1:N
       ↓
┌──────────────────────────────────────────┐
│              accounts                     │
│  - id, user_id, name, type, balance      │
└──────┬───────────────────────────────────┘
       │
       │ 1:N
       ↓
┌──────────────────────────────────────────┐
│           transactions                    │
│  - id, user_id, account_id, amount,      │
│    category, date, description           │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│              stocks                       │
│  - id, user_id, symbol, quantity,        │
│    buy_price, current_price              │
└──────┬───────────────────────────────────┘
       │
       │ 1:N
       ↓
┌──────────────────────────────────────────┐
│        stock_transactions                 │
│  - id, stock_id, type, quantity, price,  │
│    date, charges                          │
└──────────────────────────────────────────┘

[Similar patterns for:]
- mutual_funds + mutual_fund_transactions
- bonds + bond_transactions
- fno_trades
- forex_transactions
- goals
- family_transfers
```

### Table Descriptions

| Table                      | Purpose                  | Key Columns                                      |
| -------------------------- | ------------------------ | ------------------------------------------------ |
| `accounts`                 | Bank/investment accounts | name, type, balance, user_id                     |
| `transactions`             | Income/expense ledger    | account_id, amount, category, date               |
| `stocks`                   | Stock holdings           | symbol, quantity, buy_price, current_price       |
| `stock_transactions`       | Buy/sell history         | stock_id, type, quantity, price, charges         |
| `mutual_funds`             | MF holdings              | scheme_code, units, purchase_nav                 |
| `mutual_fund_transactions` | MF investment history    | mf_id, type, units, nav                          |
| `bonds`                    | Bond holdings            | isin, face_value, coupon_rate, maturity_date     |
| `bond_transactions`        | Bond buy/sell            | bond_id, type, quantity, price                   |
| `fno_trades`               | F&O positions            | symbol, type, quantity, entry_price, exit_price  |
| `forex_transactions`       | Currency exchanges       | from_currency, to_currency, amount, rate         |
| `goals`                    | Financial milestones     | name, target_amount, current_amount, target_date |
| `family_transfers`         | Money sent/received      | person, amount, type, date                       |
| `app_settings`             | User preferences         | brokerage_rate, show_demo_data                   |

---

## Security Architecture

### Authentication Flow

```
User visits app
       ↓
AuthContext checks for Supabase session
       ↓
If no session → Redirect to /login
If session exists → Load user data
       ↓
All Supabase queries automatically filtered by user_id (RLS)
```

### Row-Level Security (RLS) Policies

Every table has RLS enabled:

```sql
-- Enable RLS
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users view own data" ON stocks
FOR SELECT USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users insert own data" ON stocks
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users update own data" ON stocks
FOR UPDATE USING (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users delete own data" ON stocks
FOR DELETE USING (auth.uid() = user_id);
```

### API Security

1. **Server-side API calls**: All external APIs called from Next.js API routes
2. **CORS protection**: Configured in `lib/services/api.ts`
3. **Input validation**: All user inputs validated before DB operations
4. **SQL injection prevention**: Parameterized queries via Supabase client

---

## Performance Optimization

### 1. Data Fetching Strategies

**Batch API Calls**:

```typescript
// Instead of N requests
for (const stock of stocks) {
  fetch(`/api/stocks/quote?symbol=${stock.symbol}`);
}

// Make 1 batch request
fetch('/api/stocks/batch', {
  method: 'POST',
  body: JSON.stringify({
    symbols: stocks.map((s) => s.symbol),
  }),
});
```

**Caching**:

- Client-side: 5-minute TTL in FinanceContext
- Server-side: Consider adding Redis for API responses

### 2. React Optimization

**Memoization**:

```typescript
const totalValue = useMemo(() => {
  return stocks.reduce((sum, stock) => sum + stock.current_price * stock.quantity, 0);
}, [stocks]);
```

**Code Splitting**:

```typescript
// Dynamic imports for heavy components
const StocksClient = dynamic(() => import('./StocksClient'), {
  loading: () => <SkeletonLoader />
});
```

### 3. Database Optimization

- **Indexes**: Create indexes on frequently queried columns (user_id, date)
- **Pagination**: Implement for large datasets (transactions, ledger)
- **Materialized views**: Consider for complex aggregations (net worth calculation)

### 4. Bundle Size

- **Tree-shaking**: Only import used components from libraries
- **Image optimization**: Use Next.js Image component
- **CSS**: Scoped CSS modules to avoid unused styles

---

## Deployment Architecture

### Recommended Stack

```
┌─────────────────────────────────────────┐
│          CDN (Cloudflare/Vercel)        │
│  Static assets, images, fonts           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        Edge Runtime (Vercel/CF)         │
│  - Next.js App Router                   │
│  - API Routes                           │
│  - Server-side rendering                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Supabase (Backend)              │
│  - PostgreSQL Database                  │
│  - Authentication                       │
│  - Row Level Security                   │
│  - Real-time subscriptions (optional)   │
└─────────────────────────────────────────┘
```

### Environment Configuration

**Development**:

- Local Next.js dev server
- Supabase cloud instance (or local)

**Staging**:

- Vercel preview deployment
- Supabase staging instance

**Production**:

- Vercel/Cloudflare Pages
- Supabase production instance
- Custom domain with SSL

---

## Future Architecture Considerations

### Scalability

1. **Microservices**: Split heavy workloads (chart generation, PDF exports)
2. **Queue system**: Background jobs for data refreshes (Bull/BullMQ)
3. **Caching layer**: Redis for API responses and computed metrics
4. **Read replicas**: If database reads become bottleneck

### Real-time Features

1. **WebSocket integration**: Live price updates via Supabase Realtime
2. **Push notifications**: Price alerts, goal achievements
3. **Collaborative features**: Shared portfolios, family accounts

### Advanced Analytics

1. **Data warehouse**: BigQuery/Snowflake for historical analysis
2. **Machine learning**: Portfolio optimization, risk assessment
3. **Business intelligence**: Metabase/Superset dashboards

---

## Architecture Decision Records (ADRs)

### ADR-001: Why Context API over Redux?

**Status**: Accepted

**Context**: Need global state management for financial data.

**Decision**: Use React Context API with hooks.

**Rationale**:

- Simpler setup and less boilerplate
- Sufficient for our use case (read-heavy, not many concurrent updates)
- Better TypeScript integration
- Smaller bundle size

**Consequences**:

- May need to refactor if app scales significantly
- Careful management needed to avoid unnecessary re-renders

### ADR-002: Why Supabase over custom backend?

**Status**: Accepted

**Context**: Need database, authentication, and real-time capabilities.

**Decision**: Use Supabase as backend-as-a-service.

**Rationale**:

- Built-in authentication with RLS
- PostgreSQL (powerful, scalable)
- Generous free tier
- Fast development velocity
- Real-time subscriptions if needed

**Consequences**:

- Vendor lock-in (mitigated by standard PostgreSQL)
- May need custom backend for complex business logic

---

## Additional Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Supabase Documentation](https://supabase.com/docs)
- [React Context Best Practices](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [Database Schema Design Guide](DATABASE.md)
- [API Documentation](API.md)
