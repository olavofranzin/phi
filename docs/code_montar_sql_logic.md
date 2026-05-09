# Audit: Code Montar SQL (Daily Entry)

## Node Metadata
- **Node ID:** `a096aa19-496a-4050-88c7-da4e76abb1b9`
- **Purpose:** Constructing the BigQuery `MERGE` statement for daily performance ingestion.
- **Target Table:** `phi_prod.raw_campaign_data`

## Extracted JavaScript Logic

```javascript
// ============================================================
// PHIT v1.4 - Code Montar SQL (Daily Entry ? raw_campaign_data)
// Versão 4 - campos v23 integrados (Core, Termos, Canais)
// ============================================================
const d = $input.first().json;

// ??? HELPERS ????????????????????????????????????????????????
const getNum = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };
const esc    = (v) => String(v ?? '').replace(/'/g, "''").trim();

const prop = (key) => {
  const p = d?.properties?.[key];
  if (!p) return null;
  if (p.number     !== undefined) return p.number;
  if (p.select?.name)             return p.select.name;
  if (p.rich_text?.length)        return p.rich_text[0].plain_text;
  if (p.multi_select?.length)     return p.multi_select.map(x => x.name).join(', ');
  if (p.checkbox   !== undefined) return p.checkbox;
  if (p.formula)                  return p.formula.string ?? p.formula.number ?? null;
  return null;
};

// ??? IDENTIFICAÇÃO ???????????????????????????????????????????
const clientId = esc(prop('client_id') || d.client_id || '');

const idGoogle = getNum(prop('id_google_camp') ?? d.id_google_camp);
const idMeta   = getNum(prop('id_meta_camp')   ?? d.id_meta_camp);
let campaignId = '';
if (idGoogle > 0)    campaignId = `GADS-${idGoogle}`;
else if (idMeta > 0) campaignId = `META-${idMeta}`;

const executionId = esc(
  d.execution_id ||
  prop('execution_id') ||
  ('EXEC-DE-' + new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14))
);

// ??? MÉTRICAS DE CONVERSÃO (janelas D1, D3, D7) ??????????????
const conversions   = Math.round(getNum(prop('Métrica-Mãe 1D') ?? prop('Valor Métrica-Mãe 1D')));
const conversions3d = Math.round(getNum(prop('Métrica-Mãe 3D') ?? prop('Valor Métrica-Mãe 3D')));
const conversions7d = Math.round(getNum(prop('Métrica-Mãe 7D') ?? prop('Valor Métrica-Mãe 7D')));

// ??? CAMPOS v23 - Bloco 1 Core ???????????????????????????????
// Lidos do node Code Processar Blocos v23 (upstream)
const cost                    = getNum(d.v23_cost                    ?? 0);
const clicks                  = getNum(d.v23_clicks                  ?? 0);
const impressions             = getNum(d.v23_impressions             ?? 0);
const active_view_impressions = getNum(d.v23_active_view_impressions ?? 0);
const average_cpm             = getNum(d.v23_average_cpm             ?? 0);
const average_cpc             = getNum(d.v23_average_cpc             ?? 0);
const phone_calls             = getNum(d.v23_phone_calls             ?? 0);
const biddingStrategyType     = esc(d.v23_bidding_strategy_type      ?? '');
const targetCpaMicros         = getNum(d.v23_target_cpa_micros       ?? 0);
const targetRoas              = getNum(d.v23_target_roas             ?? 0);

// ??? CAMPOS v23 - Bloco 3 Canais ?????????????????????????????
const adNetworkSearch   = getNum(d.v23_ad_network_search   ?? 0);
const adNetworkDisplay  = getNum(d.v23_ad_network_display  ?? 0);
const adNetworkPartners = getNum(d.v23_ad_network_partners ?? 0);

// ??? CAMPOS v23 - Bloco 2 Termos ?????????????????????????????
const topSearchTerms = esc(d.v23_top_search_terms ?? '');

// ??? cost_3d e cost_7d ????????????????????????????????????????
// Google Ads: usar custo agregado já retornado pelos requests D3/D7.
// Meta Ads: manter 0 por decisão formal do ADR-005 (heterogeneidade temporária).
const isGoogleCampaign = campaignId.startsWith('GADS-');
const googleCost3d = getNum($('HTTP Request Google Ontem (D3)').first().json?.results?.[0]?.metrics?.costMicros) / 1000000;
const googleCost7d = getNum($('HTTP Request Google Ontem (D7)').first().json?.results?.[0]?.metrics?.costMicros) / 1000000;
const cost3d = isGoogleCampaign ? googleCost3d : 0;
const cost7d = isGoogleCampaign ? googleCost7d : 0;

// ??? CORREÇÃO: primary_metric_goal como FLOAT64 ??????????????
const primaryMetricGoal = getNum(
  prop('Meta da Métrica-mãe') ??
  d.meta_value                ??
  d.clean_cpa_alvo            ??
  prop('CPA Alvo')            ??
  0
);

// ??? STRINGS ?????????????????????????????????????????????????
const dataSource = esc(prop('Fonte dos Dados') || d.data_source || 'google_ads_api');

const platform = esc(
  d.clean_plataforma ||
  prop('Fonte') ||
  'google_ads'
).toLowerCase().replace(/\s+/g, '_');

// ??? MONTA SQL ???????????????????????????????????????????????
const sql = `
MERGE phi_prod.raw_campaign_data AS target
USING (
  SELECT
    '${executionId}'                              AS execution_id,
    '${clientId}'                                 AS client_id,
    '${campaignId}'                               AS campaign_id,
    DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY) AS date,
    -- Métricas financeiras
    CAST(${cost}            AS FLOAT64)           AS cost,
    CAST(${cost3d}          AS FLOAT64)           AS cost_3d, -- Meta: ver ADR-005 (heterogeneidade temporária)
    CAST(${cost7d}          AS FLOAT64)           AS cost_7d, -- Meta: ver ADR-005 (heterogeneidade temporária)
    -- Métricas de conversão
    CAST(${conversions}     AS INT64)             AS conversions,
    CAST(${conversions3d}   AS INT64)             AS conversions_3d,
    CAST(${conversions7d}   AS INT64)             AS conversions_7d,
    -- Métricas de tráfego
    CAST(${clicks}          AS INT64)             AS clicks,
    CAST(${impressions}     AS INT64)             AS impressions,
    -- Métricas de visibilidade (ES)
    CAST(${active_view_impressions} AS INT64)     AS active_view_impressions,
    CAST(${average_cpm}     AS FLOAT64)           AS average_cpm,
    CAST(${average_cpc}     AS FLOAT64)           AS average_cpc,
    -- Métricas secundárias
    CAST(${phone_calls}     AS INT64)             AS phone_calls,
    -- Configuração de lances (MAS)
    '${biddingStrategyType}'                      AS bidding_strategy_type,
    CAST(${targetCpaMicros} AS INT64)             AS target_cpa_micros,
    CAST(${targetRoas}      AS FLOAT64)           AS target_roas,
    -- Distribuição por canal (FIS)
    CAST(${adNetworkSearch}   AS FLOAT64)         AS ad_network_search,
    CAST(${adNetworkDisplay}  AS FLOAT64)         AS ad_network_display,
    CAST(${adNetworkPartners} AS FLOAT64)         AS ad_network_partners,
    -- Diagnóstico (hipótese sugerida)
    '${topSearchTerms}'                           AS top_search_terms,
    -- Meta e identificação
    CAST(${primaryMetricGoal} AS FLOAT64)         AS primary_metric_goal,
    '${dataSource}'                               AS data_source,
    '${platform}'                                 AS platform,
    'SUCCESS'                                     AS ingestion_status,
    'DAILY_ENTRY'                                 AS ingestion_step,
    CURRENT_TIMESTAMP()                           AS ingested_at
) AS source
ON  target.client_id   = source.client_id
AND target.campaign_id = source.campaign_id
AND target.date        = source.date
WHEN MATCHED THEN UPDATE SET
  target.cost                    = source.cost,
  target.cost_3d                 = source.cost_3d,
  target.cost_7d                 = source.cost_7d,
  target.conversions             = source.conversions,
  target.conversions_3d          = source.conversions_3d,
  target.conversions_7d          = source.conversions_7d,
  target.clicks                  = source.clicks,
  target.impressions             = source.impressions,
  target.active_view_impressions = source.active_view_impressions,
  target.average_cpm             = source.average_cpm,
  target.average_cpc             = source.average_cpc,
  target.phone_calls             = source.phone_calls,
  target.bidding_strategy_type   = source.bidding_strategy_type,
  target.target_cpa_micros       = source.target_cpa_micros,
  target.target_roas             = source.target_roas,
  target.ad_network_search       = source.ad_network_search,
  target.ad_network_display      = source.ad_network_display,
  target.ad_network_partners     = source.ad_network_partners,
  target.top_search_terms        = source.top_search_terms,
  target.primary_metric_goal     = source.primary_metric_goal,
  target.data_source             = source.data_source,
  target.platform                = source.platform,
  target.ingestion_status        = source.ingestion_status,
  target.ingested_at             = source.ingested_at
