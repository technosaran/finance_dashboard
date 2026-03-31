-- Database audit cleanup and stock sync repair.
-- Cleans legacy pre-user-isolation rows, restores stock ledger/account triggers,
-- backfills missing stock ledger entries, and hardens core ownership constraints.

-- 1. Remove legacy anonymous rows left behind before user isolation.
DELETE FROM public.transactions
WHERE user_id IS NULL;

DELETE FROM public.family_transfers
WHERE user_id IS NULL;

DELETE FROM public.goals
WHERE user_id IS NULL;

DELETE FROM public.stocks
WHERE user_id IS NULL;

DELETE FROM public.accounts
WHERE user_id IS NULL;

-- 2. Repair an impossible historical stock sell that slipped in before trade guards.
ALTER TABLE public.stock_transactions DISABLE TRIGGER USER;

UPDATE public.stock_transactions
SET quantity = 10,
    total_amount = 221.00,
    brokerage = 0,
    taxes = 15.35,
    notes = CASE
        WHEN COALESCE(notes, '') = '' THEN
            'Auto charge mode: delivery | audit repaired from quantity 840 to 10 based on recorded holdings'
        WHEN notes LIKE '%audit repaired from quantity 840 to 10%' THEN
            notes
        ELSE
            notes || ' | audit repaired from quantity 840 to 10 based on recorded holdings'
    END,
    updated_at = NOW()
WHERE id = 22
  AND stock_id = 11
  AND transaction_type = 'SELL'
  AND quantity = 840;

ALTER TABLE public.stock_transactions ENABLE TRIGGER USER;

-- 3. Normalize closed-out grouped holdings that still carry negative row fragments.
WITH broken_zero_groups AS (
    SELECT
        user_id,
        UPPER(symbol) AS symbol_key,
        UPPER(exchange) AS exchange_key
    FROM public.stocks
    WHERE user_id IS NOT NULL
    GROUP BY user_id, UPPER(symbol), UPPER(exchange)
    HAVING SUM(quantity) = 0
       AND BOOL_OR(quantity < 0)
)
UPDATE public.stocks AS s
SET quantity = 0,
    investment_amount = 0,
    current_value = 0,
    pnl = 0,
    pnl_percentage = 0,
    updated_at = NOW()
FROM broken_zero_groups AS g
WHERE s.user_id = g.user_id
  AND UPPER(s.symbol) = g.symbol_key
  AND UPPER(s.exchange) = g.exchange_key;

-- 4. Harden user-owned records so ghost rows cannot reappear.
ALTER TABLE public.accounts
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.transactions
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.goals
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.family_transfers
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.stocks
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.stock_transactions
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN account_id SET NOT NULL;

ALTER TABLE public.mutual_funds
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.mutual_fund_transactions
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.fno_trades
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.bonds
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.bond_transactions
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.forex_transactions
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.dividends
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.portfolio_snapshots
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.recurring_schedules
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.stocks
    DROP CONSTRAINT IF EXISTS stocks_quantity_nonnegative,
    DROP CONSTRAINT IF EXISTS stocks_avg_price_nonnegative,
    DROP CONSTRAINT IF EXISTS stocks_current_price_nonnegative,
    DROP CONSTRAINT IF EXISTS stocks_investment_amount_nonnegative,
    DROP CONSTRAINT IF EXISTS stocks_current_value_nonnegative,
    DROP CONSTRAINT IF EXISTS stocks_previous_price_nonnegative;

ALTER TABLE public.stocks
    ADD CONSTRAINT stocks_quantity_nonnegative CHECK (quantity >= 0),
    ADD CONSTRAINT stocks_avg_price_nonnegative CHECK (avg_price >= 0),
    ADD CONSTRAINT stocks_current_price_nonnegative CHECK (current_price >= 0),
    ADD CONSTRAINT stocks_investment_amount_nonnegative CHECK (investment_amount >= 0),
    ADD CONSTRAINT stocks_current_value_nonnegative CHECK (current_value >= 0),
    ADD CONSTRAINT stocks_previous_price_nonnegative CHECK (previous_price IS NULL OR previous_price >= 0);

ALTER TABLE public.stock_transactions
    DROP CONSTRAINT IF EXISTS stock_transactions_positive_values;

ALTER TABLE public.stock_transactions
    ADD CONSTRAINT stock_transactions_positive_values
    CHECK (quantity > 0 AND price > 0 AND total_amount > 0);

-- 5. Restore explicit stock-only sync triggers.
CREATE OR REPLACE FUNCTION public.sync_stock_transaction_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_symbol TEXT;
    v_desc TEXT;
    v_type TEXT;
    v_amount DECIMAL(15,2);
