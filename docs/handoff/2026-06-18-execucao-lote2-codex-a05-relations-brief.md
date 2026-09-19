# Brief Codex — Execução Lote 2 `a05-relations` (versao_sop_aplicada text → relation)

> **Escopo:** Batch 1 do Lote 2. Refatorar **apenas** o propertyValue de `versao_sop_aplicada` nos 4 nodes Notion native v2.2 dos 3 WFs Execução (rich_text → relation). Schema do DB `PHI - Demandas` já foi migrado (2026-06-18 via MCP). 3 demandas existentes já foram atualizadas com a relation correta. Padronizador como sub-WF fica pro Batch 2 (`a05-padronizador`).
>
> **Pré-leitura:** `docs/strategic-planning/execucao-demandas/BRUTO-v0.4-design.md` §3 (mudança schema e impacto nos WFs).

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `a05-relations` da Execução Lote 2 — refatorar `versao_sop_aplicada` de `rich_text` para `relation` nos 4 propertyValues que escrevem nesse campo nos 3 WFs Execução Lote 1.

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** HEAD mais novo (`git fetch origin claude/agentic-agency-planning-KwJEw` antes)
- **Arquivos a tocar:** SÓ `onboarding/execucao/lote1/{intake-pacing,orquestrador,qualitygate-pacing}/{workflow.json,sandbox_export.json}` + `onboarding/execucao_lote1_tests.ps1` (checks novos). NÃO tocar `generate_export.js` (a refactor neste batch não muda constantes).
- **Schema do DB PHI - Demandas (já migrado 2026-06-18 via MCP Notion):** `versao_sop_aplicada` agora é `relation` apontando pra `PHI - SOPs` (data_source `bfeb1105-83a6-4e89-8d62-26607ebfcc8c`), com DUAL relation `Demandas que aplicaram este SOP` no lado do SOP.

## Pré-flight obrigatório

Antes de cristalizar o código do propertyValue, **chame `mcp__n8n__get_node_types` pro node `n8n-nodes-base.notion` v2.2 operation `databasePage.create` e `databasePage.update`** pra confirmar o formato exato de propertyValue quando `type='relation'`. Os formatos candidatos são:

```js
// Opção A (string única):
{ key: 'versao_sop_aplicada|relation', type: 'relation', mode: 'list', value: '={{ $json.versao_sop_aplicada }}' }

// Opção B (array de UUIDs):
{ key: 'versao_sop_aplicada|relation', type: 'relation', relationValue: ['={{ $json.versao_sop_aplicada }}'] }

// Opção C (Resource Locator igual databaseId):
{ key: 'versao_sop_aplicada|relation', type: 'relation', relationValue: { __rl: true, mode: 'list', value: '={{ $json.versao_sop_aplicada }}' } }
```

Use o que `get_node_types` mostrar como assinatura canônica. Documente a escolha no commit.

## Mapa dos 4 nodes a refatorar

Todos têm um propertyValue com `key: 'versao_sop_aplicada|rich_text'` hoje. Vai virar `relation` (com o formato confirmado no pré-flight).

| # | WF | Node | Operação |
|---|---|---|---|
| 1 | Intake-Pacing | `[Exec Intake] Criar Demanda` | `databasePage.create` (DB Demandas) |
| 2 | Orquestrador | `[Exec Orq] Atualizar Demanda Priorizada` | `databasePage.update` (DB Demandas) |
| 3 | QualityGate-Pacing | `[Exec QG] Marcar Entregue` | `databasePage.update` (DB Demandas) |
| 4 | QualityGate-Pacing | `[Exec QG] Reabrir Demanda` | `databasePage.update` (DB Demandas) |

**`versao_sop_aplicada` nos eventos (DB Eventos) NÃO muda:** continua `rich_text`. Eventos são log imutável; não precisa de relation. Esses ficam intocados:

- `[Exec Intake] Criar Evento demanda.criada` — sem mudança
- `[Exec Orq] Criar Evento demanda.priorizada` — sem mudança
- `[Exec QG] Criar Evento demanda.em_revisao` — sem mudança
- `[Exec QG] Criar Evento demanda.entregue` — sem mudança
- `[Exec QG] Criar Evento demanda.reaberta` — sem mudança

## Code nodes upstream

Nenhuma mudança no jsCode dos Code nodes (Preparar Demanda e Evento, Validar DoD Pacing Flash, Calcular Prioridade Pro). O valor passado pra `versao_sop_aplicada` continua sendo o `sopData.id` (UUID da page SOP Vigente) — só o formato de envio pro Notion native muda.

## NÃO fazer

- ❌ Não tocar nenhum outro propertyValue (só `versao_sop_aplicada` nos 4 nodes listados)
- ❌ Não tocar Code nodes upstream (jsCode preservado byte-a-byte)
- ❌ Não tocar `versao_sop_aplicada` nos creates de evento (continua rich_text)
- ❌ Não tocar `generate_export.js` (constantes inalteradas; ADR-19 build-time injection preservada)
- ❌ Não tocar topologia (connections), schedule, trigger, credentials, IDs n8n, active:false, timezone
- ❌ Não tocar `alwaysOutputData:false` (Lote 1 setou false; mantém)

