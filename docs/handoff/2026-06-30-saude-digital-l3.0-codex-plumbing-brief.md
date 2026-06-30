# [BRIEF Codex] L3.0 — Plumbing do Orquestrador de Análises (campaign vertical slice)

> **Frente:** Saúde Digital · **Lote:** L3.0 (Camada 2 — Análise) · **Branch:** `claude/agentic-agency-planning-KwJEw`
> **Design:** `docs/strategic-planning/saude-digital/L3.0-orquestrador-campaign-design.md`
> **Fluxo de revisão:** Codex implementa → Claude pré-revisa → Antigravity → smoke real (Olavo).
> **Escopo deste brief = PLUMBING.** O framework de análise (§4 do design — o prompt
> do LLM, taxonomia final de flags, severidade) é **DEFERIDO** para um sub-chat
> dedicado. Aqui construímos o encanamento E2E com um **nó de análise PLACEHOLDER
> determinístico** (regras), pronto para receber o LLM depois sem mexer na estrutura.

---

## 0. TL;DR do que entregar

Dois workflows novos no n8n (**draft**, via MCP `create_workflow_from_code`, **sem
publish/activate**):

1. **`WF-T28-Orquestrador-Analises`** — lê `t28_campaign` + PHI·Mídia canônico
   (1 query BQ com JOIN), resolve relations Notion (best-effort), fan-out por
   campanha via Execute Workflow.
2. **`WF-T28-Analise-Campaign`** (sub-WF) — recebe 1 campanha, computa flags
   determinísticas (placeholder do híbrido), faz **upsert** de 1 page em
   **`PHI - Análises`** (Notion) por chave de negócio.

Smoke em **phi_dev** (lê `phi_dev.t28_campaign` × `phi_prod.phi_score_current`),
escreve page real em `PHI - Análises` com `execution_id` = `EXEC-ORQ-SMOKE-*`.

---

## 1. Decisões travadas (Olavo) — respeitar

| # | Decisão |
|---|---|
| Escopo | Fatia vertical **campaign-level** (janela **D-7**, materializada). |
| Gatilho | **Schedule próprio** lendo `t28_*` (desacoplado do Agregador, ADR-23). |
| Score | **Lido canônico** de `phi_score_current` (ADR-003) — **NÃO recalcular**. |
| Framework §4 | **Por último**, em sub-chat. Aqui = placeholder determinístico. |
| Flags | **Híbrido** — regras determinísticas (implementadas agora) + LLM (depois). |
| Modelo | **Claude** p/ análise densa (campaign). **NÃO** é dependência do plumbing (placeholder). |
| Relations | `cliente`/`campanha` = **relation** às DBs canônicas; `client_id`/`campaign_id` text mantidos. |

---

## 2. Pré-requisitos / dependências

| Dep | Estado | Nota |
|---|---|---|
| DB `PHI - Análises` criado (Notion) | **PENDENTE** (gate MCP) | Olavo cria (spec no §6) ou via reload. **Necessário o data source id** antes do smoke. |
| Credencial **BigQuery** no n8n | OK | Reusar a do Agregador/Pipeline_v2. |
| Credencial **Notion** no n8n | OK | Reusar a do Agregador. |
| Credencial **Claude/Anthropic** | **NÃO** bloqueante | Só quando o sub-chat entregar o framework. Plumbing usa placeholder. |
| Data source ids p/ relations | RESOLVIDOS | Clientes `19fb65e5-c72b-81db-8376-000bbe74c256`; Campanhas `19fb65e5-c72b-80be-8c3b-000bb115d53f`. |

**Config centralizada:** primeiro nó `Set config` (Set, `executeOnce: true`) com:
`BQ_DATASET` (= `phi_dev` no smoke; `phi_prod` em prod), `SCORE_DATASET` (= `phi_prod`
sempre — score é canônico de prod), `ANALISES_DS_ID` (data source id de PHI - Análises,
preencher após criação), `CLIENTES_DS_ID`, `CAMPANHAS_DS_ID`, `tenant_id` (`phi-agencia`),
`janela` (`D-7`), `business_date` (override opcional; default = calculado).

