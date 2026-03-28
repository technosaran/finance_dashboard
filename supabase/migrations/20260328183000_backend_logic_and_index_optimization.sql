-- Backend logic hardening and query/index optimization
-- 20260328183000_backend_logic_and_index_optimization.sql

-- 1. Fix transaction-driven account balance updates so UPDATE/DELETE and account moves stay correct.
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance + CASE WHEN OLD.type = 'Income' THEN -OLD.amount ELSE OLD.amount END
        WHERE id = OLD.account_id;
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance + CASE WHEN NEW.type = 'Income' THEN NEW.amount ELSE -NEW.amount END
        WHERE id = NEW.account_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. Remove legacy direct account-balance triggers and keep transactions as the single source of truth.
DROP TRIGGER IF EXISTS tr_update_balance_stocks ON public.stock_transactions;
DROP TRIGGER IF EXISTS tr_update_balance_mf ON public.mutual_fund_transactions;
DROP TRIGGER IF EXISTS tr_update_balance_bonds ON public.bond_transactions;
DROP TRIGGER IF EXISTS tr_update_balance_fno ON public.fno_trades;

-- 3. Helpers for trigger-backed ledger sync.
CREATE OR REPLACE FUNCTION public.delete_ledger_entries_for_source(
    p_source_table TEXT,
    p_source_id BIGINT
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.transactions
    WHERE metadata->>'source_table' = p_source_table
      AND (metadata->>'source_id')::BIGINT = p_source_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.insert_ledger_transaction(
    p_user_id UUID,
    p_account_id BIGINT,
    p_date DATE,
    p_description TEXT,
    p_category TEXT,
    p_type TEXT,
    p_amount NUMERIC,
    p_source_table TEXT,
    p_source_id BIGINT,
    p_entry_kind TEXT DEFAULT 'primary'
)
RETURNS VOID AS $$
BEGIN
    IF p_description IS NULL OR p_type IS NULL OR p_amount IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO public.transactions (
        user_id,
        account_id,
        date,
        description,
        category,
        type,
        amount,
        metadata
    )
    VALUES (
        p_user_id,
        p_account_id,
        COALESCE(p_date, CURRENT_DATE),
        p_description,
        p_category,
        p_type,
        p_amount,
        jsonb_build_object(
            'source_table', p_source_table,
            'source_id', p_source_id,
            'entry_kind', p_entry_kind
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Keep ledger entries in sync for INSERT/UPDATE/DELETE across trigger-backed source tables.
CREATE OR REPLACE FUNCTION public.sync_investment_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_source_table TEXT := LOWER(TG_TABLE_NAME);
    v_source_id BIGINT;
    v_desc TEXT;
    v_type TEXT;
    v_amount NUMERIC;
    v_symbol TEXT;
    v_date DATE;
BEGIN
    v_source_id := CASE
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
    END;

    PERFORM public.delete_ledger_entries_for_source(v_source_table, v_source_id);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    IF v_source_table = 'stock_transactions' THEN
        SELECT symbol INTO v_symbol FROM public.stocks WHERE id = NEW.stock_id;

        v_desc := NEW.transaction_type || ' Stock: ' || COALESCE(v_symbol, 'Unknown') ||
            ' (' || NEW.quantity || ' shares)';
        v_type := CASE WHEN NEW.transaction_type = 'BUY' THEN 'Expense' ELSE 'Income' END;
        v_amount := CASE
            WHEN NEW.transaction_type = 'BUY'
                THEN COALESCE(NEW.total_amount, 0) + COALESCE(NEW.brokerage, 0) + COALESCE(NEW.taxes, 0)
            ELSE
                COALESCE(NEW.total_amount, 0) - COALESCE(NEW.brokerage, 0) - COALESCE(NEW.taxes, 0)
        END;
        v_date := NEW.transaction_date;

        PERFORM public.insert_ledger_transaction(
            NEW.user_id, NEW.account_id, v_date, v_desc, 'Investments', v_type, v_amount,
            v_source_table, NEW.id
        );

    ELSIF v_source_table = 'mutual_fund_transactions' THEN
        SELECT name INTO v_symbol FROM public.mutual_funds WHERE id = NEW.mutual_fund_id;

        v_desc := NEW.transaction_type || ' MF: ' || COALESCE(v_symbol, 'Unknown') ||
            ' (' || NEW.units || ' units)';
        v_type := CASE WHEN NEW.transaction_type IN ('BUY', 'SIP') THEN 'Expense' ELSE 'Income' END;
        v_amount := COALESCE(NEW.total_amount, 0);
        v_date := NEW.transaction_date;

        PERFORM public.insert_ledger_transaction(
            NEW.user_id, NEW.account_id, v_date, v_desc, 'Investments', v_type, v_amount,
            v_source_table, NEW.id
        );

    ELSIF v_source_table = 'fno_trades' THEN
        IF NEW.status = 'OPEN' THEN
            PERFORM public.insert_ledger_transaction(
                NEW.user_id,
                NEW.account_id,
                NEW.entry_date,
                'FnO Entry: ' || NEW.instrument,
                'Investments',
                'Expense',
                COALESCE(NEW.avg_price, 0) * COALESCE(NEW.quantity, 0),
                v_source_table,
                NEW.id,
                'entry'
            );
        ELSIF NEW.status = 'CLOSED' THEN
            PERFORM public.insert_ledger_transaction(
                NEW.user_id,
                NEW.account_id,
                NEW.entry_date,
                'FnO Entry: ' || NEW.instrument,
                'Investments',
                'Expense',
                COALESCE(NEW.avg_price, 0) * COALESCE(NEW.quantity, 0),
                v_source_table,
                NEW.id,
                'entry'
            );

            PERFORM public.insert_ledger_transaction(
                NEW.user_id,
                NEW.account_id,
                COALESCE(NEW.exit_date, NEW.entry_date),
                'FnO Exit: ' || NEW.instrument,
                'Investments',
                'Income',
                (COALESCE(NEW.avg_price, 0) * COALESCE(NEW.quantity, 0)) + COALESCE(NEW.pnl, 0),
                v_source_table,
                NEW.id,
                'exit'
            );
        END IF;

    ELSIF v_source_table = 'bond_transactions' THEN
        SELECT name INTO v_symbol FROM public.bonds WHERE id = NEW.bond_id;

        v_desc := NEW.transaction_type || ' Bond: ' || COALESCE(v_symbol, 'Unknown');
        v_type := CASE
            WHEN NEW.transaction_type = 'BUY' THEN 'Expense'
            ELSE 'Income'
        END;
        v_amount := COALESCE(NEW.total_amount, 0);
        v_date := NEW.transaction_date;

        PERFORM public.insert_ledger_transaction(
            NEW.user_id, NEW.account_id, v_date, v_desc, 'Investments', v_type, v_amount,
            v_source_table, NEW.id
        );

    ELSIF v_source_table = 'forex_transactions' THEN
        v_desc := 'Forex ' || NEW.transaction_type ||
            CASE WHEN NEW.notes IS NOT NULL AND BTRIM(NEW.notes) <> '' THEN ': ' || NEW.notes ELSE '' END;
        v_type := CASE
            WHEN UPPER(NEW.transaction_type) IN ('DEPOSIT', 'PROFIT') THEN 'Income'
            ELSE 'Expense'
        END;
        v_amount := COALESCE(NEW.amount, 0);
        v_date := NEW.transaction_date;

        PERFORM public.insert_ledger_transaction(
            NEW.user_id, NEW.account_id, v_date, v_desc, 'Forex', v_type, v_amount,
            v_source_table, NEW.id
        );

    ELSIF v_source_table = 'family_transfers' THEN
        v_desc := 'Family Transfer: ' || NEW.recipient || ' (' || NEW.relationship || ')';
        v_type := 'Expense';
        v_amount := COALESCE(NEW.amount, 0);
        v_date := NEW.date;

        PERFORM public.insert_ledger_transaction(
            NEW.user_id, NEW.account_id, v_date, v_desc, 'Family', v_type, v_amount,
            v_source_table, NEW.id
        );

    ELSIF v_source_table = 'dividends' THEN
        IF NEW.stock_id IS NOT NULL THEN
            SELECT symbol INTO v_symbol FROM public.stocks WHERE id = NEW.stock_id;
            v_desc := 'Stock Dividend: ' || COALESCE(v_symbol, 'Unknown');
        ELSIF NEW.mf_id IS NOT NULL THEN
            SELECT name INTO v_symbol FROM public.mutual_funds WHERE id = NEW.mf_id;
            v_desc := 'MF Dividend: ' || COALESCE(v_symbol, 'Unknown');
        ELSE
            v_desc := 'Dividend Payment';
        END IF;

        v_type := 'Income';
        v_amount := COALESCE(NEW.amount, 0);
        v_date := NEW.date;

        PERFORM public.insert_ledger_transaction(
            NEW.user_id, NEW.account_id, v_date, v_desc, 'Investment', v_type, v_amount,
            v_source_table, NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_ledger_stocks ON public.stock_transactions;
CREATE TRIGGER tr_sync_ledger_stocks
AFTER INSERT OR UPDATE OR DELETE ON public.stock_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_investment_to_ledger();

DROP TRIGGER IF EXISTS tr_sync_ledger_mf ON public.mutual_fund_transactions;
CREATE TRIGGER tr_sync_ledger_mf
AFTER INSERT OR UPDATE OR DELETE ON public.mutual_fund_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_investment_to_ledger();

DROP TRIGGER IF EXISTS tr_sync_ledger_fno ON public.fno_trades;
CREATE TRIGGER tr_sync_ledger_fno
AFTER INSERT OR UPDATE OR DELETE ON public.fno_trades
FOR EACH ROW EXECUTE FUNCTION public.sync_investment_to_ledger();

DROP TRIGGER IF EXISTS tr_sync_ledger_bonds ON public.bond_transactions;
CREATE TRIGGER tr_sync_ledger_bonds
AFTER INSERT OR UPDATE OR DELETE ON public.bond_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_investment_to_ledger();

DROP TRIGGER IF EXISTS tr_sync_ledger_forex ON public.forex_transactions;
CREATE TRIGGER tr_sync_ledger_forex
AFTER INSERT OR UPDATE OR DELETE ON public.forex_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_investment_to_ledger();

DROP TRIGGER IF EXISTS tr_sync_ledger_family ON public.family_transfers;
CREATE TRIGGER tr_sync_ledger_family
AFTER INSERT OR UPDATE OR DELETE ON public.family_transfers
FOR EACH ROW EXECUTE FUNCTION public.sync_investment_to_ledger();

DROP TRIGGER IF EXISTS tr_sync_ledger_dividends ON public.dividends;
CREATE TRIGGER tr_sync_ledger_dividends
AFTER INSERT OR UPDATE OR DELETE ON public.dividends
FOR EACH ROW EXECUTE FUNCTION public.sync_investment_to_ledger();

-- 5. Recalculate holdings from the transaction history so DELETE/UPDATE stay consistent.
CREATE OR REPLACE FUNCTION public.recalculate_stock_holding(target_stock_id BIGINT)
RETURNS VOID AS $$
DECLARE
    rec RECORD;
    v_qty NUMERIC := 0;
    v_avg NUMERIC := 0;
    v_current_price NUMERIC := 0;
    v_investment_amount NUMERIC := 0;
    v_current_value NUMERIC := 0;
BEGIN
    IF target_stock_id IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(current_price, 0) INTO v_current_price
    FROM public.stocks
    WHERE id = target_stock_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    FOR rec IN
        SELECT transaction_type, quantity, price
        FROM public.stock_transactions
        WHERE stock_id = target_stock_id
        ORDER BY transaction_date, id
    LOOP
        IF rec.transaction_type = 'BUY' THEN
            IF v_qty + COALESCE(rec.quantity, 0) > 0 THEN
                v_avg := CASE
                    WHEN v_qty > 0 THEN
                        ((v_qty * v_avg) + (COALESCE(rec.quantity, 0) * COALESCE(rec.price, 0))) /
                        (v_qty + COALESCE(rec.quantity, 0))
                    ELSE
                        COALESCE(rec.price, 0)
                END;
            END IF;

            v_qty := v_qty + COALESCE(rec.quantity, 0);
        ELSIF rec.transaction_type = 'SELL' THEN
            v_qty := GREATEST(v_qty - COALESCE(rec.quantity, 0), 0);
            IF v_qty = 0 THEN
                v_avg := 0;
            END IF;
        END IF;
    END LOOP;

    v_investment_amount := v_qty * v_avg;
    v_current_value := v_qty * COALESCE(NULLIF(v_current_price, 0), v_avg);

    UPDATE public.stocks
    SET
        quantity = v_qty,
        avg_price = v_avg,
        investment_amount = v_investment_amount,
        current_value = v_current_value,
        pnl = v_current_value - v_investment_amount,
        pnl_percentage = CASE
            WHEN v_investment_amount > 0 THEN ((v_current_value - v_investment_amount) / v_investment_amount) * 100
            ELSE 0
        END,
        updated_at = NOW()
    WHERE id = target_stock_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.recalculate_mutual_fund_holding(target_mutual_fund_id BIGINT)
RETURNS VOID AS $$
DECLARE
    rec RECORD;
    v_units NUMERIC := 0;
    v_avg_nav NUMERIC := 0;
    v_current_nav NUMERIC := 0;
    v_investment_amount NUMERIC := 0;
    v_current_value NUMERIC := 0;
BEGIN
    IF target_mutual_fund_id IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(current_nav, 0) INTO v_current_nav
    FROM public.mutual_funds
    WHERE id = target_mutual_fund_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    FOR rec IN
        SELECT transaction_type, units, nav
        FROM public.mutual_fund_transactions
        WHERE mutual_fund_id = target_mutual_fund_id
        ORDER BY transaction_date, id
    LOOP
        IF rec.transaction_type IN ('BUY', 'SIP') THEN
            IF v_units + COALESCE(rec.units, 0) > 0 THEN
                v_avg_nav := CASE
                    WHEN v_units > 0 THEN
                        ((v_units * v_avg_nav) + (COALESCE(rec.units, 0) * COALESCE(rec.nav, 0))) /
                        (v_units + COALESCE(rec.units, 0))
                    ELSE
                        COALESCE(rec.nav, 0)
                END;
            END IF;

            v_units := v_units + COALESCE(rec.units, 0);
        ELSIF rec.transaction_type = 'SELL' THEN
            v_units := GREATEST(v_units - COALESCE(rec.units, 0), 0);
            IF v_units = 0 THEN
                v_avg_nav := 0;
            END IF;
        END IF;
    END LOOP;

    v_investment_amount := v_units * v_avg_nav;
    v_current_value := v_units * COALESCE(NULLIF(v_current_nav, 0), v_avg_nav);

    UPDATE public.mutual_funds
    SET
        units = v_units,
        avg_nav = v_avg_nav,
        investment_amount = v_investment_amount,
        current_value = v_current_value,
        pnl = v_current_value - v_investment_amount,
        pnl_percentage = CASE
            WHEN v_investment_amount > 0 THEN ((v_current_value - v_investment_amount) / v_investment_amount) * 100
            ELSE 0
        END,
        updated_at = NOW()
    WHERE id = target_mutual_fund_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.recalculate_bond_holding(target_bond_id BIGINT)
RETURNS VOID AS $$
DECLARE
    rec RECORD;
    v_qty NUMERIC := 0;
    v_avg NUMERIC := 0;
    v_current_price NUMERIC := 0;
    v_investment_amount NUMERIC := 0;
    v_current_value NUMERIC := 0;
    v_status TEXT := 'ACTIVE';
    v_matured BOOLEAN := FALSE;
BEGIN
    IF target_bond_id IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(current_price, 0) INTO v_current_price
    FROM public.bonds
    WHERE id = target_bond_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    FOR rec IN
        SELECT transaction_type, quantity, price
        FROM public.bond_transactions
        WHERE bond_id = target_bond_id
        ORDER BY transaction_date, id
    LOOP
        IF rec.transaction_type = 'BUY' THEN
            IF v_qty + COALESCE(rec.quantity, 0) > 0 THEN
                v_avg := CASE
                    WHEN v_qty > 0 THEN
                        ((v_qty * v_avg) + (COALESCE(rec.quantity, 0) * COALESCE(rec.price, 0))) /
                        (v_qty + COALESCE(rec.quantity, 0))
                    ELSE
                        COALESCE(rec.price, 0)
                END;
            END IF;

            v_qty := v_qty + COALESCE(rec.quantity, 0);
        ELSIF rec.transaction_type = 'SELL' THEN
            v_qty := GREATEST(v_qty - COALESCE(rec.quantity, 0), 0);
            IF v_qty = 0 THEN
                v_avg := 0;
            END IF;
        ELSIF rec.transaction_type = 'MATURITY' THEN
            v_qty := 0;
            v_avg := 0;
            v_matured := TRUE;
        END IF;
    END LOOP;

    v_investment_amount := v_qty * v_avg;
    v_current_value := v_qty * COALESCE(NULLIF(v_current_price, 0), v_avg);
    v_status := CASE
        WHEN v_qty > 0 THEN 'ACTIVE'
        WHEN v_matured THEN 'MATURED'
        ELSE 'SOLD'
    END;

    UPDATE public.bonds
    SET
        quantity = v_qty,
        avg_price = v_avg,
        investment_amount = v_investment_amount,
        current_value = v_current_value,
        pnl = v_current_value - v_investment_amount,
        pnl_percentage = CASE
            WHEN v_investment_amount > 0 THEN ((v_current_value - v_investment_amount) / v_investment_amount) * 100
            ELSE 0
        END,
        status = v_status,
        updated_at = NOW()
    WHERE id = target_bond_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_stock_holdings()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.recalculate_stock_holding(OLD.stock_id);
        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.stock_id IS DISTINCT FROM NEW.stock_id THEN
        PERFORM public.recalculate_stock_holding(OLD.stock_id);
    END IF;

    PERFORM public.recalculate_stock_holding(NEW.stock_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_mf_holdings()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.recalculate_mutual_fund_holding(OLD.mutual_fund_id);
        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.mutual_fund_id IS DISTINCT FROM NEW.mutual_fund_id THEN
        PERFORM public.recalculate_mutual_fund_holding(OLD.mutual_fund_id);
    END IF;

    PERFORM public.recalculate_mutual_fund_holding(NEW.mutual_fund_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_bond_holdings()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.recalculate_bond_holding(OLD.bond_id);
        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.bond_id IS DISTINCT FROM NEW.bond_id THEN
        PERFORM public.recalculate_bond_holding(OLD.bond_id);
    END IF;

    PERFORM public.recalculate_bond_holding(NEW.bond_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_stock_holdings ON public.stock_transactions;
CREATE TRIGGER tr_sync_stock_holdings
AFTER INSERT OR UPDATE OR DELETE ON public.stock_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_stock_holdings();

DROP TRIGGER IF EXISTS tr_sync_mf_holdings ON public.mutual_fund_transactions;
CREATE TRIGGER tr_sync_mf_holdings
AFTER INSERT OR UPDATE OR DELETE ON public.mutual_fund_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_mf_holdings();

DROP TRIGGER IF EXISTS tr_sync_bond_holdings ON public.bond_transactions;
CREATE TRIGGER tr_sync_bond_holdings
AFTER INSERT OR UPDATE OR DELETE ON public.bond_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_bond_holdings();

-- 6. Match indexes to the app's real access patterns under RLS and sorted reads.
CREATE INDEX IF NOT EXISTS idx_accounts_user_name
    ON public.accounts(user_id, name);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date_desc
    ON public.transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_family_transfers_user_date_desc
    ON public.family_transfers(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_user_date_desc
    ON public.stock_transactions(user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_mutual_fund_transactions_user_date_desc
    ON public.mutual_fund_transactions(user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_bond_transactions_user_date_desc
    ON public.bond_transactions(user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_source_ref
    ON public.transactions (
        (metadata->>'source_table'),
        ((metadata->>'source_id')::BIGINT)
    )
    WHERE metadata ? 'source_table' AND metadata ? 'source_id';