## ps1 — checks novos

Adicionar bloco em `onboarding/execucao_lote1_tests.ps1`:

```powershell
# === a05-relations ===
# versao_sop_aplicada é relation nos 4 nodes do DB Demandas
$relationNodes = @{
  'intake' = '[Exec Intake] Criar Demanda'
  'orq' = '[Exec Orq] Atualizar Demanda Priorizada'
  'qg_entregue' = '[Exec QG] Marcar Entregue'
  'qg_reabrir' = '[Exec QG] Reabrir Demanda'
}

foreach ($key in $relationNodes.Keys) {
  $nodeName = $relationNodes[$key]
  if ($key -eq 'intake') { $wf = $wfIntake }
  elseif ($key -eq 'orq') { $wf = $wfOrq }
  else { $wf = $wfQg }
  $node = $wf.nodes | Where-Object { $_.name -eq $nodeName }
  if (-not $node) { throw "Node $nodeName not found" }
  $prop = $node.parameters.propertiesUi.propertyValues | Where-Object { $_.key -like 'versao_sop_aplicada*' }
  if (-not $prop) { throw "$nodeName: missing versao_sop_aplicada propertyValue" }
  if ($prop.key -ne 'versao_sop_aplicada|relation') {
    throw "$nodeName: versao_sop_aplicada key not 'relation' (got '$($prop.key)')"
  }
  if ($prop.type -ne 'relation') {
    throw "$nodeName: versao_sop_aplicada type not 'relation' (got '$($prop.type)')"
  }
}

# versao_sop_aplicada nos eventos continua rich_text
$eventNodes = @(
  '[Exec Intake] Criar Evento demanda.criada',
  '[Exec Orq] Criar Evento demanda.priorizada',
  '[Exec QG] Criar Evento demanda.em_revisao',
  '[Exec QG] Criar Evento demanda.entregue',
  '[Exec QG] Criar Evento demanda.reaberta'
)
foreach ($evName in $eventNodes) {
  $node = $null
  foreach ($wfTmp in @($wfIntake, $wfOrq, $wfQg)) {
    $found = $wfTmp.nodes | Where-Object { $_.name -eq $evName }
    if ($found) { $node = $found; break }
  }
  if (-not $node) { throw "Event node $evName not found" }
  $prop = $node.parameters.propertiesUi.propertyValues | Where-Object { $_.key -like 'versao_sop_aplicada*' }
  if (-not $prop) { throw "$evName: missing versao_sop_aplicada propertyValue" }
  if ($prop.key -ne 'versao_sop_aplicada|rich_text') {
    throw "$evName: versao_sop_aplicada in events must stay rich_text (got '$($prop.key)')"
  }
}
```

## Critérios de aceite

- [ ] 4 propertyValues `versao_sop_aplicada` em nodes do DB Demandas têm `key='versao_sop_aplicada|relation'`, `type='relation'` (formato exato confirmado via `get_node_types` pré-flight)
- [ ] 5 propertyValues `versao_sop_aplicada` em creates de evento continuam `key='versao_sop_aplicada|rich_text'`, `type='rich_text'`
- [ ] Code nodes upstream (Preparar Demanda e Evento, Validar DoD Pacing Flash, Calcular Prioridade Pro) byte-a-byte preservados
- [ ] sandbox_export.json == workflow.json (SHA256 igual) em cada um dos 3 WFs
- [ ] `git diff` em `generate_export.js` deve ser ZERO
- [ ] `git diff` em `intake-pacing/`, `orquestrador/`, `qualitygate-pacing/` mostra SÓ os 4 propertyValues mudados (+ ps1)
- [ ] Sem BOM, sem secrets, sem mojibake
- [ ] `active: false` mantido nos 3 WFs
- [ ] Topologia e credenciais inalteradas

## Commit + push + verificação

```bash
git add onboarding/execucao/lote1/intake-pacing/ \
        onboarding/execucao/lote1/orquestrador/ \
        onboarding/execucao/lote1/qualitygate-pacing/ \
        onboarding/execucao_lote1_tests.ps1
git status --short  # confirme que generate_export.js NÃO aparece
git commit -m "exec-lote2 a05-relations: versao_sop_aplicada rich_text -> relation nos 4 nodes do DB Demandas"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA + qual formato de relation propertyValue foi usado (A/B/C ou outro). Depois disso:
1. Olavo re-importa os 3 workflows no n8n.
2. Smoke isolado: POST webhook Intake (cria 1 demanda; `versao_sop_aplicada` deve aparecer como link clickável no Notion); Manual trigger no Orq (atualiza pra Priorizada com relation OK); criar 1 demanda Em revisao manual e esperar QG (pass + fail; relação preservada).
3. Critério de fechamento do `a05-relations`: as 3 demandas pós-smoke têm relation visível como link no DB Demandas.
4. Verde → abro brief `a05-padronizador` (Batch 2 do Lote 2 — sub-WF + refactor QG).

--- END COPY ---
