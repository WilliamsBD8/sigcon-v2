-- Reseteo
DROP INDEX IF EXISTS uk_assets_code_active;
DROP INDEX IF EXISTS uk_assets_name_active;

DROP INDEX IF EXISTS uk_risk_segmentation_client_active;

-- Activos
CREATE UNIQUE INDEX IF NOT EXISTS uk_assets_code_active
ON assets (product_id, asset_code)
WHERE deleted_at IS NULL;

-- risk_segmentation
CREATE UNIQUE INDEX IF NOT EXISTS uk_risk_segmentation_client_active
ON risk_segmentation (client_id)
WHERE deleted_at IS NULL;

-- product_accountings
CREATE UNIQUE INDEX IF NOT EXISTS uk_product_accountings
ON product_accountings (product_id, accounting_account_id)
WHERE deleted_at IS NULL;