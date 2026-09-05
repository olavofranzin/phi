# Brief Codex — Execução Lote 1 `a04-intake` (refactor HTTP Notion → Notion native, **só Intake-Pacing**)

> **Escopo:** segundo dos 3 refactors do Lote 1. Só `WF-EXEC-Intake-Pacing`. Aplica os 6 aprendizados do smoke do QG (validado em produção 2026-06-16, commits `49cae25` + `72b4086`) **desde o brief inicial** — pra não tropeçar nos mesmos bugs.
>
> **QualityGate-Pacing e Orquestrador NÃO devem ser tocados nesta entrega.** QG está em produção; Orq fica pra `a04-orq`.

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `a04-intake` da Execução Lote 1 — eliminar **2 HTTP Request direta ao Notion no WF-EXEC-Intake-Pacing** substituindo por `n8n-nodes-base.notion` v2.2, aplicando aprendizados do refactor do QualityGate validado em produção.

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** HEAD mais novo (`git fetch origin claude/agentic-agency-planning-KwJEw` antes)
- **Arquivos a tocar:** SÓ `onboarding/execucao/lote1/intake-pacing/{workflow.json,sandbox_export.json}` + `onboarding/execucao/lote1/generate_export.js` (apenas a parte do Intake — adicionar constantes `DB_DEMANDAS_PAGE`/`DB_DEMANDAS_NAME` se ainda não existirem; QG só usa `DB_EVENTOS_PAGE`) + `onboarding/execucao_lote1_tests.ps1` (checks novos do Intake).
- **Arquivos a NÃO tocar:** `onboarding/execucao/lote1/qualitygate-pacing/**` (já em produção), `onboarding/execucao/lote1/orquestrador/**`.

O QG validado em produção provou: `n8n-nodes-base.notion` v2.2 + propertiesUi.propertyValues funciona. Refactor do Intake segue o mesmo padrão. **Atenção especial aos 6 bugs latentes detectados no smoke do QG** (cobrir desde o início):

1. **`alwaysOutputData:true` em search nodes injeta item fantasma** quando filtro retorna 0 matches → downstream Code processa `page = {}` → cascata de erros. Remover/setar `false` nos 2 search nodes do Intake (`Buscar SOP Vigente`, `Buscar Demandas Existentes`).
2. **Notion native v2.2 substitui `$json` em create/update** — pairedItem quebra downstream. Consumers que precisam de dados do upstream antes do Notion node devem usar `$('NodeName').first().json.<campo>` (Intake = 1 item por execução, webhook trigger) ou `.all().find()` por chave de negócio.
3. **Date-only é mais portável** que ISO datetime em Notion `date` property. Usar `new Date().toISOString().slice(0, 10)` (formato `YYYY-MM-DD`).
4. **Guards `page.id` / `demanda_id` defensivos** em Code nodes downstream — falha cedo com mensagem clara se input vier vazio (caso o fix 1 falhar por algum motivo).
5. **Telegram com fallback `(sem texto)`** — impede falha `text:''` se lookup retornar undefined.
6. **Schema do DB Demandas** tem properties em snake_case ASCII (verificado via MCP Notion fetch): `titulo`, `tenant_id`, `client_id`, `tipo`, `classe_sla`, `estado`, `prioridade`, `prioridade_origem`, `prazo`, `sla_version`, `quality_gate`, `versao_sop_aplicada`, `observacoes`. Notion v2.2 propertyValues exige `key: '<name>|<type>'` (ex: `'tipo|select'`).

## Mapa dos 2 HTTPs no Intake

| # | Node atual (id / name) | Tipo HTTP hoje | Substituir por |
|---|---|---|---|
| 1 | `exec-intake-create-demanda` — `[Exec Intake] Criar Demanda` | POST /v1/pages | Notion `databasePage.create` em **PHI - Demandas** |
| 2 | `exec-intake-create-event` — `[Exec Intake] Criar Evento demanda.criada` | POST /v1/pages | Notion `databasePage.create` em **PHI - Eventos** |

Preservar `id`, `name` e `position` dos 2 nodes. Só `type`/`typeVersion`/`parameters`/`credentials` mudam.

## UUIDs e nomes dos DBs

| DB | UUID page_id | `cachedResultName` |
|---|---|---|
| PHI - Demandas | `a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b` | `PHI - Demandas` |
| PHI - Eventos | `c64f600e-4f46-4b2b-ac22-c1e425c8966e` | `PHI - Eventos` |

