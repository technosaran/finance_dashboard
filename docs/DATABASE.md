# FINCORE Database Documentation

## Overview

FINCORE uses **Supabase** (PostgreSQL) as its database, with **Row-Level Security (RLS)** enabled on all tables to ensure users can only access their own data.

## Database Schema

### Entity Relationship Diagram

```
                    ┌─────────────┐
                    │   users     │  (Supabase Auth)
                    │ (managed by │
                    │  Supabase)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ↓            ↓            ↓
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │accounts │  │  stocks │  │   mf    │  ... (other entities)
        └────┬────┘  └────┬────┘  └────┬────┘
             │            │            │
             ↓            ↓            ↓
      ┌─────────────┐ ┌──────────┐ ┌──────────┐
      │transactions │ │stock_txn │ │  mf_txn  │
      └─────────────┘ └──────────┘ └──────────┘
```

---

## Core Tables

### 1. accounts

Stores user's bank accounts, wallets, and investment accounts.

**Columns**:

| Column       | Type        | Nullable | Description                              |
| ------------ | ----------- | -------- | ---------------------------------------- |
| `id`         | UUID        | No       | Primary key (auto-generated)             |
| `user_id`    | UUID        | No       | Foreign key to auth.users                |
| `name`       | TEXT        | No       | Account name (e.g., "HDFC Savings")      |
| `type`       | TEXT        | No       | Account type: 'bank', 'wallet', 'broker' |
| `balance`    | NUMERIC     | No       | Current balance (default: 0)             |
| `created_at` | TIMESTAMPTZ | No       | Creation timestamp                       |
| `updated_at` | TIMESTAMPTZ | No       | Last update timestamp                    |

**Indexes**:

- Primary key on `id`
- Index on `user_id` for filtering
- Composite index on `(user_id, type)` for type-based queries

**RLS Policies**:

```sql
-- SELECT: Users can view their own accounts
CREATE POLICY "users_select_own_accounts" ON accounts
FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can create accounts with their user_id
CREATE POLICY "users_insert_own_accounts" ON accounts
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own accounts
CREATE POLICY "users_update_own_accounts" ON accounts
FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Users can delete their own accounts
CREATE POLICY "users_delete_own_accounts" ON accounts
FOR DELETE USING (auth.uid() = user_id);
```

**Example Data**:

```json
{
  "id": "a1b2c3d4-...",
  "user_id": "user-uuid-...",
  "name": "HDFC Bank Savings",
  "type": "bank",
  "balance": 150000.5,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-14T08:00:00Z"
}
```

---

### 2. transactions

Ledger of all income and expenses.

**Columns**:

| Column        | Type        | Nullable | Description                               |
| ------------- | ----------- | -------- | ----------------------------------------- |
| `id`          | UUID        | No       | Primary key                               |
| `user_id`     | UUID        | No       | Foreign key to auth.users                 |
| `account_id`  | UUID        | No       | Foreign key to accounts                   |
| `amount`      | NUMERIC     | No       | Transaction amount                        |
| `type`        | TEXT        | No       | 'income' or 'expense'                     |
| `category`    | TEXT        | No       | Category (e.g., 'salary', 'food', 'rent') |
| `description` | TEXT        | Yes      | Optional notes                            |
| `date`        | DATE        | No       | Transaction date                          |
| `created_at`  | TIMESTAMPTZ | No       | Creation timestamp                        |

**Indexes**:

- Primary key on `id`
- Index on `user_id`
- Index on `date` for date-range queries
- Index on `category` for filtering

**Foreign Keys**:

- `account_id` REFERENCES `accounts(id)` ON DELETE CASCADE

**RLS Policies**: Similar to `accounts` (users can only access their own data)

**Example Data**:

```json
{
  "id": "txn-uuid-...",
  "user_id": "user-uuid-...",
  "account_id": "account-uuid-...",
  "amount": 75000.0,
  "type": "income",
  "category": "salary",
  "description": "February salary",
  "date": "2026-02-01",
  "created_at": "2026-02-01T09:00:00Z"
}
```

---

### 3. stocks

User's stock holdings.

**Columns**:

