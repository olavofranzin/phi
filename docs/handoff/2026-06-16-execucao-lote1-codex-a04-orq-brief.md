# Brief Codex — Execução Lote 1 `a04-orq` (refactor HTTP Notion → Notion native, **só Orquestrador**)

> **Escopo:** terceiro e último dos 3 refactors do Lote 1. Só `WF-EXEC-Orquestrador`. Aplica os 6 aprendizados do smoke do QG (validado em produção 2026-06-16, commits `49cae25` + `72b4086`) **desde o brief inicial**.
>
> **QualityGate-Pacing e Intake-Pacing NÃO devem ser tocados nesta entrega.** QG está em produção; Intake refatorado no `a04-intake`.
>
> **Quando este `a04-orq` ficar verde em produção, o Lote 1 da Execução FECHA.**

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `a04-orq` da Execução Lote 1 — eliminar **2 HTTP Request direta ao Notion no WF-EXEC-Orquestrador** substituindo por `n8n-nodes-base.notion` v2.2, aplicando aprendizados do QG (em produção desde 2026-06-16).

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** HEAD mais novo (`git fetch origin claude/agentic-agency-planning-KwJEw` antes)
- **Arquivos a tocar:** SÓ `onboarding/execucao/lote1/orquestrador/{workflow.json,sandbox_export.json}` + `onboarding/execucao/lote1/generate_export.js` (só a parte do Orq — não precisa adicionar constantes novas; `DB_EVENTOS_PAGE`/`DB_EVENTOS_NAME` já existem) + `onboarding/execucao_lote1_tests.ps1` (checks novos do Orq).
- **Arquivos a NÃO tocar:** `qualitygate-pacing/**` (em produção), `intake-pacing/**`.

O QG validou: `n8n-nodes-base.notion` v2.2 + propertiesUi.propertyValues funciona. O Orquestrador é arquiteturalmente **mais parecido com o QG do que o Intake**: ambos processam N demandas por execução (Schedule trigger + Notion search). Padrão de referência: **`a04-qg-fix-1` (commit `72b4086`)**.

### Os 6 aprendizados do QG (cobrir desde o início)

1. **`alwaysOutputData:true` em search nodes injeta item fantasma** → remover nos 2 search nodes do Orq (`Buscar SOP Vigente`, `Buscar Demandas Abertas`).
2. **Notion native v2.2 substitui `$json` em create/update**. Orq processa N demandas por execução → usar **`.all().find(o => o.json.demanda_id === $json.id)`** pra pareamento (igual QG, Fix 4/5 do `a04-qg-fix-1`).
3. **Date-only é mais portável** → `new Date().toISOString().slice(0, 10)` no `utcNow`.
4. **Guards `page.id` / `demanda_id`** em Code nodes downstream.
5. **`Restaurar Payload Priorizacao`** já existe e usa `$('Calcular Prioridade Pro').all().map(...)` — manter intocado, igual `Restaurar Payload DoD` no QG.
6. **Schema do DB Demandas** (verificado via MCP Notion fetch): properties relevantes pro update — `prioridade` (number), `prioridade_origem` (select), `estado` (select), `versao_sop_aplicada` (rich_text via Notion API; type=text no schema; aceita textContent direto). Schema do DB Eventos idem QG (9 properties).

## Mapa dos 2 HTTPs no Orquestrador

| # | Node atual (id / name) | Tipo HTTP hoje | Substituir por |
|---|---|---|---|
| 1 | `exec-orq-update` — `[Exec Orq] Atualizar Demanda Priorizada` | PATCH /v1/pages/{id} | Notion `databasePage.update` |
| 2 | `exec-orq-event` — `[Exec Orq] Criar Evento demanda.priorizada` | POST /v1/pages | Notion `databasePage.create` em **PHI - Eventos** |

Preservar `id`, `name`, `position` dos 2 nodes. Só `type`/`typeVersion`/`parameters`/`credentials` mudam.

## UUIDs e nomes dos DBs