`Buscar SOP Vigente` (`exec-intake-sop`) e `Buscar Demandas Existentes` (`exec-intake-existing`) **continuam Notion native intocados** quanto à conexão, MAS perdem `alwaysOutputData:true` (Fix 1).

## Template — Substituir HTTP POST `Criar Demanda` por Notion `databasePage.create`

```js
{
  id: 'exec-intake-create-demanda',
  name: '[Exec Intake] Criar Demanda',
  type: 'n8n-nodes-base.notion',
  typeVersion: 2.2,
  position: [2200, -260],
  parameters: {
    resource: 'databasePage',
    operation: 'create',
    databaseId: {
      __rl: true,
      mode: 'list',
      value: 'a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b',
      cachedResultName: 'PHI - Demandas',
    },
    simple: false,
    propertiesUi: {
      propertyValues: [
        { key: 'titulo|title',                   type: 'title',     title:       '={{ $json.demanda_titulo }}' },
        { key: 'tenant_id|rich_text',            type: 'rich_text', textContent: '={{ $json.tenant_id }}' },
        { key: 'client_id|rich_text',            type: 'rich_text', textContent: '={{ $json.client_id }}' },
        { key: 'tipo|select',                    type: 'select',    selectValue: 'Pacing/verba' },
        { key: 'classe_sla|select',              type: 'select',    selectValue: 'Critica' },
        { key: 'estado|select',                  type: 'select',    selectValue: 'Aberta' },
        { key: 'prioridade|number',              type: 'number',    numberValue: '={{ $json.prioridade }}' },
        { key: 'prioridade_origem|select',       type: 'select',    selectValue: 'agente' },
        { key: 'prazo|date',                     type: 'date',      date:        '={{ $json.prazo }}' },
        { key: 'sla_version|rich_text',          type: 'rich_text', textContent: 'v0.3-2026-06-14' },
        { key: 'quality_gate|select',            type: 'select',    selectValue: 'pendente' },
        { key: 'versao_sop_aplicada|rich_text',  type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' },
        { key: 'observacoes|rich_text',          type: 'rich_text', textContent: '={{ $json.observacoes }}' },
      ],
    },
  },
  credentials: {
    notionApi: { id: '<credential_id_redacted>', name: 'Notion account' },
  },
}
```

**Nota `prazo`:** o Notion native `date` property aceita ISO datetime com offset. O `$json.prazo` deve vir como `YYYY-MM-DDTHH:mm:ss-03:00` (formato `brDue()`). Continua válido — não trocar pra date-only neste caso (prazo precisa de hora exata 23:59 BRT).

## Template — Substituir HTTP POST `Criar Evento demanda.criada` por Notion `databasePage.create`

```js
{
  id: 'exec-intake-create-event',
  name: '[Exec Intake] Criar Evento demanda.criada',
  type: 'n8n-nodes-base.notion',
  typeVersion: 2.2,
  position: [2640, -260],
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
        { key: 'tipo|title',                     type: 'title',     title:       '={{ $json.evento_tipo }}' },
        { key: 'entidade_id|rich_text',          type: 'rich_text', textContent: '={{ $json.entidade_id }}' },
        { key: 'entidade_area|select',           type: 'select',    selectValue: 'Execucao' },
        { key: 'payload_json|rich_text',         type: 'rich_text', textContent: '={{ $json.payload_json }}' },
        { key: 'timestamp|date',                 type: 'date',      date:        '={{ $json.timestamp }}' },
        { key: 'execution_id|rich_text',         type: 'rich_text', textContent: '={{ $json.execution_id }}' },
        { key: 'tenant_id|rich_text',            type: 'rich_text', textContent: '={{ $json.tenant_id }}' },
        { key: 'tier_agente|select',             type: 'select',    selectValue: '={{ $json.tier_agente }}' },
        { key: 'versao_sop_aplicada|rich_text',  type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' },
      ],
    },
  },
  credentials: {
    notionApi: { id: '<credential_id_redacted>', name: 'Notion account' },
  },
}
```

**Nota chave:** o `$json.entidade_id` vem do Code `Montar Evento demanda.criada` upstream (= `page.id` da Demanda recém-criada). O `$json.timestamp` é date-only (Fix 3). Outros campos vêm do mesmo Code refatorado.

## Refactor dos 2 Code nodes upstream

### `[Exec Intake] Preparar Demanda e Evento` (id `exec-intake-prepare`)

**Antes:** retorna `{ ...ctx, demanda_body: {...}, event: {...}, ... }`.

