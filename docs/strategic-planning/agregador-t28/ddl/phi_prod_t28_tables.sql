-- ============================================================================
-- DDL Agregador T28 — 6 tabelas + 3 VIEWs (D-1, D-3) — DATASET phi_prod
-- ============================================================================
-- ADR: "Destino canônico do contract T28 + governança" (Aceito 2026-06-21)
-- SOP: "Critério Estatístico volume_suficiente v1.0" (Vigente 2026-06-21)
-- Strawman: docs/strategic-planning/agregador-t28/BRUTO-v0.2-design.md
-- Lote: L1.5 Agregador T28 — promoção phi_dev -> phi_prod (2026-06-22)
--
-- Política:
--   1. ✅ DDL em phi_dev aplicado em 2026-06-21 (L0 concluído).
--   2. ✅ Smoke real em phi_dev verde 2026-06-22 (L1 concluído, smoke 4:
--      12/0/2/1/1/0 com CLI-4 piloto; KPIs/audit/volume_suficiente ok).
--   3. ⏳ APLICAR ESTE DDL EM phi_prod (este arquivo).
--   4. ⏳ Promover via MCP update_workflow trocando datasetId nos 6 BQ
--      Inserts de phi_dev -> phi_prod.
--   5. ⏳ Re-smoke real em phi_prod com mesmo CLI-4.
--
-- IDÊNTICO ao phi_dev_t28_tables.sql exceto pelo dataset (phi_prod).
-- Toda mudança de schema futura deve ser aplicada em AMBOS os arquivos
-- (ou refatorar para gerador único parametrizado por dataset).
--
-- Convenções:
--   - PARTITION BY business_date (otimiza query por período)
--   - CLUSTER BY client_id, janela (otimiza filtros típicos do agente)
--   - Bloco audit comum: execution_id, source_execution_id, versao_contract_aplicada,
--     source_status JSON, volume_suficiente
--   - Tipos: STRING NOT NULL pra IDs/categorias; FLOAT64 pra métricas; JSON pra
--     campos polimórficos; TIMESTAMP NOT NULL pra ingested_at; DATE pra
--     business_date
-- ============================================================================

-- =============================================
-- 1. t28_campaign — métricas + KPIs por campanha
-- =============================================
CREATE TABLE IF NOT EXISTS `phi_prod.t28_campaign` (
  -- chaves
  client_id                STRING NOT NULL,
  campaign_id              STRING NOT NULL,
  business_date            DATE   NOT NULL,
  janela                   STRING NOT NULL,  -- 'D-7' | 'D-30' (D-1, D-3 via VIEW)

  -- contexto de negócio (lido do Notion via Adaptador)
  campaign_name            STRING,
  data_inicio_campanha     DATE,             -- pra calcular campanha_idade_dias
  objetivo                 STRING,            -- ex: 'Conversões', 'Leads', 'Tráfego'
  modelo_negocio           STRING,            -- ex: 'B2C-ecommerce', 'B2B-leads'
  metrica_mae              STRING NOT NULL,   -- 'CPA' | 'ROAS'
  meta_metrica_mae         FLOAT64,
  margem_contribuicao_pct  FLOAT64,
  ticket_ltv               FLOAT64,
  landing_page             STRING,

  -- métricas brutas Google Ads (vindas de raw_campaign_data per ADR-010 Daily Entry)
  impressions              INT64,
  clicks                   INT64,
  cost                     FLOAT64,
  conversions              FLOAT64,
  conv_value               FLOAT64,
  impression_share         FLOAT64,
  budget_lost_is           FLOAT64,

  -- KPIs derivados (materializados — agente não precisa recalcular)
  cpm                      FLOAT64,
  cpc                      FLOAT64,
  ctr                      FLOAT64,
  cvr                      FLOAT64,
  cpa                      FLOAT64,
  cpl                      FLOAT64,
  roas                     FLOAT64,

  -- features agregadas de Search Terms (Gemini classifier — termos NÃO persistem; D5)
  pct_brand_terms          FLOAT64,
  pct_problem_solving_terms FLOAT64,
  pct_competitor_terms     FLOAT64,
  pct_other_terms          FLOAT64,

  -- bloco audit + qualidade (comum a todas as 6 tabelas T28)
  execution_id             STRING NOT NULL,
  source_execution_id      STRING,           -- link pro Daily Entry consumido (ADR-009)
  versao_contract_aplicada STRING NOT NULL,
  versao_sop_aplicada      STRING NOT NULL,  -- SOP volume_suficiente
  source_status            JSON   NOT NULL,
  volume_suficiente        BOOL   NOT NULL,
  ingested_at              TIMESTAMP NOT NULL
)
PARTITION BY business_date
CLUSTER BY client_id, janela
OPTIONS (description = "Contract T28 por campanha; lê raw_campaign_data + KPIs derivados + features de Search Terms agregadas. D-7 e D-30 materializadas; D-1 e D-3 via VIEW.");