| DB | UUID page_id | `cachedResultName` |
|---|---|---|
| PHI - Eventos | `c64f600e-4f46-4b2b-ac22-c1e425c8966e` | `PHI - Eventos` |
| PHI - Demandas (update via `pageId` = `$json.demanda_id`) | n/a — `pageId.value` vem do payload | n/a |

`Buscar SOP Vigente` (`exec-orq-sop`) e `Buscar Demandas Abertas` (`exec-orq-open`) **continuam Notion native intocados** quanto à conexão, MAS perdem `alwaysOutputData:true` (Fix 1).

## Template — Substituir HTTP PATCH `Atualizar Demanda Priorizada` por Notion `databasePage.update`

```js
{
  id: 'exec-orq-update',
  name: '[Exec Orq] Atualizar Demanda Priorizada',
  type: 'n8n-nodes-base.notion',
  typeVersion: 2.2,
  position: [1540, 0],
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
        { key: 'prioridade|number',              type: 'number',    numberValue: '={{ $json.prioridade }}' },
        { key: 'prioridade_origem|select',       type: 'select',    selectValue: '={{ $json.prioridade_origem }}' },
        { key: 'estado|select',                  type: 'select',    selectValue: '={{ $json.novo_estado }}' },
        { key: 'versao_sop_aplicada|rich_text',  type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' },
      ],
    },
  },
  credentials: {
    notionApi: { id: '<credential_id_redacted>', name: 'Notion account' },
  },
}
```

**Mudança importante vs. original:** o jsCode antigo do `Calcular Prioridade Pro` usava `update_body.properties.estado.select.name = 'Priorizada'` hardcoded. Após refactor, expor `novo_estado: 'Priorizada'` no output do Code (alinha com o padrão usado no QG via `novo_estado='Entregue'`/`'Em execucao'` — Fix 4/5 do `a04-qg-fix-1`).

## Template — Substituir HTTP POST `Criar Evento demanda.priorizada` por Notion `databasePage.create`

Idêntico ao create de eventos do QG (mesmo DB, mesmas 9 properties). Padrão `.all().find()` pareando por `demanda_id` (Fix 2 — pairedItem quebra após Notion update upstream):

```js
{
  id: 'exec-orq-event',
  name: '[Exec Orq] Criar Evento demanda.priorizada',
  type: 'n8n-nodes-base.notion',
  typeVersion: 2.2,
  position: [1760, 0],
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
        { key: 'tipo|title',                     type: 'title',     title:       '={{ $(\'[Exec Orq] Restaurar Payload Priorizacao\').all().find(o => o.json.demanda_id === $json.id).json.evento_tipo }}' },
        { key: 'entidade_id|rich_text',          type: 'rich_text', textContent: '={{ $(\'[Exec Orq] Restaurar Payload Priorizacao\').all().find(o => o.json.demanda_id === $json.id).json.entidade_id }}' },
        { key: 'entidade_area|select',           type: 'select',    selectValue: 'Execucao' },
        { key: 'payload_json|rich_text',         type: 'rich_text', textContent: '={{ $(\'[Exec Orq] Restaurar Payload Priorizacao\').all().find(o => o.json.demanda_id === $json.id).json.payload_json }}' },
        { key: 'timestamp|date',                 type: 'date',      date:        '={{ $(\'[Exec Orq] Restaurar Payload Priorizacao\').all().find(o => o.json.demanda_id === $json.id).json.timestamp }}' },
        { key: 'execution_id|rich_text',         type: 'rich_text', textContent: '={{ $(\'[Exec Orq] Restaurar Payload Priorizacao\').all().find(o => o.json.demanda_id === $json.id).json.execution_id }}' },
        { key: 'tenant_id|rich_text',            type: 'rich_text', textContent: '={{ $(\'[Exec Orq] Restaurar Payload Priorizacao\').all().find(o => o.json.demanda_id === $json.id).json.tenant_id }}' },
        { key: 'tier_agente|select',             type: 'select',    selectValue: '={{ $(\'[Exec Orq] Restaurar Payload Priorizacao\').all().find(o => o.json.demanda_id === $json.id).json.tier_agente }}' },
        { key: 'versao_sop_aplicada|rich_text',  type: 'rich_text', textContent: '={{ $(\'[Exec Orq] Restaurar Payload Priorizacao\').all().find(o => o.json.demanda_id === $json.id).json.versao_sop_aplicada }}' },
      ],
    },
  },
  credentials: {
    notionApi: { id: '<credential_id_redacted>', name: 'Notion account' },
  },
}
```

