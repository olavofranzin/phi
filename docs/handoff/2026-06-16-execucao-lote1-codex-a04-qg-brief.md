# Brief Codex — Execução Lote 1 `a04-qg` (refactor HTTP Notion → Notion native, **só QualityGate**)

> **Escopo reduzido.** O brief `a04 v2` (2026-06-15) refatorava os 3 workflows (Intake + Orquestrador + QualityGate) de uma vez. Este `a04-qg` faz **só o WF-EXEC-QualityGate-Pacing** primeiro — piloto isolado pra validar abordagem antes de propagar pros outros 2.
>
> **Intake e Orquestrador NÃO devem ser tocados nesta entrega.** Ficam pra `a04-intake` e `a04-orq` em entregas separadas.

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `a04-qg` da Execução Lote 1 — eliminar **5 HTTP Request direta ao Notion no WF-EXEC-QualityGate-Pacing** substituindo por `n8n-nodes-base.notion` v2.2.

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** HEAD mais novo (`git fetch origin claude/agentic-agency-planning-KwJEw` antes)
- **Arquivos a tocar:** SÓ `onboarding/execucao/lote1/qualitygate-pacing/{workflow.json,sandbox_export.json}` + `onboarding/execucao/lote1/generate_export.js` (apenas a parte do QG) + `onboarding/execucao_lote1_tests.ps1` (apenas checks do QG).
- **Arquivos a NÃO tocar:** `onboarding/execucao/lote1/intake-pacing/**`, `onboarding/execucao/lote1/orquestrador/**`.

Os HTTPs `POST /v1/pages` e `PATCH /v1/pages/{id}` com `Notion-Version: 2022-06-28` esperam **page_id** em `parent.database_id`, mas hoje os jsCodes upstream do QG montam `event_body.parent.database_id = '3423df0d-...'` (data_source_id de PHI - Eventos, retornado pelo MCP Notion na criação). Mesma classe de bug que motivou o refactor — eliminar os HTTPs resolve.

`n8n-nodes-base.notion` v2.2 trata data_source_id ↔ page_id internamente, dispensa `Notion-Version` no node e usa credencial via `credentials.notionApi` (mesma forma que os HTTPs já fazem com `authentication: predefinedCredentialType`).

## Mapa exato dos 5 HTTPs no QG

| # | Node atual (id / name) | Tipo HTTP hoje | Substituir por |
|---|---|---|---|
| 1 | `exec-qg-event-revisao` — `[Exec QG] Criar Evento demanda.em_revisao` | POST /v1/pages | Notion `databasePage.create` em **PHI - Eventos** |
| 2 | `exec-qg-entregue` — `[Exec QG] Marcar Entregue` | PATCH /v1/pages/{id} | Notion `databasePage.update` |
| 3 | `exec-qg-event-entregue` — `[Exec QG] Criar Evento demanda.entregue` | POST /v1/pages | Notion `databasePage.create` em **PHI - Eventos** |
| 4 | `exec-qg-reabrir` — `[Exec QG] Reabrir Demanda` | PATCH /v1/pages/{id} | Notion `databasePage.update` |
| 5 | `exec-qg-event-reaberta` — `[Exec QG] Criar Evento demanda.reaberta` | POST /v1/pages | Notion `databasePage.create` em **PHI - Eventos** |

Preservar `id`, `name` e `position` dos 5 nodes. Só o `type`/`typeVersion`/`parameters`/`credentials` mudam.

## UUIDs e nomes dos DBs

| DB | UUID page_id (Notion native v2.2 expects) | `cachedResultName` |
|---|---|---|
| PHI - Eventos | `c64f600e-4f46-4b2b-ac22-c1e425c8966e` | `PHI - Eventos` |
| PHI - Demandas (update via `pageId` = `$json.demanda_id`) | n/a — `pageId.value` vem do payload | n/a |

**Importante:** `Buscar SOP Vigente` (id `exec-qg-sop`) e `Buscar Demandas Em Revisao` (id `exec-qg-revisao`) **NÃO devem ser tocados** — já são Notion native funcionando. Os `databaseId.value` deles (`bfeb1105-...` e `cd1ab757-...`) são data_source_ids e funcionam porque n8n converte internamente.

## Template — substituir HTTP POST por Notion `databasePage.create` (Eventos)

