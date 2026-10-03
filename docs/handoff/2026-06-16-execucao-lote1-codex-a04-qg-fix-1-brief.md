# Brief Codex — Execução Lote 1 `a04-qg-fix-1` (consolida fixes do smoke real)

> **Escopo:** consolidar no repo as 6 correções aplicadas **inline na UI do n8n** durante o smoke do `a04-qg` (commit `49cae25`), mais 4 cleanups defensivos relacionados. Zero mudança de comportamento vs. o n8n atual em produção — só fecha o drift n8n ↔ repo.
>
> **Smoke real:** `a04-qg` + fixes inline rodaram verde em 2026-06-16 (execuções `ID#7953` PASS + `ID#7954` idempotência). FAIL branch confirmado verde em re-rodada (Telegram + DB updates corretos).
>
> **Intake e Orquestrador NÃO devem ser tocados nesta entrega** (continuam pra `a04-intake` / `a04-orq`).

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `a04-qg-fix-1` da Execução Lote 1 — consolidar no repo 6 fixes aplicados inline no n8n + 4 cleanups defensivos no **WF-EXEC-QualityGate-Pacing** (commit base: `49cae25`).

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** HEAD mais novo (`git fetch origin claude/agentic-agency-planning-KwJEw` antes)
- **Arquivos a tocar:** SÓ `onboarding/execucao/lote1/qualitygate-pacing/{workflow.json,sandbox_export.json}` + `onboarding/execucao_lote1_tests.ps1`.
- **Arquivos a NÃO tocar:** `intake-pacing/**`, `orquestrador/**`, `generate_export.js` (a04-qg-fix-1 não muda constantes nem gera nada novo).

O `a04-qg` (refactor HTTP → Notion native) passou pré-revisão Claude mas o smoke real revelou bugs latentes não-estruturais — fix lookup do `Validar DoD` lendo o item errado, pairedItem quebrado nos Notion creates de evento, regex de DoD frágil. Após 6 fixes inline na UI, **smoke fechou verde**: 4 linhas em PHI - Eventos, ambas demandas processadas (PASS = Entregue, FAIL = Em execucao), Telegram correto, idempotência confirmada na 2ª execução.

Este `a04-qg-fix-1` **transcreve esses fixes pro repo, byte-a-byte ao que está rodando**, mais 4 cleanups defensivos (`alwaysOutputData: false` + guards `page.id`).

## Mapa dos 11 fixes

### Fix 1 — `[Exec QG] Validar DoD Pacing Flash`: ler da fonte certa

No jsCode, **trocar a linha**:

```js
for (const item of $input.all()) {
```

por:

```js
for (const item of $('[Exec QG] Buscar Demandas Em Revisao').all()) {
```

**Por quê:** `$input` aqui é o output do `Criar Evento demanda.em_revisao` (page do evento criado, NÃO a demanda). `page.id` = id do evento → `demanda_id` errado → updates falham com "estado is not a property that exists" (estavam tentando atualizar a page-de-evento no DB Eventos, que não tem `estado`).

### Fix 2 — `[Exec QG] Validar DoD Pacing Flash`: `utcNow` date-only

No jsCode, **trocar a linha**:

```js
const utcNow = () => new Date().toISOString();
```

por:

```js
const utcNow = () => new Date().toISOString().slice(0, 10);
```

**Por quê:** o `Notion v2.2 date` property estava recebendo o ISO datetime e produzindo "Invalid date" quando pairedItem quebrava upstream. Date-only (`YYYY-MM-DD`) é portável, válido, e elimina ambiguidade.

### Fix 3 — `[Exec QG] Validar DoD Pacing Flash`: push consolidado com guard

Substituir o trecho final do jsCode:

```js
const missing = checks.filter((check) => !check.ok).map((check) => check.item);
const quality_gate = missing.length === 0 ? 'pass' : 'fail';
const demanda_id = page.id;
const client_id = pickText(props.client_id);
const tipo = pickSelect(props.tipo) || 'Pacing/verba';
const classe_sla = pickSelect(props.classe_sla) || 'Critica';
const basePayload = { tenant_id, client_id, execution_id, versao_sop_aplicada: sopData.id, demanda_id, tipo, classe_sla, quality_gate, checklist: checks, tier_agente: 'flash' };
if (quality_gate === 'pass') {
  out.push({ json: { demanda_id, quality_gate, novo_estado: 'Entregue', versao_sop_aplicada: sopData.id, evento_tipo: 'demanda.entregue', entidade_id: demanda_id, entidade_area: 'Execucao', payload_json: compactJson(basePayload), timestamp: utcNow(), execution_id, tenant_id, tier_agente: 'flash', text: 'PASS demanda ' + demanda_id } });
} else {
  out.push({ json: { demanda_id, quality_gate, novo_estado: 'Em execucao', versao_sop_aplicada: sopData.id, evento_tipo: 'demanda.reaberta', entidade_id: demanda_id, entidade_area: 'Execucao', payload_json: compactJson({ ...basePayload, missing }), timestamp: utcNow(), execution_id, tenant_id, tier_agente: 'flash', missing, text: '<b>Quality gate FAIL</b>\nDemanda: ' + demanda_id + '\nFaltam:\n- ' + missing.join('\n- ') } });
}
```

por:

```js
const missing = checks.filter((check) => !check.ok).map((check) => check.item);
const quality_gate = missing.length === 0 ? 'pass' : 'fail';
const demanda_id = page.id;
if (!demanda_id) throw new Error('[Validar DoD] page.id ausente — Buscar Demandas Em Revisao retornou item sem id');
const client_id = pickText(props.client_id);
const tipo = pickSelect(props.tipo) || 'Pacing/verba';
const classe_sla = pickSelect(props.classe_sla) || 'Critica';
const basePayload = { tenant_id, client_id, execution_id, versao_sop_aplicada: sopData.id, demanda_id, tipo, classe_sla, quality_gate, checklist: checks, tier_agente: 'flash' };
const ts = utcNow();
if (!ts || !/^\d{4}-\d{2}-\d{2}$/.test(ts)) {
  throw new Error('data invalida produzida por utcNow: ' + JSON.stringify(ts));
}
if (quality_gate === 'pass') {
  out.push({ json: { demanda_id, quality_gate, novo_estado: 'Entregue', versao_sop_aplicada: sopData.id, evento_tipo: 'demanda.entregue', entidade_id: demanda_id, entidade_area: 'Execucao', payload_json: compactJson(basePayload), timestamp: ts, execution_id, tenant_id, tier_agente: 'flash', text: 'PASS demanda ' + demanda_id } });
} else {
  out.push({ json: { demanda_id, quality_gate, novo_estado: 'Em execucao', versao_sop_aplicada: sopData.id, evento_tipo: 'demanda.reaberta', entidade_id: demanda_id, entidade_area: 'Execucao', payload_json: compactJson({ ...basePayload, missing }), timestamp: ts, execution_id, tenant_id, tier_agente: 'flash', missing, text: '<b>Quality gate FAIL</b>\nDemanda: ' + demanda_id + '\nFaltam:\n- ' + missing.join('\n- ') } });
}
```

Mudanças: `if (!demanda_id) throw` defensivo + `const ts = utcNow()` com guard regex + `timestamp: ts` em ambos branches.

### Fix 4 — `[Exec QG] Criar Evento demanda.entregue`: 9 expressions via `.all().find()`

Substituir os 9 itens de `propertiesUi.propertyValues`:

| Property key | Expression novo |
|---|---|
| `tipo\|title` | `={{ $('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.id).json.evento_tipo }}` |
| `entidade_id\|rich_text` | `={{ $('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.id).json.entidade_id }}` |
| `entidade_area\|select` | `Execucao` *(fixo — não muda)* |
| `payload_json\|rich_text` | `={{ $('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.id).json.payload_json }}` |
| `timestamp\|date` | `={{ $('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.id).json.timestamp }}` |
| `execution_id\|rich_text` | `={{ $('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.id).json.execution_id }}` |
| `tenant_id\|rich_text` | `={{ $('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.id).json.tenant_id }}` |
| `tier_agente\|select` | `={{ $('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.id).json.tier_agente }}` |
| `versao_sop_aplicada\|rich_text` | `={{ $('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.id).json.versao_sop_aplicada }}` |

**Por quê:** `$json` no `Criar Evento demanda.entregue` é a Demanda atualizada (output do `Marcar Entregue` — Notion native substitui o item). `$json.id` é o page.id da Demanda. O `.all().find(o => o.json.demanda_id === $json.id)` casa com o item correspondente no `Restaurar Payload DoD` (que tem os campos avulsos produzidos pelo `Validar DoD`). Não depende de pairedItem.

### Fix 5 — `[Exec QG] Criar Evento demanda.reaberta`: mesmos 9 expressions