---

## 3. WF-T28-Orquestrador-Analises (workflow 1)

**Nomes de nó: 100% ASCII** (sem acento/ç) — proteção contra o bug de `$()` ref
(ASCII-folding/mojibake) que já nos custou no Agregador. Use `executeOnce` e
`.all()[0].json` em refs cross-node (determinístico) — **nunca** `.item.json` em
runOnceForAllItems.

### Grafo
```
Manual Trigger (smoke)  ─┐
Schedule Trigger (prod) ─┴─> Set config ─> Code calc janela/datas
   ─> BigQuery: read t28 + score (JOIN)        [executeQuery, read-only]
   ─> Loop (Split in Batches, 1 por campanha)
        ─> Notion: resolve campanha (best-effort)
        ─> Notion: resolve cliente   (best-effort)
        ─> Code: monta payload da analise
        ─> Execute Workflow -> WF-T28-Analise-Campaign
   ─> (done) NoOp / log
```
- **Schedule Trigger** presente mas o workflow fica **inativo** (draft). Semanal
  espelhando o Agregador; refinar cron depois. Manual Trigger é o caminho do smoke.
- **Code calc janela/datas**: deriva `business_date` (default = a última data com
  dado materializado; no smoke, usar o override do `Set config`). `janela` = `D-7`.

### Nó BigQuery — leitura t28 + score (JOIN)
`n8n-nodes-base.googleBigQuery`, operation **executeQuery**, `useLegacySql: false`.
SQL (montar `BQ_DATASET`/`business_date`/`janela` via expressão do `Set config`;
valores internos, sem input externo — risco de injeção baixo, mas envolva DATE com
`DATE('...')` e strings com aspas simples):

```sql
SELECT
  t.client_id, t.campaign_id, t.business_date, t.janela,
  t.campaign_name, t.data_inicio_campanha, t.objetivo, t.modelo_negocio,
  t.metrica_mae, t.meta_metrica_mae, t.margem_contribuicao_pct, t.ticket_ltv, t.landing_page,
  t.impressions, t.clicks, t.cost, t.conversions, t.conv_value,
  t.impression_share, t.budget_lost_is,
  t.cpm, t.cpc, t.ctr, t.cvr, t.cpa, t.cpl, t.roas,
  t.pct_brand_terms, t.pct_problem_solving_terms, t.pct_competitor_terms, t.pct_other_terms,
  t.volume_suficiente,
  TO_JSON_STRING(t.source_status) AS source_status,
  t.versao_contract_aplicada,
  s.phi_value, s.phi_classification, s.calculated_date,
  s.mas, s.tss, s.fis, s.es, s.rs, s.os, s.business_model, s.model_version
FROM `{{BQ_DATASET}}.t28_campaign` t
LEFT JOIN `{{SCORE_DATASET}}.phi_score_current` s
  ON t.client_id = s.client_id AND t.campaign_id = s.campaign_id
WHERE t.business_date = DATE('{{business_date}}')
  AND t.janela = '{{janela}}'
```
- **LEFT JOIN** de propósito: campanha sem score em `phi_score_current` ainda gera
  análise (com `phi_midia_score`/`leitura` vazios + flag `score_indisponivel`),
  não bloqueia (ADR-23 resiliência).
- `phi_score_current` é VIEW (último SUCCESS por `client_id+campaign_id`) — sem
  alinhar data/janela. `calculated_date` vai pra rastreabilidade.
- `t28_campaign` só materializa **D-7/D-30**; D-1/D-3 são VIEWs. Slice = `D-7`.