-- =============================================
-- 2. t28_adset — métricas + criativos top-N por conjunto
-- =============================================
CREATE TABLE IF NOT EXISTS `phi_prod.t28_adset` (
  client_id                STRING NOT NULL,
  campaign_id              STRING NOT NULL,
  adset_id                 STRING NOT NULL,
  business_date            DATE   NOT NULL,
  janela                   STRING NOT NULL,

  adset_name               STRING,
  data_inicio_adset        DATE,

  -- métricas brutas Google Ads nível adset (vindo do agregador GAQL — Daily Entry
  -- não cobre adset hoje; vide T4 do strawman)
  impressions              INT64,
  clicks                   INT64,
  cost                     FLOAT64,
  conversions              FLOAT64,
  conv_value               FLOAT64,

  -- KPIs derivados nível adset
  cpm                      FLOAT64,
  cpc                      FLOAT64,
  ctr                      FLOAT64,
  cvr                      FLOAT64,
  cpa                      FLOAT64,
  roas                     FLOAT64,

  -- top-N criativos como JSON aninhado (per Q3 das decisões)
  -- Formato: [{ad_id, headlines[], descriptions[], final_url, impressions, clicks, cost, conversions, cpa, roas}]
  criativos_json           JSON,

  -- bloco audit
  execution_id             STRING NOT NULL,
  source_execution_id      STRING,
  versao_contract_aplicada STRING NOT NULL,
  versao_sop_aplicada      STRING NOT NULL,
  source_status            JSON   NOT NULL,
  volume_suficiente        BOOL   NOT NULL,
  ingested_at              TIMESTAMP NOT NULL
)
PARTITION BY business_date
CLUSTER BY client_id, janela
OPTIONS (description = "Contract T28 por conjunto; criativos top-N em JSON aninhado (economia de storage vs tabela ad separada). D-7 e D-30 materializadas.");

-- =============================================
-- 3. t28_ga4_landing — GA4 orgânico × pago × por landing
-- =============================================
CREATE TABLE IF NOT EXISTS `phi_prod.t28_ga4_landing` (
  client_id                STRING NOT NULL,
  business_date            DATE   NOT NULL,
  janela                   STRING NOT NULL,
  canal                    STRING NOT NULL,   -- 'google_organic' | 'google_paid' | 'meta_paid' | etc
  landing_page             STRING NOT NULL,
  source                   STRING NOT NULL,   -- 'organico' | 'pago'

  sessions                 INT64,
  users                    INT64,
  new_users                INT64,
  engaged_sessions         INT64,
  engagement_rate          FLOAT64,
  conversions              FLOAT64,
  key_events               FLOAT64,
  avg_session_duration_sec FLOAT64,
  bounce_rate              FLOAT64,

  execution_id             STRING NOT NULL,
  source_execution_id      STRING,
  versao_contract_aplicada STRING NOT NULL,
  versao_sop_aplicada      STRING NOT NULL,
  source_status            JSON   NOT NULL,
  volume_suficiente        BOOL   NOT NULL,
  ingested_at              TIMESTAMP NOT NULL
)
PARTITION BY business_date
CLUSTER BY client_id, janela
OPTIONS (description = "Contract T28 GA4 por landing × source (orgânico/pago) × canal. D-7 e D-30 materializadas.");

-- =============================================
-- 4. t28_gbp_daily — Google Business Profile (perfil local)
-- =============================================
CREATE TABLE IF NOT EXISTS `phi_prod.t28_gbp_daily` (
  client_id                STRING NOT NULL,
  business_date            DATE   NOT NULL,
  janela                   STRING NOT NULL,

  gbp_impressions          INT64,
  gbp_search_views         INT64,
  gbp_maps_views           INT64,
  gbp_website_clicks       INT64,
  gbp_phone_calls          INT64,
  gbp_direction_requests   INT64,
  gbp_reviews_count        INT64,
  gbp_reviews_avg_rating   FLOAT64,

  execution_id             STRING NOT NULL,
  source_execution_id      STRING,
  versao_contract_aplicada STRING NOT NULL,
  versao_sop_aplicada      STRING NOT NULL,
  source_status            JSON   NOT NULL,
  volume_suficiente        BOOL   NOT NULL,
  ingested_at              TIMESTAMP NOT NULL
)
PARTITION BY business_date
CLUSTER BY client_id, janela
OPTIONS (description = "Contract T28 Google Business Profile (perfil local). 1 linha por (client_id, business_date, janela).");