**Explicação do `.all().find()`:** após o Notion `Atualizar Demanda Priorizada` rodar, `$json` é a Demanda atualizada (`$json.id` = page.id da Demanda). O `Restaurar Payload Priorizacao` upstream tem N items com `demanda_id` no top-level — find casa com o item correspondente.

## Refactor do Code node upstream

### `[Exec Orq] Calcular Prioridade Pro` (id `exec-orq-prioridade`)

**Antes:** `update_body` e `event_body` aninhados no output.

**Depois:** campos avulsos no top-level. Output esperado pelos templates acima:

```js
const pickText = (prop) => (prop?.rich_text || []).map((part) => part.plain_text || '').join('').trim();
const pickSelect = (prop) => prop?.select?.name || prop?.status?.name || '';
const pickTitle = (page) => {
  for (const prop of Object.values(page.properties || {})) {
    if (prop?.type === 'title') return (prop.title || []).map((part) => part.plain_text || '').join('').trim();
  }
  return '';
};
const utcNow = () => new Date().toISOString().slice(0, 10);
const execId = (prefix) => prefix + '-' + $execution.id;
const compactJson = (value) => JSON.stringify(value);

const sopFromItems = (items) => {
  const pages = items.map((item) => item.json || {}).filter((page) => !page.archived && !page.is_archived);
  const vigente = pages.find((page) => {
    const props = page.properties || {};
    return pickSelect(props.area) === 'Execucao' && pickSelect(props.estado) === 'Vigente';
  });
  if (!vigente) throw new Error('SOP Vigente de area Execucao nao encontrada');
  return { id: vigente.id, titulo: pickTitle(vigente), versao: pickText((vigente.properties || {}).versao) || 'v1.0' };
};

const sopData = sopFromItems($('[Exec Orq] Buscar SOP Vigente').all());
const execution_id = execId('EXEC-EXEC-ORQ');
const tenant_id = 'phi-agencia';
const ts = utcNow();
if (!ts || !/^\d{4}-\d{2}-\d{2}$/.test(ts)) {
  throw new Error('data invalida produzida por utcNow: ' + JSON.stringify(ts));
}

const demandaPages = $input.all().map((item) => item.json || {}).filter((page) => !page.archived && !page.is_archived);

const priorityFor = (classe_sla) => {
  if (classe_sla === 'Critica') return 100;
  if (classe_sla === 'Recorrente diaria') return 50;
  if (classe_sla === 'Recorrente semanal') return 30;
  if (classe_sla === 'Ad-hoc padrao') return 20;
  return 20;
};

const out = [];
for (const page of demandaPages) {
  const demanda_id = page.id;
  if (!demanda_id) throw new Error('[Calcular Prioridade Pro] page.id ausente — Buscar Demandas Abertas retornou item sem id (alwaysOutputData removido — checar filtros)');
  const props = page.properties || {};
  const tipo = pickSelect(props.tipo);
  const classe_sla = pickSelect(props.classe_sla);
  const client_id = pickText(props.client_id);
  const prioridade = priorityFor(classe_sla);
  const payload = {
    tenant_id,
    client_id,
    execution_id,
    versao_sop_aplicada: sopData.id,
    demanda_id,
    tipo,
    classe_sla,
    prioridade,
    prioridade_origem: 'agente',
    estado: 'Priorizada',
    tier_agente: 'pro',
  };
  out.push({
    json: {
      demanda_id,
      novo_estado: 'Priorizada',
      prioridade,
      prioridade_origem: 'agente',
      versao_sop_aplicada: sopData.id,
      evento_tipo: 'demanda.priorizada',
      entidade_id: demanda_id,
      entidade_area: 'Execucao',
      payload_json: compactJson(payload),
      timestamp: ts,
      execution_id,
      tenant_id,
      tier_agente: 'pro',
    }
  });
}
return out;
```

