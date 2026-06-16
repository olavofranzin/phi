# Brief Codex — Execução Lote 1 `a02` (fix bugs bloqueantes da pré-revisão Claude)

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: implementar `a02` do Lote 1 da Execução de Demandas, corrigindo 3 bugs bloqueantes detectados pela pré-revisão Claude do `a01` (commit `0f03469`).

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** o HEAD mais novo (`git fetch origin claude/agentic-agency-planning-KwJEw` antes; provavelmente `0f03469` ou pequenos commits de doc posteriores)

O `a01` (`0f03469`) **passa** estruturalmente: sandbox==workflow byte-a-byte, sem BOM/secrets/mojibake, Merge Triggers com `numberInputs: 2` correto, Gemini Pro no Orquestrador e Gemini Flash no QualityGate, IDs Notion corretos. **Mas REJEITADO** por 3 bugs bloqueantes + 1 dependência externa que já foi resolvida.

## Pré-leitura

- `docs/handoff/2026-06-14-execucao-lote1-codex-brief.md` (brief original)
- `docs/strategic-planning/execucao-demandas/BRUTO-v0.3-design.md`
- `onboarding/execucao/lote1/generate_export.js` (gerador atual)
- `onboarding/execucao/lote1/{intake-pacing,orquestrador,qualitygate-pacing}/workflow.json`
- `onboarding/execucao_lote1_tests.ps1` (suíte atual)

## Dependência externa já resolvida (Claude criou)

**DB `PHI - Eventos`** foi criado via MCP Notion durante a pré-revisão Claude:
- Page: `c64f600e-4f46-4b2b-ac22-c1e425c8966e`
- Data source ID: **`3423df0d-77df-4834-bdda-c08ddbae40ff`**

Substituir o placeholder `<PHI_EVENTOS_DATA_SOURCE_ID_pending_creation>` por **`3423df0d-77df-4834-bdda-c08ddbae40ff`** em todos os pontos: `generate_export.js` (constante `DB_EVENTOS`) + 3 workflows (via regeneração após mudança no gerador).

## Bugs a corrigir

### B1 — `versao_sop_aplicada` como `relation` mas schema é `text`

Os 3 workflows fazem:

```js
versao_sop_aplicada: { relation: [{ id: sopData.id }] }
```

no update da Demanda. Mas o DB `PHI - Demandas` (data source `cd1ab757-e4d1-493f-b1e1-b64a95d33d1b`) foi criado com `versao_sop_aplicada` como `RICH_TEXT` (decisão Lote 0: conversão pra RELATION fica pro Lote 2). **A Notion API retorna 400 em todos os updates do `a01`.**

**Fix `a02`:** trocar nos 3 workflows o update e o eventBody pra usar rich_text com o ID do SOP:

```js
// ANTES (a01)
versao_sop_aplicada: { relation: [{ id: sopData.id }] }

// DEPOIS (a02)
versao_sop_aplicada: { rich_text: richText(sopData.id) }
```

Aplicar onde aparecer no `update_body.properties` dos 3 workflows. No `eventBody`, já está como `rich_text` — verificar e manter consistente. (No DB `PHI - Eventos` o campo também é `rich_text`.)

### B2 — Webhook secret AUSENTE no Intake-Pacing

`[Exec Intake] Webhook Pacing Alert` (path `pacing-alert`, method POST) está com `authentication=undefined` e não há check de secret no primeiro Code node. Padrão inegociável do Lote 1 Onboarding: **webhook secret validado antes do payload**.

Sem isso, qualquer um que descobrir a URL pode POSTar e criar demandas Críticas spam (fila polui + Telegram).

**Fix `a02`:** seguir o padrão A2.1 Onboarding (`[Onb A2.1] Validar Secret` + `[Onb A2.1] Secret Valido?`):

1. Adicionar node `[Exec Intake] Validar Secret` (Code, runOnceForAllItems) **antes** de validar payload:
   ```js
   const expected = $env.WEBHOOK_SECRET_EXECUCAO || '';
   const got = $input.first()?.json?.headers?.['x-pacing-secret'] || $input.first()?.json?.headers?.['X-Pacing-Secret'] || '';
   return [{ json: { ok: expected !== '' && got === expected, secret_present: !!got } }];
   ```
2. Adicionar node `[Exec Intake] Secret Valido?` (IF: `={{ $json.ok }}` === true)
3. Branch false → node Respond `401 Unauthorized` + log Telegram opcional
4. Branch true → segue pro `Validar Payload`
5. Atualizar wiring: Webhook → Validar Secret → Secret Valido? → (true: Validar Payload → fluxo atual / false: Respond 401)

Padrão de redação dos exports sanitizados: o `WEBHOOK_SECRET_EXECUCAO` é env var no n8n (não vai pro JSON). Documente no SOP ou no brief o nome do env var pra Olavo configurar antes do smoke.

### B3 — `priorityFor` confunde `tipo` com `classe_sla`

No `orquestrador/workflow.json` jsCode do node `[Exec Orq] Calcular Prioridade` (ou similar — qualquer node que tenha a função `priorityFor`):

```js
// BUG no a01
const priorityFor = (classe, tipo) => {
  if (classe === 'Critica') return 100;
  if (tipo === 'Recorrente diaria') return 50;  // confunde tipo com classe + classe certa é 'Recorrente diaria'
  if (tipo === 'Semanal') return 30;            // confunde + 'Semanal' não existe (schema = 'Recorrente semanal')
  if (tipo === 'Ad-hoc') return 20;             // confunde + 'Ad-hoc' não existe (schema = 'Ad-hoc padrao')
  return 20;
};
```

