# Implementação — Métricas de Anúncios (raw_ad_data)

> Continuação do bootstrap `2026-06-27-metricas-anuncios-subchat-bootstrap.md`.
> **Branch:** `claude/agentic-agency-planning-KwJEw`.
> **Workflow alvo:** `sw metricas anuncios copy` (id `vVAdXAJh6MW2Z5Hp`, `active:false`).

## Decisões fechadas (gate §8, Olavo 2026-06-28)

1. **Choice A** — criar `raw_ad_data` (grão anúncio) + VIEW `raw_adset_data_rollup`. **Não** criar `t28_ad`.
2. **Não podar** — manter o ramo de observação Notion + tendências do workflow.
3. **Ad-only** agora; adset dedicado e `impression_share` diferidos.
4. **Manter 1-ad-por-request** na GAQL (sem batelada por campanha agora).

**Insight-chave:** `raw_ad_data` é camada de **INGESTÃO**; a D15/ADR-24 governa o **CONTRATO** (`t28_*`, que continua sem `t28_ad`, usando `criativos_json` em `t28_adset`). São camadas diferentes — `raw_ad_data` **não viola a D15**, apenas estende o padrão do ADR-010 (hoje só campanha) ao grão de anúncio.

## Orientação confirmada (Fases 0–1)

- **Bug confirmado:** o nó `Code Montar SQL` de anúncios é clone byte-a-byte do de campanhas — fazia `MERGE phi_prod.raw_campaign_data ON (client_id, campaign_id, date)` (grão de campanha, sem `ad_id`/`adset_id`).
- **GAQL já é ad-grain:** `v23 / searchStream`, `FROM ad_group_ad`, traz `campaign.id` + `ad_group.id` + `ad_group_ad.ad.id` + `conversions_value` (ROAS). Filtra `WHERE ad_group_ad.ad.id = X AND segments.date = 'date_d1'` → 1 anúncio por request.
- **Nó de insert intocado:** `Execute SQL inserir daily entry` roda `{{ $json._bq_sql }}` no projeto `project-0e7c58d4-656f-49e8-807`, onde `phi_dev` e `phi_prod` são datasets. Logo o novo SQL resolve sem mudar o nó.

## Artefatos (DDL)

- `docs/strategic-planning/agregador-t28/ddl/phi_dev_raw_ad_data.sql` — tabela + VIEW em **phi_dev**.
- `docs/strategic-planning/agregador-t28/ddl/phi_prod_raw_ad_data.sql` — promoção em **phi_prod**.
- `docs/strategic-planning/agregador-t28/ddl/phi_dev_raw_ad_data_smoke.sql` — 5 checagens de smoke (Fase 4).

**Schema:** `conversions`/`conv_value` = FLOAT64 (alinha `t28_adset`); `conv_value` por janela D1/3D/7D (`raw_campaign_data` não tem); `CLUSTER BY client_id, campaign_id, adset_id, ad_id`; MERGE idempotente nessas 5 chaves + `date`.

## Ordem de aplicação

1. **BQ:** rodar `phi_dev_raw_ad_data.sql` (cria tabela + VIEW em phi_dev).
2. **n8n (UI):** colar o jsCode abaixo no nó **`Code Montar SQL`**. Nenhum outro nó muda.
3. **Rodar** o workflow para o cliente piloto (CLI-4 tem ads Google).
4. **BQ:** rodar `phi_dev_raw_ad_data_smoke.sql`.
5. **Smoke verde →** rodar `phi_prod_raw_ad_data.sql`, trocar `phi_dev` → `phi_prod` no jsCode (linha única do `MERGE`), recolar e **ativar** o workflow.

> **Guard de mojibake (§6):** colar pela UI do n8n (não via MCP) para não corromper os acentos dos outros 36 nós. Após colar, conferir que nomes de nós com acento seguem íntegros.

## jsCode — nó `Code Montar SQL` (alvo phi_dev; para prod, trocar a 1 linha do MERGE)

