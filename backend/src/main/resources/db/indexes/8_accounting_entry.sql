CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_period_company_open
ON accounting_periods(company_id)
WHERE status = 'OPEN' AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_consecutive_company_id_active
ON accounting_entries (consecutive, company_id)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_accounting_entry_accounting_account_active
ON accounting_entry_lines (accounting_entry_id, accounting_account_id)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_accounting_entry_active_voucher
ON accounting_entries (voucher_id)
WHERE deleted_at IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_accounting_entry_credit_debit'
    ) THEN
        ALTER TABLE accounting_entries
        ADD CONSTRAINT chk_accounting_entry_credit_debit
        CHECK (credit <> 0 AND debit <> 0);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_accounting_entry_credit_debit_equal'
    ) THEN
        ALTER TABLE accounting_entries
        ADD CONSTRAINT chk_accounting_entry_credit_debit_equal
        CHECK (credit = debit);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_accounting_entry_line_amount_positive'
    ) THEN
        ALTER TABLE accounting_entry_lines
        ADD CONSTRAINT chk_accounting_entry_line_amount_positive
        CHECK (amount > 0);
    END IF;
END$$;
