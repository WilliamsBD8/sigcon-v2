-- Facturas de venta (FV): permisos, menús y asignación a superadmin

INSERT INTO permissions (code, created_at, deleted_at, description, name, "type", updated_at, module_id)
SELECT v.code, now(), NULL::timestamp, v.description, v.name, v."type", now(), 6
FROM (
    VALUES
    ('CREATE_INVOICE_FV', 'Permiso para crear facturas de venta', 'Crear factura de venta', 'CREATE'),
    ('VIEW_INVOICE_FV', 'Permiso para consultar facturas de venta', 'Ver facturas de venta', 'READ'),
    ('UPDATE_INVOICE_FV', 'Permiso para actualizar facturas de venta', 'Actualizar factura de venta', 'UPDATE')
) AS v(code, description, name, "type")
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.code = v.code);

INSERT INTO menus (component, created_at, deleted_at, icon, "label", menu_order, "path", status, updated_at, module_id, parent_id, visible)
SELECT *
FROM (
    VALUES
    ('INVOICE_SALE', now(), NULL::timestamp, 'ri-shopping-cart-line', 'Facturas de Venta', 2, 'invoice-sale', 'ACTIVE', now(), 6, NULL::bigint, TRUE)
) AS v(component, created_at, deleted_at, icon, "label", menu_order, "path", status, updated_at, module_id, parent_id, visible)
WHERE NOT EXISTS (
    SELECT 1 FROM menus m WHERE m.component = v.component AND m.module_id = v.module_id
);

INSERT INTO menus (component, created_at, deleted_at, icon, "label", menu_order, "path", status, updated_at, module_id, parent_id, visible)
SELECT v.component, now(), NULL::timestamp, v.icon, v."label", v.menu_order, v."path", v.status, now(), 6, p.id, v.visible
FROM (
    VALUES
    ('CREATE_INVOICE_SALE', 'ri-add-line', 'Crear Factura de Venta', 2, 'create', 'ACTIVE', FALSE),
    ('UPDATE_INVOICE_SALE', 'ri-pencil-line', 'Actualizar Factura de Venta', 3, 'update/:id', 'ACTIVE', FALSE),
    ('VIEW_INVOICE_SALE', 'ri-eye-line', 'Ver Factura de Venta', 4, 'view/:id', 'ACTIVE', FALSE)
) AS v(component, icon, "label", menu_order, "path", status, visible)
CROSS JOIN menus p
WHERE p.component = 'INVOICE_SALE' AND p.module_id = 6
  AND NOT EXISTS (
    SELECT 1 FROM menus m WHERE m.component = v.component AND m.module_id = 6
);

INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPERADMIN'
  AND p.code IN ('CREATE_INVOICE_FV', 'VIEW_INVOICE_FV', 'UPDATE_INVOICE_FV')
  AND NOT EXISTS (
    SELECT 1 FROM roles_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

INSERT INTO menu_permissions (menu_id, role_id, created_at, updated_at)
SELECT m.id, r.id, now(), now()
FROM roles r
CROSS JOIN menus m
WHERE r.name = 'SUPERADMIN'
  AND m.component IN ('INVOICE_SALE', 'CREATE_INVOICE_SALE', 'UPDATE_INVOICE_SALE', 'VIEW_INVOICE_SALE')
  AND m.module_id = 6
  AND NOT EXISTS (
    SELECT 1 FROM menu_permissions mp
    WHERE mp.role_id = r.id AND mp.menu_id = m.id AND mp.deleted_at IS NULL
);