```javascript
const input = $input.first().json;

const num = (value) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const sqlString = (value) => String(value ?? '').replace(/'/g, "''");

// searchStream devolve [{results:[...]}]; n8n quebra em itens, então .first() = batch[0].
// Pegamos results[0] (1 anúncio por request — cardinalidade mantida).
const firstResult = (nodeName) => {
  try {
    return $(nodeName).item.json.results?.[0] || {};
  } catch (e) {
    return {};
  }
};
const metricsOf = (r) => r.metrics || {};

const getNodeJson = (nodeName) => {
  try {
    return $(nodeName).item.json || {};
  } catch (e) {
    return {};
  }
};

const clean = getNodeJson('Code clean propriedades');
const validation = getNodeJson('Code Valida Dados');

const rD1 = firstResult('HTTP Request Google Ontem (D1)');
const rD3 = firstResult('HTTP Request Google Ontem (D3)');
const rD7 = firstResult('HTTP Request Google Ontem (D7)');
const mD1 = metricsOf(rD1);
const mD3 = metricsOf(rD3);
const mD7 = metricsOf(rD7);

// ---- Chaves: resposta GAQL (autoritativa) com fallback p/ clean propriedades ----
const googleCampaignId = rD1.campaign?.id || clean.clean_id_google_camp || '';
const googleAdsetId     = rD1.adGroup?.id || clean.clean_id_google_adset || '';
const googleAdId        = rD1.adGroupAd?.ad?.id || clean.clean_id_google_ad || '';

const executionId = clean.source_execution_id || input.source_execution_id ||
  `EXEC-DE-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;
const clientId   = clean.clean_client_slug || input.client_id || '';
const campaignId = googleCampaignId ? `GADS-${googleCampaignId}` : '';
const adsetId    = String(googleAdsetId || '');
const adId       = String(googleAdId || '');
const adName     = rD1.adGroupAd?.ad?.name || clean.clean_nome_anuncio || '';
const adStatus   = rD1.adGroupAd?.status || '';

// ---- Métricas por janela (FLOAT64 conversions/conv_value p/ ROAS) ----
const cost  = num(mD1.costMicros) / 1000000;
const conversions = num(mD1.conversions);
const clicks      = num(mD1.clicks);
const impressions = num(mD1.impressions);
const convValue   = num(mD1.conversionsValue);

const cost3d = num(mD3.costMicros) / 1000000;
const conversions3d = num(mD3.conversions);
const convValue3d   = num(mD3.conversionsValue);

const cost7d = num(mD7.costMicros) / 1000000;
const conversions7d = num(mD7.conversions);
const convValue7d   = num(mD7.conversionsValue);

const dataSource = validation.data_source || 'google_ads_api';
const platform = clean.clean_plataforma === 'Google Ads'
  ? 'google_ads'
  : String(clean.clean_plataforma || 'google_ads').toLowerCase().replace(/\s+/g, '_');

