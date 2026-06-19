# Brief Codex — Execução Lote 2 `a05-padronizador` (sub-WF + refactor QG)

> **Escopo:** Batch 2 do Lote 2. Criar novo sub-WF `WF-EXEC-Padronizador-Flash` (Execute Workflow Trigger) movendo a lógica do quality-gate de dentro do QG pra um agente isolado, e refatorar o QG pra delegar via Execute Workflow node. Sem mudança funcional E2E — refactor arquitetural puro.
>
> **Pré-requisito:** `a05-relations` (Batch 1) ATIVO em produção. Schema `versao_sop_aplicada` é `relation`; 3 demandas existentes têm relation populado.
>
> **Pré-leitura:** `docs/strategic-planning/execucao-demandas/BRUTO-v0.4-design.md` §2 (arquitetura sub-WF) + §4 (SOP Padronizador) + §5 (plano de execução).

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `a05-padronizador` da Execução Lote 2 — extrair lógica de quality-gate do QG pra novo sub-WF `WF-EXEC-Padronizador-Flash` chamado via Execute Workflow.

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** HEAD mais novo após `a05-relations` em produção (`git fetch origin claude/agentic-agency-planning-KwJEw` antes).
- **Arquivos a tocar:**
  - **NOVO:** `onboarding/execucao/lote1/padronizador/{workflow.json,sandbox_export.json}`
  - `onboarding/execucao/lote1/qualitygate-pacing/{workflow.json,sandbox_export.json}` — refactor (remove 3 nodes, adiciona 2)
  - `onboarding/execucao/lote1/generate_export.js` — adiciona gerador do Padronizador
  - `onboarding/execucao_lote1_tests.ps1` — checks novos pro sub-WF + topologia nova do QG
- **Arquivos a NÃO tocar:** `intake-pacing/**`, `orquestrador/**` (Lote 1 ATIVO, sem mudança no Batch 2).

## Pré-flight obrigatório

Use `mcp__n8n__get_node_types` pra:
1. `n8n-nodes-base.executeWorkflowTrigger` — confirma `parameters` (espera input shape definido? aceita "always pass"?).
2. `n8n-nodes-base.executeWorkflow` — confirma `parameters` (`workflowId` formato, `mode`, como passar items upstream pro sub-WF).

Documente as escolhas no commit. Sugiro `executeWorkflow` modo `Run Each Item Once` (default) — passa cada item upstream individualmente pro sub-WF e agrega outputs.

## Arquitetura nova

### Antes (QG Lote 1, em produção pós a05-relations)

```
Schedule 5min
  → Buscar SOP Vigente
  → Buscar Demandas Em Revisao
  → Montar Evento demanda.em_revisao (Code)
  → Criar Evento demanda.em_revisao (Notion create)
  → Validar DoD Pacing Flash (Code)         ◄── MOVE PRO SUB-WF
  → Gemini Flash DoD Pacing                 ◄── MOVE PRO SUB-WF
  → Restaurar Payload DoD (Code)            ◄── MOVE PRO SUB-WF
  → Resultado PASS? (IF)
  → {Marcar Entregue / Reabrir Demanda} → Criar Evento entregue/reaberta → Telegram
```

### Depois (QG Lote 2)

```
Schedule 5min
  → Buscar SOP Vigente
  → Buscar Demandas Em Revisao
  → Montar Evento demanda.em_revisao (Code)
  → Criar Evento demanda.em_revisao (Notion create)
  → Preparar Input Padronizador (Code, NOVO)  ◄── extrai contexto pro sub-WF
  → Chamar Padronizador (Execute Workflow, NOVO)  ◄── dispara sub-WF
  → Resultado PASS? (IF)
  → {Marcar Entregue / Reabrir Demanda} → Criar Evento entregue/reaberta → Telegram
```

### Novo sub-WF: WF-EXEC-Padronizador-Flash

```
Execute Workflow Trigger (entrada do QG)
  → Validar DoD Pacing (Code, jsCode movido do QG)
  → Gemini Flash DoD Pacing (decorativo, continueOnFail)
  → Restaurar Payload (Code, return $('Validar').all().map)
  → [output retorna pro QG]
```

## Conteúdo do novo `WF-EXEC-Padronizador-Flash`

Crie em `onboarding/execucao/lote1/padronizador/workflow.json` (gerado pelo `generate_export.js`):