**Depois:** retorna campos avulsos da Demanda + contexto pro evento + auxiliares — SEM `demanda_body`, SEM `event`. Output esperado pelo Notion `Criar Demanda` (Fix 6 mapping):
- `demanda_titulo` (title)
- `tenant_id`, `client_id`, `versao_sop_aplicada`, `prazo`, `observacoes` (rich_text / date)
- `prioridade: 100` (number)
- **Auxiliares pro evento downstream (sobrevivem na cadeia via referência do Code `Montar Evento`):**
  - `execution_id`, `tenant_id`, `versao_sop_aplicada`, `payload` (objeto inteiro pra stringificar no Montar)
- **Controle:** `idempotency_key`, `ja_existe`, `cliente_nome`, `text` (Telegram base)

JsCode refatorado completo do `Preparar Demanda e Evento`:

```js
const pickTitle = (page) => {
  for (const prop of Object.values(page.properties || {})) {
    if (prop?.type === 'title') return (prop.title || []).map((part) => part.plain_text || '').join('').trim();
  }
  return '';
};
const pickText = (prop) => (prop?.rich_text || []).map((part) => part.plain_text || '').join('').trim();
const pickSelect = (prop) => prop?.select?.name || prop?.status?.name || '';
const brDate = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const brDue = () => brDate() + 'T23:59:00-03:00';
const execId = (prefix) => prefix + '-' + $execution.id;

const ctx = $('[Exec Intake] Normalizar SOP Vigente').item.json;
const existing = $input.all().map((item) => item.json || {}).filter((page) => !page.archived && !page.is_archived);
const demandDate = brDate();
const idempotencyKey = 'pacing|' + demandDate + '|' + ctx.client_id;
const existingKeys = new Set();
for (const page of existing) {
  const props = page.properties || {};
  const obs = pickText(props.observacoes) || pickText(props.Observacoes);
  const titleText = pickTitle(page);
  if (obs.includes(idempotencyKey) || titleText.includes(ctx.cliente_nome)) existingKeys.add(idempotencyKey);
}
const execution_id = execId('EXEC-EXEC-INTAKE');
const tenant_id = 'phi-agencia';
const tituloDemanda = 'Pacing critico cliente ' + ctx.cliente_nome;
const due = brDue();
const observacoes = 'idempotency_key=' + idempotencyKey + '; execution_id=' + execution_id + '; fonte=' + ctx.fonte;
const payload = {
  tenant_id,
  client_id: ctx.client_id,
  execution_id,
  versao_sop_aplicada: ctx.versao_sop_aplicada,
  tipo: 'Pacing/verba',
  classe_sla: 'Critica',
  estado: 'Aberta',
  sla_version: 'v0.3-2026-06-14',
  prazo: due,
  idempotency_key: idempotencyKey,
  alerta_id: ctx.alerta_id,
  fonte: ctx.fonte,
  diagnostico: ctx.diagnostico,
  plataforma: ctx.plataforma,
  campanha: ctx.campanha,
  gasto_atual: ctx.gasto_atual,
  orcamento_planejado: ctx.orcamento_planejado,
};
return [{
  json: {
    ...ctx,
    execution_id,
    tenant_id,
    demanda_titulo: tituloDemanda,
    prioridade: 100,
    prazo: due,
    versao_sop_aplicada: ctx.versao_sop_aplicada,
    observacoes,
    idempotency_key: idempotencyKey,
    ja_existe: existingKeys.has(idempotencyKey),
    cliente_nome: ctx.cliente_nome,
    payload,
    text: '<b>Execucao critica</b>\nPacing/verba aberto para ' + ctx.cliente_nome + '\nPrazo: hoje 23:59 BRT\nSOP: ' + ctx.versao_sop_aplicada,
  }
}];
```

Mudanças vs. original:
- Removido `demanda_body` (n8n native Notion monta o body internamente via propertyValues).
- Removido `event` aninhado (o `Montar Evento demanda.criada` produz campos avulsos do evento).
- Expostos `prioridade`, `prazo`, `observacoes`, `cliente_nome` no top-level (consumidos pelo Notion native via expressions).
- `payload` permanece (será stringificado no `Montar Evento` downstream).

### `[Exec Intake] Montar Evento demanda.criada` (id `exec-intake-event-body`)

**Antes:** retorna `{ ...prepared, demanda_id, event_body: eventBody(event), text }`.

**Depois:** retorna campos avulsos do Evento — SEM `event_body`. Output esperado pelo Notion `Criar Evento demanda.criada`:

```js
const utcNow = () => new Date().toISOString().slice(0, 10);
const compactJson = (value) => JSON.stringify(value);

const prepared = $('[Exec Intake] Preparar Demanda e Evento').first().json;
const demandaPage = $json || {};
const demanda_id = demandaPage.id;
if (!demanda_id) throw new Error('[Montar Evento demanda.criada] Demanda page.id ausente — Criar Demanda upstream falhou ou substituiu o item');

const ts = utcNow();
if (!ts || !/^\d{4}-\d{2}-\d{2}$/.test(ts)) {
  throw new Error('data invalida produzida por utcNow: ' + JSON.stringify(ts));
}

const payloadComDemandaId = { ...prepared.payload, demanda_id };

return [{
  json: {
    demanda_id,
    evento_tipo: 'demanda.criada',
    entidade_id: demanda_id,
    entidade_area: 'Execucao',
    payload_json: compactJson(payloadComDemandaId),
    timestamp: ts,
    execution_id: prepared.execution_id,
    tenant_id: prepared.tenant_id,
    tier_agente: 'n/a',
    versao_sop_aplicada: prepared.versao_sop_aplicada,
    text: prepared.text + '\nDemanda: ' + demanda_id,
    idempotency_key: prepared.idempotency_key,
  }
}];
```

Mudanças:
- Lê `prepared` via `$('Preparar Demanda e Evento').first().json` (Intake = 1 item por execução, webhook trigger; `.first()` é seguro — Fix 2).
- Lê `$json.id` (page da Demanda recém-criada via Notion native upstream).
- Guard `if (!demanda_id) throw` (Fix 4).
- Guard `ts` regex `YYYY-MM-DD` (Fix 4).
- `utcNow` date-only (Fix 3).
- Output expõe campos avulsos pra Notion `Criar Evento demanda.criada` consumir via expressions.
- Preserva `text` (Telegram) e `idempotency_key` (auditoria).
- Remove funções não usadas (`pickTitle`, `pickText`, `pickSelect`, `richText`, `title`, `brDate`, `brDue`, `execId`, `sopFromItems`, `eventBody`).

### `[Exec Intake] Normalizar SOP Vigente` (id `exec-intake-sop-normalize`)

**Não tocar.** Continua produzindo `{ ...prev, sop_vigente, versao_sop_aplicada }`. Esse output é consumido pelo `Preparar Demanda e Evento` via `$('[Exec Intake] Normalizar SOP Vigente').item.json`.

### Outros nodes downstream do `Criar Evento demanda.criada`

- **`[Exec Intake] Enviar Telegram Critico`** (id `exec-intake-telegram`): atualmente lê `={{ String($json.text || '')... }}`. Após refactor, `$json` é a page de evento criada (Notion native). Trocar pra:

```
={{ String(($('[Exec Intake] Montar Evento demanda.criada').first()?.json?.text) || '(sem texto)').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}
```

(Fix 5 — fallback `'(sem texto)'`.)

- **`[Exec Intake] Responder 201`** (id `exec-intake-201`): atualmente lê `={{ { ok: true, demanda_id: $json.demanda_id, event: "demanda.criada" } }}`. Trocar `$json.demanda_id` por `$('[Exec Intake] Montar Evento demanda.criada').first().json.demanda_id`:

```
={{ { ok: true, demanda_id: $('[Exec Intake] Montar Evento demanda.criada').first().json.demanda_id, event: "demanda.criada" } }}
```

- **`[Exec Intake] Responder Idempotente`** (id `exec-intake-idempotent`): NÃO TOCAR. Recebe do IF branch true (Preparar Demanda e Evento upstream), que ainda tem `idempotency_key` no top-level.

## Constantes em `generate_export.js`

Adicionar (se ainda não existirem — QG só usa `DB_EVENTOS_PAGE`):

```js
const DB_DEMANDAS_PAGE = 'a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b';
const DB_DEMANDAS_NAME = 'PHI - Demandas';
```

`DB_EVENTOS_PAGE` e `DB_EVENTOS_NAME` já existem (consolidados no `a04-qg-fix-1`). Reutilizar.

`DB_DEMANDAS` antigo (data_source_id `cd1ab757-...`) usado em `Buscar Demandas Existentes` — manter, esse node funciona como Notion native.

**Importante:** QG e Orquestrador continuam intactos. `generate_export.js` deve produzir o Intake refatorado + os outros 2 INALTERADOS.

## Fix 1: alwaysOutputData nos search nodes do Intake