| Column          | Type        | Nullable | Description                        |
| --------------- | ----------- | -------- | ---------------------------------- |
| `id`            | UUID        | No       | Primary key                        |
| `user_id`       | UUID        | No       | Foreign key to auth.users          |
| `symbol`        | TEXT        | No       | Stock symbol (e.g., "RELIANCE.NS") |
| `name`          | TEXT        | No       | Company name                       |
| `quantity`      | INTEGER     | No       | Number of shares owned             |
| `buy_price`     | NUMERIC     | No       | Average purchase price per share   |
| `current_price` | NUMERIC     | No       | Latest market price                |
| `last_updated`  | TIMESTAMPTZ | Yes      | Last price update timestamp        |
| `created_at`    | TIMESTAMPTZ | No       | Creation timestamp                 |

**Indexes**:

- Primary key on `id`
- Index on `user_id`
- Unique index on `(user_id, symbol)` to prevent duplicates

**Computed Fields** (application-level):

- `current_value = quantity * current_price`
- `invested_value = quantity * buy_price`
- `unrealized_pnl = current_value - invested_value`
- `unrealized_pnl_percent = (unrealized_pnl / invested_value) * 100`

**Example Data**:

```json
{
  "id": "stock-uuid-...",
  "user_id": "user-uuid-...",
  "symbol": "RELIANCE.NS",
  "name": "Reliance Industries",
  "quantity": 50,
  "buy_price": 2400.0,
  "current_price": 2456.75,
  "last_updated": "2026-02-14T08:30:00Z",
  "created_at": "2026-01-10T14:00:00Z"
}
```

---

### 4. stock_transactions

History of stock buy/sell transactions.

**Columns**:

| Column       | Type        | Nullable | Description               |
| ------------ | ----------- | -------- | ------------------------- |
| `id`         | UUID        | No       | Primary key               |
| `user_id`    | UUID        | No       | Foreign key to auth.users |
| `stock_id`   | UUID        | No       | Foreign key to stocks     |
| `type`       | TEXT        | No       | 'buy' or 'sell'           |
| `quantity`   | INTEGER     | No       | Number of shares          |
| `price`      | NUMERIC     | No       | Price per share           |
| `charges`    | NUMERIC     | No       | Brokerage + taxes         |
| `date`       | DATE        | No       | Transaction date          |
| `notes`      | TEXT        | Yes      | Optional notes            |
| `created_at` | TIMESTAMPTZ | No       | Creation timestamp        |

**Indexes**:

- Primary key on `id`
- Index on `user_id`
- Index on `stock_id`
- Index on `date`

**Foreign Keys**:

- `stock_id` REFERENCES `stocks(id)` ON DELETE CASCADE

**Computed Fields**:

- `total_cost = (quantity * price) + charges` (for buy)
- `net_proceeds = (quantity * price) - charges` (for sell)

**Example Data**:

```json
{
  "id": "stxn-uuid-...",
  "user_id": "user-uuid-...",
  "stock_id": "stock-uuid-...",
  "type": "buy",
  "quantity": 25,
  "price": 2400.0,
  "charges": 75.5,
  "date": "2026-01-10",
  "notes": "First purchase",
  "created_at": "2026-01-10T14:00:00Z"
}
```

---

### 5. mutual_funds

User's mutual fund holdings.

**Columns**:

| Column         | Type        | Nullable | Description               |
| -------------- | ----------- | -------- | ------------------------- |
| `id`           | UUID        | No       | Primary key               |
| `user_id`      | UUID        | No       | Foreign key to auth.users |
| `scheme_code`  | TEXT        | No       | MFAPI scheme code         |
| `scheme_name`  | TEXT        | No       | Mutual fund scheme name   |
| `units`        | NUMERIC     | No       | Number of units owned     |
| `purchase_nav` | NUMERIC     | No       | Average NAV at purchase   |
| `current_nav`  | NUMERIC     | No       | Latest NAV                |
| `last_updated` | TIMESTAMPTZ | Yes      | Last NAV update timestamp |
| `created_at`   | TIMESTAMPTZ | No       | Creation timestamp        |

**Indexes**:

- Primary key on `id`
- Index on `user_id`
- Unique index on `(user_id, scheme_code)`

**Computed Fields**:

- `current_value = units * current_nav`
- `invested_value = units * purchase_nav`
- `unrealized_pnl = current_value - invested_value`

**Example Data**:

```json
{
  "id": "mf-uuid-...",
  "user_id": "user-uuid-...",
  "scheme_code": "119551",
  "scheme_name": "Axis Bluechip Fund - Direct Plan - Growth",
  "units": 250.45,
  "purchase_nav": 42.5,
  "current_nav": 45.67,
  "last_updated": "2026-02-13T18:00:00Z",
  "created_at": "2026-01-05T10:00:00Z"
}
```

