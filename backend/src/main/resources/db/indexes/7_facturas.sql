-- LLaves para unicidad

DROP INDEX IF EXISTS uk_payment_methods_code;
CREATE UNIQUE INDEX IF NOT EXISTS uk_payment_methods_code
ON payment_methods (code)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_invoices_res_type
ON invoices (type_invoice_id, resolution, company_id)
WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS uk_invoices_res_invoice_company;
CREATE UNIQUE INDEX IF NOT EXISTS uk_invoices_res_invoice_company
ON invoices (type_invoice_id, resolution_invoice, company_id)
WHERE deleted_at IS NULL
AND resolution_invoice IS NOT NULL
AND resolution_invoice <> '';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_origin_destination_different'
    ) THEN
        ALTER TABLE invoices
        ADD CONSTRAINT chk_origin_destination_different
        CHECK (
            location_origin_id IS NULL 
            OR location_destination_id IS NULL 
            OR location_origin_id <> location_destination_id
        );
    END IF;
END$$;

DROP INDEX IF EXISTS uk_types_invoices_code;

CREATE UNIQUE INDEX uk_types_invoices_code
ON types_invoices (code)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_types_invoices_code_number
ON types_invoices (code_number)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_invoice_states_name_code_block
ON invoice_states (name, code, block)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_payment_forms_code
ON payment_forms (code)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_voucher_types_code
ON voucher_types (code)
WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS uk_vouchers_number;
CREATE UNIQUE INDEX IF NOT EXISTS uk_vouchers_number
ON vouchers (number, voucher_type_id, company_id)
WHERE deleted_at IS NULL;

ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS chk_origin_payment_not_null;
ALTER TABLE vouchers
ADD CONSTRAINT chk_origin_payment_not_null
CHECK (
    bank_account_id IS NOT NULL
    OR cash_account_id IS NOT NULL
    OR check_id IS NOT NULL
);

ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS chk_amount_positive;
ALTER TABLE vouchers
ADD CONSTRAINT chk_amount_positive
CHECK (amount IS NOT NULL AND amount > 0);