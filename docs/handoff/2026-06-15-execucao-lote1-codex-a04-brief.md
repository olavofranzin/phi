# Brief Codex — Execução Lote 1 `a04` v2 (refactor HTTP Notion → Notion node nativo)

> **Escopo MUDOU.** A versão anterior deste brief era só "trocar data_source_id por page_id nos jsCodes". Após investigação técnica, Olavo decidiu refatorar de vez: substituir todos os HTTP Request pra `api.notion.com` por `n8n-nodes-base.notion` nativo. Brief abaixo é cirúrgico e auto-suficiente.

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `a04` da Execução Lote 1 — eliminar 9 HTTP Request direta ao Notion (3 workflows) substituindo por `n8n-nodes-base.notion` v2.2.

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** HEAD mais novo (`git fetch origin claude/agentic-agency-planning-KwJEw` antes)

O `a03` passou pré-revisão Claude. Smoke real (2026-06-15) parou ao configurar credenciais Notion: HTTPs `POST /v1/pages` com `Notion-Version: 2022-06-28` esperam **page_id** em `parent.database_id`, mas os jsCodes montavam o body com **data_source_id** (retornado pelo MCP Notion ao criar os DBs). Versão `2022-06-28` é a estável em prod; mudar pra `2025-09-03` (que aceita data_source_id) é decisão maior.

**Decisão arquitetural (AskUserQuestion 2026-06-15, escolha "Agora — substituir a04"):** em vez de trocar IDs nos bodies, **eliminar os HTTPs Notion** e usar `n8n-nodes-base.notion` v2.2 nativo, que:
- Trata data_source_id ↔ page_id internamente (sem ambiguidade)
- Não exige `Notion-Version` no node (n8n gerencia)
- Usa credencial Notion via `credentials.notionApi` (idêntico ao que os HTTPs já fazem com `authentication: predefinedCredentialType`)
- É consistente com os Notion natives já presentes (`Buscar SOP Vigente`, `Buscar Demandas`)

**ADR-19 (build-time injection do `EXEC_WEBHOOK_KEY`) permanece intacto.** `EXEC_NOTION_TOKEN` não existe nesses workflows (`grep` confirmou) — HTTPs Notion já usam credencial via `predefinedCredentialType`, não secret.

## Mapa exato dos 9 HTTPs a substituir

### intake-pacing (2)
| # | Node atual | Substituir por |
|---|---|---|
| 13 | `[Exec Intake] Criar Demanda` (POST /v1/pages) | Notion `databasePage.create` no DB **PHI - Demandas** |
| 15 | `[Exec Intake] Criar Evento demanda.criada` (POST /v1/pages) | Notion `databasePage.create` no DB **PHI - Eventos** |

### orquestrador (2)
| # | Node atual | Substituir por |
|---|---|---|
| 09 | `[Exec Orq] Atualizar Demanda Priorizada` (PATCH /v1/pages/{id}) | Notion `databasePage.update` |
| 10 | `[Exec Orq] Criar Evento demanda.priorizada` (POST /v1/pages) | Notion `databasePage.create` no DB **PHI - Eventos** |

### qualitygate-pacing (5)
| # | Node atual | Substituir por |
|---|---|---|
| 04 | `[Exec QG] Criar Evento demanda.em_revisao` (POST /v1/pages) | Notion `databasePage.create` no DB **PHI - Eventos** |
| 09 | `[Exec QG] Marcar Entregue` (PATCH /v1/pages/{id}) | Notion `databasePage.update` |
| 10 | `[Exec QG] Criar Evento demanda.entregue` (POST /v1/pages) | Notion `databasePage.create` no DB **PHI - Eventos** |
| 11 | `[Exec QG] Reabrir Demanda` (PATCH /v1/pages/{id}) | Notion `databasePage.update` |
| 12 | `[Exec QG] Criar Evento demanda.reaberta` (POST /v1/pages) | Notion `databasePage.create` no DB **PHI - Eventos** |

## UUIDs (page_id) e nomes dos DBs

| DB | UUID page_id | `cachedResultName` |
|---|---|---|
| PHI - Demandas | `a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b` | `PHI - Demandas` |
| PHI - Eventos | `c64f600e-4f46-4b2b-ac22-c1e425c8966e` | `PHI - Eventos` |
| PHI - SOPs | `bfeb1105-83a6-4e89-8d62-26607ebfcc8c` | (não muda — `Buscar SOP` já usa esse `data_source_id` e funciona com Notion native) |