---

### 6. mutual_fund_transactions

History of mutual fund investments and redemptions.

**Columns**:

| Column       | Type        | Nullable | Description                 |
| ------------ | ----------- | -------- | --------------------------- |
| `id`         | UUID        | No       | Primary key                 |
| `user_id`    | UUID        | No       | Foreign key to auth.users   |
| `mf_id`      | UUID        | No       | Foreign key to mutual_funds |
| `type`       | TEXT        | No       | 'buy' or 'sell'             |
| `units`      | NUMERIC     | No       | Number of units             |
| `nav`        | NUMERIC     | No       | NAV at transaction time     |
| `date`       | DATE        | No       | Transaction date            |
| `notes`      | TEXT        | Yes      | Optional notes              |
| `created_at` | TIMESTAMPTZ | No       | Creation timestamp          |

**Foreign Keys**:

- `mf_id` REFERENCES `mutual_funds(id)` ON DELETE CASCADE

---

### 7. bonds

User's bond holdings.

**Columns**:

| Column           | Type        | Nullable | Description               |
| ---------------- | ----------- | -------- | ------------------------- |
| `id`             | UUID        | No       | Primary key               |
| `user_id`        | UUID        | No       | Foreign key to auth.users |
| `isin`           | TEXT        | No       | Bond ISIN code            |
| `name`           | TEXT        | No       | Bond name/issuer          |
| `quantity`       | INTEGER     | No       | Number of bonds           |
| `face_value`     | NUMERIC     | No       | Face value per bond       |
| `coupon_rate`    | NUMERIC     | No       | Annual interest rate (%)  |
| `purchase_price` | NUMERIC     | No       | Purchase price per bond   |
| `current_price`  | NUMERIC     | No       | Current market price      |
| `maturity_date`  | DATE        | No       | Maturity date             |
| `last_updated`   | TIMESTAMPTZ | Yes      | Last price update         |
| `created_at`     | TIMESTAMPTZ | No       | Creation timestamp        |

**Indexes**:

- Primary key on `id`
- Index on `user_id`
- Index on `maturity_date`

**Computed Fields**:

- `invested_value = quantity * purchase_price`
- `current_value = quantity * current_price`
- `annual_interest = quantity * face_value * (coupon_rate / 100)`

---

### 8. bond_transactions

History of bond purchases and sales.

**Columns**:

| Column       | Type        | Nullable | Description               |
| ------------ | ----------- | -------- | ------------------------- |
| `id`         | UUID        | No       | Primary key               |
| `user_id`    | UUID        | No       | Foreign key to auth.users |
| `bond_id`    | UUID        | No       | Foreign key to bonds      |
| `type`       | TEXT        | No       | 'buy' or 'sell'           |
| `quantity`   | INTEGER     | No       | Number of bonds           |
| `price`      | NUMERIC     | No       | Price per bond            |
| `date`       | DATE        | No       | Transaction date          |
| `notes`      | TEXT        | Yes      | Optional notes            |
| `created_at` | TIMESTAMPTZ | No       | Creation timestamp        |

**Foreign Keys**:

- `bond_id` REFERENCES `bonds(id)` ON DELETE CASCADE

---

### 9. fno_trades

Futures and Options trading positions.

**Columns**:

| Column         | Type        | Nullable | Description                                 |
| -------------- | ----------- | -------- | ------------------------------------------- |
| `id`           | UUID        | No       | Primary key                                 |
| `user_id`      | UUID        | No       | Foreign key to auth.users                   |
| `symbol`       | TEXT        | No       | Contract symbol (e.g., "NIFTY26FEB24000CE") |
| `type`         | TEXT        | No       | 'future' or 'option'                        |
| `option_type`  | TEXT        | Yes      | 'call' or 'put' (null for futures)          |
| `strike_price` | NUMERIC     | Yes      | Strike price for options                    |
| `expiry_date`  | DATE        | No       | Contract expiry date                        |
| `quantity`     | INTEGER     | No       | Lot size \* number of lots                  |
| `entry_price`  | NUMERIC     | No       | Entry price                                 |
| `exit_price`   | NUMERIC     | Yes      | Exit price (null if open)                   |
| `status`       | TEXT        | No       | 'open' or 'closed'                          |
| `entry_date`   | DATE        | No       | Trade entry date                            |
| `exit_date`    | DATE        | Yes      | Trade exit date                             |
| `charges`      | NUMERIC     | No       | Brokerage + taxes                           |
| `notes`        | TEXT        | Yes      | Optional notes                              |
| `created_at`   | TIMESTAMPTZ | No       | Creation timestamp                          |

