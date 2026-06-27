# Agregador T28 L2 Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o Agregador T28 para que erros tratados nao mascarem falha de ETL, o Adaptador suporte execucao `executeOnce`, e a escrita BQ siga o contrato T28/ADR vigente.

**Architecture:** Manter a Camada 1 como ETL puro: Notion apenas contexto operacional, `raw_campaign_data` como fonte Daily Entry preservada, `t28_*` como destino canonico analitico. O Error Handler global continua recebendo falhas criticas, mas o Agregador passa a emitir sinal claro de execucao degradada quando alguma fonte estrutural falha.

**Tech Stack:** n8n live workflow, n8n MCP/API, Code node JavaScript, Execute Workflow Trigger, BigQuery Standard SQL, Google Ads GAQL, Notion ADR/SOP, Telegram.

---

## Contexto Obrigatorio

- Branch alvo: `claude/agentic-agency-planning-KwJEw`.
- Workflow alvo: `PHI - Agregador de Metricas Multi-fonte`, ID `4sdG2UKMCBuFq8xn`.
- Versao observada antes deste plano: `versionId=276e7e22-7b3b-4b55-840e-dfbb5d8e7c6b`, `activeVersionId=276e7e22-7b3b-4b55-840e-dfbb5d8e7c6b`.
- Sub-WF Error Handler: ID `rTS5pE34eElfuMPl`, versao observada `5ce0bf17-f176-40cb-9814-12473d43064c`.
- Execucao analisada: `11655`, status n8n `success`, mas com error output em `Adaptador Input T28`.
- Docs fonte:
  - `docs/strategic-planning/ESTADO-DO-PROJETO.md`
  - `docs/strategic-planning/agregador-t28/BRUTO-v0.1-design.md`
  - `docs/strategic-planning/saude-digital/BRUTO-v0.1-arquitetura-saude-digital.md`
  - Notion ADR `Error Handler global da Operacao Interna`
  - Notion ADR `Destino canonico do contract T28 + governanca`
  - Notion SOP `Criterio Estatistico volume_suficiente v1.0`

## Fora de Escopo

- Nao remover o Loop legado inteiro.
- Nao ativar LLM, Orquestrador ou Entrega.
- Nao persistir Search Terms brutos em BigQuery.
- Nao trocar credenciais reais sem pedido explicito.
- Nao tocar em `Adaptador Input T28` se houver aviso posterior de protecao manual; neste plano ele e alvo porque o erro atual esta nele.

---

### Task 1: Baseline e trava de seguranca

**Files/Surfaces:**
- Read: live workflow `4sdG2UKMCBuFq8xn`
- Read: execution `11655`
- Create: `tmp/audit_agregador_t28_baseline.json`
- Create: `tmp/audit_agregador_t28_findings.json`

- [ ] **Step 1: Capturar estado live do workflow**

Run:

```powershell
python C:\tmp\phi_repo_audit\docs\fetch_workflow.py 4sdG2UKMCBuFq8xn > C:\tmp\phi_repo_audit\tmp\audit_agregador_t28_baseline.json
```

Expected:

```text
Arquivo JSON contem name, nodes, connections, versionId e activeVersionId.
```

- [ ] **Step 2: Reconfirmar execucao 11655**

Use `get_execution` com `includeData=true` para estes nodes:

```text
Adaptador Input T28
[Err] Roteador Payload
[Err] Call Handler
[T28] BQ Read raw_campaign_data
Normalizador T28
```

Expected:

```text
Adaptador Input T28 tem output error com "Cannot read properties of undefined (reading 'json')".
[Err] Call Handler executou sub-workflows de erro.
Workflow 11655 aparece como success, logo o run foi degradado e nao totalmente verde.
```

- [ ] **Step 3: Registrar baseline**

Salvar em `tmp/audit_agregador_t28_findings.json`:

```json
{
  "workflowId": "4sdG2UKMCBuFq8xn",
  "workflowName": "PHI - Agregador de Metricas Multi-fonte",
  "baselineExecutionId": "11655",
  "knownBadNode": "Adaptador Input T28",
  "knownBadMessage": "Cannot read properties of undefined (reading 'json')",
  "requiredOutcome": "No Adaptador error output; degraded run signal exists when handler receives structural errors"
}
```

