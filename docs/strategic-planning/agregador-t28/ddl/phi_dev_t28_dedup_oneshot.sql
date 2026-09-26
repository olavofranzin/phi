-- ============================================================================
-- Dedup one-shot para phi_dev.t28_* (validacao do L1.6 antes do phi_prod)
-- ============================================================================
-- Limpa as duplicatas legadas dos smokes antigos (era streaming-insert).
-- Rodar UMA vez no BigQuery Console; depois rodar o workflow 1x e confirmar
-- que `GROUP BY chave HAVING COUNT(*) > 1` vem VAZIO (MERGE mantem 1 por chave).
-- Mantem a linha mais recente por chave de negocio usando ingested_at DESC.
-- Preserva PARTITION BY / CLUSTER BY (identicos ao DDL).

CREATE OR REPLACE TABLE `phi_dev.t28_campaign`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, campaign_id, business_date, janela
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_dev.t28_campaign`
)
WHERE _rn = 1;

CREATE OR REPLACE TABLE `phi_dev.t28_adset`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, campaign_id, adset_id, business_date, janela
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_dev.t28_adset`
)
WHERE _rn = 1;

CREATE OR REPLACE TABLE `phi_dev.t28_ga4_landing`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, business_date, janela, canal, landing_page
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_dev.t28_ga4_landing`
)
WHERE _rn = 1;

CREATE OR REPLACE TABLE `phi_dev.t28_gbp_daily`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, business_date, janela
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_dev.t28_gbp_daily`
)
WHERE _rn = 1;

CREATE OR REPLACE TABLE `phi_dev.t28_clarity_daily`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, business_date, janela
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_dev.t28_clarity_daily`
)
WHERE _rn = 1;

CREATE OR REPLACE TABLE `phi_dev.t28_meta_campaign`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, campaign_id_meta, business_date, janela
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_dev.t28_meta_campaign`
)
WHERE _rn = 1;
