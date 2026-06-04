-- Alinear códigos de permisos con User.getAuthorities(): authority = 'PERM_' || code (el code en BD no lleva prefijo PERM_)
UPDATE permissions SET code = 'CREATE_BANK_ACCOUNT', updated_at = now() WHERE code = 'PERM_CREATE_BANK_ACCOUNT';
UPDATE permissions SET code = 'VIEW_BANK_ACCOUNT', updated_at = now() WHERE code = 'PERM_VIEW_BANK_ACCOUNT';
UPDATE permissions SET code = 'UPDATE_BANK_ACCOUNT', updated_at = now() WHERE code = 'PERM_UPDATE_BANK_ACCOUNT';
UPDATE permissions SET code = 'DELETE_BANK_ACCOUNT', updated_at = now() WHERE code = 'PERM_DELETE_BANK_ACCOUNT';

-- Permisos referenciados en @PreAuthorize de controladores y ausentes del seed base
INSERT INTO permissions (code, created_at, deleted_at, description, name, "type", updated_at, module_id)
SELECT *
FROM (
    VALUES
    -- Facturas (module_id = 6)
    ('CREATE_INVOICE_OC', now(), NULL::timestamp, 'Permiso para crear órdenes de compra / facturas OC', 'Crear orden de compra', 'CREATE', now(), 6),
    ('READ_INVOICE_OC', now(), NULL::timestamp, 'Permiso para consultar órdenes de compra / facturas OC', 'Consultar orden de compra', 'READ', now(), 6),

    -- Comprobantes / vouchers (listas contables, module_id = 2)
    ('SEARCH_VOUCHER', now(), NULL::timestamp, 'Permiso para buscar comprobantes contables', 'Buscar comprobantes', 'READ', now(), 2),

    ('CREATE_RULER_TAX', now(), NULL::timestamp, 'Permiso para crear reglas tributarias', 'Crear reglas tributarias', 'CREATE', now(), 2),
    ('VIEW_RULER_TAX', now(), NULL::timestamp, 'Permiso para ver reglas tributarias', 'Ver reglas tributarias', 'READ', now(), 2),
    ('UPDATE_RULER_TAX', now(), NULL::timestamp, 'Permiso para actualizar reglas tributarias', 'Actualizar reglas tributarias', 'UPDATE', now(), 2),
    ('DELETE_RULER_TAX', now(), NULL::timestamp, 'Permiso para eliminar reglas tributarias', 'Eliminar reglas tributarias', 'DELETE', now(), 2),
    ('ASSIGN_ACCOUNTING_ACCOUNT_TO_RULER_TAX', now(), NULL::timestamp, 'Permiso para asignar cuenta contable a regla tributaria', 'Asignar cuenta a regla tributaria', 'UPDATE', now(), 2),

    ('CREATE_EXCHANGE_RATES', now(), NULL::timestamp, 'Permiso para crear tasas de cambio', 'Crear tasas de cambio', 'CREATE', now(), 2),
    ('VIEW_EXCHANGE_RATES', now(), NULL::timestamp, 'Permiso para ver tasas de cambio', 'Ver tasas de cambio', 'READ', now(), 2),
    ('UPDATE_EXCHANGE_RATES', now(), NULL::timestamp, 'Permiso para actualizar tasas de cambio', 'Actualizar tasas de cambio', 'UPDATE', now(), 2),
    ('DELETE_EXCHANGE_RATES', now(), NULL::timestamp, 'Permiso para eliminar tasas de cambio', 'Eliminar tasas de cambio', 'DELETE', now(), 2),

    -- Activos (module_id = 3)
    ('CREATE_ASSET', now(), NULL::timestamp, 'Permiso para crear activos', 'Crear activos', 'CREATE', now(), 3),
    ('VIEW_ASSET', now(), NULL::timestamp, 'Permiso para ver activos', 'Ver activos', 'READ', now(), 3),
    ('UPDATE_ASSET', now(), NULL::timestamp, 'Permiso para actualizar activos', 'Actualizar activos', 'UPDATE', now(), 3),

    -- Terceros (module_id = 4)
    ('CREATE_THIRD_PARTY', now(), NULL::timestamp, 'Permiso para crear terceros', 'Crear terceros', 'CREATE', now(), 4),
    ('BULK_STORE_THIRD_PARTY', now(), NULL::timestamp, 'Permiso para carga masiva de terceros', 'Carga masiva de terceros', 'CREATE', now(), 4),
    ('VIEW_THIRD_PARTY', now(), NULL::timestamp, 'Permiso para ver terceros', 'Ver terceros', 'READ', now(), 4),
    ('UPDATE_THIRD_PARTY', now(), NULL::timestamp, 'Permiso para actualizar terceros', 'Actualizar terceros', 'UPDATE', now(), 4),
    ('MANAGE_THIRD_PARTY_ROLES_STATUS', now(), NULL::timestamp, 'Permiso para gestionar roles y estado de terceros', 'Gestionar roles y estado de terceros', 'UPDATE', now(), 4),
    ('DELETE_THIRD_PARTY', now(), NULL::timestamp, 'Permiso para eliminar terceros', 'Eliminar terceros', 'DELETE', now(), 4),

    ('CALCULATE_ECL_SEGMENT', now(), NULL::timestamp, 'Permiso para calcular segmentación ECL', 'Calcular segmentación ECL', 'UPDATE', now(), 4),
    ('ADJUST_ECL_SEGMENT', now(), NULL::timestamp, 'Permiso para ajustar segmentación ECL', 'Ajustar segmentación ECL', 'UPDATE', now(), 4),
    ('VIEW_ECL_SEGMENT', now(), NULL::timestamp, 'Permiso para ver segmentación ECL', 'Ver segmentación ECL', 'READ', now(), 4),

    ('CREATE_COMMERCIAL_DATA', now(), NULL::timestamp, 'Permiso para crear datos comerciales', 'Crear datos comerciales', 'CREATE', now(), 4),
    ('UPDATE_COMMERCIAL_DATA', now(), NULL::timestamp, 'Permiso para actualizar datos comerciales', 'Actualizar datos comerciales', 'UPDATE', now(), 4),
    ('VIEW_COMMERCIAL_DATA', now(), NULL::timestamp, 'Permiso para ver datos comerciales', 'Ver datos comerciales', 'READ', now(), 4),
    ('DELETE_COMMERCIAL_DATA', now(), NULL::timestamp, 'Permiso para eliminar datos comerciales', 'Eliminar datos comerciales', 'DELETE', now(), 4),

    -- Bancos y cajas (module_id = 5)
    ('CREATE_BANK_ACCOUNT', now(), NULL::timestamp, 'Permiso para crear cuentas bancarias', 'Crear cuentas bancarias', 'CREATE', now(), 5),
    ('VIEW_BANK_ACCOUNT', now(), NULL::timestamp, 'Permiso para ver cuentas bancarias', 'Ver cuentas bancarias', 'READ', now(), 5),
    ('UPDATE_BANK_ACCOUNT', now(), NULL::timestamp, 'Permiso para actualizar cuentas bancarias', 'Actualizar cuentas bancarias', 'UPDATE', now(), 5),
    ('DELETE_BANK_ACCOUNT', now(), NULL::timestamp, 'Permiso para eliminar cuentas bancarias', 'Eliminar cuentas bancarias', 'DELETE', now(), 5),

    ('CREATE_BANK', now(), NULL::timestamp, 'Permiso para crear bancos', 'Crear bancos', 'CREATE', now(), 5),
    ('VIEW_BANK', now(), NULL::timestamp, 'Permiso para ver bancos', 'Ver bancos', 'READ', now(), 5),
    ('UPDATE_BANK', now(), NULL::timestamp, 'Permiso para actualizar bancos', 'Actualizar bancos', 'UPDATE', now(), 5),
    ('DELETE_BANK', now(), NULL::timestamp, 'Permiso para eliminar bancos', 'Eliminar bancos', 'DELETE', now(), 5),

    ('CREATE_BANK_BRANCH', now(), NULL::timestamp, 'Permiso para crear sucursales bancarias', 'Crear sucursales bancarias', 'CREATE', now(), 5),
    ('VIEW_BANK_BRANCH', now(), NULL::timestamp, 'Permiso para ver sucursales bancarias', 'Ver sucursales bancarias', 'READ', now(), 5),
    ('UPDATE_BANK_BRANCH', now(), NULL::timestamp, 'Permiso para actualizar sucursales bancarias', 'Actualizar sucursales bancarias', 'UPDATE', now(), 5),
    ('DELETE_BANK_BRANCH', now(), NULL::timestamp, 'Permiso para eliminar sucursales bancarias', 'Eliminar sucursales bancarias', 'DELETE', now(), 5),

    ('CREATE_CASH', now(), NULL::timestamp, 'Permiso para crear cajas', 'Crear cajas', 'CREATE', now(), 5),
    ('UPDATE_CASH', now(), NULL::timestamp, 'Permiso para actualizar cajas', 'Actualizar cajas', 'UPDATE', now(), 5),
    ('DELETE_CASH', now(), NULL::timestamp, 'Permiso para eliminar cajas', 'Eliminar cajas', 'DELETE', now(), 5),
    ('CHANGE_CASH_STATUS', now(), NULL::timestamp, 'Permiso para cambiar estado de cajas', 'Cambiar estado de cajas', 'UPDATE', now(), 5),
    ('VIEW_CASH', now(), NULL::timestamp, 'Permiso para ver cajas', 'Ver cajas', 'READ', now(), 5),

    ('CREATE_CHECKBOOK', now(), NULL::timestamp, 'Permiso para crear chequeras', 'Crear chequeras', 'CREATE', now(), 5),
    ('UPDATE_CHECKBOOK', now(), NULL::timestamp, 'Permiso para actualizar chequeras', 'Actualizar chequeras', 'UPDATE', now(), 5),
    ('DELETE_CHECKBOOK', now(), NULL::timestamp, 'Permiso para eliminar chequeras', 'Eliminar chequeras', 'DELETE', now(), 5),
    ('VIEW_CHECKBOOK', now(), NULL::timestamp, 'Permiso para ver chequeras', 'Ver chequeras', 'READ', now(), 5),

    ('CREATE_BANK_CHECK', now(), NULL::timestamp, 'Permiso para crear cheques bancarios', 'Crear cheques', 'CREATE', now(), 5),
    ('VIEW_BANK_CHECK', now(), NULL::timestamp, 'Permiso para ver cheques bancarios', 'Ver cheques', 'READ', now(), 5),
    ('VOID_BANK_CHECK', now(), NULL::timestamp, 'Permiso para anular cheques bancarios', 'Anular cheques', 'UPDATE', now(), 5),
    ('REPORT_LOST_BANK_CHECK', now(), NULL::timestamp, 'Permiso para reportar cheque extraviado', 'Reportar cheque extraviado', 'UPDATE', now(), 5),
    ('RECONCILE_BANK_CHECK', now(), NULL::timestamp, 'Permiso para conciliar cheques bancarios', 'Conciliar cheques', 'UPDATE', now(), 5),
    ('DELETE_BANK_CHECK', now(), NULL::timestamp, 'Permiso para eliminar cheques bancarios', 'Eliminar cheques', 'DELETE', now(), 5)
) AS v(code, created_at, deleted_at, description, name, "type", updated_at, module_id)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.code = v.code);