Mudanças vs. original:
- Removidos `update_body` e `event_body` (Notion native monta internamente via propertyValues).
- Expostos `novo_estado`, `prioridade`, `prioridade_origem`, `versao_sop_aplicada` (consumidos pelo update via expressions).
- Expostos `evento_tipo`, `entidade_id`, `payload_json`, `timestamp`, `execution_id`, `tenant_id`, `tier_agente` (consumidos pelo create de evento via `.all().find()`).
- Guard `if (!demanda_id) throw` (Fix 4).
- Guard `ts` regex `YYYY-MM-DD` (Fix 4).
- `utcNow` date-only (Fix 3).
- Removidas funções não usadas (`brDate`, `brDue`, `richText`, `title`, `eventBody`).

### `[Exec Orq] Restaurar Payload Priorizacao` (id `exec-orq-restaurar`)

**Não tocar.** Continua `return $('[Exec Orq] Calcular Prioridade Pro').all().map((item) => ({ json: item.json }));`. Output preservado: N items com `demanda_id` + campos avulsos, consumido pelo `.all().find()` downstream.

### `[Exec Orq] Normalizar SOP Vigente` (id `exec-orq-sop-normalize`)

**Não tocar.** Continua produzindo `{ sop_vigente, versao_sop_aplicada, tenant_id, execution_id }`. Esse output não é diretamente consumido pelos updates/creates downstream (são consumidos pelo `Calcular Prioridade Pro` via `$('Buscar SOP Vigente').all()`).

## Constantes em `generate_export.js`

**Não precisa adicionar nada.** `DB_EVENTOS_PAGE` e `DB_EVENTOS_NAME` já existem (vieram do `a04-qg-fix-1`). O update do Orq usa `pageId` dinâmico (`$json.demanda_id`), não precisa de constante de DB.

**Importante:** QG e Intake continuam intactos. `generate_export.js` deve produzir o Orq refatorado + os outros 2 INALTERADOS.

## Fix 1: alwaysOutputData nos search nodes do Orquestrador

Em `[Exec Orq] Buscar SOP Vigente` e `[Exec Orq] Buscar Demandas Abertas`:

```diff
- "alwaysOutputData": true
+ "alwaysOutputData": false
```

(Equivalente: omitir a chave inteiramente.)

## NÃO fazer

- ❌ Não tocar QualityGate (em produção)
- ❌ Não tocar Intake
- ❌ Não tocar Schedule, Manual Trigger, Merge Triggers, Gemini Pro, IF (não tem IF no Orq) — preservar byte-a-byte
- ❌ Não tocar `Buscar SOP Vigente` nem `Buscar Demandas Abertas` (exceto `alwaysOutputData`)
- ❌ Não tocar `Normalizar SOP Vigente` nem `Restaurar Payload Priorizacao` (jsCodes preservados)
- ❌ Não mudar topologia (`connections`)
- ❌ Não introduzir `Notion-Version` headers
- ❌ Não criar credencial Notion nova
- ❌ Não mudar `active: false` nem `timezone` (`America/Sao_Paulo`) nem schedule (08:00 diário)
- ❌ Não tocar `Merge Triggers` `numberInputs: 2`

## ps1 — checks novos

Adicionar bloco escopado ao Orq em `onboarding/execucao_lote1_tests.ps1`:

```powershell
# === a04-orq ===
$orqWf = Join-Path $base 'orquestrador/workflow.json'
$rawOrq = [System.IO.File]::ReadAllText($orqWf, [System.Text.Encoding]::UTF8)
$wfOrq = $rawOrq | ConvertFrom-Json
$orqMap = @{}
foreach ($n in $wfOrq.nodes) { $orqMap[$n.name] = $n }

# 0 HTTP Request pra api.notion.com no Orq
$httpNotionOrq = $wfOrq.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.httpRequest' -and
  $_.parameters.url -is [string] -and
  $_.parameters.url.Contains('api.notion.com')
}
if ($httpNotionOrq) { throw "orquestrador/workflow.json still has HTTP Request to api.notion.com (a04-orq refactor incomplete)" }

# 1 Notion update + 1 Notion create
$notionUpdate = $wfOrq.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'update'
}
$notionCreate = $wfOrq.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'create'
}
if ($notionUpdate.Count -ne 1) { throw "Orq expected 1 Notion update node, got $($notionUpdate.Count)" }
if ($notionCreate.Count -ne 1) { throw "Orq expected 1 Notion create node, got $($notionCreate.Count)" }

foreach ($n in $notionUpdate) {
  if (-not $n.parameters.pageId) { throw "Orq Notion update '$($n.name)' missing pageId" }
  if ($n.parameters.pageId.mode -ne 'id') { throw "Orq Notion update '$($n.name)' pageId.mode != 'id'" }
}
foreach ($n in $notionCreate) {
  $dbVal = $n.parameters.databaseId.value
  if (-not ($dbVal -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')) {
    throw "Orq Notion node '$($n.name)' databaseId.value not UUID: $dbVal"
  }
  if ($dbVal -eq '3423df0d-77df-4834-bdda-c08ddbae40ff') {
    throw "Orq Notion '$($n.name)' uses Eventos data_source_id ($dbVal) instead of page_id (c64f600e-...)"
  }
}

# alwaysOutputData false/ausente nos 2 search nodes
$searchOrq = $wfOrq.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'getAll'
}
foreach ($n in $searchOrq) {
  if ($n.alwaysOutputData -eq $true) {
    throw "Orq node '$($n.name)' has alwaysOutputData=true (a04-orq fix #1)"
  }
}

# Calcular Prioridade Pro: sem update_body, sem event_body, com guards
$prioridadeCode = [string]$orqMap['[Exec Orq] Calcular Prioridade Pro'].parameters.jsCode
if ($prioridadeCode.Contains('update_body')) {
  throw "Orq Calcular Prioridade Pro ainda tem update_body — refactor incompleto"
}
if ($prioridadeCode.Contains('event_body')) {
  throw "Orq Calcular Prioridade Pro ainda tem event_body — refactor incompleto"
}
if (-not $prioridadeCode.Contains('if (!demanda_id) throw')) {
  throw "Orq Calcular Prioridade Pro sem guard demanda_id (fix #4)"
}
if (-not $prioridadeCode.Contains('.toISOString().slice(0, 10)')) {
  throw "Orq Calcular Prioridade Pro utcNow nao date-only (fix #3)"
}
if (-not $prioridadeCode.Contains("novo_estado: 'Priorizada'")) {
  throw "Orq Calcular Prioridade Pro sem novo_estado no top-level"
}

# Restaurar Payload Priorizacao preservado
$restaurarCode = [string]$orqMap['[Exec Orq] Restaurar Payload Priorizacao'].parameters.jsCode
if (-not $restaurarCode.Contains("`$('[Exec Orq] Calcular Prioridade Pro').all().map")) {
  throw "Orq Restaurar Payload Priorizacao foi alterado (deveria estar intocado)"
}