```js
{
  id: '<manter id atual: exec-qg-event-revisao | exec-qg-event-entregue | exec-qg-event-reaberta>',
  name: '<manter name atual>',
  type: 'n8n-nodes-base.notion',
  typeVersion: 2.2,
  position: [<mesma posição>],
  parameters: {
    resource: 'databasePage',
    operation: 'create',
    databaseId: {
      __rl: true,
      mode: 'list',
      value: 'c64f600e-4f46-4b2b-ac22-c1e425c8966e',
      cachedResultName: 'PHI - Eventos',
    },
    simple: false,
    propertiesUi: {
      propertyValues: [
        { key: 'tipo|title',                type: 'title',     title:       '={{ $json.evento_tipo }}' },
        { key: 'entidade_id|rich_text',     type: 'rich_text', textContent: '={{ $json.entidade_id }}' },
        { key: 'entidade_area|select',      type: 'select',    selectValue: 'Execucao' },
        { key: 'payload_json|rich_text',    type: 'rich_text', textContent: '={{ $json.payload_json }}' },
        { key: 'timestamp|date',            type: 'date',      date:        '={{ $json.timestamp }}' },
        { key: 'execution_id|rich_text',    type: 'rich_text', textContent: '={{ $json.execution_id }}' },
        { key: 'tenant_id|rich_text',       type: 'rich_text', textContent: '={{ $json.tenant_id }}' },
        { key: 'tier_agente|select',        type: 'select',    selectValue: '={{ $json.tier_agente }}' },
        { key: 'versao_sop_aplicada|rich_text', type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' },
      ],
    },
  },
  credentials: {
    notionApi: { id: '<credential_id_redacted>', name: 'Notion account' },
  },
}
```

## Template — substituir HTTP PATCH por Notion `databasePage.update` (Demandas)

```js
{
  id: '<manter id atual: exec-qg-entregue | exec-qg-reabrir>',
  name: '<manter name atual>',
  type: 'n8n-nodes-base.notion',
  typeVersion: 2.2,
  position: [<mesma posição>],
  parameters: {
    resource: 'databasePage',
    operation: 'update',
    pageId: {
      __rl: true,
      mode: 'id',
      value: '={{ $json.demanda_id }}',
    },
    simple: false,
    propertiesUi: {
      propertyValues: [
        { key: 'estado|select',                 type: 'select',    selectValue: '={{ $json.novo_estado }}' },
        { key: 'quality_gate|select',           type: 'select',    selectValue: '={{ $json.quality_gate }}' },
        { key: 'versao_sop_aplicada|rich_text', type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' },
      ],
    },
  },
  credentials: {
    notionApi: { id: '<credential_id_redacted>', name: 'Notion account' },
  },
}
```

**Nota:** o `Marcar Entregue` muda `estado='Entregue'`+`quality_gate='pass'`; o `Reabrir Demanda` muda `estado='Em execucao'`+`quality_gate='fail'`. A diferenciação vem via `$json.novo_estado` / `$json.quality_gate` produzidos pelo Code upstream (`[Exec QG] Validar DoD Pacing Flash`).

## Refactor dos 2 Code nodes upstream

Os Code nodes que hoje produzem `event_body` e `update_body` precisam **passar a produzir os campos avulsos** que os expressions acima referenciam.

### `[Exec QG] Montar Evento demanda.em_revisao` (id `exec-qg-event-revisao-body`)

**Antes:** retorna `{ json: { ...page, event_body: eventBody(event) } }`.

**Depois:** retorna `{ json: { ...page, evento_tipo: 'demanda.em_revisao', entidade_id, entidade_area: 'Execucao', payload_json: JSON.stringify(payload), timestamp, execution_id, tenant_id, tier_agente: 'flash', versao_sop_aplicada } }`. Remover a função `eventBody()` deste node — não vai mais ser usada aqui.

Preservar `pickTitle`, `pickText`, `pickSelect`, `sopFromItems`, `execId`, `utcNow`, `compactJson`. Preservar todo o cálculo de `payload` e `event` (só pare de embrulhar em `event_body`).

### `[Exec QG] Validar DoD Pacing Flash` (id `exec-qg-validar`)

**Antes:** ramos PASS/FAIL retornam `{ demanda_id, quality_gate, update_body, event_body, text }`.

**Depois:** ramos PASS/FAIL retornam `{ demanda_id, quality_gate, novo_estado, versao_sop_aplicada, evento_tipo, entidade_id, entidade_area: 'Execucao', payload_json, timestamp, execution_id, tenant_id, tier_agente: 'flash', text }`.