### Resolução de relations (best-effort, NÃO bloqueante)
Para cada linha (no Loop), antes do payload:
1. **campanha**: Notion `databasePage:getAll` em `CAMPANHAS_DS_ID`, filtro
   `campaign_id` (rich_text/text) **equals** `t28.campaign_id`. Pega o `page_id`
   do 1º match. Se 0 matches → relation vazia + flag interna `campanha_nao_resolvida`.
2. **cliente**: Notion `databasePage:getAll` em `CLIENTES_DS_ID`, tentar casar
   `t28.client_id` contra a coluna `client_id` (no Clientes Database é
   `auto_increment_id`/INTEGER — comparar como string; se o formato não casar,
   deixar vazio + flag `cliente_nao_resolvido`).
   > ⚠️ Os formatos de id reais (t28.client_id STRING vs Clientes.client_id INT)
   > podem não casar 1:1. **Não trave o smoke nisso** — `client_id`/`campaign_id`
   > text sempre carregam o valor. Ajustamos o match quando vermos os ids reais
   > no smoke. (Possível atalho: derivar o cliente a partir da página de campanha
   > resolvida, se houver vínculo direto — investigar no smoke.)
- Use `onError: continueRegularOutput` nesses nós Notion (lookup que falha degrada
  a relation, não aborta a análise).

### Code: monta payload
Emite 1 item por campanha com TODO o contexto + score + os page_ids resolvidos:
```
{
  identidade: {client_id, campaign_id, campaign_name, janela, business_date, tenant_id},
  score: {phi_value, phi_classification, calculated_date, mas, tss, fis, es, rs, os, model_version},
  metricas: {impressions, clicks, cost, conversions, conv_value, impression_share,
             budget_lost_is, cpm, cpc, ctr, cvr, cpa, cpl, roas},
  contexto: {objetivo, modelo_negocio, metrica_mae, meta_metrica_mae,
             margem_contribuicao_pct, ticket_ltv, landing_page, data_inicio_campanha,
             pct_brand_terms, pct_problem_solving_terms, pct_competitor_terms, pct_other_terms},
  qualidade: {volume_suficiente, source_status},
  rel: {cliente_page_id|null, campanha_page_id|null, resolucao_flags:[...]},
  audit: {versao_contract_aplicada, execution_id: 'EXEC-ORQ-<ts>-<uuid>'}
}
```
`execution_id` = `EXEC-ORQ-SMOKE-<ts>` no smoke (Manual Trigger), `EXEC-ORQ-<ts>`
em prod (Schedule).

### Execute Workflow
`n8n-nodes-base.executeWorkflow` → `WF-T28-Analise-Campaign`, modo "run once for
each item", passando o payload.

---

## 4. WF-T28-Analise-Campaign (workflow 2, sub-WF)

### Grafo
```
Execute Workflow Trigger
  ─> Code: flags determinísticas + severidade (PLACEHOLDER do híbrido)
  ─> Code: monta properties + body da page Notion
  ─> Notion: query PHI - Análises por chave de negocio (upsert lookup)
  ─> IF existe?
       ├ sim ─> Notion: update page (props + body)
       └ nao ─> Notion: create page (props + body)
```

### Code: flags determinísticas (PLACEHOLDER — strawman; sub-chat finaliza)
> Esta é a **metade determinística** do híbrido — a única parte segura de
> implementar sem o framework. Thresholds são **strawman**; marcar como tal.
> O LLM (depois) adiciona narrativa/priorização por cima — não substitui estas
> regras.