# Criar Evento Notion create usa .all().find() pareando por demanda_id
$createEvent = $orqMap['[Exec Orq] Criar Evento demanda.priorizada']
$dynamicWithFind = 0
foreach ($p in $createEvent.parameters.propertiesUi.propertyValues) {
  if ($p.key -eq 'entidade_area|select') { continue }
  $val = if ($p.title) { $p.title } elseif ($p.textContent) { $p.textContent } elseif ($p.selectValue) { $p.selectValue } elseif ($p.date) { $p.date } else { '' }
  if ($val -is [string] -and $val.StartsWith('=')) {
    if (-not $val.Contains("`$('[Exec Orq] Restaurar Payload Priorizacao').all().find")) {
      throw "Orq Criar Evento property '$($p.key)' nao usa .all().find (fix #2)"
    }
    if (-not $val.Contains("o.json.demanda_id === `$json.id")) {
      throw "Orq Criar Evento property '$($p.key)' nao pareia por demanda_id (fix #2)"
    }
    $dynamicWithFind++
  }
}
if ($dynamicWithFind -ne 8) {
  throw "Orq Criar Evento esperava 8 expressions dinamicos via .all().find(), got $dynamicWithFind"
}
```

Não introduzir checks idênticos ao Orq nos blocos do QG/Intake.

## Critérios de aceite

- [ ] 0 nodes `n8n-nodes-base.httpRequest` com URL `api.notion.com` em `orquestrador/workflow.json`
- [ ] 2 HTTPs antigos substituídos: 1 Notion `databasePage.update` (Demanda) + 1 Notion `databasePage.create` (Evento em PHI - Eventos)
- [ ] Nodes preservados byte-a-byte: Schedule, Manual Trigger, Merge Triggers (numberInputs:2), Buscar SOP + Buscar Demandas Abertas (exceto `alwaysOutputData`), Normalizar SOP Vigente, Gemini Pro, Restaurar Payload Priorizacao
- [ ] `Calcular Prioridade Pro` produz campos avulsos (sem `update_body`, sem `event_body`), com `novo_estado='Priorizada'`, guard `demanda_id`, `utcNow` date-only
- [ ] `Atualizar Demanda Priorizada` (Notion update) tem 4 propertyValues exatos (prioridade, prioridade_origem, estado, versao_sop_aplicada) com expressions `$json.<campo>`
- [ ] `Criar Evento demanda.priorizada` (Notion create) tem 9 propertyValues; 8 dinâmicos via `.all().find()` pareando por `demanda_id`, 1 fixo (`entidade_area='Execucao'`)
- [ ] `alwaysOutputData` ausente ou `false` nos 2 search nodes
- [ ] `generate_export.js`: nenhuma constante nova (DB_EVENTOS_* já existem)
- [ ] `onboarding/execucao_lote1_tests.ps1` ganha checks escopados ao Orq e passa verde
- [ ] sandbox==workflow byte-a-byte (sha256 igual) só pro Orq
- [ ] Sem BOM, sem secrets, sem mojibake
- [ ] `active: false` mantido
- [ ] Cada Notion novo tem `credentials.notionApi.id: '<credential_id_redacted>'`
- [ ] **QG e Intake NÃO mudaram** (`git diff` mostra zero alterações em `qualitygate-pacing/` e `intake-pacing/`)

## Commit + push + verificação

```bash
git add onboarding/execucao/lote1/orquestrador/ \
        onboarding/execucao/lote1/generate_export.js \
        onboarding/execucao_lote1_tests.ps1
git status --short  # confirme que qualitygate-pacing/ e intake-pacing/ NÃO aparecem
git commit -m "exec-lote1 a04-orq: refactor HTTP Notion -> Notion native v2.2 no Orquestrador (aplica aprendizados do QG)"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Depois disso o Olavo configura credencial Notion nos 2 Notion novos do Orq no n8n, dispara via Manual Trigger pra smoke isolado — deve atualizar N demandas em `Aberta` → `Priorizada` (com prioridade calculada via priorityFor) + criar N eventos `demanda.priorizada` em DB Eventos. Pré-req: ter ≥1 demanda manual no DB Demandas com `estado='Aberta'`. **Smoke do Orq verde → Lote 1 Execução de Demandas FECHA.**

--- END COPY ---