**Indexes**:

- Primary key on `id`
- Index on `user_id`
- Index on `status`
- Index on `expiry_date`

**Computed Fields**:

- `pnl = (exit_price - entry_price) * quantity - charges` (if closed)

---

### 10. forex_transactions

Foreign exchange transactions.

**Columns**:

| Column          | Type        | Nullable | Description                   |
| --------------- | ----------- | -------- | ----------------------------- |
| `id`            | UUID        | No       | Primary key                   |
| `user_id`       | UUID        | No       | Foreign key to auth.users     |
| `type`          | TEXT        | No       | 'deposit' or 'withdrawal'     |
| `from_currency` | TEXT        | No       | Source currency (e.g., "INR") |
| `to_currency`   | TEXT        | No       | Target currency (e.g., "USD") |
| `from_amount`   | NUMERIC     | No       | Amount in source currency     |
| `to_amount`     | NUMERIC     | No       | Amount in target currency     |
| `exchange_rate` | NUMERIC     | No       | Conversion rate               |
| `date`          | DATE        | No       | Transaction date              |
| `notes`         | TEXT        | Yes      | Optional notes                |
| `created_at`    | TIMESTAMPTZ | No       | Creation timestamp            |

**Indexes**:

- Primary key on `id`
- Index on `user_id`
- Index on `date`

---

### 11. goals

Financial goals and milestones.

**Columns**:

| Column           | Type        | Nullable | Description                            |
| ---------------- | ----------- | -------- | -------------------------------------- |
| `id`             | UUID        | No       | Primary key                            |
| `user_id`        | UUID        | No       | Foreign key to auth.users              |
| `name`           | TEXT        | No       | Goal name (e.g., "House Down Payment") |
| `target_amount`  | NUMERIC     | No       | Target amount                          |
| `current_amount` | NUMERIC     | No       | Current saved amount (default: 0)      |
| `target_date`    | DATE        | Yes      | Target completion date                 |
| `status`         | TEXT        | No       | 'active', 'completed', 'paused'        |
| `created_at`     | TIMESTAMPTZ | No       | Creation timestamp                     |
| `updated_at`     | TIMESTAMPTZ | No       | Last update timestamp                  |

**Indexes**:

- Primary key on `id`
- Index on `user_id`
- Index on `status`

**Computed Fields**:

- `progress_percent = (current_amount / target_amount) * 100`

---

### 12. family_transfers

Money sent to/received from family members.

**Columns**:

| Column       | Type        | Nullable | Description               |
| ------------ | ----------- | -------- | ------------------------- |
| `id`         | UUID        | No       | Primary key               |
| `user_id`    | UUID        | No       | Foreign key to auth.users |
| `person`     | TEXT        | No       | Family member name        |
| `amount`     | NUMERIC     | No       | Transfer amount           |
| `type`       | TEXT        | No       | 'sent' or 'received'      |
| `date`       | DATE        | No       | Transfer date             |
| `notes`      | TEXT        | Yes      | Optional notes            |
| `created_at` | TIMESTAMPTZ | No       | Creation timestamp        |

**Indexes**:

- Primary key on `id`
- Index on `user_id`
- Index on `date`

---

### 13. watchlist

Stocks/instruments user is monitoring (not owned).

**Columns**:

| Column         | Type        | Nullable | Description               |
| -------------- | ----------- | -------- | ------------------------- |
| `id`           | UUID        | No       | Primary key               |
| `user_id`      | UUID        | No       | Foreign key to auth.users |
| `symbol`       | TEXT        | No       | Symbol to watch           |
| `name`         | TEXT        | No       | Instrument name           |
| `target_price` | NUMERIC     | Yes      | Alert price               |
| `created_at`   | TIMESTAMPTZ | No       | Creation timestamp        |

**Indexes**:

- Primary key on `id`
- Index on `user_id`
- Unique index on `(user_id, symbol)`

---

### 14. app_settings

User preferences and application settings.

**Columns**:

| Column           | Type        | Nullable | Description                            |
| ---------------- | ----------- | -------- | -------------------------------------- |
| `id`             | UUID        | No       | Primary key                            |
| `user_id`        | UUID        | No       | Foreign key to auth.users (unique)     |
| `brokerage_rate` | NUMERIC     | No       | Custom brokerage rate (default: 0.03%) |
| `theme`          | TEXT        | No       | 'light' or 'dark' (default: 'dark')    |
| `currency`       | TEXT        | No       | Display currency (default: 'INR')      |
| `show_demo_data` | BOOLEAN     | No       | Show sample data (default: false)      |
| `created_at`     | TIMESTAMPTZ | No       | Creation timestamp                     |
| `updated_at`     | TIMESTAMPTZ | No       | Last update timestamp                  |

**Indexes**:

- Primary key on `id`
- Unique index on `user_id`

---

## Database Setup

### Initial Schema Creation

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- Create RLS policies (see individual table sections)

-- Create indexes for performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
-- ... (create all necessary indexes)
```

### Migration Strategy

FINCORE uses **manual migrations** tracked in version control. Future migrations should:

1. Be numbered sequentially (e.g., `001_initial_schema.sql`, `002_add_watchlist.sql`)
2. Include both `up` and `down` scripts
3. Be idempotent (safe to run multiple times)
4. Preserve existing data

**Example Migration**:

```sql
-- 003_add_target_date_to_goals.sql (UP)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date DATE;

-- (DOWN - for rollback)
-- ALTER TABLE goals DROP COLUMN IF EXISTS target_date;
```

---

## Querying Best Practices

### Using Supabase Client

```typescript
import { supabase } from '@/lib/supabase';

// SELECT with filters
const { data, error } = await supabase
  .from('stocks')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// INSERT with return
const { data, error } = await supabase
  .from('accounts')
  .insert({ name, type, balance, user_id })
  .select()
  .single();

// UPDATE
const { error } = await supabase
  .from('stocks')
  .update({ current_price: newPrice })
  .eq('id', stockId);

// DELETE
const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
```

### Joining Tables

```typescript
// Get transactions with account details
const { data } = await supabase
  .from('transactions')
  .select(
    `
    *,
    accounts:account_id (
      name,
      type
    )
  `
  )
  .eq('user_id', userId);
```

### Aggregations

```typescript
// Calculate total balance across accounts
const { data } = await supabase.from('accounts').select('balance').eq('user_id', userId);

const totalBalance = data?.reduce((sum, acc) => sum + acc.balance, 0);
```

---

## Backup and Recovery

### Automated Backups (Supabase)

- **Daily backups**: Automatic on Supabase Pro plan
- **Point-in-time recovery**: Available for Pro+ plans
- **Manual exports**: Use Supabase dashboard or pg_dump

### Manual Backup Example

```bash
# Export database schema
pg_dump -h db.xxx.supabase.co -U postgres -s fincore_db > schema.sql

# Export data
pg_dump -h db.xxx.supabase.co -U postgres -a fincore_db > data.sql
```

---

## Performance Monitoring

### Query Performance

Use Supabase dashboard to:

- Monitor slow queries
- Analyze query execution plans
- Track database CPU and memory usage

### Optimization Tips

1. **Add indexes** on frequently filtered columns
2. **Use pagination** for large result sets
3. **Batch operations** where possible
4. **Materialized views** for complex aggregations
5. **Connection pooling** (handled by Supabase)

---

## Security Considerations

### Row-Level Security (RLS)

✅ **Always Enabled**: Every table has RLS policies enforcing `user_id` checks

❌ **Never do this**:

```typescript
// Bypass RLS by using service role key in client-side code
const supabase = createClient(url, SERVICE_ROLE_KEY); // DANGEROUS!
```

✅ **Do this**:

```typescript
// Use anonymous key with RLS policies
const supabase = createClient(url, ANON_KEY);
```

### Sensitive Data

- **Passwords**: Managed by Supabase Auth (never stored in tables)
- **API keys**: Stored as environment variables, never in database
- **PII**: Minimal personal information stored; consider encryption for sensitive fields

---

## Future Database Enhancements

### Planned Improvements

1. **Audit logs**: Track all data changes with timestamps
2. **Soft deletes**: Mark records as deleted instead of hard deletes
3. **Versioning**: Track historical changes to portfolios
4. **Full-text search**: For transactions, bonds, and notes
5. **Computed columns**: Database-level calculations for performance
6. **Triggers**: Automatic balance updates on account transactions

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQL Best Practices](https://www.postgresql.org/docs/current/performance-tips.html)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
