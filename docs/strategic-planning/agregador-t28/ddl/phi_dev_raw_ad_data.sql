-- =============================================================================
-- raw_ad_data — Daily Entry, grão de ANÚNCIO (Choice A, decidido por Olavo 2026-06-28)
-- Camada: INGESTÃO (não confundir com contrato t28_*). Espelha raw_campaign_data
-- + chaves de anúncio. Honra ADR-24 (bottom-up) e NÃO cria t28_ad (D15 preservada).
-- AMBIENTE: phi_dev primeiro. Promover para phi_prod só após smoke verde (Fase 4).
-- =============================================================================
CREATE TABLE IF NOT EXISTS `phi_dev.raw_ad_data` (
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

  -- janela 3D (espelha raw_campaign_data)
  cost_3d          FLOAT64,
  conversions_3d   FLOAT64,
  conv_value_3d    FLOAT64,

  -- janela 7D
  cost_7d          FLOAT64,
  conversions_7d   FLOAT64,
  conv_value_7d    FLOAT64,

  -- bloco audit (idêntico ao raw_campaign_data)
  data_source      STRING,
  platform         STRING,
  ingestion_status STRING,
  ingestion_step   STRING,
  ingested_at      TIMESTAMP NOT NULL
)
PARTITION BY date
CLUSTER BY client_id, campaign_id, adset_id, ad_id
OPTIONS (description = "Daily Entry grão de anúncio (ad_group_ad). Fonte única ad-level p/ drill-down. Adset derivado por VIEW raw_adset_data_rollup. Campanha permanece em raw_campaign_data (ADR-010).");

-- =============================================================================
-- VIEW rollup de ADSET — só métricas ADITIVAS (impressions/clicks/cost/conversions/conv_value)
-- impression_share NÃO sobe por rollup (diferido, decisão ad-only do Olavo).
-- Serve p/ drill-down ad-level; relatório de campanha continua em raw_campaign_data.
-- =============================================================================
CREATE OR REPLACE VIEW `phi_dev.raw_adset_data_rollup` AS
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
FROM `phi_dev.raw_ad_data`
GROUP BY client_id, campaign_id, adset_id, date;
