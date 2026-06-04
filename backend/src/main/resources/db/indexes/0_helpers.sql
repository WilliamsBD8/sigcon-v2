CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX IF NOT EXISTS no_overlap_exchange_rates
ON exchange_rates
USING gist (
    currency_id,
    currency_iso,
    exchange_type,
    company_id,
    daterange(start_date, end_date, '[)')
)
WHERE deleted_at IS NULL;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE column_name IN ('created_at', 'updated_at')
          AND table_schema = 'public'
    LOOP
        EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN %I SET DEFAULT NOW();',
            r.table_name,
            r.column_name
        );
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION check_min_role1_user()
RETURNS TRIGGER AS $$
DECLARE
    total_role1 INTEGER;
BEGIN
    -- Solo validar si el usuario afectado tiene role_id = 1
    IF OLD.role_id = 1 THEN
        
        SELECT COUNT(*) INTO total_role1
        FROM users_roles
        WHERE role_id = 1;

        -- Si solo queda 1, impedir operación
        IF total_role1 <= 1 THEN
            RAISE EXCEPTION 
                USING 
                    MESSAGE = 'Debe existir al menos un usuario con SUPERADMIN',
                    ERRCODE = '45000'; -- código personalizado
        END IF;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_soft_delete_superadmin()
RETURNS TRIGGER AS $$
DECLARE
    total_superadmin INTEGER;
BEGIN

    -- Solo validar si se está haciendo soft delete
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN

        -- Verificar si el usuario tiene rol SUPERADMIN
        IF EXISTS (
            SELECT 1
            FROM users_roles
            WHERE user_id = OLD.id
            AND role_id = 1
        ) THEN

            SELECT COUNT(*) INTO total_superadmin
            FROM users_roles ur
            JOIN users u ON u.id = ur.user_id
            WHERE ur.role_id = 1
            AND u.deleted_at IS NULL
            AND u.id <> OLD.id;

            IF total_superadmin = 0 THEN
                RAISE EXCEPTION
                USING
                    MESSAGE = 'Debe existir al menos un usuario con SUPERADMIN',
                    ERRCODE = '45000';
            END IF;

        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tasas de cambio
CREATE EXTENSION IF NOT EXISTS btree_gist;

DROP TRIGGER IF EXISTS prevent_soft_delete_last_superadmin ON users;

ALTER TABLE exchange_rates
DROP CONSTRAINT IF EXISTS no_overlapping_exchange_rates;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'no_overlapping_exchange_rates'
    ) THEN
        ALTER TABLE exchange_rates
        ADD CONSTRAINT no_overlapping_exchange_rates
        EXCLUDE USING gist (
            currency_id WITH =,
            currency_iso WITH =,
            company_id WITH =,
            exchange_type WITH =,
            value WITH =,
            daterange(start_date, end_date, '[]') WITH &&
        )
        WHERE (deleted_at IS NULL);
    END IF;
END;
$$;

-- Bancos

-- Trigger: Cuando se crea un nuevo banco, insertar automáticamente una sucursal principal (Sede principal) en el municipio de Bogotá usando el código de Bogotá

-- 1. Crear función (siempre seguro)
CREATE OR REPLACE FUNCTION create_main_branch_after_bank_insert() 
RETURNS TRIGGER AS $$
DECLARE
    bogota_municipality_id bigint;
BEGIN
    SELECT id INTO bogota_municipality_id
    FROM municipalities
    WHERE code = '11001'
    LIMIT 1;

    IF bogota_municipality_id IS NOT NULL THEN
        INSERT INTO bank_branches (
            address, main_branch, bank_id, municipality_id, created_at, updated_at
        )
        VALUES (
            'Sede principal', TRUE, NEW.id, bogota_municipality_id, NOW(), NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2. Crear trigger de forma idempotente
DROP TRIGGER IF EXISTS trg_after_insert_bank_create_main_branch ON banks;

CREATE TRIGGER trg_after_insert_bank_create_main_branch
AFTER INSERT ON banks
FOR EACH ROW
EXECUTE FUNCTION create_main_branch_after_bank_insert();

-- Trigger: Cuando se crea una nueva empresa, insertar automáticamente una sucursal principal (Sede principal) en el municipio de Bogotá usando el código de Bogotá

-- -- 1. Crear función (siempre seguro)
-- CREATE OR REPLACE FUNCTION create_main_branch_after_company_insert() 
-- RETURNS TRIGGER AS $$
-- DECLARE
--     bogota_municipality_id bigint;
-- BEGIN
--     SELECT id INTO bogota_municipality_id
--     FROM municipalities
--     WHERE code = '11001'
--     LIMIT 1;

--     IF bogota_municipality_id IS NOT NULL THEN
--         INSERT INTO company_locations (
--             name, address, status, company_id, municipality_id, is_main, created_at, updated_at
--         )
--         VALUES (
--             'Sede principal', 'Sede principal', 'ACTIVE', NEW.id, bogota_municipality_id, TRUE, NOW(), NOW()
--         );
--     END IF;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;


-- -- 2. Crear trigger de forma idempotente
-- DROP TRIGGER IF EXISTS trg_after_insert_company_create_main_branch ON companies;

-- CREATE TRIGGER trg_after_insert_company_create_main_branch
-- AFTER INSERT ON companies
-- FOR EACH ROW
-- EXECUTE FUNCTION create_main_branch_after_company_insert();