// ALVO: phi_dev p/ smoke (Fase 4). Promoção a phi_prod = trocar phi_dev -> phi_prod.
const sql = `MERGE phi_dev.raw_ad_data AS target
USING (
  SELECT
    '${sqlString(executionId)}' AS execution_id,
    '${sqlString(clientId)}' AS client_id,
    '${sqlString(campaignId)}' AS campaign_id,
    '${sqlString(adsetId)}' AS adset_id,
    '${sqlString(adId)}' AS ad_id,
    DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY) AS date,
    '${sqlString(adName)}' AS ad_name,
    '${sqlString(adStatus)}' AS ad_status,
    CAST(${impressions} AS INT64) AS impressions,
    CAST(${clicks} AS INT64) AS clicks,
    CAST(${cost} AS FLOAT64) AS cost,
    CAST(${conversions} AS FLOAT64) AS conversions,
    CAST(${convValue} AS FLOAT64) AS conv_value,
    CAST(${cost3d} AS FLOAT64) AS cost_3d,
    CAST(${conversions3d} AS FLOAT64) AS conversions_3d,
    CAST(${convValue3d} AS FLOAT64) AS conv_value_3d,
    CAST(${cost7d} AS FLOAT64) AS cost_7d,
    CAST(${conversions7d} AS FLOAT64) AS conversions_7d,
    CAST(${convValue7d} AS FLOAT64) AS conv_value_7d,
    '${sqlString(dataSource)}' AS data_source,
    '${sqlString(platform)}' AS platform,
    'SUCCESS' AS ingestion_status,
    'DAILY_ENTRY' AS ingestion_step,
    CURRENT_TIMESTAMP() AS ingested_at
) AS source
ON  target.client_id   = source.client_id
AND target.campaign_id = source.campaign_id
AND target.adset_id    = source.adset_id
AND target.ad_id       = source.ad_id
AND target.date        = source.date
WHEN MATCHED THEN UPDATE SET
  target.ad_name = source.ad_name,
  target.ad_status = source.ad_status,
  target.impressions = source.impressions,
  target.clicks = source.clicks,
  target.cost = source.cost,
  target.conversions = source.conversions,
  target.conv_value = source.conv_value,
  target.cost_3d = source.cost_3d,
  target.conversions_3d = source.conversions_3d,
  target.conv_value_3d = source.conv_value_3d,
  target.cost_7d = source.cost_7d,
  target.conversions_7d = source.conversions_7d,
  target.conv_value_7d = source.conv_value_7d,
  target.data_source = source.data_source,
  target.platform = source.platform,
  target.ingestion_status = source.ingestion_status,
  target.ingested_at = source.ingested_at
WHEN NOT MATCHED THEN INSERT (
  execution_id, client_id, campaign_id, adset_id, ad_id, date,
  ad_name, ad_status,
  impressions, clicks, cost, conversions, conv_value,
  cost_3d, conversions_3d, conv_value_3d,
  cost_7d, conversions_7d, conv_value_7d,
  data_source, platform, ingestion_status, ingestion_step, ingested_at
) VALUES (
  source.execution_id, source.client_id, source.campaign_id, source.adset_id, source.ad_id, source.date,
  source.ad_name, source.ad_status,
  source.impressions, source.clicks, source.cost, source.conversions, source.conv_value,
  source.cost_3d, source.conversions_3d, source.conv_value_3d,
  source.cost_7d, source.conversions_7d, source.conv_value_7d,
  source.data_source, source.platform, source.ingestion_status, source.ingestion_step, source.ingested_at
);`;

return {
  json: {
    ...input,
    _bq_sql: sql
  }
};
```

## Alertas para o smoke

1. **`searchStream`:** o jsCode assume que o n8n quebra o array de lotes em itens (`.first()` = lote 0). Se a V2 voltar tudo zerado, o n8n manteve o array inteiro → trocar `firstResult` para desempacotar `json[0].results[0]`.
2. **Ramo de observação/tendências inalterado:** segue grão de campanha lendo `phi_prod.raw_campaign_data` (nó `BigQuery Série Diária`). Funciona como antes; tendência ad-level não foi adicionada (decisão ad-only).

## Reorganização do grafo (aplicar na UI — guard de mojibake §6)

Aprovado por Olavo 2026-06-30. **Dois objetivos:** (1) tornar a ingestão BQ
independente do Notion (deixa de ser refém da cadeia de observação) e
(2) remover o nó no-op `Code Debug` (só `console.log` + passthrough).

**Por que fan-out e não inserção em série:** o nó `Execute SQL inserir daily entry`
(googleBigQuery) retorna o resultado da query (metadados do MERGE), **não** o item
de entrada. Splicá-lo no meio da cadeia descartaria o json rico que a observação
consome. O fan-out a partir de `Code Cálcula Métricas` preserva os dois ramos.

### Mudança de conexões

**Remover:**
- `Update a database page` → `Code Montar SQL`
- `Execute SQL inserir daily entry` → `Loop Over Items`
- `Code Preparar Payload de Observação` → `Code Debug`
- `Code Debug` → `Create a database page Create Observation`

**Adicionar:**
- `Code Cálcula Métricas` → `Code Montar SQL`  (novo fan-out; **mantém** também `Code Cálcula Métricas` → `Code Recupera Metas p Comparação`)
- `Update a database page` → `Loop Over Items`  (novo retorno do loop / splitInBatches)
- `Code Preparar Payload de Observação` → `Create a database page Create Observation`

**Deletar nó:** `Code Debug`.

**Inalterado:**
- `Code Cálcula Métricas` → `Code Recupera Metas p Comparação`
- `Code Montar SQL` → `Execute SQL inserir daily entry`  (agora um ramo-folha)

### Resultado (ordem)

```
... → Code Cálcula Métricas ─┬─> Code Montar SQL → Execute SQL inserir daily entry   (ingestão, folha)
                             └─> Code Recupera Metas → Code Prep Tendência → BigQuery Série Diária
                                 → Code Tendência Real → Code calculo desvio meta → Code classificar status
                                 → Code Preparar Payload de Observação → Create Observation
                                 → Update a database page → Loop Over Items   (fecha a iteração)