- [ ] **Step 4: Commit baseline docs only if files are tracked by this task**

Run:

```powershell
git -C C:\tmp\phi_repo_audit status --short
```

Expected:

```text
Somente arquivos temporarios ou plano aparecem; nenhum workflow live foi alterado ainda.
```

---

### Task 2: Corrigir leitura estrutural do Adaptador Input T28

**Files/Surfaces:**
- Modify: node `Adaptador Input T28` in workflow `4sdG2UKMCBuFq8xn`
- Test: structural Code node syntax check

- [ ] **Step 1: Extrair codigo atual do node**

Run script local que le `audit_agregador_t28_baseline.json` e grava:

```powershell
node C:\tmp\phi_repo_audit\scripts\extract_node_code.js `
  C:\tmp\phi_repo_audit\tmp\audit_agregador_t28_baseline.json `
  "Adaptador Input T28" `
  C:\tmp\phi_repo_audit\tmp\adaptador_input_t28_before.js
```

Expected:

```text
Arquivo contem referencias a $('Set dados').item.json e readOrThrow(...).
```

- [ ] **Step 2: Substituir leituras `.item.json` por helpers deterministicas**

No Code node, trocar o bloco de leitura estrutural por este padrao:

```javascript
function firstJson(label, nodeName) {
  const items = $(nodeName).all();
  if (!items || items.length === 0 || !items[0] || !items[0].json) {
    throw new Error(`[T28-ADAPTADOR] fonte estrutural ausente: ${label}`);
  }
  return items[0].json;
}

function allJson(label, nodeName) {
  const items = $(nodeName).all();
  if (!items || items.length === 0) {
    throw new Error(`[T28-ADAPTADOR] fonte estrutural ausente: ${label}`);
  }
  return items.map((item, idx) => {
    if (!item || !item.json) {
      throw new Error(`[T28-ADAPTADOR] item invalido em ${label} index=${idx}`);
    }
    return item.json;
  });
}

const setDadosItems = allJson('Set dados', 'Set dados');
const ids = setDadosItems[0];
const campProps = firstJson('Get database campanhas', 'Get database campanhas').properties;
const cliProps = firstJson('Get database clientes', 'Get database clientes').properties;
const windows = firstJson('Code prepara datas para extracao', 'Code prepara datas para extracao');
const rawCampaignRows = allJson('[T28] BQ Read raw_campaign_data', '[T28] BQ Read raw_campaign_data');
```

Then replace direct `$('...').item.json`, unsafe `.first().json`, and BQ `all().map(i => i.json)` reads with these helpers.

- [ ] **Step 3: Preserve optional-source behavior explicitly**

Optional sources must not throw if absence is legitimate:

```javascript
function optionalFirstJson(nodeName, fallback = {}) {
  const items = $(nodeName).all();
  if (!items || items.length === 0 || !items[0] || !items[0].json) return fallback;
  return items[0].json;
}

