ALTER TABLE products
    ADD COLUMN IF NOT EXISTS sale_price NUMERIC(19, 2) DEFAULT 0 NOT NULL;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS stock NUMERIC(19, 4) DEFAULT 0 NOT NULL;

UPDATE products SET sale_price = price WHERE sale_price IS NULL OR sale_price = 0;

INSERT INTO invoice_states (name, code, block, description, color, created_at, updated_at)
SELECT v.name, v.code, v.block, v.description, v.color, now(), now()
FROM (
    VALUES
    ('Facturada', 'BILLED', 'FV', 'Factura de venta facturada', 'label-info')
) AS v(name, code, block, description, color)
WHERE NOT EXISTS (
    SELECT 1 FROM invoice_states s WHERE s.block = v.block AND s.code = v.code
);