```

### Notas de segurança

- **Aplicar na UI** (arrastar conexões), não via MCP — re-serializar nomes acentuados gera mojibake nos outros 36 nós.
- `Code Montar SQL` passa a receber input de `Code Cálcula Métricas` (json mais rico); como ele lê nós nomeados (`Code clean propriedades`, `Code Valida Dados`, HTTP D1/D3/D7), independe de qual é o nó de entrada direto.
- Ganho: se a cadeia Notion falhar (ex.: a ref quebrada `Code prepara contexto para observação` no `Create Observation`), a ingestão BQ **já rodou** — deixa de ser bloqueada.
- Pós-edição: conferir 0 mojibake nos nomes dos nós e que o `Loop Over Items` recebe retorno só de `Update a database page`.

## Expressões Notion (nó Update) — vazio quando 7d = 0

Campos **rich_text** do nó de update. Padrão: o campo monta a string completa
(`7d (30d)` com a unidade correta) ou retorna `''` (vazio) quando o valor 7d é
`0`/`null`/`undefined`/`NaN`. `Number(...)` força *falsy* no zero; `?? 0` protege
o 30d. Para o texto literal "vazio", trocar o `: ''` final por `: 'vazio'`.

**Monetárias — `R$ X (R$ Y)`:**
```
CPC:  ={{ Number($('Code classificar status').item.json.cpc_7d) ? 'R$ ' + $('Code classificar status').item.json.cpc_7d + ' (R$ ' + ($('Code classificar status').item.json.cpc_30d ?? 0) + ')' : '' }}
CPA:  ={{ Number($('Code classificar status').item.json.cpa_7d) ? 'R$ ' + $('Code classificar status').item.json.cpa_7d + ' (R$ ' + ($('Code classificar status').item.json.cpa_30d ?? 0) + ')' : '' }}
CPL:  ={{ Number($('Code classificar status').item.json.cpl_7d) ? 'R$ ' + $('Code classificar status').item.json.cpl_7d + ' (R$ ' + ($('Code classificar status').item.json.cpl_30d ?? 0) + ')' : '' }}
CPM:  ={{ Number($('Code classificar status').item.json.cpm_7d) ? 'R$ ' + $('Code classificar status').item.json.cpm_7d + ' (R$ ' + ($('Code classificar status').item.json.cpm_30d ?? 0) + ')' : '' }}
```

**Percentuais — `X% (Y%)`:**
```
CTR:               ={{ Number($('Code classificar status').item.json.ctr_7d) ? $('Code classificar status').item.json.ctr_7d + '% (' + ($('Code classificar status').item.json.ctr_30d ?? 0) + '%)' : '' }}
Taxa de Conversão: ={{ Number($('Code classificar status').item.json.taxa_conversao_7d) ? $('Code classificar status').item.json.taxa_conversao_7d + '% (' + ($('Code classificar status').item.json.taxa_conversao_30d ?? 0) + '%)' : '' }}
```

**Contagem — `X (Y)`:**
```
Impressões: ={{ Number($('Code classificar status').item.json.impressions_7d) ? $('Code classificar status').item.json.impressions_7d + ' (' + ($('Code classificar status').item.json.impressions_30d ?? 0) + ')' : '' }}
```

> Os campos existem em `Code classificar status` porque o nó propaga o json de
> `Code Cálcula Métricas` via spread. Formato percentual usa `%)` (canônico dos
> demais nós), não `)%`.

## Fora de escopo (backlog)

Tendência ad-level; `impression_share` por adset (query `FROM ad_group` separada); batelada GAQL por campanha; rotação do `google_developer_token`.
