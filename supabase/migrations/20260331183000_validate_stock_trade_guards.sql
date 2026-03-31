-- Enforce real-world stock trade checks before inserts and keep grouped holdings in sync.

CREATE OR REPLACE FUNCTION public.validate_stock_transaction_entry()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_symbol TEXT;
    v_exchange TEXT;
    v_account_balance DECIMAL(15,2);
    v_account_currency TEXT;
    v_required_amount DECIMAL(15,2);
    v_available_quantity DECIMAL(15,4);
BEGIN
    IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than zero.';
    END IF;

    IF NEW.price IS NULL OR NEW.price <= 0 THEN
        RAISE EXCEPTION 'Price must be greater than zero.';
    END IF;

    IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN
        RAISE EXCEPTION 'Trade value must be greater than zero.';
    END IF;

    SELECT user_id, symbol, exchange
    INTO v_user_id, v_symbol, v_exchange
    FROM public.stocks
    WHERE id = NEW.stock_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Selected stock holding was not found.';
    END IF;

    IF NEW.account_id IS NULL THEN
        RAISE EXCEPTION 'Select an operating INR account before placing a stock order.';
    END IF;

    SELECT balance, currency
    INTO v_account_balance, v_account_currency
    FROM public.accounts
    WHERE id = NEW.account_id
      AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Selected operating account is not available for this trade.';
    END IF;

    IF v_account_currency <> 'INR' THEN
        RAISE EXCEPTION 'Stock trades require an INR funding account.';
    END IF;

    IF NEW.transaction_type = 'BUY' THEN
        v_required_amount :=
            NEW.total_amount + COALESCE(NEW.brokerage, 0) + COALESCE(NEW.taxes, 0);

        IF v_account_balance < v_required_amount THEN
            RAISE EXCEPTION
                'Insufficient account balance. Required: %, available: %.',
                ROUND(v_required_amount, 2),
                ROUND(v_account_balance, 2);
        END IF;
    ELSIF NEW.transaction_type = 'SELL' THEN
        PERFORM 1
        FROM public.stocks
        WHERE user_id = v_user_id
          AND UPPER(symbol) = UPPER(v_symbol)
          AND UPPER(exchange) = UPPER(v_exchange)
          AND quantity > 0
        FOR UPDATE;

        SELECT COALESCE(SUM(quantity), 0)
        INTO v_available_quantity
        FROM public.stocks
        WHERE user_id = v_user_id
          AND UPPER(symbol) = UPPER(v_symbol)
          AND UPPER(exchange) = UPPER(v_exchange);

        IF v_available_quantity < NEW.quantity THEN
            RAISE EXCEPTION
                'Insufficient shares. Available: %, requested: %.',
                ROUND(v_available_quantity, 4),
                NEW.quantity;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_validate_stock_transaction_entry ON public.stock_transactions;
CREATE TRIGGER tr_validate_stock_transaction_entry
BEFORE INSERT ON public.stock_transactions
FOR EACH ROW EXECUTE FUNCTION public.validate_stock_transaction_entry();

CREATE OR REPLACE FUNCTION public.sync_stock_holdings()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_symbol TEXT;
    v_exchange TEXT;
    v_old_qty DECIMAL;
    v_old_avg DECIMAL;
    v_new_qty DECIMAL;
    v_new_avg DECIMAL;
    v_current_price DECIMAL;
    v_remaining_qty DECIMAL;
    v_sell_qty DECIMAL;
    v_target RECORD;
BEGIN
    SELECT user_id, symbol, exchange
    INTO v_user_id, v_symbol, v_exchange
    FROM public.stocks
    WHERE id = NEW.stock_id;

    IF NEW.transaction_type = 'BUY' THEN
        SELECT quantity, avg_price, current_price
        INTO v_old_qty, v_old_avg, v_current_price
        FROM public.stocks
        WHERE id = NEW.stock_id
        FOR UPDATE;

        v_new_qty := COALESCE(v_old_qty, 0) + NEW.quantity;

        IF v_new_qty > 0 THEN
            v_new_avg := (
                (COALESCE(v_old_qty, 0) * COALESCE(v_old_avg, 0)) + (NEW.quantity * NEW.price)
            ) / v_new_qty;
        ELSE
            v_new_avg := NEW.price;
        END IF;

        UPDATE public.stocks
        SET quantity = v_new_qty,
            avg_price = v_new_avg,
            investment_amount = v_new_qty * v_new_avg,
            current_value = v_new_qty * COALESCE(v_current_price, v_new_avg),
            pnl = (v_new_qty * COALESCE(v_current_price, v_new_avg)) - (v_new_qty * v_new_avg),
            pnl_percentage = CASE
                WHEN (v_new_qty * v_new_avg) > 0 THEN
                    (((v_new_qty * COALESCE(v_current_price, v_new_avg)) - (v_new_qty * v_new_avg))
                    / (v_new_qty * v_new_avg)) * 100
                ELSE 0
            END,
            updated_at = NOW()
        WHERE id = NEW.stock_id;

        RETURN NEW;
    END IF;

    v_remaining_qty := NEW.quantity;

    FOR v_target IN
        SELECT id, quantity, avg_price, current_price
        FROM public.stocks
        WHERE user_id = v_user_id
          AND UPPER(symbol) = UPPER(v_symbol)
          AND UPPER(exchange) = UPPER(v_exchange)
          AND quantity > 0
        ORDER BY CASE WHEN id = NEW.stock_id THEN 0 ELSE 1 END, created_at, id
        FOR UPDATE
    LOOP
        EXIT WHEN v_remaining_qty <= 0;

        v_sell_qty := LEAST(v_target.quantity, v_remaining_qty);
        v_new_qty := v_target.quantity - v_sell_qty;
        v_remaining_qty := v_remaining_qty - v_sell_qty;

        UPDATE public.stocks
        SET quantity = v_new_qty,
            investment_amount = v_new_qty * COALESCE(v_target.avg_price, 0),
            current_value = v_new_qty * COALESCE(v_target.current_price, v_target.avg_price, NEW.price),
            pnl = (
                v_new_qty * COALESCE(v_target.current_price, v_target.avg_price, NEW.price)
            ) - (v_new_qty * COALESCE(v_target.avg_price, 0)),
            pnl_percentage = CASE
                WHEN (v_new_qty * COALESCE(v_target.avg_price, 0)) > 0 THEN
                    (
                        (
                            v_new_qty * COALESCE(v_target.current_price, v_target.avg_price, NEW.price)
                        ) - (v_new_qty * COALESCE(v_target.avg_price, 0))
                    ) / (v_new_qty * COALESCE(v_target.avg_price, 0))
                ) * 100
                ELSE 0
            END,
            updated_at = NOW()
        WHERE id = v_target.id;
    END LOOP;

    IF v_remaining_qty > 0 THEN
        RAISE EXCEPTION 'Unable to settle sell transaction because holdings are insufficient.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