```js
const m = $json; // payload
const flags = [];
const meta = Number(m.contexto.meta_metrica_mae);
const mm = (m.contexto.metrica_mae || '').toUpperCase();

if (m.qualidade.volume_suficiente === false) flags.push('volume_insuficiente');
if (m.score.phi_value == null) flags.push('score_indisponivel'); // LEFT JOIN sem match

if (mm === 'CPA' && meta > 0 && m.metricas.cpa != null) {
  if (m.metricas.cpa > meta * 1.2) flags.push('cpa_acima_meta');
}
if (mm === 'ROAS' && meta > 0 && m.metricas.roas != null) {
  if (m.metricas.roas < meta) flags.push('roas_abaixo_meta');
}
if (m.metricas.impression_share != null && m.metricas.impression_share < 0.5)
  flags.push('impression_share_baixo');
if (m.metricas.budget_lost_is != null && m.metricas.budget_lost_is > 0.2)
  flags.push('budget_lost');
if ((m.metricas.conversions || 0) === 0 && (m.metricas.cost || 0) > 0)
  flags.push('sem_conversao'); // limiar de custo refinado no sub-chat
// ctr_baixo: DEFERIDO (precisa de benchmark por objetivo — vem do framework)

// severidade = pior flag ativa (placeholder)
const CRIT = new Set(['sem_conversao','cpa_acima_meta','roas_abaixo_meta']);
const ATEN = new Set(['impression_share_baixo','budget_lost']);
let severidade = 'info';
if (flags.some(f => CRIT.has(f))) severidade = 'critico';
else if (flags.some(f => ATEN.has(f))) severidade = 'atencao';
if (m.qualidade.volume_suficiente === false) severidade = 'info'; // guarda: nao agressivo

// insight placeholder (templated; o LLM substitui no sub-chat)
const insight = `[PLACEHOLDER] Análise determinística. Score PHI·Mídia: ` +
  `${m.score.phi_value ?? 'N/D'} (${m.score.phi_classification ?? 'sem leitura'}). ` +
  `Flags: ${flags.length ? flags.join(', ') : 'nenhuma'}.`;
return [{ json: { ...m, analise: { insight, recomendacoes: [], flags, severidade,
  evidencias: [], modelo_llm: 'placeholder-deterministico' } } }];
```

### Notion — upsert por chave de negócio (idempotência, padrão L1.6)
**Chave:** `client_id` + `campaign_id` + `business_date` + `janela` + `nivel`(=`campaign`).
- **Lookup**: `databasePage:getAll` em `ANALISES_DS_ID`, filtro AND em `client_id`,
  `campaign_id`, `janela`, `business_date`, `nivel`. (Notion não tem MERGE; o upsert
  é lookup→IF→update/create. Aceita-se a janela de corrida — execução serial.)
- **IF existe**: 1+ match → `databasePage:update` no 1º; 0 → `databasePage:create`.
- Re-run com a mesma chave **atualiza**, não duplica (idempotente).

### Properties da page (mapeamento → `PHI - Análises`)
| Property | Origem |
|---|---|
| `titulo` | `[campaign] ${campaign_name||campaign_id} — ${janela} (${business_date})` |
| `nivel` | `campaign` |
| `cliente` (relation) | `rel.cliente_page_id` (se houver) |
| `campanha` (relation) | `rel.campanha_page_id` (se houver) |
| `client_id` / `campaign_id` | do payload (sempre) |
| `janela` / `business_date` | do payload |
| `phi_midia_score` | `score.phi_value` |
| `leitura` | `score.phi_classification` (vazio se null) |
| `flags_ativas` (multi-select) | `analise.flags` |
| `severidade` | `analise.severidade` |
| `modelo_llm` | `analise.modelo_llm` (`placeholder-deterministico` por ora) |
| `execution_id` | `audit.execution_id` |
| `versao_contract` | `audit.versao_contract_aplicada` |
| `calculated_date` | `score.calculated_date` |
| `tenant_id` | `phi-agencia` |
**Body (blocks):** Insight (analise.insight) · Recomendações (vazio por ora) ·
Evidências (lista das métricas-chave: cpa/roas vs meta, impression_share, budget_lost_is).

> Multi-select `flags_ativas`: se vier flag fora do enum semeado (ex.: `score_indisponivel`),
> o Notion cria a opção on-the-fly — OK; consolidamos o enum no sub-chat.

---

## 5. Restrições n8n (obrigatórias)
- **Workflows em DRAFT.** Criar via `create_workflow_from_code`; **não** publicar
  nem ativar. **Não** usar a public API PUT (auto-ativa). Se precisar editar depois,
  `update_workflow` (MCP, mantém draft).