**Fix `a02`:** usar **`classe_sla`** consistente, com nomes exatos do schema do DB Demandas:

```js
const priorityFor = (classe_sla) => {
  if (classe_sla === 'Critica') return 100;
  if (classe_sla === 'Recorrente diaria') return 50;
  if (classe_sla === 'Recorrente semanal') return 30;
  if (classe_sla === 'Ad-hoc padrao') return 20;
  return 20;  // fallback defensivo
};
```

Atualizar todos os callers da função (remover o `tipo` extra). O `tipo` da demanda (`Pacing/verba`, `Daily Entry`, etc.) é o nome do produto, não a classe SLA.

## ps1 — adicionar checks novos

`onboarding/execucao_lote1_tests.ps1` precisa ganhar:

```powershell
# B1: versao_sop_aplicada como rich_text (não relation) nos updates
foreach ($path in @($intakeWf, $orqWf, $qgWf)) {
  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  if ($raw -match 'versao_sop_aplicada"\s*:\s*\{\s*"relation"') {
    throw "$path uses versao_sop_aplicada as relation; schema is rich_text"
  }
}

# B2: Intake tem Validar Secret + Secret Valido?
$intakeMap = @{}
foreach ($node in $intake.nodes) { $intakeMap[$node.name] = $node }
foreach ($req in @('[Exec Intake] Validar Secret', '[Exec Intake] Secret Valido?')) {
  if (-not $intakeMap.ContainsKey($req)) {
    throw "Intake-Pacing missing webhook secret guard: $req"
  }
}

# B3: priorityFor usa classe_sla, nomes corretos do schema
$orqRaw = [System.IO.File]::ReadAllText($orqWf, [System.Text.Encoding]::UTF8)
foreach ($snippet in @("classe_sla === 'Critica'", "classe_sla === 'Recorrente diaria'", "classe_sla === 'Recorrente semanal'", "classe_sla === 'Ad-hoc padrao'")) {
  if (-not $orqRaw.Contains($snippet)) {
    throw "Orquestrador priorityFor missing snippet: $snippet"
  }
}
if ($orqRaw -match "tipo === 'Recorrente diaria'" -or $orqRaw -match "tipo === 'Semanal'" -or $orqRaw -match "tipo === 'Ad-hoc'") {
  throw "Orquestrador priorityFor still uses 'tipo' or wrong class names"
}

# Placeholder substituído
$allWfs = @($intakeWf, $orqWf, $qgWf) + @((Join-Path $PSScriptRoot 'execucao\lote1\generate_export.js'))
foreach ($path in $allWfs) {
  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  if ($raw.Contains('PHI_EVENTOS_DATA_SOURCE_ID_pending_creation')) {
    throw "$path still contains PHI_EVENTOS placeholder"
  }
  if (-not $raw.Contains('3423df0d-77df-4834-bdda-c08ddbae40ff')) {
    throw "$path missing PHI - Eventos data source ID"
  }
}
```

## Critérios de aceite

- [ ] Placeholder `<PHI_EVENTOS_DATA_SOURCE_ID_pending_creation>` removido; substituído por `3423df0d-77df-4834-bdda-c08ddbae40ff` em todos os pontos (`generate_export.js` constante + 3 workflows após regenerar)
- [ ] `versao_sop_aplicada` no update da Demanda é `rich_text` (não `relation`) nos 3 workflows
- [ ] `[Exec Intake] Validar Secret` + `[Exec Intake] Secret Valido?` presentes no Intake; branch false retorna 401; padrão A2.1
- [ ] `priorityFor` no Orquestrador usa `classe_sla` com nomes exatos do schema (`Critica`, `Recorrente diaria`, `Recorrente semanal`, `Ad-hoc padrao`)
- [ ] ps1 atualizada com os 4 novos checks acima e PASSA verde
- [ ] sandbox == workflow byte-a-byte nos 3 (sha256 idêntico após regenerar)
- [ ] `active: false` mantido em todos
- [ ] Sem BOM, secrets, mojibake, placeholder
- [ ] Outros padrões inegociáveis do brief original mantidos (jsCode ASCII-safe, Telegram HTML, idempotência Intake, eventos canônicos, tier Pro/Flash, DB IDs corretos)

## NÃO fazer

- ❌ Não tocar Schedule Trigger, Merge Triggers (numberInputs:2 está OK), modelos Gemini (Pro/Flash corretos), DBs (IDs corretos), idempotência do Intake
- ❌ Não alterar o schema do DB `PHI - Demandas` no Notion (text → relation fica pro Lote 2)
- ❌ Não tocar `versao_sop_aplicada` no eventBody (já é rich_text)
- ❌ Não publicar (`active: true`) — vai pra smoke depois de Antigravity

## Commit + push + verificação

```bash
git add onboarding/execucao/lote1/ onboarding/execucao_lote1_tests.ps1
git commit -m "exec-lote1 a02: fix B1 sop rich_text + B2 webhook secret + B3 priorityFor + PHI_EVENTOS ID"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Sequência após push: pré-revisão Claude (rodar suíte ps1 em Node + diff dos jsCodes vs `a01`) → brief Antigravity rodada 1 → **smoke real** (Olavo). Sem smoke verde, não publica.

--- END COPY ---
