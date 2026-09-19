# Brief Codex — Agregador T28 Lote 1 (refactor + sink BQ phi_dev)

> **Escopo:** Lote 1 do Agregador T28. Refatorar workflow n8n `4sdG2UKMCBuFq8xn` (`PHI — Agregador de Métricas Multi-fonte`) pra: (1) **ler `phi_prod.raw_campaign_data`** em vez de chamar Google Ads Campanhas GAQL direto (D4-b — preserva ADR-010); (2) **escrever contract T28** em `phi_dev.t28_*` (D2 sandbox); (3) **Search Terms só como features agregadas** em `t28_campaign` (D5 — termos NÃO persistem); (4) **env var `BQ_DATASET`** per ADR-19.
>
> **Pré-requisitos cristalizados:**
> - ADR `Aceito` 2026-06-21: [`Destino canônico do contract T28 + governança`](https://app.notion.com/p/386b65e5c72b8140a4c4e730f47559aa) (5 decisões D1-D5).
> - SOP `Vigente` 2026-06-21: [`Critério Estatístico volume_suficiente v1.0`](https://app.notion.com/p/386b65e5c72b818c84ebc5917b089438) (page_id `386b65e5-c72b-818c-84eb-c5917b089438` — usar como `versao_sop_aplicada`).
> - DDL aplicado 2026-06-21: 6 tabelas + 6 VIEWs em `phi_dev` (script canônico: `docs/strategic-planning/agregador-t28/ddl/phi_dev_t28_tables.sql`).
> - Strawman canônico: `docs/strategic-planning/agregador-t28/BRUTO-v0.2-design.md`.

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `agregador-t28-l1` — refatorar workflow n8n `4sdG2UKMCBuFq8xn` (PHI — Agregador de Métricas Multi-fonte) pra sink BQ `phi_dev` com 3 mudanças cirúrgicas (D2/D4-b/D5 do ADR T28 Aceito 2026-06-21).

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** HEAD mais novo (`git fetch origin claude/agentic-agency-planning-KwJEw` antes)
- **Workflow alvo (n8n):** `4sdG2UKMCBuFq8xn` (`PHI — Agregador de Métricas Multi-fonte`). Página de contexto: https://app.notion.com/p/386b65e5c72b811f80cec8d9f1bf9614
- **Modo de trabalho:** via **MCP n8n** (não há JSON do workflow no repo). Você lê/edita o workflow em produção via tools `get_workflow_details`, `update_workflow`, `validate_workflow`, `test_workflow`. Antes de qualquer escrita, **`get_sdk_reference` + `get_suggested_nodes`** per instruções do server.
- **DDL aplicado:** 6 tabelas + 6 VIEWs em `phi_dev` (script em `docs/strategic-planning/agregador-t28/ddl/phi_dev_t28_tables.sql`). Estrutura confirmada via console BQ 2026-06-21 16:57.
- **Dataset destino:** `phi_dev` (sandbox; promo `phi_prod` é Lote 1.5).
- **Dataset fonte:** `phi_prod.raw_campaign_data` (Daily Entry escreve aqui — ADR-010 preservado). T28 lê produção, escreve sandbox.

## Pré-flight obrigatório

Antes de tocar qualquer node, execute via MCP n8n:

1. **`get_sdk_reference`** — seções `guidelines` + `design` + `bigquery`.
2. **`get_workflow_details(workflow_id='4sdG2UKMCBuFq8xn')`** — pega estrutura completa, salva localmente.
3. **`search_nodes`** com queries: `['bigquery']`, `['set', 'code', 'http request']` — confirmar discriminators do node BigQuery (resource/operation/mode).
4. **`get_node_types`** pros nodes que vai usar (BigQuery insert + BigQuery executeQuery se forem distintos).
5. **`bq` console verifica** (você não tem acesso direto a BQ; assuma DDL aplicado conforme `phi_dev_t28_tables.sql`). Liste o schema das 6 tabelas + 6 VIEWs lendo o `.sql` versionado.

Documente o que descobriu no commit.

## Estado atual do workflow (confirme via `get_workflow_details`)

Nodes principais por etapa (per página Notion `4sdG2UKMCBuFq8xn`):

| Etapa | Nodes |
|---|---|
| **Trigger** | `Schedule Trigger Semanal` + `Schedule Trigger Mensal` |
| **Contexto Notion** | `Get database clientes` / `campanhas` / `conjuntos` / `anuncios` |
| **Setup** | `Set dados` (consolida contexto por entidade) + `Code prepara datas para extração` (calcula janelas) |
| **Loop** | `Loop` (Split in Batches por campanha) |
| **Extração Google Ads** | `Google Ads Campanhas (GAQL)` / `Conjuntos (GAQL)` / `Anúncios (GAQL)` |
| **Search Terms** | `Extracting Search Terms (janela)` + `Search Terms Checker` (Gemini) |
| **Extração outras fontes** | `HTTP Request GA4 Orgânico` / `GA4 Pago (LPs)` / `GBP` / `Clarity` / `Fetch Meta Ads` (desativado hoje) |
| **Consolidação** | `Merge1` |
| **Normalização** | `Adaptador Input T28` + `Normalizador T28` |
| **Trilha legada** | `Calculate KPIs & Campaign Insights` → `AI Agent` → `Prepare Report Data2` → `Append or update row in sheet2` (já desativada 2026-06-21) |

## Mudanças cirúrgicas

### Mudança 1 — Substituir `Google Ads Campanhas (GAQL)` por query BQ em `phi_prod.raw_campaign_data` (D4-b)

**Remover** o node `Google Ads Campanhas (GAQL)` (HTTP Request).

**Adicionar** node `[T28] BQ Read raw_campaign_data` (n8n `n8n-nodes-base.googleBigQuery`, operation `executeQuery`):

```sql
SELECT
  client_id,
  campaign_id,
  business_date,
  -- agregados na janela calculada pelo Code prepara datas
  SUM(impressions) AS impressions,
  SUM(clicks) AS clicks,
  SUM(cost) AS cost,
  SUM(conversions) AS conversions,
  SUM(conv_value) AS conv_value,
  -- v23 já enriquecido pelo Daily Entry
  ANY_VALUE(data_source) AS data_source,
  ANY_VALUE(platform) AS platform,
  ANY_VALUE(primary_metric_goal) AS primary_metric_goal,
  -- audit (per ADR-009)
  ANY_VALUE(execution_id) AS daily_entry_execution_id  -- vira source_execution_id do T28
FROM `phi_prod.raw_campaign_data`
WHERE client_id = @client_id
  AND business_date BETWEEN @start_date AND @end_date
  -- per ADR-010: filtro ingestion_step='DAILY_ENTRY' fica latente — assumir que raw_campaign_data
  -- é canônico pós-eliminação do writer GADS_INSERT. Validar via probe na fase de smoke.
GROUP BY client_id, campaign_id, business_date
```

Parameters: `client_id` (do contexto Notion), `start_date`/`end_date` (do `Code prepara datas`).

**Manter** `Google Ads Conjuntos (GAQL)` e `Google Ads Anúncios (GAQL)` — `raw_campaign_data` não cobre adset/ad. T4 (tensão registrada) revisita em Lote 4+ se Daily Entry expandir.

### Mudança 2 — Search Terms vira features agregadas em `t28_campaign` (D5)

**Manter** `Extracting Search Terms (janela)` (HTTP Request) e `Search Terms Checker` (Gemini classifier).

**Modificar** output do Search Terms Checker: em vez de array de termos brutos, retornar **features agregadas** por campanha:

```js
// Code: agregação Search Terms → features
const termos = $input.all()[0].json.terms || [];  // output do Gemini classifier

const brand_count = termos.filter(t => t.classificacao === 'brand').length;
const problem_count = termos.filter(t => t.classificacao === 'problem_solving').length;
const competitor_count = termos.filter(t => t.classificacao === 'competitor').length;
const other_count = termos.filter(t => t.classificacao === 'other').length;
const total = termos.length;

return [{
  json: {
    pct_brand_terms: total > 0 ? brand_count / total : 0,
    pct_problem_solving_terms: total > 0 ? problem_count / total : 0,
    pct_competitor_terms: total > 0 ? competitor_count / total : 0,
    pct_other_terms: total > 0 ? other_count / total : 0,
    // NUNCA passar adiante os termos brutos — D5 do ADR
  }
}];
```

**Importante (D5):** os termos brutos **não devem aparecer no contract T28** nem ser salvos em BQ. Validar no `Normalizador T28`: se aparecer campo com lista de termos, **falhar com erro claro** (`throw new Error('D5: search terms brutos não podem persistir em t28_*')`).

### Mudança 3 — Adaptador/Normalizador T28 escreve em `phi_dev.t28_*` (D2)

**Modificar** `Normalizador T28` (Code node): em vez de emitir output só pra trilha legada (Sheets), produzir **objetos por tabela target** prontos pra INSERT.

**Adicionar** após o Normalizador:

- **`[T28] BQ Insert t28_campaign`** (BigQuery node, operation `insert`, dataset via `={{ $env.BQ_DATASET }}`, tabela `t28_campaign`)
- **`[T28] BQ Insert t28_adset`** (idem, tabela `t28_adset`)
- **`[T28] BQ Insert t28_ga4_landing`**
- **`[T28] BQ Insert t28_gbp_daily`**
- **`[T28] BQ Insert t28_clarity_daily`**
- **`[T28] BQ Insert t28_meta_campaign`** (mesmo se Meta desativado hoje — pode ficar com `executeOnce: false` ou condicional via IF)

**Schema source de cada INSERT:** consultar `docs/strategic-planning/agregador-t28/ddl/phi_dev_t28_tables.sql` (verdade canônica do schema). Cada propertyValue deve casar exatamente com a coluna no DDL.

### Mudança 4 — Bloco audit comum (per ADR-009)

Cada linha emitida deve preencher o **bloco audit** das 6 tabelas:

| Campo | Origem |
|---|---|
| `execution_id` | `'EXEC-T28-' + $execution.id` |
| `source_execution_id` | `daily_entry_execution_id` vindo da query BQ (Mudança 1) — link pro Daily Entry consumido |
| `versao_contract_aplicada` | `'v1.0'` (literal — primeira versão do contract) |
| `versao_sop_aplicada` | `'386b65e5-c72b-818c-84eb-c5917b089438'` (page_id do SOP volume_suficiente v1.0 — string por enquanto; quando schema do BQ aceitar relation, migra) |
| `source_status` | JSON `{google_ads: 'ok'|'cred_missing'|'error', ga4: ..., gbp: ..., clarity: ..., meta: ...}` — preencher por fonte; `continueOnFail:true` nos extratores reflete em status |
| `volume_suficiente` | Calcular per SOP v1.0 (regra D1) — ver Mudança 5 |
| `ingested_at` | `new Date().toISOString()` |

### Mudança 5 — Cálculo `volume_suficiente` per SOP v1.0

Código canônico do Normalizador (ou Code dedicado upstream):

```js
const calcVolumeSuficiente = (dataInicioCampanha, businessDate, conversoesNaJanela, diasDaJanela) => {
  const idadeCampanhaDias = Math.floor(
    (new Date(businessDate) - new Date(dataInicioCampanha)) / (1000 * 60 * 60 * 24)
  );
  if (idadeCampanhaDias <= 14) {
    // campanha nova
    return conversoesNaJanela >= 50 && diasDaJanela >= 7;
  }
  // campanha madura
  return true;
};
```

Aplicar por entidade (campaign/adset/etc) e por janela em cada linha.

### Mudança 6 — Env var `BQ_DATASET` per ADR-19

Adicionar constante em `n8n` (ou no node Set inicial):

```js
const BQ_DATASET = $env.BQ_DATASET || 'phi_dev';  // default sandbox; produção setta phi_prod via build-time
```

Usar em todos os 6 nodes `[T28] BQ Insert *`: dataset = `={{ $env.BQ_DATASET || 'phi_dev' }}`.

`raw_campaign_data` lê sempre de `phi_prod` (Daily Entry é fixo em produção).

## NÃO fazer

- ❌ Não tocar Daily Entry, PHI-Pipeline_v2, Subworkflow Campanhas (Lote 4 refatora Pipeline_v2 separado)
- ❌ Não persistir Search Terms brutos em BQ (D5) — só features agregadas
- ❌ Não reativar trilha legada (`Calculate KPIs & Campaign Insights` → `AI Agent` → ...) — desativada 2026-06-21
- ❌ Não tocar `Google Ads Conjuntos (GAQL)` nem `Google Ads Anúncios (GAQL)` neste Lote (T4 revisita depois)
- ❌ Não escrever em `phi_prod.t28_*` (Lote 1.5 promove via env var)
- ❌ Não criar credenciais novas (use as existentes do agregador atual; placeholders/IDs reais ficam no n8n)
- ❌ Não introduzir tabela `t28_search_terms` (foi removida do schema per D5)

## Critérios de aceite (validar via `validate_workflow`)

- [ ] `Google Ads Campanhas (GAQL)` removido; `[T28] BQ Read raw_campaign_data` presente com query SQL correta
- [ ] `Google Ads Conjuntos (GAQL)` + `Google Ads Anúncios (GAQL)` byte-a-byte preservados
- [ ] `Search Terms Checker` (Gemini) preservado; output NÃO contém termos brutos no contract; só 4 features `pct_*`
- [ ] 6 nodes `[T28] BQ Insert *` adicionados (campaign, adset, ga4_landing, gbp_daily, clarity_daily, meta_campaign)
- [ ] Cada INSERT tem `dataset='={{ $env.BQ_DATASET || \"phi_dev\" }}'` (ADR-19 + D2)
- [ ] Bloco audit comum (`execution_id`, `source_execution_id`, `versao_contract_aplicada='v1.0'`, `versao_sop_aplicada='386b65e5...9438'`, `source_status` JSON, `volume_suficiente`, `ingested_at`) presente em TODAS as 6 inserções
- [ ] Função `calcVolumeSuficiente` aplica regra SOP v1.0 (nova ≤14d: conv≥50 + dias≥7; madura: true sempre)
- [ ] Trilha legada (Sheets) permanece desativada
- [ ] Schema dos INSERTs casa byte-a-byte com `phi_dev_t28_tables.sql` (cada propertyValue mapeia uma coluna exata)
- [ ] `validate_workflow` passa sem erros
- [ ] `active: false` mantido durante a entrega (Olavo activate manualmente após smoke)

## Smoke real pós-merge (Olavo executa após você reportar SHA)

1. Activate o workflow com `BQ_DATASET=phi_dev` (env injetado per ADR-19).
2. Disparar via `Schedule Trigger Semanal` manual (Manual Trigger ou Execute Workflow no n8n).
3. Esperar: 6 tabelas em `phi_dev.t28_*` ganham N linhas (1 por cliente × campanha × janela materializada D-7+D-30).
4. **Cenário canônico:** 1 cliente × 1 semana × cenário sem credencial faltando (`source_status` deve marcar `cred_missing` se GBP/GA4 Orgânico ainda sem cred — não bloqueia run).
5. **Validação manual via console BQ:**

```sql
-- valida que t28_campaign bate raw_campaign_data
WITH t28 AS (
  SELECT client_id, campaign_id, business_date, impressions, clicks, cost, conversions
  FROM `phi_dev.t28_campaign`
  WHERE janela = 'D-7' AND ingested_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
),
raw AS (
  SELECT
    client_id,
    campaign_id,
    business_date,
    SUM(impressions) AS impressions,
    SUM(clicks) AS clicks,
    SUM(cost) AS cost,
    SUM(conversions) AS conversions
  FROM `phi_prod.raw_campaign_data`
  WHERE client_id = '<CLIENT_ID_SMOKE>'
    AND business_date BETWEEN '<START>' AND '<END>'
  GROUP BY client_id, campaign_id, business_date
)
SELECT
  t28.client_id, t28.campaign_id, t28.business_date,
  t28.impressions = raw.impressions AS impressions_ok,
  t28.clicks = raw.clicks AS clicks_ok,
  ABS(t28.cost - raw.cost) < 0.01 AS cost_ok,
  ABS(t28.conversions - raw.conversions) < 0.01 AS conversions_ok
FROM t28 JOIN raw USING (client_id, campaign_id, business_date)
ORDER BY t28.business_date DESC;
```

Esperado: TODOS os campos `*_ok = true`. Allow ±0.01 pra floats.

6. **Verificar `volume_suficiente`:**
```sql
SELECT
  campaign_id,
  data_inicio_campanha,
  DATE_DIFF(business_date, data_inicio_campanha, DAY) AS idade_dias,
  conversions,
  volume_suficiente,
  CASE
    WHEN DATE_DIFF(business_date, data_inicio_campanha, DAY) <= 14 AND (conversions < 50 OR 7 > 7) THEN FALSE  -- nova insuficiente
    WHEN DATE_DIFF(business_date, data_inicio_campanha, DAY) <= 14 THEN conversions >= 50  -- nova suficiente
    ELSE TRUE  -- madura
  END AS volume_esperado
FROM `phi_dev.t28_campaign`
WHERE janela = 'D-7';
```

Esperado: `volume_suficiente = volume_esperado` em todas linhas.

7. Verde → Lote 1.5 (promoção `phi_dev` → `phi_prod`): re-importar workflow com `BQ_DATASET=phi_prod` + rodar DDL em `phi_prod`. Olavo conduz separadamente.

## Commit + push + verificação

Como você está editando o workflow via MCP n8n (não há JSON local), o commit do repo é apenas pra **brief de implementação + log de execução**:

```bash
# Criar/atualizar log do que foi feito
cat > docs/handoff/2026-06-21-agregador-t28-l1-execution-log.md <<'EOF'
# Log de execução — agregador-t28-l1

- Workflow n8n editado: 4sdG2UKMCBuFq8xn
- Data: 2026-06-21
- Mudanças: M1 (BQ read raw_campaign_data) + M2 (Search Terms features) + M3 (BQ insert phi_dev t28_*) + M4 (bloco audit) + M5 (volume_suficiente) + M6 (env BQ_DATASET)
- validate_workflow: <PASS/FAIL com saída>
- get_workflow_details pós-edit: <hash ou versão>
- Próximo: Olavo activate com BQ_DATASET=phi_dev e smoke
EOF

git add docs/handoff/2026-06-21-agregador-t28-l1-execution-log.md
git commit -m "exec(agregador-t28-l1): refactor n8n 4sdG2UKMCBuFq8xn (read raw + escrever phi_dev t28_* + features Search Terms + audit + volume_suficiente)"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA do commit + saída do `validate_workflow`. Olavo activate manualmente e roda smoke (queries de validação acima).

--- END COPY ---