BEGIN
    SELECT symbol
    INTO v_symbol
    FROM public.stocks
    WHERE id = NEW.stock_id;

    v_desc := NEW.transaction_type || ' Stock: ' || COALESCE(v_symbol, 'Unknown') || ' (' || NEW.quantity || ' shares)';

    IF NEW.transaction_type = 'BUY' THEN
        v_type := 'Expense';
        v_amount := ROUND((NEW.total_amount + COALESCE(NEW.brokerage, 0) + COALESCE(NEW.taxes, 0))::numeric, 2);
    ELSE
        v_type := 'Income';
        v_amount := ROUND((NEW.total_amount - COALESCE(NEW.brokerage, 0) - COALESCE(NEW.taxes, 0))::numeric, 2);
    END IF;

    INSERT INTO public.transactions (user_id, account_id, date, description, category, type, amount, metadata)
    VALUES (
        NEW.user_id,
        NEW.account_id,
        NEW.transaction_date,
        v_desc,
        'Investments',
        v_type,
        v_amount,
        jsonb_build_object('autoGenerated', true)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_account_on_stock_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_net_amount DECIMAL(15,2);
BEGIN
    IF NEW.transaction_type = 'BUY' THEN
        v_net_amount := ROUND((NEW.total_amount + COALESCE(NEW.brokerage, 0) + COALESCE(NEW.taxes, 0))::numeric, 2) * -1;
    ELSE
        v_net_amount := ROUND((NEW.total_amount - COALESCE(NEW.brokerage, 0) - COALESCE(NEW.taxes, 0))::numeric, 2);
    END IF;

    UPDATE public.accounts
    SET balance = balance + v_net_amount,
        updated_at = NOW()
    WHERE id = NEW.account_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_ledger_stocks ON public.stock_transactions;
CREATE TRIGGER tr_sync_ledger_stocks
AFTER INSERT ON public.stock_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_stock_transaction_to_ledger();

DROP TRIGGER IF EXISTS tr_update_balance_stocks ON public.stock_transactions;
CREATE TRIGGER tr_update_balance_stocks
AFTER INSERT ON public.stock_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_account_on_stock_transaction();

-- 6. Backfill any stock ledger rows that were missed while the stock sync trigger drifted.
WITH missing_stock_ledger AS (
    SELECT
        st.id AS stock_transaction_id,
        st.user_id,
        st.account_id,
        st.transaction_date AS entry_date,
        st.transaction_type || ' Stock: ' || COALESCE(s.symbol, 'Unknown') || ' (' || st.quantity || ' shares)' AS description,
        CASE
            WHEN st.transaction_type = 'BUY' THEN 'Expense'
            ELSE 'Income'
        END AS entry_type,
        ROUND(
            CASE
                WHEN st.transaction_type = 'BUY' THEN
                    (st.total_amount + COALESCE(st.brokerage, 0) + COALESCE(st.taxes, 0))::numeric
                ELSE
                    (st.total_amount - COALESCE(st.brokerage, 0) - COALESCE(st.taxes, 0))::numeric
            END,
            2
        ) AS entry_amount
    FROM public.stock_transactions AS st
    JOIN public.stocks AS s
        ON s.id = st.stock_id
    LEFT JOIN public.transactions AS t
        ON t.user_id = st.user_id
       AND t.account_id = st.account_id
       AND t.date = st.transaction_date
       AND t.description = st.transaction_type || ' Stock: ' || COALESCE(s.symbol, 'Unknown') || ' (' || st.quantity || ' shares)'
       AND t.category = 'Investments'
       AND t.type = CASE
            WHEN st.transaction_type = 'BUY' THEN 'Expense'
            ELSE 'Income'
       END
       AND ROUND(t.amount::numeric, 2) = ROUND(
            CASE
                WHEN st.transaction_type = 'BUY' THEN
                    (st.total_amount + COALESCE(st.brokerage, 0) + COALESCE(st.taxes, 0))::numeric
                ELSE
                    (st.total_amount - COALESCE(st.brokerage, 0) - COALESCE(st.taxes, 0))::numeric
            END,
            2
       )
    WHERE t.id IS NULL
),
inserted_ledger AS (
    INSERT INTO public.transactions (user_id, account_id, date, description, category, type, amount, metadata)
    SELECT
        user_id,
        account_id,
        entry_date,
        description,
        'Investments',
        entry_type,
        entry_amount,
        jsonb_build_object('autoGenerated', true, 'auditBackfill', true)
    FROM missing_stock_ledger
    RETURNING account_id, type, amount
),
balance_delta AS (
    SELECT
        account_id,
        SUM(
            CASE
                WHEN type = 'Income' THEN amount
                ELSE -amount
            END
        ) AS delta
    FROM inserted_ledger
    WHERE account_id IS NOT NULL
    GROUP BY account_id
)
UPDATE public.accounts AS a
SET balance = a.balance + balance_delta.delta,
    updated_at = NOW()
FROM balance_delta
WHERE a.id = balance_delta.account_id;