Em `[Exec Intake] Buscar SOP Vigente` e `[Exec Intake] Buscar Demandas Existentes`:

```diff
- "alwaysOutputData": true
+ "alwaysOutputData": false
```

(Equivalente: omitir a chave. Default n8n é `false`.)

## NÃO fazer

- ❌ Não tocar QualityGate (em produção)
- ❌ Não tocar Orquestrador
- ❌ Não tocar Webhook trigger, Validar Secret, IF Secret Valido?, Responder 401, Validar Payload, IF Payload Valido?, Responder 400, IF Demanda Ja Existe?, Responder Idempotente — preservar byte-a-byte
- ❌ Não tocar `Buscar SOP Vigente` nem `Buscar Demandas Existentes` (exceto `alwaysOutputData`)
- ❌ Não tocar `Normalizar SOP Vigente` (preservar jsCode original)
- ❌ Não mudar topologia (`connections`)
- ❌ Não introduzir `Notion-Version` headers
- ❌ Não criar credencial Notion nova — `<credential_id_redacted>` permanece
- ❌ Não mudar `active: false` nem `timezone`
- ❌ Não tocar `EXEC_WEBHOOK_KEY` / ADR-19 (build-time injection preservada no Validar Secret)

## ps1 — checks novos

Adicionar bloco escopado ao Intake em `onboarding/execucao_lote1_tests.ps1`:

```powershell
# === a04-intake ===
$intakeWf = Join-Path $base 'intake-pacing/workflow.json'
$rawIntake = [System.IO.File]::ReadAllText($intakeWf, [System.Text.Encoding]::UTF8)
$wfIntake = $rawIntake | ConvertFrom-Json
$intakeMap = @{}
foreach ($n in $wfIntake.nodes) { $intakeMap[$n.name] = $n }

# 0 HTTP Request pra api.notion.com no Intake
$httpNotionIntake = $wfIntake.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.httpRequest' -and
  $_.parameters.url -is [string] -and
  $_.parameters.url.Contains('api.notion.com')
}
if ($httpNotionIntake) { throw "intake-pacing/workflow.json still has HTTP Request to api.notion.com (a04-intake refactor incomplete)" }

# 2 Notion novos (1 create Demandas + 1 create Eventos) + 2 search preservados (getAll)
$notionCreate = $wfIntake.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'create'
}
if ($notionCreate.Count -ne 2) { throw "Intake expected 2 Notion create nodes, got $($notionCreate.Count)" }

foreach ($n in $notionCreate) {
  $dbVal = $n.parameters.databaseId.value
  if (-not ($dbVal -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')) {
    throw "Intake Notion node '$($n.name)' databaseId.value not UUID: $dbVal"
  }
  if ($dbVal -eq '3423df0d-77df-4834-bdda-c08ddbae40ff') {
    throw "Intake Notion '$($n.name)' uses Eventos data_source_id ($dbVal) instead of page_id (c64f600e-...)"
  }
}

# alwaysOutputData false/ausente nos 2 search nodes
$searchIntake = $wfIntake.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'getAll'
}
foreach ($n in $searchIntake) {
  if ($n.alwaysOutputData -eq $true) {
    throw "Intake node '$($n.name)' has alwaysOutputData=true (a04-intake fix #1)"
  }
}

# Preparar Demanda e Evento: sem demanda_body, sem event aninhado
$prepCode = [string]$intakeMap['[Exec Intake] Preparar Demanda e Evento'].parameters.jsCode
if ($prepCode.Contains('demanda_body')) {
  throw "Intake Preparar Demanda e Evento ainda tem demanda_body — refactor incompleto"
}
if (-not $prepCode.Contains('demanda_titulo')) {
  throw "Intake Preparar Demanda e Evento sem demanda_titulo no top-level"
}
if (-not $prepCode.Contains('prioridade: 100')) {
  throw "Intake Preparar Demanda e Evento sem prioridade no top-level"
}

# Montar Evento demanda.criada: sem event_body, com guard page.id, utcNow date-only
$montarCode = [string]$intakeMap['[Exec Intake] Montar Evento demanda.criada'].parameters.jsCode
if ($montarCode.Contains('event_body')) {
  throw "Intake Montar Evento ainda tem event_body — refactor incompleto"
}
if (-not $montarCode.Contains('if (!demanda_id) throw')) {
  throw "Intake Montar Evento sem guard demanda_id (fix #4)"
}
if (-not $montarCode.Contains('.toISOString().slice(0, 10)')) {
  throw "Intake Montar Evento utcNow nao date-only (fix #3)"
}

# Telegram com fallback (sem texto) + lookup via Montar Evento
$telegramText = [string]$intakeMap['[Exec Intake] Enviar Telegram Critico'].parameters.text
if (-not $telegramText.Contains("`$('[Exec Intake] Montar Evento demanda.criada').first()")) {
  throw "Intake Telegram nao referencia Montar Evento via .first() (fix #2)"
}
if (-not $telegramText.Contains("'(sem texto)'")) {
  throw "Intake Telegram sem fallback '(sem texto)' (fix #5)"
}

