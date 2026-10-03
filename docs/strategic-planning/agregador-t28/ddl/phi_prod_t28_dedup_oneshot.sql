-- ============================================================================
-- Dedup one-shot para phi_prod.t28_* apos L1.6 MERGE idempotente
-- ============================================================================
-- Rodar uma vez no BigQuery Console apos smoke phi_prod verde.
-- Mantem a linha mais recente por chave de negocio usando ingested_at DESC.
--
-- IMPORTANTE: o CREATE OR REPLACE TABLE ... AS SELECT preserva PARTITION BY /
-- CLUSTER BY (declarados abaixo, identicos ao DDL original) para nao degradar
-- custo/performance. NOT NULL e OPTIONS(description) NAO sao preservados pelo
-- CTAS (tradeoff aceito; dados ja limpos, MERGE/VIEWs nao dependem de NOT NULL).

CREATE OR REPLACE TABLE `phi_prod.t28_campaign`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, campaign_id, business_date, janela
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_prod.t28_campaign`
)
WHERE _rn = 1;

CREATE OR REPLACE TABLE `phi_prod.t28_adset`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, campaign_id, adset_id, business_date, janela
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_prod.t28_adset`
)
WHERE _rn = 1;

CREATE OR REPLACE TABLE `phi_prod.t28_ga4_landing`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, business_date, janela, canal, landing_page
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_prod.t28_ga4_landing`
)
WHERE _rn = 1;

CREATE OR REPLACE TABLE `phi_prod.t28_gbp_daily`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, business_date, janela
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_prod.t28_gbp_daily`
)
WHERE _rn = 1;

CREATE OR REPLACE TABLE `phi_prod.t28_clarity_daily`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, business_date, janela
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_prod.t28_clarity_daily`
)
WHERE _rn = 1;

CREATE OR REPLACE TABLE `phi_prod.t28_meta_campaign`
PARTITION BY business_date
CLUSTER BY client_id, janela
AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, campaign_id_meta, business_date, janela
    ORDER BY ingested_at DESC
  ) AS _rn
  FROM `phi_prod.t28_meta_campaign`
)
WHERE _rn = 1;
