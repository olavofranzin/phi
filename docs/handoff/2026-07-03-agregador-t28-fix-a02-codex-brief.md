# [BRIEF Codex a02] Agregador T28 — correção do fix ctx-por-campanha (pós-FAIL do smoke)

> **Contexto:** smoke a01 do draft `cbd3568d` = **FAIL** (report Codex 2026-07-03, exec `13697`:
> 5 linhas em `t28_campaign` com `client_id` NULL/vazio; E1 inválido). Diagnóstico do Claude abaixo.
> **Culpa do design (Claude), não da execução.** Este a02 corrige o desenho.
> **Workflow:** `4sdG2UKMCBuFq8xn` · ativo `a46d5a6a` (NÃO tocar/publicar) · trabalhar no DRAFT.
> **Pré-requisito:** dar `git push` do report a01 (`d1fd98c`) para a branch
> `claude/saude-digital-phi-midia-score-0ko12c` — o Claude precisa dele para a consolidação.

## 0. Causa-raiz do FAIL (entender antes de editar)

A cadeia T28 está pendurada no **output 0 do Loop = DONE** (refactor M3 de 2026-06-22): ela roda
**UMA vez, DEPOIS do loop terminar** — não por iteração. Logo:

1. `nodeFirst('Loop')` (âncora do a01) não devolve item de negócio — o done output do Loop carrega os
   itens realimentados pela cadeia legada (respostas de API via Merge1→Switch), **sem `id_client`** →
   `ctx.client_id` vazio → linhas com client_id NULL.
2. `@campaign_id` no BQ Read restringiu a leitura a UMA campanha numa cadeia que é one-shot → a outra
   campanha sumiu (5 linhas vs 12 esperadas).
3. `source_ingestion_step` no E1 do brief a01 estava errado (coluna existe só no stream de leitura,
   não na tabela) — a query E1 falha por coluna inexistente. Erro do brief, não do workflow.

**Desenho correto:** a leitura volta a ser client-wide; o contexto por campanha vem de um **MAPA**
construído a partir de TODAS as páginas do DB Campanhas, keyed por `id_google_camp`, aplicado linha a
linha do BQ. Sem depender de "iteração atual".

## 1. Edições no DRAFT (via MCP `update_workflow` + read-back obrigatório após CADA edição)

### 1.1 `[T28] BQ Read raw_campaign_data`

- **Remover** o parâmetro `campaign_id` de `options.queryParameters.namedParameters` (voltam a ser 3:
  `client_id`, `start_date`, `end_date` — valores atuais inalterados).
- **`sqlQuery`** (manter o dedup do a01, sem filtro de campanha):

```sql
WITH ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY client_id, campaign_id, date
      ORDER BY CASE WHEN ingestion_step = 'DAILY_ENTRY' THEN 0 ELSE 1 END
    ) AS rn
  FROM `phi_prod.raw_campaign_data`
  WHERE client_id = @client_id
    AND date BETWEEN @start_date AND @end_date
)
SELECT
  client_id, campaign_id, date AS business_date,
  impressions, clicks, cost, conversions, revenue AS conv_value,
  data_source, platform, primary_metric_goal,
  execution_id AS daily_entry_execution_id,
  ingestion_step AS source_ingestion_step
FROM ranked
WHERE rn = 1
```

### 1.2 `Adaptador Input T28` (jsCode — 3 edições cirúrgicas)

**(a) REVERTER as âncoras do a01 para o estado do ativo:**
```js
const ids = readOrThrow('Set dados', () => nodeFirst('Set dados'));
const campProps = readOrThrow('Get database campanhas', () => nodeFirst('Get database campanhas')?.properties);
const cliProps = readOrThrow('Get database clientes', () => nodeFirst('Get database clientes')?.properties);
```
e reverter a linha do landing page para:
```js
const landingPage = ids.landing_page ?? propAny(campProps, ['Landing Page', 'landing_page', 'URL'], pStr);
```
(remover também o comentário `[T28-FIX ctx-por-campanha]` do a01.)