Aplicar o **mesmo mapping da tabela do Fix 4** em `Criar Evento demanda.reaberta`. `$json.id` aqui é o page.id da Demanda atualizada pelo `Reabrir Demanda` (Notion native). Pareamento por `demanda_id` idêntico.

### Fix 6 — `[Exec QG] Telegram Checklist FAIL`: expression do `text`

No node Telegram, substituir o expression do campo `text`:

**De:**
```
={{ String($json.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}
```

**Para:**
```
={{ String(($('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.properties.entidade_id.rich_text[0].text.content) || {json:{}}).json.text || '(sem texto)').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}
```

**Por quê:** `$json` aqui é a page do evento `demanda.reaberta` criada (Notion native substituiu o item). `$json.properties.entidade_id.rich_text[0].text.content` extrai o `entidade_id` do evento (= page.id da Demanda). O find casa com o item correspondente no `Restaurar Payload DoD`. Fallback `'(sem texto)'` impede Telegram falhar com `text: ''` (que retorna `Bad Request: message text is empty`).

### Fix 7 — `[Exec QG] Buscar Demandas Em Revisao`: `alwaysOutputData: false`

No node, remover a flag (ou setar pra `false`):

```diff
- "alwaysOutputData": true
+ "alwaysOutputData": false
```

(Equivalente: omitir a chave inteiramente — n8n default é `false`.)

**Por quê:** com `true`, quando o filtro encontra 0 demandas, n8n emite 1 item dummy (`[{}]`), e o `Validar DoD` processava esse fantasma → `page.id = undefined` → cascata de erros. Com `false`, 0 matches → downstream para silenciosamente (= comportamento desejado pra Schedule a cada 5min sem demanda em revisão).

### Fix 8 — `[Exec QG] Buscar SOP Vigente`: `alwaysOutputData: false`

Mesmo cleanup que Fix 7. Não é hot bug hoje (sempre tem 1 SOP `Vigente`), mas mantém consistência defensiva — se algum dia a SOP sumir, prefiro o workflow parar visível em vez de gerar dados fantasma.

### Fix 9 — `[Exec QG] Montar Evento demanda.em_revisao`: guard `page.id` + remover `...page`

Substituir o jsCode inteiro do node. Atual:

```js
const sopData = sopFromItems($('[Exec QG] Buscar SOP Vigente').all());
const execution_id = execId('EXEC-EXEC-QG');
const tenant_id = 'phi-agencia';
return $input.all().map((item) => {
  const page = item.json || {};
  const props = page.properties || {};
  const payload = {
    tenant_id,
    client_id: pickText(props.client_id),
    execution_id,
    versao_sop_aplicada: sopData.id,
    demanda_id: page.id,
    tipo: pickSelect(props.tipo) || 'Pacing/verba',
    classe_sla: pickSelect(props.classe_sla) || 'Critica',
    estado: 'Em revisao',
    tier_agente: 'flash',
  };
  return { json: { ...page, evento_tipo: 'demanda.em_revisao', entidade_id: page.id, entidade_area: 'Execucao', payload_json: compactJson(payload), timestamp: utcNow(), execution_id, tenant_id, tier_agente: 'flash', versao_sop_aplicada: sopData.id } };
});
```

Novo (sem `...page`, com guard, com `demanda_id` exposto + `utcNow` date-only):

```js
const utcNow = () => new Date().toISOString().slice(0, 10);
const sopData = sopFromItems($('[Exec QG] Buscar SOP Vigente').all());
const execution_id = execId('EXEC-EXEC-QG');
const tenant_id = 'phi-agencia';
const ts = utcNow();
if (!ts || !/^\d{4}-\d{2}-\d{2}$/.test(ts)) {
  throw new Error('data invalida produzida por utcNow: ' + JSON.stringify(ts));
}
return $input.all().map((item) => {
  const page = item.json || {};
  if (!page.id) throw new Error('[Montar Evento demanda.em_revisao] page.id ausente — Buscar Demandas Em Revisao retornou item sem id (alwaysOutputData removido — checar filtros)');
  const props = page.properties || {};
  const payload = {
    tenant_id,
    client_id: pickText(props.client_id),
    execution_id,
    versao_sop_aplicada: sopData.id,
    demanda_id: page.id,
    tipo: pickSelect(props.tipo) || 'Pacing/verba',
    classe_sla: pickSelect(props.classe_sla) || 'Critica',
    estado: 'Em revisao',
    tier_agente: 'flash',
  };
  return { json: { demanda_id: page.id, evento_tipo: 'demanda.em_revisao', entidade_id: page.id, entidade_area: 'Execucao', payload_json: compactJson(payload), timestamp: ts, execution_id, tenant_id, tier_agente: 'flash', versao_sop_aplicada: sopData.id } };
});
```

