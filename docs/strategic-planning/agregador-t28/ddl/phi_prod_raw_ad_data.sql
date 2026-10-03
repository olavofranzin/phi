-- =============================================================================
-- PROMOÇÃO phi_dev -> phi_prod (rodar só APÓS smoke verde em phi_dev, Fase 4).
-- Cria raw_ad_data + VIEW raw_adset_data_rollup em phi_prod. Idêntico ao phi_dev.
-- =============================================================================
CREATE TABLE IF NOT EXISTS `phi_prod.raw_ad_data` (
  execution_id     STRING    NOT NULL,
  client_id        STRING    NOT NULL,
  campaign_id      STRING    NOT NULL,   -- GADS-<google_campaign_id>
  adset_id         STRING    NOT NULL,   -- ad_group.id
  ad_id            STRING    NOT NULL,   -- ad_group_ad.ad.id
  date             DATE      NOT NULL,

  ad_name          STRING,
  ad_status        STRING,               -- ad_group_ad.status

  -- janela D1 (base)
  impressions      INT64,
  clicks           INT64,
  cost             FLOAT64,
  conversions      FLOAT64,              -- FLOAT64: Google devolve conversões fracionárias (alinha t28_adset)
  conv_value       FLOAT64,              -- conversions_value (p/ ROAS)

  -- janela 3D
  cost_3d          FLOAT64,
  conversions_3d   FLOAT64,
  conv_value_3d    FLOAT64,

  -- janela 7D
  cost_7d          FLOAT64,
  conversions_7d   FLOAT64,
  conv_value_7d    FLOAT64,

  -- bloco audit
  data_source      STRING,
  platform         STRING,
  ingestion_status STRING,
  ingestion_step   STRING,
  ingested_at      TIMESTAMP NOT NULL
)
PARTITION BY date
CLUSTER BY client_id, campaign_id, adset_id, ad_id
OPTIONS (description = "Daily Entry grão de anúncio (ad_group_ad). Fonte única ad-level p/ drill-down. Adset derivado por VIEW raw_adset_data_rollup. Campanha permanece em raw_campaign_data (ADR-010).");

CREATE OR REPLACE VIEW `phi_prod.raw_adset_data_rollup` AS
SELECT
  client_id,
  campaign_id,
  adset_id,
  date,
  SUM(impressions)    AS impressions,
  SUM(clicks)         AS clicks,
  SUM(cost)           AS cost,
  SUM(conversions)    AS conversions,
  SUM(conv_value)     AS conv_value,
  SUM(cost_3d)        AS cost_3d,
  SUM(conversions_3d) AS conversions_3d,
  SUM(conv_value_3d)  AS conv_value_3d,
  SUM(cost_7d)        AS cost_7d,
  SUM(conversions_7d) AS conversions_7d,
  SUM(conv_value_7d)  AS conv_value_7d,
  MAX(ingested_at)    AS ingested_at
FROM `phi_prod.raw_ad_data`
GROUP BY client_id, campaign_id, adset_id, date;