function optionalAllJson(nodeName) {
  const items = $(nodeName).all();
  if (!items || items.length === 0) return [];
  return items.filter(item => item && item.json).map(item => item.json);
}
```

Use this only for legitimate optional sources such as Meta/Search Terms features, not for BQ raw, Set dados, campaign/client context, or date window.

- [ ] **Step 4: Validate JavaScript syntax**

Run:

```powershell
node --check C:\tmp\phi_repo_audit\tmp\adaptador_input_t28_after.js
```

Expected:

```text
No syntax errors.
```

- [ ] **Step 5: Apply minimal n8n update**

Use `update_workflow` with one `setNodeParameter` operation:

```json
{
  "workflowId": "4sdG2UKMCBuFq8xn",
  "operations": [
    {
      "type": "setNodeParameter",
      "nodeName": "Adaptador Input T28",
      "path": "jsCode",
      "value": "<full updated code>"
    }
  ]
}
```

Expected:

```text
Workflow draft versionId changes. Active version does not change unless published later.
```

---

### Task 3: Corrigir contrato multi-campanha no payload do Adaptador/Normalizador

**Files/Surfaces:**
- Modify: node `Adaptador Input T28`
- Modify: node `Normalizador T28`
- Test: local fixture with 2 campaigns from same client

- [ ] **Step 1: Criar fixture minima**

Create `tmp/t28_multi_campaign_fixture.json`:

```json
{
  "setDadosItems": [
    {"client_id": "CLI-4", "campaign_id": "GADS-21149189736"},
    {"client_id": "CLI-4", "campaign_id": "GADS-21116045403"}
  ],
  "rawCampaignRows": [
    {"client_id": "CLI-4", "campaign_id": "GADS-21149189736", "business_date": "2026-06-20", "impressions": 10, "clicks": 1, "cost": 2, "conversions": 0},
    {"client_id": "CLI-4", "campaign_id": "GADS-21116045403", "business_date": "2026-06-20", "impressions": 20, "clicks": 2, "cost": 4, "conversions": 1}
  ]
}
```

- [ ] **Step 2: Adaptador deve emitir contexto por campanha**

Ensure the Adaptador output includes:

```javascript
const campaignContextById = Object.fromEntries(
  setDadosItems
    .filter(row => row.campaign_id)
    .map(row => [String(row.campaign_id), row])
);

return [{
  json: {
    context: {
      client_id: String(ids.client_id || ''),
      campaign_ids: Object.keys(campaignContextById),
      campaign_context_by_id: campaignContextById,
      window_start: windows.date_start,
      window_end: windows.date_end,
      janela: windows.janela || 'D-7'
    },
    sources: {
      raw_campaign_data: rawCampaignRows
    }
  }
}];
```

- [ ] **Step 3: Normalizador deve preservar campaign_id por linha**

In campaign-level normalization, derive `campaign_id` from row first:

```javascript
function campaignContextFor(campaignId) {
  return input.context.campaign_context_by_id[String(campaignId)] || {};
}

const t28Campaign = rawCampaignRows.map(row => {
  const campaignId = String(row.campaign_id || '');
  const campaignCtx = campaignContextFor(campaignId);
  return {
    client_id: String(row.client_id || input.context.client_id || ''),
    campaign_id: campaignId,
    business_date: row.business_date,
    janela: input.context.janela,
    platform: row.platform || campaignCtx.platform || 'google_ads',
    impressions: Number(row.impressions || 0),
    clicks: Number(row.clicks || 0),
    cost: Number(row.cost || 0),
    conversions: Number(row.conversions || 0)
  };
});
```

- [ ] **Step 4: Do not assign adset rows to a single global campaign**

For adset rows, require row-level campaign id:

```javascript
if (adsetRows.some(row => !row.campaign_id)) {
  throw new Error('[T28-NORMALIZADOR] adset row sem campaign_id; nao e seguro atribuir campanha global');
}
```

Expected:

```text
PMAX sem adset continua retornando t28_adset vazio; nao gera linhas com campaign_id errado.
```

- [ ] **Step 5: Run fixture check**

Run a local test harness around extracted functions:

```powershell
node C:\tmp\phi_repo_audit\tmp\t28_multi_campaign_test.js
```

Expected:

```text
PASS campaign rows keep distinct campaign_id values.
PASS no adset row is created without row-level campaign_id.
```

---

### Task 4: Adicionar sinal de execucao degradada

**Files/Surfaces:**
- Modify: node `[Err] Roteador Payload`
- Modify: node `[Err] Call Handler` only if mapping missing
- Add/Modify: one lightweight summary node before workflow end if needed

- [ ] **Step 1: Definir politica**

Use this rule:

```text
Se qualquer fonte estrutural do T28 falhar, o Error Handler continua sendo chamado, mas o Agregador tambem deve produzir um item de resumo com status="degraded".
Se so fonte opcional falhar, status="partial" ou severity="warn".
Se nenhum erro passar pelo Roteador, status="ok".
```

- [ ] **Step 2: Ensure router payload includes structural severity**

`[Err] Roteador Payload` must classify:

```javascript
const structuralNodes = new Set([
  'Adaptador Input T28',
  'Normalizador T28',
  '[T28] BQ Read raw_campaign_data',
  '[T28] BQ Insert t28_campaign',
  '[T28] BQ Insert t28_adset',
  '[T28] BQ Insert t28_ga4_landing',
  '[T28] BQ Insert t28_gbp_daily',
  '[T28] BQ Insert t28_clarity_daily',
  '[T28] BQ Insert t28_meta_campaign'
]);