Mudanças:
- **`utcNow` date-only** dentro deste node também (alinha com Fix 2 do Validar).
- **`if (!page.id) throw`**: defesa em profundidade. Se Fix 7 falhar por algum motivo, falha cedo com mensagem clara.
- **Remover `...page`**: o spread espalhava `id`, `object`, `properties`, `archived`, etc. no top-level — poluição que não tem consumidor downstream. Output enxuto = mais fácil debugar.
- **Expor `demanda_id` no top-level**: simetria com o output do `Validar DoD`. Útil pra debug + futuro consumo cruzado.

### Fix 10 — `[Exec QG] Validar DoD Pacing Flash`: `utcNow` date-only no escopo do node

Como o jsCode do Validar tem sua própria definição de `utcNow`, **trocar lá também**:

```js
// linha existente no topo do jsCode do Validar DoD
const utcNow = () => new Date().toISOString().slice(0, 10);
```

(Já fica explicitado por causa do Fix 2 — esta entrada na lista é só pra garantir que o Codex faça em AMBOS os nodes que têm `utcNow` declarado: `Montar Evento demanda.em_revisao` E `Validar DoD Pacing Flash`.)

### Fix 11 — ps1: checks novos

Adicionar em `onboarding/execucao_lote1_tests.ps1` (bloco escopado ao QG):

```powershell
# === a04-qg-fix-1 ===

# alwaysOutputData removido/false nos 2 search nodes
$searchNodes = $wfQg.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'getAll'
}
foreach ($n in $searchNodes) {
  if ($n.alwaysOutputData -eq $true) {
    throw "QG node '$($n.name)' has alwaysOutputData=true (a04-qg-fix-1 #7/#8 — remover ou setar false)"
  }
}

# Validar DoD lê de Buscar Demandas Em Revisao (não de $input)
$validarCode = [string]$qgMap['[Exec QG] Validar DoD Pacing Flash'].parameters.jsCode
if (-not $validarCode.Contains("`$('[Exec QG] Buscar Demandas Em Revisao').all()")) {
  throw "QG Validar DoD deve ler de `$('[Exec QG] Buscar Demandas Em Revisao').all() (a04-qg-fix-1 #1)"
}
if ($validarCode.Contains('for (const item of $input.all())')) {
  throw "QG Validar DoD ainda tem 'for (const item of `$input.all())' — fix #1 nao aplicado"
}

# utcNow date-only em Validar DoD E Montar Evento
foreach ($nodeName in @('[Exec QG] Validar DoD Pacing Flash', '[Exec QG] Montar Evento demanda.em_revisao')) {
  $code = [string]$qgMap[$nodeName].parameters.jsCode
  if (-not $code.Contains(".toISOString().slice(0, 10)")) {
    throw "QG node '$nodeName' utcNow nao date-only (fix #2/#10)"
  }
}

# Guards page.id presentes
$montarCode = [string]$qgMap['[Exec QG] Montar Evento demanda.em_revisao'].parameters.jsCode
if (-not $montarCode.Contains("if (!page.id) throw")) {
  throw "QG Montar Evento sem guard page.id (fix #9)"
}
if (-not $validarCode.Contains("if (!demanda_id) throw")) {
  throw "QG Validar DoD sem guard demanda_id (fix #3)"
}

# Montar Evento sem ...page (cleanup)
if ($montarCode.Contains('...page')) {
  throw "QG Montar Evento ainda tem ...page no output (fix #9 cleanup)"
}

# Creates de evento entregue/reaberta usam .all().find() (não .item)
$createEntregue = $qgMap['[Exec QG] Criar Evento demanda.entregue']
$createReaberta = $qgMap['[Exec QG] Criar Evento demanda.reaberta']
foreach ($n in @($createEntregue, $createReaberta)) {
  $props = $n.parameters.propertiesUi.propertyValues
  $dynamicProps = $props | Where-Object { $_.key -ne 'entidade_area|select' }
  foreach ($p in $dynamicProps) {
    $val = if ($p.title) { $p.title } elseif ($p.textContent) { $p.textContent } elseif ($p.selectValue) { $p.selectValue } elseif ($p.date) { $p.date } else { '' }
    if ($val -is [string] -and $val.StartsWith('=')) {
      if ($val.Contains("`$json.") -and -not $val.Contains("`$('[Exec QG] Restaurar Payload DoD').all().find")) {
        throw "QG '$($n.name)' property '$($p.key)' ainda usa `$json.<X> (fix #4/#5 — trocar por .all().find)"
      }
      if (-not $val.Contains("o.json.demanda_id === `$json.id")) {
        throw "QG '$($n.name)' property '$($p.key)' nao pareia por demanda_id (fix #4/#5)"
      }
    }
  }
}