| Node | id | type | typeVersion | Função |
|---|---|---|---|---|
| `[Exec Padr] Execute Workflow Trigger` | `exec-padr-trigger` | `n8n-nodes-base.executeWorkflowTrigger` | (confirmar via pré-flight) | Recebe input do QG (1 item por demanda) |
| `[Exec Padr] Validar DoD Pacing` | `exec-padr-validar` | `n8n-nodes-base.code` | 2 | Lógica do `Validar DoD Pacing Flash` atual do QG — sem mudança funcional |
| `[Exec Padr] Gemini Flash DoD Pacing` | `exec-padr-gemini` | `@n8n/n8n-nodes-langchain.googleGemini` | 1.2 | Decorativo (mesma config do QG: `gemini-2.5-flash`, `continueOnFail:true`) |
| `[Exec Padr] Restaurar Payload` | `exec-padr-restaurar` | `n8n-nodes-base.code` | 2 | `return $('[Exec Padr] Validar DoD Pacing').all().map((item) => ({ json: item.json }));` |

**Topologia:** Trigger → Validar → Gemini → Restaurar (chain linear).

**Input esperado** (passado pelo QG via Execute Workflow):
- `$json.demanda_page_id` (page.id da demanda em revisão)
- `$json.observacoes` (texto pra validar contra regex)
- `$json.sop_id` (page.id do SOP Vigente — pra preencher `versao_sop_aplicada` no output)
- `$json.client_id`, `$json.tipo`, `$json.classe_sla` (contexto pro payload do evento)

**Output do `[Exec Padr] Validar DoD Pacing` (jsCode):** Adapta o jsCode atual do QG pra ler input do Execute Workflow Trigger em vez de `$('Buscar Demandas Em Revisao').all()`. Output expõe: `demanda_id`, `quality_gate`, `novo_estado`, `versao_sop_aplicada`, `evento_tipo`, `entidade_id`, `entidade_area`, `payload_json`, `timestamp` (date-only), `execution_id`, `tenant_id`, `tier_agente:'flash'`, `text`, `missing?` — exatamente o shape que o QG espera hoje pós `Restaurar Payload DoD`.

JsCode do `[Exec Padr] Validar DoD Pacing` (refator do QG atual):

```js
const utcNow = () => new Date().toISOString().slice(0, 10);
const compactJson = (value) => JSON.stringify(value);
const execId = (prefix) => prefix + '-' + $execution.id;

const execution_id = execId('EXEC-EXEC-PADR');
const tenant_id = 'phi-agencia';
const ts = utcNow();
if (!ts || !/^\d{4}-\d{2}-\d{2}$/.test(ts)) {
  throw new Error('data invalida produzida por utcNow: ' + JSON.stringify(ts));
}

const checklist = [
  'Diagnostico da anomalia',
  'Acao tomada OU justificativa',
  'Registro de impacto esperado',
  'Audit (execution_id + fonte)',
];

const out = [];
for (const item of $input.all()) {
  const ctx = item.json || {};
  const demanda_id = ctx.demanda_page_id;
  if (!demanda_id) throw new Error('[Padronizador] demanda_page_id ausente no input do Execute Workflow');
  const observacoes = (ctx.observacoes || '').toLowerCase();
  const hasDiagnostico = /diagnostico|anomalia/.test(observacoes);
  const hasAcao = /acao tomada|ajuste|pausad|reduz|aument|justificativa|sem acao necessaria/.test(observacoes);
  const hasImpacto = /impacto esperado|impacto/.test(observacoes);
  const hasAudit = /execution_id|fonte/.test(observacoes);
  const checks = [
    { item: checklist[0], ok: hasDiagnostico },
    { item: checklist[1], ok: hasAcao },
    { item: checklist[2], ok: hasImpacto },
    { item: checklist[3], ok: hasAudit },
  ];
  const missing = checks.filter((c) => !c.ok).map((c) => c.item);
  const quality_gate = missing.length === 0 ? 'pass' : 'fail';
  const tipo = ctx.tipo || 'Pacing/verba';
  const classe_sla = ctx.classe_sla || 'Critica';
  const client_id = ctx.client_id || '';
  const versao_sop_aplicada = ctx.sop_id;
  const basePayload = { tenant_id, client_id, execution_id, versao_sop_aplicada, demanda_id, tipo, classe_sla, quality_gate, checklist: checks, tier_agente: 'flash' };
  if (quality_gate === 'pass') {
    out.push({ json: { demanda_id, quality_gate, novo_estado: 'Entregue', versao_sop_aplicada, evento_tipo: 'demanda.entregue', entidade_id: demanda_id, entidade_area: 'Execucao', payload_json: compactJson(basePayload), timestamp: ts, execution_id, tenant_id, tier_agente: 'flash', text: 'PASS demanda ' + demanda_id } });
  } else {
    out.push({ json: { demanda_id, quality_gate, novo_estado: 'Em execucao', versao_sop_aplicada, evento_tipo: 'demanda.reaberta', entidade_id: demanda_id, entidade_area: 'Execucao', payload_json: compactJson({ ...basePayload, missing }), timestamp: ts, execution_id, tenant_id, tier_agente: 'flash', missing, text: '<b>Quality gate FAIL</b>\nDemanda: ' + demanda_id + '\nFaltam:\n- ' + missing.join('\n- ') } });
  }
}
return out;
```

