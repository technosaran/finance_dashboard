-- Fix side effects from the stock audit backfill migration.
-- The transactions trigger already updates balances on insert, so the explicit
-- account balance adjustment in the audit migration doubled the credited amount.
-- Also remove the duplicate TCS backfill row and correct the legacy TCS sell
-- entry to use net proceeds after charges.

WITH audit_backfill_delta AS (
    SELECT
        account_id,
        SUM(
            CASE
                WHEN type = 'Income' THEN amount
                ELSE -amount
            END
        ) AS delta
    FROM public.transactions
    WHERE COALESCE((metadata ->> 'auditBackfill')::boolean, FALSE)
      AND account_id IS NOT NULL
    GROUP BY account_id
)
UPDATE public.accounts AS a
SET balance = a.balance - audit_backfill_delta.delta,
    updated_at = NOW()
FROM audit_backfill_delta
WHERE a.id = audit_backfill_delta.account_id;

DELETE FROM public.transactions
WHERE COALESCE((metadata ->> 'auditBackfill')::boolean, FALSE)
  AND description = 'SELL Stock: TCS (2 shares)'
  AND date = DATE '2026-02-18'
  AND account_id = 5;

UPDATE public.transactions
SET amount = 5367.84,
    updated_at = NOW()
WHERE description = 'SELL Stock: TCS (2 shares)'
  AND category = 'Investments'
  AND type = 'Income'
  AND COALESCE((metadata ->> 'auditBackfill')::boolean, FALSE) = FALSE
  AND account_id = 5
  AND date = DATE '2026-02-18'
  AND ROUND(amount::numeric, 2) = 5410.16;
