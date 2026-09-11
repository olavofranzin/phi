-- ============================================================================
-- DDL Agregador T28 - t28_errors (Error Handler global) - DATASET phi_dev
-- ============================================================================
-- ADR: "Error Handler global da Operacao Interna" (Aceito 2026-06-22,
--      page 388b65e5-c72b-8186-aed5-c5fafd65b5f8)
-- Lote: L2 Error Handler global
-- ============================================================================

CREATE TABLE IF NOT EXISTS `phi_dev.t28_errors` (
  -- chave
  error_id           STRING    NOT NULL,
  -- correlacao
  execution_id       STRING,                -- execution_id do WF que falhou (ADR-009)
  workflow_id        STRING    NOT NULL,
  workflow_name      STRING    NOT NULL,
  node_name          STRING    NOT NULL,
  source             STRING,                -- google_ads | ga4 | gbp | clarity | meta | bq | notion | telegram | other
  -- classificacao
  severity           STRING    NOT NULL,    -- warn | error | critical
  -- detalhes
  error_message      STRING,
  error_details      JSON,                  -- payload original do node + stack quando disponivel
  -- contexto de negocio quando aplicavel
  client_id          STRING,
  business_date      DATE,
  -- ciclo de vida
  occurred_at        TIMESTAMP NOT NULL,
  resolved           BOOL                   -- null = aberto; true/false = resolvido pela operacao
)
PARTITION BY DATE(occurred_at)
CLUSTER BY workflow_id, severity;