const severity = structuralNodes.has(nodeName) ? 'critical' : 'error';
```

- [ ] **Step 3: Emit run-quality item**

Add a node `T28 Run Quality Summary` after error routing or near the terminal path:

```javascript
return [{
  json: {
    workflow_id: $workflow.id,
    workflow_name: $workflow.name,
    execution_id: $execution.id,
    status: $json.severity === 'critical' ? 'degraded' : 'partial',
    node_name: $json.node_name,
    error_message: $json.errMessage || $json.error_message || '',
    occurred_at: new Date().toISOString()
  }
}];
```

Expected:

```text
Human-readable summary makes clear that n8n success != ETL fully successful.
```

- [ ] **Step 4: Do not break Error Handler**

Keep `[Err] Call Handler` with:

```text
onError=continueRegularOutput
```

Expected:

```text
If Telegram/Notion/BQ error logging fails, original workflow does not cascade into a second outage.
```

---

### Task 5: Alinhar BigQuery writes com idempotencia

**Files/Surfaces:**
- Modify or replace: six `[T28] BQ Insert ...` nodes
- Prefer: BigQuery Execute Query/MERGE nodes if supported by current n8n schema
- Tables: `phi_prod.t28_campaign`, `t28_adset`, `t28_ga4_landing`, `t28_gbp_daily`, `t28_clarity_daily`, `t28_meta_campaign`

- [ ] **Step 1: Confirmar schema das tabelas**

Run:

```powershell
bq show --schema --format=prettyjson phi_prod.t28_campaign
bq show --schema --format=prettyjson phi_prod.t28_adset
bq show --schema --format=prettyjson phi_prod.t28_ga4_landing
bq show --schema --format=prettyjson phi_prod.t28_gbp_daily
bq show --schema --format=prettyjson phi_prod.t28_clarity_daily
bq show --schema --format=prettyjson phi_prod.t28_meta_campaign
```

Expected:

```text
Schemas include business key columns: client_id, entity id, business_date, janela, versao_contract_aplicada.
```

- [ ] **Step 2: Replace insert-only behavior with MERGE**

Use this MERGE pattern per table:

```sql
MERGE `phi_prod.t28_campaign` T
USING UNNEST(@rows) S
ON T.client_id = S.client_id
AND T.campaign_id = S.campaign_id
AND T.business_date = S.business_date
AND T.janela = S.janela
AND T.versao_contract_aplicada = S.versao_contract_aplicada
WHEN MATCHED THEN UPDATE SET
  impressions = S.impressions,
  clicks = S.clicks,
  cost = S.cost,
  conversions = S.conversions,
  updated_at = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN INSERT ROW