Especificamente:
- **PASS:** `novo_estado='Entregue'`, `quality_gate='pass'`, `evento_tipo='demanda.entregue'`, `entidade_id=demanda_id`, `payload_json=JSON.stringify(basePayload)`.
- **FAIL:** `novo_estado='Em execucao'`, `quality_gate='fail'`, `evento_tipo='demanda.reaberta'`, `entidade_id=demanda_id`, `payload_json=JSON.stringify({...basePayload, missing})`. Manter o `text` HTML-escapado pro Telegram.

Remover as funções `eventBody()` e o uso de `update_body` neste node. Preservar `checklist`, `pickTitle`/`pickText`/`pickSelect`, `sopFromItems`, cálculo de `missing`/`hasDiagnostico`/etc.

### `[Exec QG] Restaurar Payload DoD` (id `exec-qg-restaurar`)

**Não tocar.** Já faz `return $('[Exec QG] Validar DoD Pacing Flash').all().map((item) => ({ json: item.json }))` — continua válido com a nova forma.

## Constantes em `generate_export.js`

Reorganizar **apenas a parte que monta o QG**. Adicionar (se ainda não existirem):

```js
const DB_EVENTOS_PAGE = 'c64f600e-4f46-4b2b-ac22-c1e425c8966e';
const DB_EVENTOS_NAME = 'PHI - Eventos';
```

`DB_DEMANDAS` antigo (data_source_id `cd1ab757-...`) usado em `Buscar Demandas Em Revisao` — manter, esse node funciona. Não criar `DB_DEMANDAS_PAGE` ainda (vai ser usado no `a04-intake`/`a04-orq` quando refatorar `Criar Demanda` e `Atualizar Demanda Priorizada`).

**Importante:** Intake e Orquestrador continuam gerando HTTPs como hoje. `generate_export.js` deve produzir o QG refatorado e os outros 2 INALTERADOS.

## NÃO fazer

- ❌ Não tocar nodes do Intake (`onboarding/execucao/lote1/intake-pacing/`)
- ❌ Não tocar nodes do Orquestrador (`onboarding/execucao/lote1/orquestrador/`)
- ❌ Não tocar `Schedule 5 min`, `Buscar SOP Vigente`, `Buscar Demandas Em Revisao`, `Gemini Flash DoD Pacing`, `Resultado PASS?` (IF), `Restaurar Payload DoD`, `Telegram Checklist FAIL` — preservar byte-a-byte
- ❌ Não introduzir `Notion-Version` headers em lugar nenhum
- ❌ Não mudar a topologia (`connections`) — só os 5 nodes mudam internamente, wiring inalterado
- ❌ Não criar credencial Notion nova — `id: '<credential_id_redacted>'` é placeholder (Olavo configura no n8n)
- ❌ Não tocar `EXEC_WEBHOOK_KEY` / ADR-19 (escopo dele é Intake, fora desta entrega)
- ❌ Não mudar `active: false` nem `timezone` nem prefixos de node

## ps1 — checks novos

Adicionar em `onboarding/execucao_lote1_tests.ps1` (bloco escopado ao QG):

