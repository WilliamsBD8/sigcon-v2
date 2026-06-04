-- Productos
CREATE UNIQUE INDEX IF NOT EXISTS uk_products_code_active
ON products (company_id, code)
WHERE deleted_at IS NULL;