```

If n8n BigQuery node cannot bind array-of-struct cleanly, use a staging table per execution:

```text
1. Insert rows into phi_prod.t28_stage_<table> with execution_id.
2. Execute MERGE from staging into target.
3. Delete staging rows for execution_id.
```

- [ ] **Step 3: Validate parameter names with node type schema**

Use `get_node_types` for BigQuery and validate each candidate BigQuery node config before applying.

Expected:

```text
No guessed parameter names. Validation passes before update_workflow.
```

- [ ] **Step 4: Re-run same smoke twice**

Expected:

```text
Second run does not increase row count for same business keys.
Changed source metric updates existing row.
```

---

### Task 6: Verificar e corrigir volume_suficiente

**Files/Surfaces:**
- Modify: `Normalizador T28`
- Source: SOP `Criterio Estatistico volume_suficiente v1.0`

- [ ] **Step 1: Add explicit helper**

Use this implementation:

```javascript
function volumeSuficiente({ campaignStartDate, businessDate, conversions, windowDays }) {
  if (!campaignStartDate || !businessDate) return false;
  const start = new Date(campaignStartDate);
  const date = new Date(businessDate);
  const ageDays = Math.floor((date - start) / 86400000);
  if (ageDays <= 14) {
    return Number(conversions || 0) >= 50 && Number(windowDays || 0) >= 7;
  }
  return true;
}
```

- [ ] **Step 2: Persist SOP version**

Every T28 row must include:

```javascript
versao_sop_aplicada: 'volume_suficiente_v1.0'
```

or the exact existing column/value pattern used by the DDL.

- [ ] **Step 3: Test decision table**

Run local tests:

```javascript
const cases = [
  [{ campaignStartDate: '2026-06-20', businessDate: '2026-06-21', conversions: 100, windowDays: 1 }, false],
  [{ campaignStartDate: '2026-06-10', businessDate: '2026-06-20', conversions: 49, windowDays: 7 }, false],
  [{ campaignStartDate: '2026-06-10', businessDate: '2026-06-20', conversions: 50, windowDays: 7 }, true],
  [{ campaignStartDate: '2026-06-01', businessDate: '2026-06-20', conversions: 0, windowDays: 1 }, true]
];
```

Expected:

```text
All cases pass according to SOP v1.0.
```

---

### Task 7: Credenciais e parametros sensiveis

**Files/Surfaces:**
- Review: HTTP Request Clarity
- Review: Google Ads Conjuntos/Anuncios/Search Terms HTTP nodes
- Review: `Set dados`

- [ ] **Step 1: Inventory hardcoded secrets**

Search workflow JSON for:

```text
Authorization
developer-token
google_developer_token
Bearer
INSERT YOUR
your-document-id-here
```

Expected:

```text
List each node and whether value is real secret, placeholder, or context field.
```

- [ ] **Step 2: Move real secrets to credentials**

For real secrets:

```text
Use n8n credentials or environment-backed credentials.
Do not keep bearer token/developer-token as Notion context or plain node parameter.
```

- [ ] **Step 3: Leave non-secret business context in Notion**

Allowed Notion context:

```text
client_id
campaign_id
google_customer_id
google_manager_id if it is identifier-only and not secret
brand terms list
competitor terms list
```

Expected:

```text
No secret-like fields remain in Set dados or plain HTTP headers.
```

---

### Task 8: Limpeza de canvas sem mudar arquitetura

**Files/Surfaces:**
- Remove or archive only nodes confirmed dead and disconnected
- Keep Loop legado unless explicitly approved

- [ ] **Step 1: Classify disabled nodes**

Classify each:

```text
Switch
Prepare Report Data2
Append or update row in sheet2
Fetch Meta Ads
AI Agent
Calculate KPIs & Campaign Insights
```

Expected:

```text
Meta and AI legacy may stay disabled by decision.
Placeholder sheet/report nodes should be removed if disconnected and outside Camada 1.
```

- [ ] **Step 2: Remove only confirmed dead path**

Use `update_workflow` removeNode operations for nodes that meet all:

```text
disabled=true
not part of future L3 legacy preservation
not connected to active T28 path
contains placeholder or obsolete delivery/report behavior
```

- [ ] **Step 3: Verify node count and no dangling connections**

Re-fetch workflow details.

Expected:

```text
No connection references removed node names.
T28 path from trigger -> loop done -> BQ Read -> Adaptador -> Normalizador -> BQ writes remains intact.
```

---

### Task 9: Smoke tests e verificacao final

**Files/Surfaces:**
- Live n8n manual execution
- BigQuery row counts
- Error Handler sub-execution

- [ ] **Step 1: Manual smoke com cliente CLI-4**

Execute workflow in manual mode with same input shape used in `11655`.

Expected:

```text
Adaptador Input T28 executionStatus=success.
No error output from Adaptador.
Normalizador T28 executionStatus=success.
```

- [ ] **Step 2: Check expected counts**

Expected baseline from architecture docs:

```text
t28_campaign=12
t28_adset=0 for PMAX
t28_ga4_landing=2
t28_gbp_daily=1
t28_clarity_daily=1
t28_meta_campaign=0 if Meta disabled/no data
```

- [ ] **Step 3: Re-run same smoke**

Expected:

```text
MERGE/idempotency prevents duplicate row growth for same business keys.
```

- [ ] **Step 4: Force one controlled API failure**

Temporarily use a safe invalid test condition on a non-production draft path, or pin data if available.

Expected:

```text
Error Handler receives payload.
t28_errors/log task/Telegram path works.
Agregador run summary says degraded or partial.
```

- [ ] **Step 5: Check mojibake**

Run:

```powershell
rg -n "Ã|Â|â|�" C:\tmp\phi_repo_audit\tmp\audit_agregador_t28_after.json
```

Expected:

```text
No mojibake in edited node names, labels, or Portuguese messages.
```

---

### Task 10: Publish, commit e handoff

**Files/Surfaces:**
- Publish workflow `4sdG2UKMCBuFq8xn` only after smoke passes
- Publish sub-WF `rTS5pE34eElfuMPl` only if changed
- Modify: handoff doc under `docs/handoff/`

- [ ] **Step 1: Re-fetch version IDs**

Record:

```text
Agregador draft versionId
Agregador activeVersionId
Sub-WF Error Handler draft versionId
Sub-WF Error Handler activeVersionId
```

- [ ] **Step 2: Publish Agregador if production-ready**

Use `publish_workflow` for `4sdG2UKMCBuFq8xn`.

Expected:

```text
activeVersionId equals the tested draft versionId.
```

- [ ] **Step 3: Publish Error Handler only if changed**

If Task 4 changed sub-WF contract or internals, publish `rTS5pE34eElfuMPl`.

Expected:

```text
activeVersionId changes only if sub-WF changed.
```

- [ ] **Step 4: Commit repo docs/scripts**

Run:

```powershell
git -C C:\tmp\phi_repo_audit status --short
git -C C:\tmp\phi_repo_audit add docs/superpowers/plans/2026-06-27-agregador-t28-l2-hardening.md docs/handoff
git -C C:\tmp\phi_repo_audit commit -m "docs: plan agregador t28 l2 hardening"
```

Expected:

```text
Commit SHA produced.
```

- [ ] **Step 5: Final response format**

Return:

```text
SHA: <commit-sha>
Agregador draft versionId: <version-id>
Agregador activeVersionId: <version-id>
Sub-WF Error Handler draft versionId: <version-id>
Sub-WF Error Handler activeVersionId: <version-id>
Smoke executionId: <id>
Mojibake check: zero matches
```

---

## Risk Order

1. Fix Adaptador `.item.json` unsafe access first; it is the visible failure.
2. Fix multi-campaign attribution before trusting counts.
3. Add degraded-run signal before declaring handler behavior healthy.
4. Convert inserts to idempotent writes before scheduled production reruns.
5. Clean canvas only after functional smoke is green.

## Open Questions Before Execution

- Whether to implement BigQuery MERGE inside n8n BigQuery nodes directly or via staging/query nodes depends on current node schema validation.
- Whether hardcoded Google/Clarity tokens can be moved immediately depends on available n8n credentials in the project.
- Whether disabled AI/Meta legacy nodes should be removed now or preserved until L3 needs explicit confirmation if they are still connected to future work.

---

# Anexo — Análise Estratégica e Contribuições (Claude, 2026-06-27)

> Revisão do plano acima contra o estado **live** do workflow e o schema real.
> Veredito: **plano válido na premissa e no fix central (Task 2), mas com erros
> concretos, escopo inflado e uma lacuna arquitetural.** Recomendo reestruturar
> antes de executar.

## 1. Correção factual de base — a premissa do plano está CERTA (e eu estava errado)

Confirmei a execução `11655` via `get_execution` (includeData):

- `Adaptador Input T28`: `executionStatus: success`, mas **emitiu pelo error
  output** — `main[0]` (sucesso) = `[]` vazio; `main[1]` (erro) =
  `{"error":"Cannot read properties of undefined (reading 'json') [line 81]"}`.
- Fontes estruturais estavam OK: BQ Read trouxe linhas reais, `Set dados` e
  `Code prepara datas para extracao` com 2 itens cada.
- `lastNodeExecuted: [Err] Call Handler` → Error Handler capturou; n8n marcou a
  run inteira como `success`.

**Conclusão:** o rename (`extração`→`extracao`) resolveu o `Referenced node
doesn't exist`, mas **destravou um segundo bug** — leitura `.item.json` /
`.first().json` resolvendo `undefined`. **`t28_*` NÃO foi escrito em 11655.**
A run estava **degradada disfarçada de verde**. Minha leitura anterior
("pronto pro smoke / L2 fecha") estava incorreta — a Task 2 do plano ataca o
bug real.

