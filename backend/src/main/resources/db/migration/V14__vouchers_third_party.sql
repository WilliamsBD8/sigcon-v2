ALTER TABLE vouchers
    ADD COLUMN IF NOT EXISTS third_party_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_vouchers_third_party'
    ) THEN
        ALTER TABLE vouchers
            ADD CONSTRAINT fk_vouchers_third_party
            FOREIGN KEY (third_party_id) REFERENCES third_parties (id);
    END IF;
END $$;
