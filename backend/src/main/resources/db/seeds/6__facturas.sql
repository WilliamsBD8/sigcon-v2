
-- Migraciones

INSERT INTO types_invoices (name, code, description, code_number, created_at, updated_at)
SELECT * FROM (
    VALUES
    ('Orden de compra', 'OC', 'Orden de compra', 2, now(), now()),
    ('Cotizacion', 'CQ', 'Cotizacion', 3, now(), now()),
    ('Factura de compra', 'FC', 'Factura de compra', 4, now(), now()),
    
    ('Transferencia de inventario', 'TI', 'Transferencia de inventario', 5, now(), now()),
    ('Recepcion de inventario', 'RI', 'Recepcion de inventario', 6, now(), now()),
     
    ('Factura de venta', 'FV', 'Factura de venta', 1, now(), now()),
    ('Nota de crédito', 'NC', 'Nota de crédito', 7, now(), now()),
    ('Nota de débito', 'ND', 'Nota de débito', 8, now(), now())
) AS v (name, code, description, code_number, created_at, updated_at)
ON CONFLICT DO NOTHING;

INSERT INTO invoice_states (name, code, block, description, color, created_at, updated_at)
SELECT * FROM (
    VALUES
    ('Pendiente de aprobación', 'PENDING_APPROVAL', 'OC', 'Orden de compra pendiente de aprobación', 'label-dark', now(), now()),
    ('Aprobada', 'APPROVED', 'OC', 'Orden de compra aprobada', 'label-success', now(), now()),
    ('Rechazada', 'REJECTED', 'OC', 'Orden de compra rechazada', 'danger', now(), now()),
    ('Recibida parcialmente', 'PARTIALLY_RECEIVED', 'OC', 'Recepción parcial de la orden', 'label-warning', now(), now()),
    ('Recibida completamente', 'RECEIVED', 'OC', 'Recepción total de la orden', 'label-info', now(), now()),
    ('Cerrada', 'CLOSED', 'OC', 'Orden cerrada', 'success', now(), now()),

    ('Facturada', 'BILLED', 'FC', 'Factura facturada', 'info', now(), now()),
    ('Facturada', 'BILLED', 'FV', 'Factura facturada', 'info', now(), now())
) AS v (name, code, block, description, color, created_at, updated_at)
ON CONFLICT DO NOTHING;

INSERT INTO payment_forms (name, code, description, created_at, updated_at)
SELECT * FROM (
    VALUES
    ('Contado', 'CASH', 'Contado', now(), now()),
    ('Crédito', 'CREDIT', 'Crédito', now(), now())
) AS v (name, code, description, created_at, updated_at)
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (name, code, description, type, created_at, updated_at)
SELECT * FROM (
    VALUES
    ('Efectivo', 'CASH', 'Pagos', 'CASH', now(), now()),
    ('Cheque', 'CHECK', 'Cheque', 'CHECK', now(), now()),
    ('Cuenta Corriente', 'CORRIENTE', 'Cuenta Corriente', 'CORRIENTE', now(), now()),
    ('Cuenta de ahorro', 'AHORROS', 'Cuenta de ahorro', 'AHORROS', now(), now()),
    ('Tarjeta de crédito', 'TARJETA_CREDITO', 'Tarjeta de crédito', 'TARJETA_CREDITO', now(), now())
) AS v (name, code, description, type, created_at, updated_at)
ON CONFLICT DO NOTHING;


INSERT INTO voucher_types (name, code, description, type, created_at, updated_at)
SELECT * FROM (
    VALUES
    ('Pago de compra', 'PAYMENT', 'Pago de compra', 'OUTPUT', now(), now()),
    ('Cobro de venta', 'RECEIPT', 'Cobro de venta', 'INPUT', now(), now()),
    ('Pago de nomina', 'PAYROLL', 'Pago de nomina', 'OUTPUT', now(), now()),
    ('Pago de servicio', 'SERVICE_PAYMENT', 'Pago de servicio', 'OUTPUT', now(), now()),
    ('Cobro por prestacion de servicios', 'SERVICE_RECEIPT', 'Cobro por prestacion de servicios', 'INPUT', now(), now())
) AS v (name, code, description, type, created_at, updated_at)
ON CONFLICT DO NOTHING;