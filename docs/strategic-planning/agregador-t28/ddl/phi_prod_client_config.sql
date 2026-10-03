-- Schema de producao medido em 2026-09-27 (ADR-39, Fase B, volta 2).
-- Mudanca aplicada em 2026-09-27: primary_metric_type foi relaxada de
-- REQUIRED para NULLABLE. A metrica pertence a campanha (ADR-40); clientes
-- novos precisam nascer sem valor inventado no grao do cliente.

CREATE TABLE IF NOT EXISTS `phi_prod.client_config` (
  client_id                 STRING    NOT NULL,
  client_name               STRING,
  model_id                  STRING    NOT NULL,
  phi_threshold_override    FLOAT64,
  primary_metric_type       STRING,
  is_active                 BOOL      NOT NULL,
  created_at                TIMESTAMP NOT NULL,
  updated_at                TIMESTAMP,
  client_slug               STRING
);
