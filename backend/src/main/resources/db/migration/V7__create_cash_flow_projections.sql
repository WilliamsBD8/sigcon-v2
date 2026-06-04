-- ============================================================
-- BNK-RF-29 / BNK-RF-30 / BNK-RF-31 / BNK-RF-32
-- Módulo: Flujo de Caja — Proyecciones
--
-- Crea la tabla principal de proyecciones de flujo de caja.
-- No depende de empresa (companyId).
-- Soporta eliminación lógica mediante deleted_at.
-- ============================================================

-- ─── Índices ────────────────────────────────────────────────

-- Unicidad del nombre (solo entre registros activos)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_bnk_cfp_name_active
    ON bnk_cash_flow_projections (name)
    WHERE deleted_at IS NULL;

-- Consultas frecuentes por estado
CREATE INDEX IF NOT EXISTS idx_bnk_cfp_status
    ON bnk_cash_flow_projections (status)
    WHERE deleted_at IS NULL;

-- Consultas por período
CREATE INDEX IF NOT EXISTS idx_bnk_cfp_dates
    ON bnk_cash_flow_projections (start_date, end_date)
    WHERE deleted_at IS NULL;
