INSERT INTO third_party_role_catalog (name, created_at, updated_at)
SELECT v.name, NOW(), NOW()
FROM (VALUES
    ('CLIENTE'),
    ('PROVEEDOR'),
    ('EMPLEADO')
) AS v(name)
ON CONFLICT DO NOTHING;

INSERT INTO third_party_status_catalog (name, created_at, updated_at)
SELECT v.name, NOW(), NOW()
FROM (VALUES
    ('ACTIVO'),
    ('BLOQUEADO'),
    ('INACTIVO')
) AS v(name)
ON CONFLICT DO NOTHING;

-- riesgos

--Dependencias pendientes para modulos no implementados aun: 
--1. Cuentas por Cobrar (Accounts Receivable - AR) - modulo aun no implementado. 
--una vez implementado el modulo se deben conectar los datos de la antiguedad de saldos y dias mora
--para poder realizar el calculo automatico de segmentacion ECL segun el RF-08 del modulo de Terceros. 
--ALTER TABLE risk_segmentation ADD CONSTRAINT fk_risk_segmentation_ar_data
-- FOREIGN KEY (ar_references_id) REFERENCES account_receivable(id)

--auto_segment y final_segment estaran en estado PENDING porque el modulo AR no esta implementado (ECL_001)
INSERT INTO risk_segmentation (
    client_id,
    auto_segment,
    final_segment,
    segmentation_source, 
    justification, 
    calculation_date, 
    created_at,
    updated_at
)
SELECT 
    tp.id, 
    'PENDING', 
    'PENDING',
    'AUTOMATIC', 
    NULL, 
    NOW(),
    NOW(),
    NOW()
FROM third_parties tp
JOIN third_party_role_assignments tra ON tra.third_party_id = tp.id
JOIN third_party_role_catalog rc ON rc.id = tra.role_id
WHERE rc.name = 'CLIENTE'
   AND tp.deleted_at IS NULL
   AND NOT EXISTS (
    SELECT 1 FROM risk_segmentation rs 
    WHERE rs.client_id = tp.id
    AND rs.deleted_at IS NULL
   ); 
INSERT INTO risk_segmentation_history (
    client_id,
    previous_segment, 
    new_segment, 
    segmentation_source,
    justification,
    change_date
)
SELECT 
    rs.client_id,
    'PENDING',
    'PENDING',
    'AUTOMATIC',
    NULL,
    NOW()
FROM risk_segmentation rs 
JOIN third_parties tp ON rs.client_id = tp.id
JOIN third_party_role_assignments tra ON tra.third_party_id = tp.id
JOIN third_party_role_catalog rc ON rc.id = tra.role_id
WHERE rc.name = 'CLIENTE'
  AND tp.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM risk_segmentation_history rsh 
    WHERE rsh.client_id = rs.client_id
  );


-- payment_terms

-- Insertar términos de pago
INSERT INTO payment_terms (name, days)
SELECT 'Contado', 0
WHERE NOT EXISTS (
    SELECT 1 FROM payment_terms 
    WHERE name = 'Contado' AND deleted_at IS NULL
);

INSERT INTO payment_terms (name, days)
SELECT 'Diario', 1
WHERE NOT EXISTS (
    SELECT 1 FROM payment_terms 
    WHERE name = 'Diario' AND deleted_at IS NULL
);

INSERT INTO payment_terms (name, days)
SELECT 'Semanal', 7
WHERE NOT EXISTS (
    SELECT 1 FROM payment_terms 
    WHERE name = 'Semanal' AND deleted_at IS NULL
);

INSERT INTO payment_terms (name, days)
SELECT 'Quincenal', 15
WHERE NOT EXISTS (
    SELECT 1 FROM payment_terms 
    WHERE name = 'Quincenal' AND deleted_at IS NULL
);

INSERT INTO payment_terms (name, days)
SELECT 'Mensual', 30
WHERE NOT EXISTS (
    SELECT 1 FROM payment_terms 
    WHERE name = 'Mensual' AND deleted_at IS NULL
);

INSERT INTO payment_terms (name, days)
SELECT 'Trimestral', 90
WHERE NOT EXISTS (
    SELECT 1 FROM payment_terms 
    WHERE name = 'Trimestral' AND deleted_at IS NULL
);

INSERT INTO payment_terms (name, days)
SELECT 'Semestral', 180
WHERE NOT EXISTS (
    SELECT 1 FROM payment_terms 
    WHERE name = 'Semestral' AND deleted_at IS NULL
);

INSERT INTO payment_terms (name, days)
SELECT 'Anual', 360
WHERE NOT EXISTS (
    SELECT 1 FROM payment_terms 
    WHERE name = 'Anual' AND deleted_at IS NULL
);


INSERT INTO third_parties (
    third_party_code,
    nit,
    dv,
    business_name,
    status_id,
    credit_limit,
    payment_term_id,
    market_segment,
    type_organization_id,
    type_regimen_id,
    municipality_id,
    created_at,
    updated_at,
    currency_type_id
)
SELECT * FROM (
    VALUES(
        'TER2026000001',
        '9001234567',
        '1',
        'TERCERO DEMO CLIENTE SAS',
        1,
        50000000,
        3,
        'CORPORATIVO', 1, 1, 1, NOW(),NOW(), 2
    ),
    (
        'TER2026000002',
        '9019876543',
        '5',
        'TERCERO DEMO EMPLEADO',
        1,
        0,
        1,
        'PERSONA NATURAL',
        2,
        2,
        1,
        NOW(),
        NOW(), 1
    )

) AS v (third_party_code, nit, dv, business_name, status_id, credit_limit, payment_term_id, market_segment, type_organization_id, type_regimen_id, municipality_id, created_at, updated_at, currency_type_id)
ON CONFLICT DO NOTHING;

INSERT INTO third_party_role_assignments (third_party_id, role_id)
SELECT tp.id, rc.id
FROM third_parties tp
JOIN third_party_role_catalog rc ON rc.name = 'CLIENTE'
WHERE tp.dv = '1'
ON CONFLICT DO NOTHING;

INSERT INTO third_party_role_assignments (third_party_id, role_id)
SELECT tp.id, rc.id
FROM third_parties tp
JOIN third_party_role_catalog rc ON rc.name = 'PROVEEDOR'
WHERE tp.dv = '1'
ON CONFLICT DO NOTHING;


INSERT INTO third_party_role_assignments (third_party_id, role_id)
SELECT tp.id, rc.id
FROM third_parties tp
JOIN third_party_role_catalog rc ON rc.name = 'EMPLEADO'
WHERE tp.dv = '5'
ON CONFLICT DO NOTHING;