WHEN NOT MATCHED THEN INSERT (
  execution_id, client_id, campaign_id, date,
  cost, cost_3d, cost_7d,
  conversions, conversions_3d, conversions_7d,
  clicks, impressions,
  active_view_impressions, average_cpm, average_cpc,
  phone_calls,
  bidding_strategy_type, target_cpa_micros, target_roas,
  ad_network_search, ad_network_display, ad_network_partners,
  top_search_terms,
  primary_metric_goal, data_source, platform,
  ingestion_status, ingestion_step, ingested_at
) VALUES (
  source.execution_id, source.client_id, source.campaign_id, source.date,
  source.cost, source.cost_3d, source.cost_7d,
  source.conversions, source.conversions_3d, source.conversions_7d,
  source.clicks, source.impressions,
  source.active_view_impressions, source.average_cpm, source.average_cpc,
  source.phone_calls,
  source.bidding_strategy_type, source.target_cpa_micros, source.target_roas,
  source.ad_network_search, source.ad_network_display, source.ad_network_partners,
  source.top_search_terms,
  source.primary_metric_goal, source.data_source, source.platform,
  source.ingestion_status, source.ingestion_step, source.ingested_at
);
```

## Observations & Potential Improvements
> [!NOTE]
> **Data Consistency:** The node relies on `prop()` calls to Notion properties. If a property name changes in Notion, this node will return `null` and fallback to `0`, potentially skewing BigQuery metrics.

> [!TIP]
> **Performance:** The `MERGE` statement is efficient for daily updates, but ensure the `date` column in BigQuery is partitioned to optimize search performance as the table grows.