-- =============================================
-- 5. t28_clarity_daily — Microsoft Clarity (UX behavior)
-- =============================================
CREATE TABLE IF NOT EXISTS `phi_prod.t28_clarity_daily` (
  client_id                STRING NOT NULL,
  business_date            DATE   NOT NULL,
  janela                   STRING NOT NULL,

  clarity_sessions         INT64,
  clarity_users            INT64,
  clarity_rage_clicks      INT64,
  clarity_dead_clicks      INT64,
  clarity_excessive_scroll INT64,
  clarity_avg_scroll_depth FLOAT64,
  clarity_avg_session_sec  FLOAT64,

  execution_id             STRING NOT NULL,
  source_execution_id      STRING,
  versao_contract_aplicada STRING NOT NULL,
  versao_sop_aplicada      STRING NOT NULL,
  source_status            JSON   NOT NULL,
  volume_suficiente        BOOL   NOT NULL,
  ingested_at              TIMESTAMP NOT NULL
)
PARTITION BY business_date
CLUSTER BY client_id, janela
OPTIONS (description = "Contract T28 Microsoft Clarity (UX behavior). Atenção: nó Clarity tem cota 10 req/dia — deve rodar fora do Loop do agregador.");

-- =============================================
-- 6. t28_meta_campaign — Meta Ads (espelho de campaign pra Meta)
-- =============================================
CREATE TABLE IF NOT EXISTS `phi_prod.t28_meta_campaign` (
  client_id                STRING NOT NULL,
  campaign_id_meta         STRING NOT NULL,
  business_date            DATE   NOT NULL,
  janela                   STRING NOT NULL,

  campaign_name            STRING,
  data_inicio_campanha     DATE,
  objetivo                 STRING,
  metrica_mae              STRING NOT NULL,
  meta_metrica_mae         FLOAT64,

  impressions              INT64,
  clicks                   INT64,
  cost                     FLOAT64,
  leads                    FLOAT64,
  purchases                FLOAT64,
  purchase_value           FLOAT64,
  reach                    INT64,
  frequency                FLOAT64,
  actions_json             JSON,            -- ações detalhadas (formato dinâmico Meta)

  -- KPIs derivados
  cpm                      FLOAT64,
  cpc                      FLOAT64,
  ctr                      FLOAT64,
  cpl                      FLOAT64,
  roas                     FLOAT64,

  execution_id             STRING NOT NULL,
  source_execution_id      STRING,
  versao_contract_aplicada STRING NOT NULL,
  versao_sop_aplicada      STRING NOT NULL,
  source_status            JSON   NOT NULL,
  volume_suficiente        BOOL   NOT NULL,
  ingested_at              TIMESTAMP NOT NULL
)
PARTITION BY business_date
CLUSTER BY client_id, janela
OPTIONS (description = "Contract T28 por campanha Meta Ads (espelho funcional de t28_campaign). D-7 e D-30 materializadas; hoje Meta Ads está desativado no agregador (Lote 3 reativa).");

-- ============================================================================
-- VIEWs derivadas D-1 e D-3 (não materializadas — calculadas em runtime)
-- ============================================================================
-- Princípio (Q3 / D3): D-1 e D-3 derivadas da janela D-7 materializada filtrando
-- por período. Isso evita 2x de storage por janela. Custo de query: aceitável pra
-- consultas táticas de baixa frequência.

-- Nota: estas VIEWs são esqueletos. A semântica exata de "D-1" sobre dados D-7
-- depende da estratégia de agregação que o agente espera. Implementação real
-- pode requerer UNNEST ou agregação de últimos N dias da janela D-7. Refinar
-- no Lote 0 do agregador conforme o consumo real.

CREATE OR REPLACE VIEW `phi_prod.t28_campaign_d1` AS
SELECT *
FROM `phi_prod.t28_campaign`
WHERE janela = 'D-7'
  AND business_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY);

CREATE OR REPLACE VIEW `phi_prod.t28_campaign_d3` AS
SELECT *
FROM `phi_prod.t28_campaign`
WHERE janela = 'D-7'
  AND business_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY);

CREATE OR REPLACE VIEW `phi_prod.t28_adset_d1` AS
SELECT *
FROM `phi_prod.t28_adset`
WHERE janela = 'D-7'
  AND business_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY);

CREATE OR REPLACE VIEW `phi_prod.t28_adset_d3` AS
SELECT *
FROM `phi_prod.t28_adset`
WHERE janela = 'D-7'
  AND business_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY);

CREATE OR REPLACE VIEW `phi_prod.t28_meta_campaign_d1` AS
SELECT *
FROM `phi_prod.t28_meta_campaign`
WHERE janela = 'D-7'
  AND business_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY);

CREATE OR REPLACE VIEW `phi_prod.t28_meta_campaign_d3` AS
SELECT *
FROM `phi_prod.t28_meta_campaign`
WHERE janela = 'D-7'
  AND business_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY);

-- ============================================================================
-- Promoção phi_prod → phi_prod
-- ============================================================================
-- Quando Lote 1 (smoke em phi_prod) ficar verde:
--   1. Rodar este script em phi_prod (substituir "phi_prod." por "phi_prod.")
--   2. Re-importar o workflow do agregador com BQ_DATASET=phi_prod
--   3. Smoke novamente em prod
--
-- Alternativa: bq cp phi_prod.t28_campaign phi_prod.t28_campaign (copia estrutura
-- + dados; usar com cuidado pra não duplicar histórico de phi_prod em prod).