## 2. O que o plano ACERTA (manter)

- **Task 2** — trocar `.item.json`/`.first().json`/`.all().map(i=>i.json)` por
  helpers sobre `.all()[0].json`. É o fix do bug live de 11655. Direção correta:
  `.all()` não depende da resolução de paired-item que está quebrando na
  topologia BQ Read→Adaptador.
- **Princípio ETL-puro da Camada 1** (Notion=contexto, raw_campaign_data
  preservado por Daily Entry/ADR-010, t28_* destino canônico) — alinhado com
  ADR-23 e a visão 4-camadas.
- **Respeita restrições do projeto**: não persistir Search Terms (D5), não
  ativar LLM/Orquestrador, não remover Loop legado, não trocar credencial sem
  pedido. ✅
- **Task 4 (sinal de execução degradada)** — ideia forte: ataca exatamente a
  armadilha de 11655 ("n8n success ≠ ETL success"). Vale manter (mesmo que
  simplificada).

## 3. ERROS CONCRETOS a corrigir no plano antes de executar

1. **Task 5 (MERGE) — schema incorreto.** O DDL de `t28_campaign` **não tem
   coluna `updated_at`** (o bloco audit usa `ingested_at TIMESTAMP`). E a
   cláusula `ON ... AND versao_contract_aplicada = S.versao_contract_aplicada`
   está **errada**: a chave de negócio é `(client_id, campaign_id,
   business_date, janela)` — exatamente o `PARTITION BY business_date CLUSTER BY
   client_id, janela`. Pôr `versao_contract_aplicada` na chave faz uma mudança
   de contrato gerar linha nova em vez de atualizar. Cada tabela T28 tem chave
   de negócio própria (ex.: `t28_gbp_daily` = `client_id, business_date,
   janela`, sem `campaign_id`).