JsCode do `[Exec Padr] Restaurar Payload`:

```js
return $('[Exec Padr] Validar DoD Pacing').all().map((item) => ({ json: item.json }));
```

## Refactor do QG (qualitygate-pacing/workflow.json)

### Remover (3 nodes):
- `exec-qg-validar` — `[Exec QG] Validar DoD Pacing Flash`
- `exec-qg-gemini` — `[Exec QG] Gemini Flash DoD Pacing`
- `exec-qg-restaurar` — `[Exec QG] Restaurar Payload DoD`

### Adicionar (2 nodes novos):

**Node A: `[Exec QG] Preparar Input Padronizador`** (Code):

```js
// Pega cada demanda (do node Criar Evento em_revisao upstream — Notion native substituiu $json com page do evento)
// Usa .all().find() pra recuperar dados originais da demanda via Buscar Demandas Em Revisao
// Extrai contexto necessário pro Padronizador
const sopData = (() => {
  const items = $('[Exec QG] Buscar SOP Vigente').all();
  for (const item of items) {
    const page = item.json || {};
    if (page.archived || page.is_archived) continue;
    const props = page.properties || {};
    const area = props.area?.select?.name || '';
    const estado = props.estado?.select?.name || '';
    if (area === 'Execucao' && estado === 'Vigente') {
      return { id: page.id };
    }
  }
  throw new Error('[Preparar Input Padronizador] SOP Vigente Execucao nao encontrada');
})();

const out = [];
for (const item of $input.all()) {
  const evento = item.json || {};
  // entidade_id no evento criado aponta pra page.id da demanda
  const demanda_id = evento?.properties?.entidade_id?.rich_text?.[0]?.text?.content;
  if (!demanda_id) throw new Error('[Preparar Input Padronizador] entidade_id ausente no evento criado');
  // Recupera demanda original via .all().find() (pareamento canônico Aprendizado 2026-06-18)
  const demanda = $('[Exec QG] Buscar Demandas Em Revisao').all().find((d) => d.json?.id === demanda_id);
  if (!demanda) throw new Error('[Preparar Input Padronizador] demanda nao encontrada pra entidade_id=' + demanda_id);
  const dp = demanda.json?.properties || {};
  const observacoes = (dp.observacoes?.rich_text || []).map((part) => part.plain_text || '').join('').trim();
  const client_id = (dp.client_id?.rich_text || []).map((part) => part.plain_text || '').join('').trim();
  const tipo = dp.tipo?.select?.name || 'Pacing/verba';
  const classe_sla = dp.classe_sla?.select?.name || 'Critica';
  out.push({ json: { demanda_page_id: demanda_id, observacoes, client_id, tipo, classe_sla, sop_id: sopData.id } });
}
return out;
```

**Node B: `[Exec QG] Chamar Padronizador`** (Execute Workflow):

Confirmar formato exato via pré-flight, mas provavelmente:

```js
{
  id: 'exec-qg-chamar-padronizador',
  name: '[Exec QG] Chamar Padronizador',
  type: 'n8n-nodes-base.executeWorkflow',
  typeVersion: 1.2,  // confirmar via get_node_types
  position: [<mesma posição do Validar DoD removido>],
  parameters: {
    source: 'database',  // ou 'parameter' com workflowId direto — confirmar
    workflowId: {
      __rl: true,
      mode: 'list',
      value: '<workflow_id_padronizador_pending>',  // placeholder até Olavo importar e capturar ID
      cachedResultName: 'WF-EXEC-Padronizador-Flash',
    },
    options: {},
  },
}
```

### Topologia nova do QG (connections atualizadas)

Substituir o trecho:

```
Criar Evento demanda.em_revisao → Validar DoD Pacing Flash → Gemini Flash → Restaurar Payload DoD → Resultado PASS?
```

Por:

```
Criar Evento demanda.em_revisao → Preparar Input Padronizador → Chamar Padronizador → Resultado PASS?
```

Resto da topologia preservada byte-a-byte (Schedule → Buscar SOP → Buscar Demandas → Montar Evento em_revisao → Criar Evento em_revisao → ... → IF → Marcar Entregue/Reabrir → Criar Evento entregue/reaberta → Telegram).

