-- Migration to fix brokerage and taxes logic in ledger sync and account balance updates
-- Migration Name: 20260313210000_fix_taxes_brokerage_logic.sql

-- 1. Fix sync_investment_to_ledger to handle Net Amount correctly
CREATE OR REPLACE FUNCTION public.sync_investment_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_desc TEXT;
    v_type TEXT;
    v_amount DECIMAL(15,2);
    v_symbol TEXT;
BEGIN
    -- 1. Stock Transactions
    IF TG_TABLE_NAME = 'stock_transactions' THEN
        SELECT symbol INTO v_symbol FROM public.stocks WHERE id = NEW.stock_id;
        v_desc := NEW.transaction_type || ' Stock: ' || COALESCE(v_symbol, 'Unknown') || ' (' || NEW.quantity || ' shares)';
        
        IF NEW.transaction_type = 'BUY' THEN
            v_type := 'Expense';
            -- Total cost = Price * Qty + Charges
            v_amount := NEW.total_amount + COALESCE(NEW.brokerage, 0) + COALESCE(NEW.taxes, 0);
        ELSE
            v_type := 'Income';
            -- Net proceeds = Price * Qty - Charges
            v_amount := NEW.total_amount - (COALESCE(NEW.brokerage, 0) + COALESCE(NEW.taxes, 0));
        END IF;
        
    -- 2. Mutual Fund Transactions
    ELSIF TG_TABLE_NAME = 'mutual_fund_transactions' THEN
        SELECT name INTO v_symbol FROM public.mutual_funds WHERE id = NEW.mutual_fund_id;
        v_desc := NEW.transaction_type || ' MF: ' || COALESCE(v_symbol, 'Unknown') || ' (' || NEW.units || ' units)';
        v_type := CASE WHEN NEW.transaction_type IN ('BUY', 'SIP') THEN 'Expense' ELSE 'Income' END;
        v_amount := NEW.total_amount;

    -- 3. F&O Trades
    ELSIF TG_TABLE_NAME = 'fno_trades' THEN
        IF (TG_OP = 'INSERT' AND NEW.status = 'OPEN') THEN
            v_desc := 'FnO Entry: ' || NEW.instrument;
            v_type := 'Expense';
            v_amount := NEW.avg_price * NEW.quantity;
        ELSIF (TG_OP = 'INSERT' AND NEW.status = 'CLOSED') THEN
            -- Entry
            INSERT INTO public.transactions (user_id, account_id, date, description, category, type, amount)
            VALUES (NEW.user_id, NEW.account_id, NEW.entry_date, 'FnO Entry: ' || NEW.instrument, 'Investments', 'Expense', NEW.avg_price * NEW.quantity);
            -- Exit
            v_desc := 'FnO Exit: ' || NEW.instrument;
            v_type := 'Income';
            v_amount := (NEW.avg_price * NEW.quantity) + COALESCE(NEW.pnl, 0);
        ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'OPEN' AND NEW.status = 'CLOSED') THEN
            v_desc := 'FnO Exit: ' || NEW.instrument;
            v_type := 'Income';
            v_amount := (NEW.avg_price * NEW.quantity) + COALESCE(NEW.pnl, 0);
        ELSE
            RETURN NEW;
        END IF;

    -- 4. Bond Transactions
    ELSIF TG_TABLE_NAME = 'bond_transactions' THEN
        SELECT name INTO v_symbol FROM public.bonds WHERE id = NEW.bond_id;
        v_desc := NEW.transaction_type || ' Bond: ' || COALESCE(v_symbol, 'Unknown');
        v_type := CASE WHEN NEW.transaction_type = 'BUY' THEN 'Expense' ELSE 'Income' END;
        v_amount := NEW.total_amount;
    END IF;

    -- 5. Always insert ledger entry
    INSERT INTO public.transactions (user_id, account_id, date, description, category, type, amount)
    VALUES (NEW.user_id, NEW.account_id, COALESCE(NEW.transaction_date, CURRENT_DATE), v_desc, 'Investments', v_type, v_amount);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix update_account_on_investment to handle Net Amount correctly
CREATE OR REPLACE FUNCTION public.update_account_on_investment()
RETURNS TRIGGER AS $$
DECLARE
    v_net_amount DECIMAL(15,2);
BEGIN
    IF TG_TABLE_NAME = 'stock_transactions' THEN
        IF NEW.transaction_type = 'BUY' THEN
            -- Deduct total cost (Price + Charges)
            v_net_amount := -(NEW.total_amount + COALESCE(NEW.brokerage, 0) + COALESCE(NEW.taxes, 0));
        ELSE
            -- Add net proceeds (Price - Charges)
            v_net_amount := NEW.total_amount - (COALESCE(NEW.brokerage, 0) + COALESCE(NEW.taxes, 0));
        END IF;
    ELSIF TG_TABLE_NAME = 'mutual_fund_transactions' THEN
        v_net_amount := NEW.total_amount;
        IF NEW.transaction_type IN ('BUY', 'SIP') THEN v_net_amount := -v_net_amount; END IF;
    ELSIF TG_TABLE_NAME = 'bond_transactions' THEN
        v_net_amount := NEW.total_amount;
        IF NEW.transaction_type = 'BUY' THEN v_net_amount := -v_net_amount; END IF;
    END IF;

    IF NEW.account_id IS NOT NULL AND v_net_amount IS NOT NULL THEN
        UPDATE public.accounts SET balance = balance + v_net_amount WHERE id = NEW.account_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