**Importante:** `Buscar SOP Vigente`, `Buscar Demandas Existentes`, `Buscar Demandas Em Revisao`, `Buscar Demandas Abertas` **NÃO devem ser tocados** — já são Notion native funcionando.

## Template — substituir HTTP POST por Notion `databasePage.create`

```js
{
  id: '<manter id atual ou usar exec-<wf>-create-<entidade>>',
  name: '<manter nome atual>',
  type: 'n8n-nodes-base.notion',
  typeVersion: 2.2,
  position: [<mesma posição>],
  parameters: {
    resource: 'databasePage',
    operation: 'create',
    databaseId: {
      __rl: true,
      mode: 'list',
      value: '<UUID page_id do DB>',
      cachedResultName: '<Nome do DB>',
    },
    simple: false,
    propertiesUi: {
      propertyValues: [
        // um item por property — ver mapping abaixo
      ],
    },
  },
  credentials: {
    notionApi: { id: '<credential_id_placeholder>', name: 'Notion account' },
  },
}
```

## Template — substituir HTTP PATCH por Notion `databasePage.update`

```js
{
  type: 'n8n-nodes-base.notion',
  typeVersion: 2.2,
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
        // apenas as properties que mudam
      ],
    },
  },
  credentials: {
    notionApi: { id: '<credential_id_placeholder>', name: 'Notion account' },
  },
}
```

## Mapping de properties (Demanda - PHI - Demandas)

Pra cada property do `demanda_body` antigo, o equivalente em `propertyValues`:

| Property | Type | propertyValue (Notion v2.2) |
|---|---|---|
| `titulo` | title | `{ key: 'titulo\|title', type: 'title', title: '={{ $json.demanda_titulo }}' }` |
| `tenant_id` | rich_text | `{ key: 'tenant_id\|rich_text', type: 'rich_text', textContent: '={{ $json.tenant_id }}' }` |
| `client_id` | rich_text | `{ key: 'client_id\|rich_text', type: 'rich_text', textContent: '={{ $json.client_id }}' }` |
| `tipo` | select | `{ key: 'tipo\|select', type: 'select', selectValue: 'Pacing/verba' }` |
| `classe_sla` | select | `{ key: 'classe_sla\|select', type: 'select', selectValue: 'Critica' }` |
| `estado` | select | `{ key: 'estado\|select', type: 'select', selectValue: 'Aberta' }` |
| `prioridade` | number | `{ key: 'prioridade\|number', type: 'number', numberValue: '={{ $json.prioridade ?? 100 }}' }` |
| `prioridade_origem` | select | `{ key: 'prioridade_origem\|select', type: 'select', selectValue: 'agente' }` |
| `prazo` | date | `{ key: 'prazo\|date', type: 'date', date: '={{ $json.prazo }}' }` |
| `sla_version` | rich_text | `{ key: 'sla_version\|rich_text', type: 'rich_text', textContent: 'v0.3-2026-06-14' }` |
| `quality_gate` | select | `{ key: 'quality_gate\|select', type: 'select', selectValue: 'pendente' }` |
| `versao_sop_aplicada` | rich_text | `{ key: 'versao_sop_aplicada\|rich_text', type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' }` |
| `observacoes` | rich_text | `{ key: 'observacoes\|rich_text', type: 'rich_text', textContent: '={{ $json.observacoes }}' }` |

**Nota B1 (rich_text):** o node Notion v2.2 aceita `textContent` direto (single text run); B1 do a03 que injetava array `rich_text` manualmente fica resolvido pelo próprio node — não precisa do flag `richText: true` (esse só é necessário pra annotations/links, que não usamos).

## Mapping de properties (Evento - PHI - Eventos)