**(b) ADICIONAR o mapa de contexto por campanha**, logo APÓS o bloco `const ctx = {...};`:
```js
const campCtxMap = {};
for (const cj of nodeAll('Get database campanhas')) {
  const props = cj?.properties || {};
  const gid = pNum(props['id_google_camp']);
  if (gid === null || gid === undefined) continue;
  campCtxMap[String(gid)] = {
    campaign_name: pStr(props['Nome da Campanha']) ?? pStr(props['Name']) ?? null,
    data_inicio_campanha: propAny(props, ['Data de Início', 'Data Inicio', 'data_inicio_campanha', 'Início'], pDate),
    objetivo: pSel(props['Objetivo']),
    modelo_negocio: pSel(props['Modelo de Negócio']),
    metrica_mae: pSel(props['Métrica-Mãe']) ?? pSel(props['Metrica-Mae']) ?? null,
    meta_metrica_mae: pNum(props['CPA Alvo']) ?? pNum(props['Meta CPA']) ?? pNum(props['Meta ROAS']),
    landing_page: propAny(props, ['Landing Page', 'landing_page', 'URL'], pStr)
  };
}
```

**(c) SUBSTITUIR o bloco `const googleCampaigns = bqCampaigns.map(...)` por:**
```js
const googleCampaigns = bqCampaigns.map((r) => {
  const cid = String(r.campaign_id ?? ids.id_google_campanha ?? '');
  const cc = campCtxMap[cid.replace(/^GADS-/, '')] || {};
  return {
    id: cid, name: cc.campaign_name ?? ctx.campaign_name,
    business_date: String(r.business_date ?? windows.date_end ?? '').slice(0, 10),
    data_inicio_campanha: cc.data_inicio_campanha ?? campaignStart,
    objetivo: cc.objetivo ?? null, modelo_negocio: cc.modelo_negocio ?? null,
    metrica_mae: cc.metrica_mae ?? null, meta_metrica_mae: cc.meta_metrica_mae ?? null,
    landing_page: cc.landing_page ?? null,
    impressions: N(r.impressions), clicks: N(r.clicks), cost: N(r.cost),
    conversions: N(r.conversions), conv_value: N(r.conv_value),
    primary_metric_goal: r.primary_metric_goal ?? null, data_source: r.data_source ?? null,
    platform: r.platform ?? 'google_ads', daily_entry_execution_id: r.daily_entry_execution_id ?? null,
    source_ingestion_step: r.source_ingestion_step ?? null
  };
});
```

### 1.3 `Normalizador T28` (jsCode — só o push de `t28_campaign`)

No `out.push({ json: { target_table: 't28_campaign', ... } })`, trocar as origens destes campos
(demais campos inalterados):
```js
objetivo: c.objetivo ?? ctx.objetivo ?? null,
modelo_negocio: c.modelo_negocio ?? ctx.modelo_negocio ?? null,
metrica_mae: c.metrica_mae ?? metricaMae,
meta_metrica_mae: num(c.meta_metrica_mae) || num(ctx.meta_metrica_mae) || num(c.primary_metric_goal) || null,
landing_page: c.landing_page ?? ctx.landing_page ?? null,
```

## 2. Re-smoke (mesmo procedimento do brief a01, com correções)

- Brief original: `2026-07-03-agregador-t28-smoke-draft-codex-brief.md`, com:
  - **E1 corrigido** (SEM `source_ingestion_step` — a coluna não existe na tabela):
    `SELECT campaign_id, business_date, janela, objetivo, metrica_mae, meta_metrica_mae, landing_page, execution_id, ingested_at FROM `phi_prod.t28_campaign` WHERE client_id='CLI-4' AND execution_id LIKE 'EXEC-T28-%' ORDER BY ingested_at DESC, campaign_id LIMIT 30`
  - **C3 corrigido:** verificar `source_ingestion_step` no OUTPUT do nó `[T28] BQ Read` dentro da
    execução n8n (`get_execution` includeData), não na tabela.
  - **C2 (decisivo) inalterado:** Barbearia (`GADS-21149189736`) e Salão (`GADS-21116045403`) com
    contexto próprio; **client_id = 'CLI-4' em todas as linhas** (novo sub-critério C2b, dado o FAIL a01).
  - Contagem esperada volta a ~12 linhas (2 campanhas × dias com dado na janela D-7).
- **Higiene pré-smoke:** as 5 linhas ruins do a01 (client_id NULL/vazio) — deletar via
  `DELETE FROM `phi_prod.t28_campaign` WHERE client_id IS NULL OR client_id = ''` (registrar contagem
  deletada no report).

## 3. Guardrails

Iguais ao a01: NÃO publicar; read-back após cada `update_workflow` (nós grandes já falharam
silenciosamente no passado); se a execução falhar, evidência + PARAR. Report:
`docs/handoff/2026-07-03-agregador-t28-smoke-a02-codex-report.md`, commitado E **pushed** na branch.