2. **Task 2 Step 5 — JSON Pointer inválido.** `"path": "jsCode"` falha no
   `update_workflow`; o schema exige Pointer começando com `/` → **`"/jsCode"`**.
3. **Task 6 (volume_suficiente) — thresholds inventados.** O plano hardcoda
   `conversions >= 50 && ageDays <= 14`. O valor canônico é a **SOP
   "Critério Estatístico volume_suficiente v1.0" (Vigente)** — ler a SOP e
   espelhar, não chutar. Persistir `versao_sop_aplicada='volume_suficiente_v1.0'`
   (coluna já existe no DDL: `versao_sop_aplicada STRING NOT NULL`).
4. **Task 4 Step 4 já está feito.** `[Err] Call Handler` já tem
   `onError: continueRegularOutput` (fix R1/a05). Não é trabalho novo —
   é verificação.
5. **Ambiente/paths do plano não batem com este repo.** O plano assume Windows
   (`C:\tmp\phi_repo_audit`), scripts próprios (`fetch_workflow.py`,
   `extract_node_code.js`) e grava em `docs/superpowers/plans/...`. Aqui o
   ambiente é Linux remoto; usar as MCP tools n8n direto
   (`get_workflow_details`/`update_workflow`) e a convenção `docs/handoff/`.

## 4. LACUNA arquitetural — o plano trata sintoma, não a causa

A causa real de 11655 não é só "leitura insegura": é **granularidade de falha
all-or-nothing**. Hoje GBP/Clarity/GA4 são lidos via `readOrThrow` (estrutural
= fatal). Se o **GBP toma 429**, o `readOrThrow` derruba o Adaptador **inteiro**
→ nenhum `t28_*` é escrito, mesmo com BQ Read, GA4 e GAQL tendo retornado OK.
Uma fonte secundária flaky mata a agregação inteira da campanha.