```powershell
$qgWf = Join-Path $repoRoot 'onboarding\execucao\lote1\qualitygate-pacing\workflow.json'
$rawQg = [System.IO.File]::ReadAllText($qgWf, [System.Text.Encoding]::UTF8)
$wfQg = $rawQg | ConvertFrom-Json

# 0 HTTP Request pra api.notion.com no QG
$httpNotion = $wfQg.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.httpRequest' -and
  $_.parameters.url -is [string] -and
  $_.parameters.url.Contains('api.notion.com')
}
if ($httpNotion) { throw "qualitygate-pacing/workflow.json still has HTTP Request to api.notion.com (a04-qg refactor incomplete)" }

# 5 nodes Notion novos com create/update + databaseId/pageId Resource Locator valido
$notionCreate = $wfQg.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'create'
}
foreach ($n in $notionCreate) {
  $dbVal = $n.parameters.databaseId.value
  if (-not ($dbVal -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')) {
    throw "QG Notion node '$($n.name)' databaseId.value not UUID: $dbVal"
  }
  if ($dbVal -eq '3423df0d-77df-4834-bdda-c08ddbae40ff') {
    throw "QG Notion '$($n.name)' uses Eventos data_source_id ($dbVal) instead of page_id (c64f600e-...)"
  }
}

$notionUpdate = $wfQg.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'update'
}
foreach ($n in $notionUpdate) {
  if (-not $n.parameters.pageId)        { throw "QG Notion update '$($n.name)' missing pageId" }
  if ($n.parameters.pageId.mode -ne 'id') { throw "QG Notion update '$($n.name)' pageId.mode != 'id'" }
}

# Contagem exata: 3 create (eventos em_revisao/entregue/reaberta) + 2 update (entregue/reaberta)
if ($notionCreate.Count -ne 3) { throw "QG expected 3 Notion create nodes, got $($notionCreate.Count)" }
if ($notionUpdate.Count -ne 2) { throw "QG expected 2 Notion update nodes, got $($notionUpdate.Count)" }

# Nodes preservados (não foram renomeados/removidos)
$preserved = @(
  '[Exec QG] Schedule 5 min',
  '[Exec QG] Buscar SOP Vigente',
  '[Exec QG] Buscar Demandas Em Revisao',
  '[Exec QG] Montar Evento demanda.em_revisao',
  '[Exec QG] Gemini Flash DoD Pacing',
  '[Exec QG] Validar DoD Pacing Flash',
  '[Exec QG] Restaurar Payload DoD',
  '[Exec QG] Resultado PASS?',
  '[Exec QG] Telegram Checklist FAIL'
)
foreach ($name in $preserved) {
  if (-not ($wfQg.nodes | Where-Object { $_.name -eq $name })) {
    throw "QG missing preserved node: $name"
  }
}

# Topologia preservada (connections do QG inalteradas)
if (-not $wfQg.connections.'[Exec QG] Resultado PASS?'.main[0][0].node -eq '[Exec QG] Marcar Entregue') {
  throw "QG PASS branch connection broken"
}
if (-not $wfQg.connections.'[Exec QG] Resultado PASS?'.main[1][0].node -eq '[Exec QG] Reabrir Demanda') {
  throw "QG FAIL branch connection broken"
}
```

Intake e Orquestrador continuam validados pelos checks atuais — não introduzir os checks `httpNotion` nem `EXEC_NOTION_TOKEN` neles ainda (eles ainda têm HTTPs Notion válidos nesta entrega).

## Critérios de aceite

- [ ] 0 nodes `n8n-nodes-base.httpRequest` com URL `api.notion.com` em `qualitygate-pacing/workflow.json`
- [ ] 5 HTTPs antigos substituídos: 3 Notion `databasePage.create` (eventos) + 2 Notion `databasePage.update` (Demandas)
- [ ] Nodes preservados byte-a-byte: Schedule, Buscar SOP, Buscar Demandas Em Revisao, Gemini, IF Resultado PASS?, Restaurar Payload DoD, Telegram Checklist FAIL
- [ ] `[Exec QG] Montar Evento demanda.em_revisao` retorna campos avulsos (sem `event_body`)
- [ ] `[Exec QG] Validar DoD Pacing Flash` retorna campos avulsos (sem `update_body`/`event_body`)
- [ ] `generate_export.js` ganha `DB_EVENTOS_PAGE`/`DB_EVENTOS_NAME` se ainda não existirem; partes do Intake/Orq inalteradas
- [ ] `onboarding/execucao_lote1_tests.ps1` ganha checks escopados ao QG e passa verde
- [ ] sandbox==workflow byte-a-byte (sha256 igual) só pro QG
- [ ] Sem BOM, sem secrets, sem mojibake
- [ ] `active: false` mantido
- [ ] Cada Notion node novo tem `credentials.notionApi.id: '<credential_id_redacted>'`
- [ ] **Intake e Orquestrador NÃO mudaram** (`git diff` mostra zero alterações em `intake-pacing/` e `orquestrador/`)

## Commit + push + verificação

```bash
git add onboarding/execucao/lote1/qualitygate-pacing/ \
        onboarding/execucao/lote1/generate_export.js \
        onboarding/execucao_lote1_tests.ps1
git status --short  # confirme que intake-pacing/ e orquestrador/ NÃO aparecem
git commit -m "exec-lote1 a04-qg: refactor HTTP Notion -> Notion native v2.2 no QualityGate"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Depois disso o Olavo configura a credencial Notion no n8n e roda smoke do QG isolado (cria demanda manual em "Em revisao" → Schedule dispara → PASS ou FAIL via observacoes → Marcar Entregue/Reabrir Demanda + 3 eventos no DB PHI - Eventos). Se o piloto verde, abrimos `a04-intake` e `a04-orq` na sequência.

--- END COPY ---