- Nomes de nó **ASCII** (sem `ç`/acento) — evita o bug de `$()` ref.
- Refs cross-node: `.all()[0].json` (determinístico). `executeOnce: true` em
  `Set config`/Code single-item. Nada de `.item.json` em runOnceForAllItems.
- `onError: continueRegularOutput` nos nós Notion de **lookup/resolução** (degradam,
  não abortam). Nos nós de **escrita** (create/update da análise), erro **propaga**
  (queremos saber se a gravação falhou).
- BigQuery: `executeQuery`, `useLegacySql:false`, **read-only** (SELECT) — sem
  streaming buffer, sem DML.

---

## 6. Schema do `PHI - Análises` (referência — DB criado à parte)
Parent: `Central de Operações — Agência › Gerenciamento de Documentos`
(`9d6b65e5-c72b-82e7-856d-81bc34933316`). Convenção **snake_case sem acento**
(o n8n escreve este DB). 18 props — ver tabela no design doc §5. Após criação,
preencher `ANALISES_DS_ID` no `Set config`.

---

## 7. Smoke (phi_dev) — critérios de aceite
1. `Set config` com `BQ_DATASET=phi_dev`, `SCORE_DATASET=phi_prod`, `business_date`
   = uma data com `phi_dev.t28_campaign` populado (ex.: `2026-06-21`, janela `D-7`),
   `ANALISES_DS_ID`/`CLIENTES_DS_ID`/`CAMPANHAS_DS_ID` preenchidos.
2. Disparar Manual Trigger.
3. **Esperado:** 1+ page em `PHI - Análises` com — `nivel=campaign`;
   `client_id`/`campaign_id` corretos; `janela=D-7`; `business_date` certo;
   `phi_midia_score`+`leitura` vindos de `phi_score_current` (ou flag
   `score_indisponivel` se LEFT JOIN sem match); `flags_ativas` computadas pelas
   regras; `severidade` coerente; `execution_id=EXEC-ORQ-SMOKE-*`; body com insight
   placeholder + evidências. Relations `cliente`/`campanha` preenchidas **ou** vazias
   com flag de resolução (não bloqueia).
4. **Idempotência:** re-rodar com a mesma chave → mesma page **atualizada**, sem
   duplicar. (Validar contando pages da chave: deve ser 1.)
5. Reportar: execution id n8n, nº de pages, valores das props da page criada,
   prova de idempotência (count=1 após 2 runs).

---

## 8. Fora de escopo (NÃO fazer agora)
- Prompt do LLM / chamada Claude / framework §4 → **sub-chat dedicado**.
- Ativar Schedule em prod / rodar em `phi_prod` → depois do smoke verde.
- Níveis ad/adset/cliente (L3.1/L3.2), update das properties da Campanhas
  (`Status Geral da Campanha`/`Score Diário`), Telegram, loop Demandas (ADR-22),
  sink BQ de análises → L3.1+/L3.5.
- DUAL/back-relation nas DBs canônicas → upgrade futuro (relations one-way agora).

---

## 9. Entregáveis (checklist Codex)
- [ ] `WF-T28-Orquestrador-Analises` (draft) — trigger, Set config, calc datas,
      BQ JOIN read, Loop, resolução relations (best-effort), payload, Execute Workflow.
- [ ] `WF-T28-Analise-Campaign` (draft) — trigger, flags determinísticas, mapeamento
      properties+body, upsert por chave de negócio (lookup→IF→create/update).
- [ ] `validate_workflow` verde nos dois.
- [ ] Execution log em `docs/handoff/2026-06-30-saude-digital-l3.0-execution-log.md`
      (ids dos workflows, versionId draft, nós, queries usadas).
- [ ] **NÃO** ativar; **NÃO** rodar prod. Aguardar pré-revisão (Claude) → smoke (Olavo).