| Property | Type | propertyValue |
|---|---|---|
| `tipo` | title | `{ key: 'tipo\|title', type: 'title', title: '={{ $json.evento_tipo }}' }` |
| `entidade_id` | rich_text | `{ key: 'entidade_id\|rich_text', type: 'rich_text', textContent: '={{ $json.entidade_id }}' }` |
| `entidade_area` | select | `{ key: 'entidade_area\|select', type: 'select', selectValue: 'Execucao' }` |
| `payload_json` | rich_text | `{ key: 'payload_json\|rich_text', type: 'rich_text', textContent: '={{ $json.payload_json }}' }` |
| `timestamp` | date | `{ key: 'timestamp\|date', type: 'date', date: '={{ $json.timestamp }}' }` |
| `execution_id` | rich_text | `{ key: 'execution_id\|rich_text', type: 'rich_text', textContent: '={{ $json.execution_id }}' }` |
| `tenant_id` | rich_text | `{ key: 'tenant_id\|rich_text', type: 'rich_text', textContent: '={{ $json.tenant_id }}' }` |
| `tier_agente` | select | `{ key: 'tier_agente\|select', type: 'select', selectValue: '={{ $json.tier_agente }}' }` |
| `versao_sop_aplicada` | rich_text | `{ key: 'versao_sop_aplicada\|rich_text', type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' }` |

## Refactor dos Code nodes upstream

Os jsCodes que produziam `demanda_body` e `event_body` precisam **agora produzir campos avulsos** que os expressions acima referenciam. Mantém `entidade_id`, `evento_tipo`, `payload_json` etc no `$json` de saída.

**Intake `Preparar Demanda e Evento`:** remover construção de `demanda_body` e `event` (objeto inteiro). No retorno, expor: `demanda_titulo`, `tenant_id`, `client_id`, `prazo`, `versao_sop_aplicada`, `observacoes`, `prioridade` (default 100), `ja_existe`, `idempotency_key`, `execution_id`, `evento_tipo` (= `'demanda.criada'`), `entidade_id` (= `''`), `entidade_area` (= `'Execucao'`), `payload_json` (= `JSON.stringify(payload)`), `timestamp` (= `utcNow()`), `tier_agente` (= `'n/a'`), `text` (Telegram).

**Intake `Montar Evento demanda.criada`:** input é a resposta do node Notion create Demanda — `entidade_id = $json.id` (page criada). Output: campos do mapping Evento acima.

**Orq `Calcular Prioridade Pro`:** preservar lógica de cálculo de prioridade. Output expõe `demanda_id` (pra PATCH), `prioridade` (novo número), e campos do Evento (`evento_tipo: 'demanda.priorizada'`, `payload_json`, etc).

**QG `Montar Evento demanda.em_revisao` / `Validar DoD Pacing Flash`:** mesmo padrão — expor campos avulsos em vez de bodies.

`Restaurar Payload Priorizacao` e `Restaurar Payload DoD` podem precisar pequeno ajuste pra restaurar os campos corretos pós-Gemini — preservar a função (passar adiante o que veio do upstream).

## NÃO fazer

- ❌ Não tocar webhook trigger, Validar Secret, Validar Payload, IFs de validação, Responder 401/400/Idempotente
- ❌ Não tocar Notion natives já existentes (`Buscar SOP Vigente`, `Buscar Demandas Existentes/Abertas/Em Revisao`)
- ❌ Não tocar Gemini Pro / Gemini Flash / Telegram
- ❌ Não tocar Merge `numberInputs:2`
- ❌ Não mudar B4 (ADR-19 build-time injection do `EXEC_WEBHOOK_KEY`)
- ❌ Não tocar typeVersion de outros nodes; usar `2.2` no Notion native (consistente com Buscar SOP)
- ❌ Não introduzir `Notion-Version` headers em lugar nenhum (Notion native gerencia)
- ❌ Não criar credencial Notion nova — `id: '<credential_id_placeholder>'` é placeholder (Olavo configura no n8n)

## Constantes em `generate_export.js`

Reorganizar:

```js
// page_id (Notion native v2.2 espera UUID page_id no value do Resource Locator)
const DB_DEMANDAS_PAGE = 'a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b';
const DB_EVENTOS_PAGE  = 'c64f600e-4f46-4b2b-ac22-c1e425c8966e';
const DB_SOPS          = 'bfeb1105-83a6-4e89-8d62-26607ebfcc8c'; // Buscar SOP (não muda)

// Nomes pra cachedResultName
const DB_DEMANDAS_NAME = 'PHI - Demandas';
const DB_EVENTOS_NAME  = 'PHI - Eventos';
```

`DB_DEMANDAS` antigo (data_source_id `cd1ab757-...`) usado em `Buscar Demandas Existentes/Abertas/Em Revisao` — manter, esses nodes funcionam.

## ps1 — checks novos

Adicionar no `onboarding/execucao_lote1_tests.ps1`:

```powershell
foreach ($path in @($intakeWf, $orqWf, $qgWf)) {
  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  $wf = $raw | ConvertFrom-Json

  # Nenhum HTTP Request pra api.notion.com nos 3 workflows
  $httpNotion = $wf.nodes | Where-Object {
    $_.type -eq 'n8n-nodes-base.httpRequest' -and (
      $_.parameters.url -like '*api.notion.com*' -or
      ($_.parameters.url -is [string] -and $_.parameters.url.Contains('api.notion.com'))
    )
  }
  if ($httpNotion) { throw "$path still has HTTP Request to api.notion.com (a04 refactor incomplete)" }

  # Todo Notion node tem databaseId/pageId Resource Locator válido
  $notion = $wf.nodes | Where-Object { $_.type -eq 'n8n-nodes-base.notion' }
  foreach ($n in $notion) {
    $op = $n.parameters.operation
    if ($op -eq 'create' -or $op -eq 'getAll') {
      $dbVal = $n.parameters.databaseId.value
      if (-not ($dbVal -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')) {
        throw "$path Notion node '$($n.name)' databaseId.value not UUID: $dbVal"
      }
      if (-not $n.parameters.databaseId.cachedResultName) {
        Write-Host "WARN: $path Notion node '$($n.name)' missing cachedResultName"
      }
    }
    if ($op -eq 'update') {
      if (-not $n.parameters.pageId) { throw "$path Notion update node '$($n.name)' missing pageId" }
    }
  }

  # data_source_ids antigos não devem aparecer em propertyValues ou em databaseId.value de create/update
  # (Buscar nodes ainda usam cd1ab757 — então grep só falha se 3423df0d aparecer em databaseId.value)
  $notionCreates = $notion | Where-Object { $_.parameters.operation -eq 'create' -or $_.parameters.operation -eq 'update' }
  foreach ($n in $notionCreates) {
    $dbVal = $n.parameters.databaseId.value
    if ($dbVal -eq '3423df0d-77df-4834-bdda-c08ddbae40ff') {
      throw "$path Notion '$($n.name)' uses Eventos data_source_id ($dbVal) instead of page_id (c64f600e-...)"
    }
  }
}
```

E também:

```powershell
# EXEC_NOTION_TOKEN nunca deve aparecer (grep negativo)
foreach ($path in @($intakeWf, $orqWf, $qgWf)) {
  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  if ($raw -match 'EXEC_NOTION_TOKEN') {
    throw "$path references EXEC_NOTION_TOKEN — should be removed (Notion native uses credential)"
  }
}
```

B4 ADR-19 (EXEC_WEBHOOK_KEY no Validar Secret do Intake) **continua válido** — não tocar.

## Critérios de aceite

- [ ] 0 nodes `n8n-nodes-base.httpRequest` com URL `api.notion.com` nos 3 workflows
- [ ] 9 HTTPs antigos substituídos por `n8n-nodes-base.notion` v2.2 (create ou update)
- [ ] `Buscar SOP Vigente`, `Buscar Demandas Existentes/Abertas/Em Revisao`, `Validar Secret`, `Validar Payload`, webhook, IFs, RespondToWebhook, Gemini, Telegram, Merge — **intactos**
- [ ] Code nodes upstream produzem campos avulsos (não `demanda_body`/`event_body`)
- [ ] `generate_export.js` ganha `DB_DEMANDAS_PAGE` e `DB_EVENTOS_PAGE`
- [ ] ps1 ganha checks novos + passa verde
- [ ] B4 ADR-19 (EXEC_WEBHOOK_KEY) preservado
- [ ] sandbox==workflow byte-a-byte (sha256 igual)
- [ ] Sem BOM, secrets, mojibake
- [ ] `active: false` mantido
- [ ] Cada Notion node tem `credentials.notionApi.id: '<credential_id_placeholder>'` (Olavo configura no n8n)

## Commit + push + verificação

```bash
git add onboarding/execucao/lote1/ onboarding/execucao_lote1_tests.ps1
git commit -m "exec-lote1 a04: refactor HTTP Notion -> Notion native v2.2 nos 3 workflows"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Depois disso, smoke do Lote 1 roda direto pela arquitetura final — sem fix inline, sem ID errado. Olavo só vai precisar configurar credencial Notion no n8n e re-pinar Cenário A.

--- END COPY ---