**Reclassificação correta das fontes** (proposta):

| Fonte | Hoje | Deveria ser | Racional |
|---|---|---|---|
| `Set dados`, `Get database campanhas/clientes`, `Code ... extracao`, `[T28] BQ Read raw_campaign_data` | readOrThrow | **readOrThrow (fatal)** | Sem isso não existe `t28_campaign`. Correto. |
| `HTTP Request GBP` → `t28_gbp_daily` | readOrThrow | **safeOptional + status por fonte** | 429 transitório não deve matar `t28_campaign`. Degrada só `t28_gbp_daily`. |
| `HTTP Request Clarity` → `t28_clarity_daily` | readOrThrow | **safeOptional + status** | idem |
| `HTTP Request GA4 Org/Pago` → `t28_ga4_landing` | readOrThrow | **safeOptional + status** | idem |

Modelo-alvo: **cada fonte alimenta t28_* específicos; falha de fonte degrada só
os seus outputs + grava status por fonte em `source_status` (coluna JSON já
existe) e dispara o Error Handler como warn** — em vez de abortar tudo. Isso
torna a Task 4 (sinal degradado) consequência natural do design, não um node
extra solto. **Esta é a contribuição mais importante**: sem ela, a Task 2
sozinha só troca um "crash" por um "crash mais limpo" — a run ainda morre quando
o GBP espirra.

## 5. Reordenação de ESCOPO — 1 fix urgente, não 10 tasks

O plano mistura 1 correção bloqueante com um backlog de lotes distintos.
Proposta de fatiamento:

| Bloco | Tasks do plano | Lote | Prioridade |
|---|---|---|---|
| **Adaptador robusto + granularidade de falha** (Task 2 + §4 acima + Task 4 simplificado) | 2, 4 | **L2 (fecha aqui)** | 🔴 bloqueante — produção degradada hoje |
| **Idempotência BQ (MERGE/staging)** | 5 | **lote novo (L1.6)** | 🟠 alta — Schedule Triggers ativos = duplicação a cada run |
| **Contrato multi-campanha / campaign_id em adset** | 3 | lote novo | 🟡 média — plausível mas **não verificado** (t28_adset=0 nos smokes; PMAX). Precisa cliente com adset real. |
| **volume_suficiente vs SOP** | 6 | L2.5 | 🟡 média |
| **Credenciais expostas** | 7 | segurança (separado) | 🟠 — `google_developer_token` aparece **em claro** no `Set dados` (confirmado no dump de 11655); casa com o backlog de rotação já conhecido. Rotação precisa de você. |
| **Limpeza de canvas** (cadeia morta Merge1→Calculate KPIs) | 8 | L2.5 | 🟢 baixa |

**Por que `MERGE` vira urgente:** com L1.5 ativo, os Schedule Triggers
Semanal/Mensal disparam sozinhos. Inserts são append-only → cada run reescreve
as mesmas `(client_id, campaign_id, business_date, janela)` **duplicando**.
Os smokes contaram 12 mas nunca testaram **re-run idempotente**. Isso vai
inflar `t28_*` em produção. Vale tratar logo depois do L2.

## 6. Próximo passo recomendado

1. **Re-confirmar versionId live** antes de qualquer edit (11655 rodou no draft;
   o estado active/draft precisa ser relido).
2. **L2 cirúrgico**: aplicar Task 2 **junto com** a reclassificação de fontes
   (§4) — GBP/Clarity/GA4 viram `safeOptional` com status por fonte; só as 4
   fontes core ficam `readOrThrow`. Smoke deve voltar 12/0/2/1/1/0 e **sobreviver
   a um GBP 429** (degrada só `t28_gbp_daily`).
3. **Adiar** Tasks 3/5/6/7/8 para os lotes da tabela §5, cada um com seu brief.
4. **Não** executar o MERGE (Task 5) com o template atual — corrigir schema
   (`ingested_at`, chave sem `versao_contract`) primeiro.

> Resumo: o plano é um bom **backlog de hardening**, mas como "plano de correção
> do L2" ele precisa encolher para o bloco 🔴 + a granularidade de falha. O
> resto são lotes próprios.