# Telegram text usa lookup via entidade_id do evento
$telegramText = [string]$qgMap['[Exec QG] Telegram Checklist FAIL'].parameters.text
if (-not $telegramText.Contains("`$('[Exec QG] Restaurar Payload DoD').all().find")) {
  throw "QG Telegram text nao usa .all().find (fix #6)"
}
if (-not $telegramText.Contains("entidade_id.rich_text[0].text.content")) {
  throw "QG Telegram text nao pareia por entidade_id.rich_text (fix #6)"
}
if (-not $telegramText.Contains("'(sem texto)'")) {
  throw "QG Telegram text sem fallback '(sem texto)' (fix #6)"
}
```

## NÃO fazer

- ❌ Não tocar Intake (`onboarding/execucao/lote1/intake-pacing/`)
- ❌ Não tocar Orquestrador (`onboarding/execucao/lote1/orquestrador/`)
- ❌ Não tocar `generate_export.js` (nenhuma constante muda; UUIDs e nomes intocados)
- ❌ Não mudar tipo/typeVersion/credenciais/topologia dos nodes
- ❌ Não tocar `Schedule 5 min`, `Buscar SOP` (exceto `alwaysOutputData`), `Buscar Demandas Em Revisao` (exceto `alwaysOutputData`), `Gemini Flash`, `Restaurar Payload DoD`, IF `Resultado PASS?`, `Marcar Entregue`, `Reabrir Demanda` — preservar tudo o mais byte-a-byte
- ❌ Não introduzir `Notion-Version` headers
- ❌ Não criar credencial Notion nova — `<credential_id_redacted>` permanece
- ❌ Não mudar `active: false` nem `timezone`
- ❌ Não tocar `EXEC_WEBHOOK_KEY` / ADR-19 (escopo dele é Intake)

## Critérios de aceite

- [ ] `Validar DoD Pacing Flash` lê de `$('[Exec QG] Buscar Demandas Em Revisao').all()` (não `$input`)
- [ ] `utcNow` retorna date-only (`.slice(0, 10)`) em AMBOS jsCodes (Montar Evento + Validar DoD)
- [ ] Guards `if (!page.id) throw` em Montar Evento e Validar DoD
- [ ] `...page` removido do output do Montar Evento
- [ ] Todos os 9 expressions de cada um dos 2 creates de evento usam `.all().find(o => o.json.demanda_id === $json.id)` (exceto `entidade_area|select` que é fixo)
- [ ] Telegram text usa `.all().find` pareando por `entidade_id.rich_text[0].text.content` + fallback `'(sem texto)'`
- [ ] `alwaysOutputData` ausente ou `false` em `Buscar Demandas Em Revisao` e `Buscar SOP Vigente`
- [ ] sandbox==workflow byte-a-byte (sha256 igual)
- [ ] ps1 ganha os 11 checks novos e passa verde
- [ ] Sem BOM, sem secrets, sem mojibake
- [ ] `active: false` mantido
- [ ] Intake/Orquestrador: `git diff` zero alterações
- [ ] `generate_export.js`: `git diff` zero alterações

## Commit + push + verificação

```bash
git add onboarding/execucao/lote1/qualitygate-pacing/ \
        onboarding/execucao_lote1_tests.ps1
git status --short  # confirme que intake-pacing/, orquestrador/, generate_export.js NÃO aparecem
git commit -m "exec-lote1 a04-qg-fix-1: consolida 6 fixes do smoke real + 4 cleanups defensivos no QG"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Pós-merge, Olavo vai **re-importar o workflow.json no n8n** (sobrescreve as edições inline com a versão canônica do repo), re-executar Execute Workflow 1× pra confirmar paridade com o smoke verde de hoje, e então **activate**. Smoke definitivo já passou — esta entrega é só pra fechar o drift.

--- END COPY ---