## NÃO fazer

- ❌ Não tocar Intake-Pacing (intocado)
- ❌ Não tocar Orquestrador (intocado)
- ❌ Não tocar Schedule, Buscar SOP, Buscar Demandas Em Revisao, Montar Evento em_revisao, Criar Evento em_revisao, IF Resultado PASS?, Marcar Entregue, Reabrir Demanda, Criar Evento entregue, Criar Evento reaberta, Telegram Checklist FAIL (preservar byte-a-byte)
- ❌ Não tocar propertyValues do `versao_sop_aplicada` (já foi feito no a05-relations)
- ❌ Não criar credencial Notion nova (placeholders permanecem)
- ❌ Não mudar `active: false` nem timezone
- ❌ Não tocar nada de `intake-pacing/` nem `orquestrador/` (zero diff em `git diff`)
- ❌ Não mudar `EXEC_WEBHOOK_KEY` (ADR-19) — só Intake usa isso

## generate_export.js

Adicionar geração do novo `WF-EXEC-Padronizador-Flash` no mesmo padrão dos 3 atuais (templates, constantes, write workflow.json + sandbox_export.json em `padronizador/`). ADR-19 build-time injection já industrializada (helper `fromEnvOrRedacted`) — usar mesmo padrão.

## ps1 — checks novos

```powershell
# === a05-padronizador ===
$padrWf = Join-Path $base 'padronizador/workflow.json'
$rawPadr = [System.IO.File]::ReadAllText($padrWf, [System.Text.Encoding]::UTF8)
$wfPadr = $rawPadr | ConvertFrom-Json
$padrMap = @{}
foreach ($n in $wfPadr.nodes) { $padrMap[$n.name] = $n }

# Sub-WF tem 4 nodes
if ($wfPadr.nodes.Count -ne 4) { throw "Padronizador expected 4 nodes, got $($wfPadr.nodes.Count)" }

# Execute Workflow Trigger presente
$trigger = $padrMap['[Exec Padr] Execute Workflow Trigger']
if (-not $trigger) { throw "Padronizador missing Execute Workflow Trigger" }
if ($trigger.type -ne 'n8n-nodes-base.executeWorkflowTrigger') {
  throw "Padronizador trigger type incorrect: $($trigger.type)"
}

# Validar DoD Pacing com guards e date-only
$validar = [string]$padrMap['[Exec Padr] Validar DoD Pacing'].parameters.jsCode
if (-not $validar.Contains('if (!demanda_id) throw')) {
  throw "Padronizador Validar DoD sem guard demanda_id"
}
if (-not $validar.Contains('.toISOString().slice(0, 10)')) {
  throw "Padronizador Validar DoD utcNow nao date-only"
}
if (-not $validar.Contains("evento_tipo: 'demanda.entregue'") -or -not $validar.Contains("evento_tipo: 'demanda.reaberta'")) {
  throw "Padronizador Validar DoD sem ambos evento_tipo (entregue + reaberta)"
}

# Restaurar Payload preservado
$restaurar = [string]$padrMap['[Exec Padr] Restaurar Payload'].parameters.jsCode
if (-not $restaurar.Contains("`$('[Exec Padr] Validar DoD Pacing').all().map")) {
  throw "Padronizador Restaurar Payload formato incorreto"
}

# active:false, timezone Sao_Paulo (padrão)
if ($wfPadr.active -ne $false) { throw "Padronizador active deve ser false" }

# === QG refactor checks ===

# 3 nodes removidos do QG
$qgRemovidos = @('[Exec QG] Validar DoD Pacing Flash', '[Exec QG] Gemini Flash DoD Pacing', '[Exec QG] Restaurar Payload DoD')
foreach ($name in $qgRemovidos) {
  if ($qgMap.ContainsKey($name)) { throw "QG ainda tem $name (deveria ter sido removido no a05-padronizador)" }
}

# 2 nodes adicionados no QG
$qgAdicionados = @('[Exec QG] Preparar Input Padronizador', '[Exec QG] Chamar Padronizador')
foreach ($name in $qgAdicionados) {
  if (-not $qgMap.ContainsKey($name)) { throw "QG missing $name (deveria ter sido adicionado no a05-padronizador)" }
}

# Chamar Padronizador é Execute Workflow
$chamar = $qgMap['[Exec QG] Chamar Padronizador']
if ($chamar.type -ne 'n8n-nodes-base.executeWorkflow') {
  throw "QG Chamar Padronizador type incorrect: $($chamar.type)"
}

