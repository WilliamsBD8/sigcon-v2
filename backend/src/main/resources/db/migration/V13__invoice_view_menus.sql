-- Rutas ocultas para ver facturas / órdenes de compra (módulo Facturas, id=6)
INSERT INTO menus (component, created_at, deleted_at, icon, "label", menu_order, "path", status, updated_at, module_id, parent_id, visible)
SELECT *
FROM (
    VALUES
    ('VIEW_INVOICE_BILL', now(), NULL::timestamp, 'ri-eye-line', 'Ver Factura de Compra', 6, 'view/:id', 'ACTIVE', now(), 6, 38, FALSE),
    ('VIEW_PURCHASE_ORDERS', now(), NULL::timestamp, 'ri-eye-line', 'Ver Orden de Compra', 4, 'view/:id', 'ACTIVE', now(), 6, 35, FALSE)
) AS v(component, created_at, deleted_at, icon, "label", menu_order, "path", status, updated_at, module_id, parent_id, visible)
WHERE NOT EXISTS (
    SELECT 1 FROM menus m
    WHERE m.component = v.component AND m.module_id = v.module_id
);
