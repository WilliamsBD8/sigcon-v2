CREATE OR REPLACE FUNCTION audit_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audits (
        table_name,
        record_id,
        action,
        old_value,
        new_value,
        created_at,
        user_id
    )
    VALUES (
        TG_TABLE_NAME,
        NEW.id,
        'UPDATE',
        row_to_json(OLD),
        row_to_json(NEW),
        NOW(),
        COALESCE(current_setting('my.user_id', true)::BIGINT, 1)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Para todas las tablas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name NOT IN ('audits', 'audit_log')
    LOOP
        -- Eliminar trigger si existe
        EXECUTE format('
            DROP TRIGGER IF EXISTS audit_update_%I ON %I;
        ', r.table_name, r.table_name);

        EXECUTE format('
            CREATE TRIGGER audit_update_%I
            AFTER UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION audit_update();
        ', r.table_name, r.table_name);
    END LOOP;
END $$;

-- Para evitar modificaciones en la tabla de auditoría
CREATE OR REPLACE FUNCTION prevent_audit_modifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'La tabla de auditoría es inmutable. No se permiten UPDATE o DELETE.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON audits;
CREATE TRIGGER audit_no_update
BEFORE UPDATE OR DELETE ON audits
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_modifications();