# Topologia: Criar Evento em_revisao → Preparar Input → Chamar Padronizador → Resultado PASS?
$conn = $wfQg.connections
$proxNoCriarEvento = $conn.'[Exec QG] Criar Evento demanda.em_revisao'.main[0][0].node
if ($proxNoCriarEvento -ne '[Exec QG] Preparar Input Padronizador') {
  throw "QG topologia: Criar Evento em_revisao deveria conectar em Preparar Input Padronizador (got $proxNoCriarEvento)"
}
$proxNoPreparar = $conn.'[Exec QG] Preparar Input Padronizador'.main[0][0].node
if ($proxNoPreparar -ne '[Exec QG] Chamar Padronizador') {
  throw "QG topologia: Preparar Input deveria conectar em Chamar Padronizador"
}
$proxNoChamar = $conn.'[Exec QG] Chamar Padronizador'.main[0][0].node
if ($proxNoChamar -ne '[Exec QG] Resultado PASS?') {
  throw "QG topologia: Chamar Padronizador deveria conectar em Resultado PASS?"
}

# Sub-WF padronizador credentials Notion não necessárias (não há Notion nodes no Padronizador)
$notionInPadr = $wfPadr.nodes | Where-Object { $_.type -eq 'n8n-nodes-base.notion' }
if ($notionInPadr) { throw "Padronizador sub-WF nao deveria ter Notion nodes (so Code + Gemini)" }

# Sub-WF sandbox == workflow
$padrSandbox = Join-Path $base 'padronizador/sandbox_export.json'
$shaPadrWf = (Get-FileHash $padrWf -Algorithm SHA256).Hash
$shaPadrSandbox = (Get-FileHash $padrSandbox -Algorithm SHA256).Hash
if ($shaPadrWf -ne $shaPadrSandbox) {
  throw "Padronizador sandbox_export.json != workflow.json (SHA mismatch)"
}
```

## Critérios de aceite

- [ ] Novo arquivo `onboarding/execucao/lote1/padronizador/workflow.json` criado
- [ ] Novo arquivo `onboarding/execucao/lote1/padronizador/sandbox_export.json` criado (SHA igual ao workflow.json)
- [ ] Padronizador tem 4 nodes (Trigger + Validar + Gemini + Restaurar) com tipos corretos
- [ ] Padronizador `active: false` (Olavo activate depois do smoke)
- [ ] QG perdeu 3 nodes (`Validar DoD Pacing Flash`, `Gemini Flash DoD Pacing`, `Restaurar Payload DoD`) e ganhou 2 (`Preparar Input Padronizador`, `Chamar Padronizador`)
- [ ] Topologia do QG: `Criar Evento em_revisao → Preparar Input → Chamar Padronizador → Resultado PASS?` (resto byte-a-byte preservado)
- [ ] Intake e Orq: zero diff em `git diff`
- [ ] `generate_export.js` ganha geração do Padronizador no mesmo padrão dos 3 atuais (ADR-19 helper)
- [ ] ps1 ganha checks novos pro sub-WF + topologia do QG
- [ ] Sem BOM, sem secrets, sem mojibake
- [ ] QG/Padronizador credenciais redacted (`<credential_id_redacted>`, `<GEMINI_CREDENTIAL_ID_redacted>`)

## Commit + push + verificação

```bash
git add onboarding/execucao/lote1/padronizador/ \
        onboarding/execucao/lote1/qualitygate-pacing/ \
        onboarding/execucao/lote1/generate_export.js \
        onboarding/execucao_lote1_tests.ps1
git status --short  # confirme que intake-pacing/ e orquestrador/ NÃO aparecem
git commit -m "exec-lote2 a05-padronizador: sub-WF Padronizador-Flash + refactor QG delega via Execute Workflow"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA + qual `typeVersion` do `executeWorkflow`/`executeWorkflowTrigger` foi usado. Depois:
1. Olavo importa o novo `WF-EXEC-Padronizador-Flash` no n8n, captura o `workflow_id` real, atualiza o `Chamar Padronizador` no QG com esse ID.
2. Olavo re-importa o QG atualizado.
3. Smoke isolado: 2 demandas manuais no DB Demandas (1 PASS + 1 FAIL com observacoes adequados; ver SOP `Padronizador DoD Pacing v1.0` no DB SOPs pra checklist).
4. Esperado idêntico ao Lote 1: PASS=Entregue + 2 eventos em PHI - Eventos; FAIL=Em execucao + 2 eventos + Telegram com checklist.
5. Verde → activate Padronizador + QG → **Lote 2 Execução CONCLUÍDO**.

--- END COPY ---