# Responder 201 usa lookup ao Montar Evento
$resp201 = [string]$intakeMap['[Exec Intake] Responder 201'].parameters.responseBody
if (-not $resp201.Contains("`$('[Exec Intake] Montar Evento demanda.criada').first().json.demanda_id")) {
  throw "Intake Responder 201 ainda usa `$json.demanda_id direto — Notion native substituiu o item upstream"
}

# generate_export.js: DB_DEMANDAS_PAGE/DB_DEMANDAS_NAME presentes
$generatorPath = Join-Path $base 'generate_export.js'
$generator = [System.IO.File]::ReadAllText($generatorPath, [System.Text.Encoding]::UTF8)
if (-not $generator.Contains("DB_DEMANDAS_PAGE = 'a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b'")) {
  throw "generate_export.js sem DB_DEMANDAS_PAGE"
}
if (-not $generator.Contains("DB_DEMANDAS_NAME = 'PHI - Demandas'")) {
  throw "generate_export.js sem DB_DEMANDAS_NAME"
}
```

Não introduzir checks idênticos ao Intake nos blocos do QG/Orq (escopado).

## Critérios de aceite

- [ ] 0 nodes `n8n-nodes-base.httpRequest` com URL `api.notion.com` em `intake-pacing/workflow.json`
- [ ] 2 HTTPs antigos substituídos: 2 Notion `databasePage.create` (Demanda + Evento)
- [ ] Nodes preservados byte-a-byte: Webhook, Validar Secret, IFs (Secret/Payload/Existe), Responder 401/400/Idempotente, Buscar SOP Vigente + Buscar Demandas Existentes (exceto `alwaysOutputData`), Normalizar SOP Vigente
- [ ] `Preparar Demanda e Evento` produz campos avulsos (sem `demanda_body`, sem `event` aninhado)
- [ ] `Montar Evento demanda.criada` produz campos avulsos (sem `event_body`), com guard `demanda_id`, `utcNow` date-only
- [ ] `Telegram Critico` usa `$('Montar Evento demanda.criada').first()` + fallback `'(sem texto)'`
- [ ] `Responder 201` usa `$('Montar Evento demanda.criada').first().json.demanda_id`
- [ ] `alwaysOutputData` ausente ou `false` nos 2 search nodes
- [ ] `generate_export.js` ganha `DB_DEMANDAS_PAGE`/`DB_DEMANDAS_NAME` (DB_EVENTOS_* já existem)
- [ ] `onboarding/execucao_lote1_tests.ps1` ganha checks escopados ao Intake e passa verde
- [ ] sandbox==workflow byte-a-byte (sha256 igual) só pro Intake
- [ ] Sem BOM, sem secrets, sem mojibake
- [ ] `active: false` mantido
- [ ] Cada Notion novo tem `credentials.notionApi.id: '<credential_id_redacted>'`
- [ ] **QG e Orquestrador NÃO mudaram** (`git diff` mostra zero alterações em `qualitygate-pacing/` e `orquestrador/`)

## Commit + push + verificação

```bash
git add onboarding/execucao/lote1/intake-pacing/ \
        onboarding/execucao/lote1/generate_export.js \
        onboarding/execucao_lote1_tests.ps1
git status --short  # confirme que qualitygate-pacing/ e orquestrador/ NÃO aparecem
git commit -m "exec-lote1 a04-intake: refactor HTTP Notion -> Notion native v2.2 no Intake (aplica aprendizados do QG)"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Depois disso o Olavo configura credencial Notion nos 2 Notion novos do Intake no n8n, faz POST manual ao webhook `/pacing-alert` (com header `x-pacing-secret` correto + payload válido) pra smoke isolado — deve criar 1 Demanda em DB Demandas + 1 evento `demanda.criada` em DB Eventos + Telegram. Se verde, abrimos `a04-orq` na sequência.

--- END COPY ---
