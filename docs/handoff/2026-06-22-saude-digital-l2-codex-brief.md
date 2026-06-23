# Brief Codex — Lote 2 Saúde Digital: Error Handler global

> **STATUS:** A executar. Aprovado por Olavo 2026-06-22 (D14/D17/D18 + Q1/Q2/Q3).
> ADR vigente: **Error Handler global da Operação Interna (onError +
> sub-WF dedicado + t28_errors)** — `Aceito` 2026-06-22, page
> [`388b65e5-c72b-8186-aed5-c5fafd65b5f8`](https://app.notion.com/p/388b65e5c72b8186aed5c5fafd65b5f8).
>
> **PRÉ-LEITURA OBRIGATÓRIA:**
> - `docs/strategic-planning/saude-digital/BRUTO-v0.1-arquitetura-saude-digital.md` (visão de 4 camadas)
> - `docs/strategic-planning/saude-digital/adr-rascunhos/ADR-26-error-handler-global.md` (decisão)
> - `docs/handoff/2026-06-21-agregador-t28-l1-codex-brief.md` (brief L1 — padrões de escrita e validação MCP que mantemos)
> - Aprendizado consolidado: **Notion native v2.2 substitui `$json` em update/create — consumers usam `.first()` ou `.all().find()` por chave de negócio**.

---

## 1. Contexto

L1.5 do Agregador T28 está **ATIVO em produção** desde 2026-06-22
(activeVersionId `d11e7959-ec07-4923-b711-2f05266ebdcc`). Schedule
Triggers Semanal e Mensal disparando automaticamente em `phi_prod`.

**O que está exposto sem Error Handler:**

1. Falhas em chamadas externas (Google Ads GAQL, GA4, GBP, Clarity,
   Meta, BQ Insert) ou são engolidas (`safe()` no Adaptador, `continueOnFail`)
   ou derrubam execução sem notificação.
2. O smoke L1 do T28 expôs concretamente: `safe()` mascarou bug de
   schema do BQ Read raw_campaign_data (`business_date` vs `date` real) →
   2 rows fantasmas com métricas zeradas → só foi detectado por inspeção
   visual. Repete-se silenciosamente em prod sem alertar.
3. Nenhuma tarefa automática é criada quando uma fonte cai. Loop
   ADR-22 fica aberto.

**O que o Lote 2 fecha:**

- Tabela `t28_errors` em BQ (histórico + SLA).
- Sub-WF `[Global] Error Handler` (recebe erros via Execute Workflow Trigger).
- `onError: continueErrorOutput` nos nodes críticos do Agregador T28 →
  error output conecta ao Error Handler.
- Refactor `safe()` no Adaptador Input T28: trocar por log+propagação
  nas fontes estruturais; manter `safe()` só nas opcionais.

**O que o L2 NÃO faz (decidido Q1/Q2/Q3):**

- Q1 (b): saneamento da dívida arquitetural (cadeia morta Merge1 →
  Calculate KPIs disabled) **fica para L2.5 separado**.
- Q2 (a): `Loop` legado **mantido** (pode ser reusado).
- Q3 (b): política anti-spam (dedup, agrupamento) **fica para L2.5+**
  — por ora cria tarefa sempre que erro ocorrer.

---

## 2. Escopo cirúrgico (4 frentes)

| Frente | Entrega |
|---|---|
| **F1** | DDL `t28_errors` em **phi_dev** + **phi_prod** (idêntico ao padrão das outras 6 tabelas T28) |
| **F2** | Sub-WF `WF-T28-Error-Handler` (Execute Workflow Trigger → grava t28_errors + cria tarefa Notion + Telegram) |
| **F3** | `onError: continueErrorOutput` + reconexão dos error outputs nos 11 nodes críticos do Agregador T28 (`4sdG2UKMCBuFq8xn`) |
| **F4** | Refactor `safe()` no Adaptador Input T28: log+propagação nas fontes estruturais, `safe()` mantido nas opcionais |

---

## 3. F1 — DDL `t28_errors`

Criar **2 arquivos novos** seguindo o padrão de `phi_dev_t28_tables.sql` / `phi_prod_t28_tables.sql`:

- `docs/strategic-planning/agregador-t28/ddl/phi_dev_t28_errors.sql`
- `docs/strategic-planning/agregador-t28/ddl/phi_prod_t28_errors.sql`

Schema (mesmo nas 2 versões, só trocando dataset):

```sql
-- ============================================================================
-- DDL Agregador T28 — t28_errors (Error Handler global) — DATASET phi_dev
-- ============================================================================
-- ADR: "Error Handler global da Operação Interna" (Aceito 2026-06-22,
--      page 388b65e5-c72b-8186-aed5-c5fafd65b5f8)
-- Lote: L2 Error Handler global
-- ============================================================================

CREATE TABLE IF NOT EXISTS `phi_dev.t28_errors` (
  -- chave
  error_id           STRING    NOT NULL,
  -- correlação
  execution_id       STRING,                -- execution_id do WF que falhou (ADR-009)
  workflow_id        STRING    NOT NULL,
  workflow_name      STRING    NOT NULL,
  node_name          STRING    NOT NULL,
  source             STRING,                -- 'google_ads' | 'ga4' | 'gbp' | 'clarity' | 'meta' | 'bq' | 'notion' | 'telegram' | 'other'
  -- classificação
  severity           STRING    NOT NULL,    -- 'warn' | 'error' | 'critical'
  -- detalhes
  error_message      STRING,
  error_details      JSON,                  -- payload original do node + stack (quando disponível)
  -- contexto de negócio (quando aplicável)
  client_id          STRING,
  business_date      DATE,
  -- ciclo de vida
  occurred_at        TIMESTAMP NOT NULL,
  resolved           BOOL                   -- nullable: null = aberto; true/false = resolvido pela operação
)
PARTITION BY DATE(occurred_at)
CLUSTER BY workflow_id, severity;
```

Não criar VIEW agora — D-1/D-3 aplicam-se a métricas operacionais, não a
erros. Se aparecer dashboard de erros futuro, abrir ADR adicional.

---

## 4. F2 — Sub-WF `WF-T28-Error-Handler`

**Padrão de gerador:** seguir a estrutura dos workflows do Lote 1
Execução (HTTP Notion native v2.2 + ADR-19 build-time injection).

Diretório novo: `workflows/wf-t28-error-handler/` (irmão dos
`workflows/wf-exec-*` já existentes). Contém:

- `generate_export.js` (SDK n8n)
- `workflow.json` (sandbox)
- `sandbox_export.json` (idem ao workflow.json para diff humano)

### 4.1. Trigger

Execute Workflow Trigger. Payload de entrada esperado:

```json
{
  "workflow_id": "4sdG2UKMCBuFq8xn",
  "workflow_name": "PHI — Agregador de Métricas Multi-fonte",
  "node_name": "[T28] BQ Read raw_campaign_data",
  "source": "bq",
  "severity": "error",
  "error_message": "Unrecognized name: business_date at [10:7]",
  "error_details": { "errorCode": "INVALID_QUERY", "rawError": "..." },
  "client_id": "CLI-4",
  "business_date": "2026-06-21",
  "execution_id": "EXEC-T28-9919"
}
```

### 4.2. Nodes (ordem + objetivo)

1. **`[ErrHdl] Execute Workflow Trigger`** — input do sub-WF.

2. **`[ErrHdl] Set Contexto`** — enriquece o payload com:
   - `error_id` = `crypto.randomUUID()` (Code node helper) ou
     `=${EXEC-ERRHDL-${$execution.id}-${$itemIndex}}` se randomUUID indisponível
   - `occurred_at` = `={{ $now.toISO() }}` (UTC)
   - `severity_normalized` = lower-case
   - `resolved` = `null` (sentinel: aberto)

3. **`[ErrHdl] BQ Insert t28_errors`** — gravar 1 linha em
   `phi_prod.t28_errors`. Operation: `insert`. Batch size 1.
   Campos mapeados do Set Contexto + payload original.

   Importante: dataset hardcoded `phi_prod` (Olavo confirmou no L1.5 que
   self-hosted bloqueia `$env`). Se quiser sandbox depois, abrir tarefa
   pra solução `$vars`/whitelist env.

4. **`[ErrHdl] Notion Criar Tarefa Demanda`** — Notion native v2.2.
   - Database: `PHI - Demandas` (Codex deve buscar dataSourceId via
     `notion-search` no momento da execução; previsivelmente
     `cd1ab757-...` per v0.1.10 do ESTADO).
   - Properties (verificar schema via `notion-fetch` antes):
     - `Título` = `[ERR] {{node_name}} ({{source}}): {{error_message slice 0..60}}`
     - `Status` = `Triagem` (ou primeiro valor válido do select)
     - `Origem` = `Sistema` ou similar (verificar opções reais)
     - `Prioridade` / `Urgência` = mapear severity → option do select:
       - `critical` → `Alta` / `Urgente`
       - `error` → `Média` / `Normal`
       - `warn` → `Baixa`
     - `execution_id` (rich_text) = payload
     - `error_id` (rich_text) = do Set Contexto
   - Body: bloco de código com `error_details` JSON formatado.

5. **`[ErrHdl] Telegram Notificar`** — HTML formatado:
   ```
   🚨 <b>{severity}</b> — {workflow_name}
   Node: <code>{node_name}</code>
   Source: {source}
   Cliente: {client_id} ({business_date})
   Erro: <code>{error_message slice 0..200}</code>
   ID: {error_id}
   Tarefa: <a href="...">Abrir no Notion</a>
   ```
   - Credencial Telegram per ADR-19 (`fromEnvOrRedacted('TELEGRAM_CRED_ID', '...')`).
   - chat_id idem (`fromEnvOrRedacted('TELEGRAM_CHAT_ID', '...')`).
   - `continueOnFail: true` — falhar Telegram NÃO deve mascarar o erro original.

### 4.3. Settings do sub-WF

- `name`: `WF-T28-Error-Handler`
- `active`: `false` no commit; ativar via `publish_workflow` após pré-revisão
- `description`: "Sub-WF acionado via onError dos nodes críticos. Grava t28_errors + cria tarefa Demanda + Telegram. ADR Aceito 2026-06-22."

---

## 5. F3 — `onError` + reconexões no Agregador T28

WorkflowId: `4sdG2UKMCBuFq8xn` (versionId atual a confirmar com
`get_workflow_details` antes de aplicar — após o publish, é o
activeVersionId `d11e7959-ec07-4923-b711-2f05266ebdcc`).

### 5.1. Lista de nodes críticos (11)

| # | Node | Fonte/severity default |
|---|---|---|
| 1 | `[T28] BQ Read raw_campaign_data` | bq / error |
| 2 | `[T28] BQ Insert t28_campaign` | bq / error |
| 3 | `[T28] BQ Insert t28_adset` | bq / error |
| 4 | `[T28] BQ Insert t28_ga4_landing` | bq / error |
| 5 | `[T28] BQ Insert t28_gbp_daily` | bq / error |
| 6 | `[T28] BQ Insert t28_clarity_daily` | bq / error |
| 7 | `[T28] BQ Insert t28_meta_campaign` | bq / error |
| 8 | `HTTP Request GA4 Orgânico` | ga4 / error |
| 9 | `HTTP Request GA4 Pago (LPs)` | ga4 / error |
| 10 | `HTTP Request GBP` | gbp / error |
| 11 | `HTTP Request Clarity` | clarity / error |
| 12 | `Google Ads Conjuntos (GAQL)` | google_ads / error |
| 13 | `Google Ads Anúncios (GAQL)` | google_ads / error |

**Excluídos da F3 nesta rodada:**
- `Fetch Meta Ads` — já está `disabled`; quando reativar, adicionar onError ao mesmo tempo.
- Nodes Notion `Get database *`, `Set dados`, `Code prepara datas` — usam dados internos, sem falha estrutural.
- `Adaptador Input T28`, `Normalizador T28`, `[T28] Search Terms Features`,
  6× `[T28] Filter`, 6× `[T28] Strip` — Code/Filter sem fonte externa.

### 5.2. Aplicação via MCP `update_workflow`

Para cada node crítico (13 total):

```ts
{
  type: "setNodeSettings",
  nodeName: "<nome>",
  settings: { onError: "continueErrorOutput" }
}
```

E **2 conexões novas** por node:

```ts
// (1) adiciona node intermediário [Err] Build Payload (Set, 1 por critical)
{ type: "addNode", node: { name: "[Err Payload] <node-name>", type: "n8n-nodes-base.set", typeVersion: 3.4, position: [..., ...], parameters: { assignments: { ... } } } }

// (2) error output do node crítico → Build Payload
{ type: "addConnection", connectionType: "main", source: "<node>", sourceIndex: 1, target: "[Err Payload] <node-name>", targetIndex: 0 }

// (3) Build Payload → Execute Workflow (calling WF-T28-Error-Handler)
{ type: "addConnection", source: "[Err Payload] <node-name>", target: "[Err] Call Handler", targetIndex: 0 }
```

**Simplificação de design** (recomendada, valida primeiro com Olavo se
o pacote ficar grande): em vez de 13 Set nodes diferentes, criar **1
único** `[Err] Roteador Payload` (Code node) que recebe items de
todos os 13 error outputs e identifica o source/severity pela presença
de chaves específicas (`$node.name` disponível no Code? Ou recebe via
metadata?). Depois 1 único `[Err] Call Handler` (Execute Workflow).

Custo: tem que ler `$json` + saber qual node emitiu. Em n8n, items que
chegam via error output preservam `$json` original + adicionam
`$node.error.json` ou similar. Validar via `validate_node_config` antes
de assumir.

**Recomendação para a primeira iteração:** Codex implementa 1 par
(`[Err] Build Payload Unified` + `[Err] Call Handler`), com `Set` ou
`Code` no payload que detecta source pelo `$node.name`. Se em smoke
ficar inviável, reverte para N pares.

### 5.3. Payload do Execute Workflow → sub-WF Error Handler

O `[Err] Call Handler` é um node `n8n-nodes-base.executeWorkflow`
apontando para `WF-T28-Error-Handler`. Payload:

```json
{
  "workflow_id": "{{ $workflow.id }}",
  "workflow_name": "{{ $workflow.name }}",
  "node_name": "<source node>",
  "source": "<inferido do nome>",
  "severity": "error",  // default; warn/critical via mapeamento futuro
  "error_message": "{{ $json.error?.message ?? 'unknown' }}",
  "error_details": "{{ $json }}",
  "client_id": "{{ $('Set dados').first().json?.id_client ?? null }}",
  "business_date": "{{ $('Code prepara datas para extração').first().json?.date_end ?? null }}",
  "execution_id": "EXEC-T28-{{ $execution.id }}"
}
```

---

## 6. F4 — Refactor `safe()` no Adaptador Input T28

Arquivo do node (jsCode do `Adaptador Input T28` no WF
`4sdG2UKMCBuFq8xn`): substituir o padrão `safe(() => ..., default)` em
fontes **estruturais** por:

```javascript
function readOrThrow(label, fn) {
  try {
    const v = fn();
    if (v === null || v === undefined) {
      throw new Error(`[T28-ADAPTADOR] fonte estrutural ausente: ${label}`);
    }
    return v;
  } catch (e) {
    throw new Error(`[T28-ADAPTADOR] falha lendo ${label}: ${e.message}`);
  }
}
```

E para **opcionais**, manter `safe()` (renomear para `safeOptional()`
para deixar a intenção visível):

```javascript
function safeOptional(label, fn, defaultValue = null) {
  try {
    return fn() ?? defaultValue;
  } catch (e) {
    console.log(`[T28-ADAPTADOR] opcional ${label} ausente: ${e.message}`);
    return defaultValue;
  }
}
```

### 6.1. Classificação (estrutural vs opcional)

| Fonte (lookup no jsCode) | Hoje | Nova classificação |
|---|---|---|
| `$('Set dados').item.json` | safe | **Estrutural** → readOrThrow |
| `$('Get database campanhas').item.json.properties` | safe | **Estrutural** → readOrThrow |
| `$('Get database clientes').item.json.properties` | safe | **Estrutural** → readOrThrow |
| `$('Code prepara datas para extração').item.json` | safe | **Estrutural** → readOrThrow |
| `$('Get database conjuntos').all()` | safe → [] | Opcional (cliente pode não ter) → safeOptional |
| `$('Get database anuncios').all()` | safe → [] | Opcional (idem) → safeOptional |
| `$('[T28] BQ Read raw_campaign_data').all()` | safe → [] | **Estrutural** → readOrThrow (a propósito! era o bug do L1) |
| `$('Google Ads Conjuntos (GAQL)').first()` | safe → null | Opcional (PMAX não tem adset) → safeOptional |
| `$('Google Ads Anúncios (GAQL)').first()` | safe → null | Opcional → safeOptional |
| `$('HTTP Request GA4 Orgânico').first()` | safe → null | **Estrutural** → readOrThrow |
| `$('HTTP Request GA4 Pago (LPs)').first()` | safe → null | **Estrutural** → readOrThrow |
| `$('HTTP Request GBP').first()` | safe → {} | **Estrutural** → readOrThrow |
| `$('HTTP Request Clarity').first()` | safe → {} | **Estrutural** → readOrThrow |
| `$('Fetch Meta Ads').first()` | safe → [] | Opcional (cliente pode não ter Meta) → safeOptional |
| `$('[T28] Search Terms Features').first()` | safe → {} | Opcional (placeholder hoje) → safeOptional |

**Implicação:** se o Codex marcar estrutural mas o cliente piloto não
tiver a fonte (ex: GA4 Pago zerado), o Adaptador falha. Compensa via
`onError: continueErrorOutput` no Adaptador → cai no Error Handler →
operacional descobre antes do dado mentir.

### 6.2. Adaptador também ganha `onError`

Adicionar `onError: continueErrorOutput` ao `Adaptador Input T28` e ao
`Normalizador T28`. Conectar error outputs ao `[Err] Roteador Payload`
do F3 (reuso).

---

## 7. Smoke L2 (validação real)

### 7.1. Smoke "feliz"

Disparar `Execute Workflow` manual no Agregador T28 com CLI-4 piloto.
Confirmar:

- 6 BQ Inserts t28_* gravam normalmente (mesmo padrão do L1.5: 12/0/2/1/1/0).
- **t28_errors permanece vazio** para essa execução (sem erros).

### 7.2. Smoke "triste" (erro proposital)

Reproduzir o bug do L1 propositalmente para validar o caminho de erro:

**Cenário 1: BQ Read com schema mismatch.** Temporariamente editar o
sqlQuery do `[T28] BQ Read raw_campaign_data` para referenciar coluna
inexistente (ex: `business_date_fake`). Disparar. Esperado:

- BQ Read falha → error output ativa.
- `[Err] Roteador Payload` enriquece com `source='bq'`, `severity='error'`.
- `[Err] Call Handler` invoca `WF-T28-Error-Handler`.
- **1 row em `phi_prod.t28_errors`** com:
  - `node_name = '[T28] BQ Read raw_campaign_data'`
  - `severity = 'error'`
  - `error_message LIKE '%Unrecognized name%'`
  - `client_id = 'CLI-4'`
- **1 página criada no DB `PHI - Demandas`** com título `[ERR] ...`.
- **1 mensagem no Telegram** com link da tarefa.
- Demais nodes downstream do BQ Read NÃO disparam (não há fallback
  fantasma).

Após smoke verde, **reverter o sqlQuery** para a versão correta.

**Cenário 2: HTTP GBP credencial fake.** Trocar credencial GBP por
inválida. Disparar. Esperado mesmo padrão, com `source='gbp'`.

### 7.3. Validação SQL

```sql
-- erros gravados na última hora
SELECT
  occurred_at, workflow_name, node_name, source, severity,
  SUBSTR(error_message, 1, 100) AS msg,
  client_id, execution_id
FROM `phi_prod.t28_errors`
WHERE occurred_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
ORDER BY occurred_at DESC;

-- counts por severity (últimas 24h)
SELECT severity, COUNT(*) c
FROM `phi_prod.t28_errors`
WHERE occurred_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY severity;
```

---

## 8. Validação MCP (pré-revisão)

Antes do smoke real, Codex deve:

1. `validate_node_config` em cada node novo do sub-WF Error Handler.
2. `validate_workflow` no JSON completo do sub-WF.
3. `get_workflow_details` no `4sdG2UKMCBuFq8xn` pós-edit. Verificar:
   - 13 nodes com `settings.onError === 'continueErrorOutput'`.
   - 13 conexões `sourceIndex=1` para o `[Err] Roteador Payload`.
   - `[Err] Roteador Payload` → `[Err] Call Handler`.
   - `[Err] Call Handler` é `n8n-nodes-base.executeWorkflow` apontando para o sub-WF criado.
   - nodeCount esperado: 61 (antes) + ~3 (Roteador + Call Handler + opcional Set) = ~64.

---

## 9. Entrega esperada (commit + push)

Branch: `claude/agentic-agency-planning-KwJEw` (mesma do projeto).

Commit único (recomendado) com:

- 2 arquivos DDL novos: `docs/strategic-planning/agregador-t28/ddl/phi_dev_t28_errors.sql`, `phi_prod_t28_errors.sql`
- Diretório novo: `workflows/wf-t28-error-handler/` (generate_export.js, workflow.json, sandbox_export.json)
- (Opcional) `workflow_live.json` ignorado por `.gitignore`
- `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md` com:
  - SHA do commit
  - workflowId do sub-WF criado
  - versionId pós-edit do `4sdG2UKMCBuFq8xn`
  - resultado das validações MCP
  - resultado do smoke real (links/IDs)
  - 2 warnings registrados (qualquer falso positivo do validador, como o
    do BQ Read sqlQuery+namedParameters do L1)

Mensagem de commit (template):

```
feat(saude-digital-l2): Error Handler global + DDL t28_errors + onError nos 13 nodes críticos

ADR Aceito 2026-06-22 (page 388b65e5...b5f8). Implementa F1-F4: DDL
t28_errors (phi_dev + phi_prod), sub-WF WF-T28-Error-Handler (Execute
Workflow Trigger → BQ Insert + Notion tarefa + Telegram), onError
continueErrorOutput nos 13 nodes críticos do Agregador T28, refactor
safe() no Adaptador para readOrThrow nas fontes estruturais. Smoke real
green (caminho feliz + caminho triste com erro proposital). Saneamento
da dívida arquitetural Merge1->cadeia morta fica para L2.5 separado
(Q1=b).
```

---

## 10. Pré-revisão Claude — checklist (o que vou validar antes de aprovar)

| # | Critério | Como verificar |
|---|---|---|
| 1 | Os 2 DDLs t28_errors são idênticos exceto pelo dataset | `diff` + `grep -c phi_dev` em ambos |
| 2 | Sub-WF gera workflow.json sanitizado (per ADR-19) | inspeção do generate_export.js + grep credenciais |
| 3 | sub-WF tem `Execute Workflow Trigger` como trigger único | get_workflow_details |
| 4 | sub-WF NÃO grava em `phi_dev` por engano | inspeção do parameter datasetId |
| 5 | sub-WF cria tarefa no `PHI - Demandas` real (dataSourceId confirmado) | notion-search + notion-fetch validados |
| 6 | Os 13 nodes do Agregador T28 têm `onError: continueErrorOutput` | get_workflow_details + jq filter |
| 7 | Há **1 só** `[Err] Roteador Payload` e **1 só** `[Err] Call Handler` (não 13 cópias) | get_workflow_details |
| 8 | Adaptador Input T28 substitui `safe()` por `readOrThrow` nas estruturais | jsCode diff |
| 9 | Telegram tem `continueOnFail: true` (falhar Telegram NÃO deve abortar handler) | inspeção |
| 10 | versionId pós-edit do `4sdG2UKMCBuFq8xn` registrado no execution log | execution log |
| 11 | Smoke real verde nos 2 cenários (feliz + triste) com counts esperados | SQL queries do §7.3 |
| 12 | Cliente piloto CLI-4 sem regressão no L1.5 (12/0/2/1/1/0) | mesma query do L1.5 |

Após pré-revisão verde, eu publico o sub-WF (`publish_workflow`) e
ativo o `4sdG2UKMCBuFq8xn` em prod com o Error Handler ligado.

---

## 11. Decisões pendentes para o Codex (resolver durante o trabalho)

| # | Decisão | Default |
|---|---|---|
| C1 | Layout do Roteador Payload — 1 Code unificado vs 13 Set diferentes | **1 Code unificado** (mais limpo); reverter se `validate_node_config` falhar |
| C2 | dataSourceId do `PHI - Demandas` (verificar antes) | Buscar via `notion-search` + `notion-fetch` |
| C3 | Schema exato de properties do `PHI - Demandas` (Status, Prioridade) | Buscar via `notion-fetch`; usar primeiros valores válidos se nomes não baterem; reportar no execution log |
| C4 | Posição (`x,y`) dos nodes novos no canvas | Estética; agrupar abaixo dos BQ Inserts |
| C5 | Se `Set Contexto` precisar UUID, usar `crypto.randomUUID()` via Code | Default; se Set node não suportar, gerar via Code node intermediário |

Para qualquer ponto não trivial fora destes, **abrir comentário no
execution log** em vez de decidir sozinho.

---

## 12. O que NÃO está no escopo (e o que será L2.5)

- ❌ Deletar cadeia morta `Merge1 → Calculate KPIs (off) → AI Agent (off) → Prepare Report Data2 (off) → Switch (off)` → **L2.5**
- ❌ Refactor Adaptador para consumir Merge1 via conexão explícita (em vez de `$('node').first()`) → **L2.5**
- ❌ Política anti-spam (dedup, agrupamento, threshold por janela) → **L2.5+**
- ❌ Dashboard de erros web → **L4+ ou ADR futuro**
- ❌ Error Workflow nativo do n8n (Settings → Error Workflow) → **L2.5+ como rede de segurança complementar**
- ❌ Ativar `Fetch Meta Ads` com onError → **quando cliente piloto Meta entrar**

---

**Fim do brief.** Quando Codex terminar, manda execution log + SHA do commit + IDs do sub-WF / activeVersionId pós-edit pra Olavo, que eu faço a pré-revisão.
