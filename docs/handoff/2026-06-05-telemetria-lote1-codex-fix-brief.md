# [HANDOFF] Telemetria Lote 1 — Brief Codex Correções (a03)

**De:** Cérebro Estratégico (Claude)
**Para:** Codex
**Data:** 2026-06-11 (criado após retificação)
**Branch:** `claude/agentic-agency-planning-KwJEw`
**HEAD atual:** `ed3d4be` (brief Antigravity entregue)
**Veredito Antigravity:** REJEITADO (com 1 falso positivo + 3 bugs reais + 1 sugestão arquitetural)

---

## 0. Resumo da situação atual (retificada)

Em 2026-06-05, Codex empurrou `b15e8dd` (Telemetria `a01`). Eu fiz pré-revisão Claude (commit `327872d`) corrigindo o G1 (linha residual `parse_mode=HTML` no digest). Brief Antigravity foi versionado (`ed3d4be`).

Antigravity revisou e emitiu veredito **REJEITADO** com 4 bloqueadores. Análise factual posterior contra o estado atual:

| Bloqueador | Estado real | Veredito |
|---|---|---|
| **B1** — G1 não corrigido | ✅ **JÁ CORRIGIDO** em `327872d` (diff confirma — linhas 169-171 do digestCode removidas, `parse_mode=HTML` ausente de generate_export.js, workflow.json e sandbox_export.json) | **Falso positivo do Antigravity** — provavelmente revisou o estado de `b15e8dd` sem pegar meus commits posteriores |
| **B2** — 16 nodes com IF + Merge | Workflow tem 14 nodes. PS1 diz `exactly 14`. Antigravity sugere refatorar pra 16 (IF Tem Novas Linhas + Merge Pos-Snapshot) | **Sugestão arquitetural** — resolve B3 elegantemente; não é exigência factual da PS1 |
| **B3** — cadeia quebra com 0 items | ✅ **Bug real:** `return toCreate.map(...)` (generate_export.js:131) emite array vazio quando idempotência zera linhas novas — quebra Criar Snapshot → Digest → Telegram na 2ª execução do mesmo dia | **Antigravity acertou** — precisa correção |
| **B4** — acento Chave da métrica | ✅ **Bug real:** linha 70 lê `'Chave da métrica'` (COM acento), linha 242 escreve `'Chave da metrica\|rich_text'` (SEM acento). Idempotência quebra silenciosamente | **Antigravity acertou** — precisa correção |

**Conclusão:** **B1 já está fixed.** Você precisa corrigir **B3 e B4** (bugs reais). **B2 é opcional** — recomendo aplicar porque resolve B3 de forma elegante e padroniza com práticas n8n.

---

## 1. Pré-leitura obrigatória

1. **Aprendizado #19 retificado** (sobre cache de fetch local — não é mais sobre "compactação"): https://www.notion.so/376b65e5c72b81ffb521d5f35e02274c
2. **Brief Antigravity:** `docs/handoff/2026-06-05-telemetria-lote1-antigravity-brief.md` (commit `ed3d4be`) — referencial do veredito original
3. **Brief Codex original:** `docs/handoff/2026-06-04-telemetria-lote1-codex-brief.md`
4. **Strawman v0.2:** `docs/strategic-planning/telemetria-minima/BRUTO-v0.1-design.md`
5. **Padrões inegociáveis Lote 1 Onboarding:** §5 da âncora [HANDOFF] Curador (https://www.notion.so/375b65e5c72b810f8f4be50873daedbe)

---

## 2. Arquivos a modificar

- `onboarding/telemetria/generate_export.js` (mudanças manuais)
- `onboarding/telemetria/workflow.json` (regenerar via `node generate_export.js`)
- `onboarding/telemetria/sandbox_export.json` (idem)
- `onboarding/telemetria_tests.ps1` (atualizar pra refletir mudanças)

---

## 3. Correções obrigatórias

### 3.1. B4 — acento "Chave da métrica" no Criar Snapshot

`generate_export.js` linha 242:
```js
{ key: 'Chave da metrica|rich_text', textContent: '={{ $json.chave }}' },
```

Substituir por (usar escape Unicode pra manter ASCII-safe):
```js
{ key: 'Chave da métrica|rich_text', textContent: '={{ $json.chave }}' },
```

O escape `é` é o caractere `é`. Mantém ASCII-safe (padrão inegociável Lote 1) e bate exatamente com a propriedade real do DB Snapshots no Notion.

### 3.2. B3 — sentinel pattern no metricCode

`generate_export.js` linha 131:
```js
return toCreate.map((m) => ({ json: { ...m, metricas_do_dia: metricas, linhas_novas: toCreate.length } }));`;
```

Substituir por:
```js
const itemsParaCriar = toCreate.map((m) => ({ json: { ...m, metricas_do_dia: metricas, linhas_novas: toCreate.length } }));
if (itemsParaCriar.length === 0) {
  itemsParaCriar.push({ json: { sentinel: true, metricas_do_dia: metricas, linhas_novas: 0, data_snapshot, execution_id, tenant_id, versao_consulta } });
}
return itemsParaCriar;`;
```

Cada item passado downstream agora carrega `linhas_novas`. O IF do passo 3.3 filtra pelo valor.

### 3.3. B2 — refatoração estrutural com IF + Merge (RECOMENDADA pra resolver B3 elegantemente)

**Justificativa:** sem o IF + Merge, o sentinel chega no Criar Snapshot e cria uma linha fantasma no DB Snapshots (porque a propriedade `Chave da métrica` virá vazia). Solução elegante: usar IF pra desviar o sentinel e Merge pra convergir antes do Digest.

**Novo node entre `Calcular Metricas` e `Criar Snapshot`:**

```js
{
  id: 'telemetria-if-tem-novas',
  name: '[Telemetria] IF Tem Novas Linhas',
  type: 'n8n-nodes-base.if',
  typeVersion: 2,
  position: [832, 0],
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
      conditions: [
        {
          id: 'cond-linhas-novas',
          leftValue: '={{ $json.linhas_novas }}',
          rightValue: 0,
          operator: { type: 'number', operation: 'gt' }
        }
      ],
      combinator: 'and'
    }
  }
},
```

**Novo node após `Criar Snapshot`:**

```js
{
  id: 'telemetria-merge-pos-snapshot',
  name: '[Telemetria] Merge Pos-Snapshot',
  type: 'n8n-nodes-base.merge',
  typeVersion: 3,
  position: [1056, 120],
  parameters: { mode: 'append' }
},
```

**Renumerar nós (16 total):**

1. `[Telemetria] Schedule Trigger`
2. `[Telemetria] Set Contexto`
3-9. 7 reads Notion paralelos
10. `[Telemetria] Calcular Metricas`
11. **`[Telemetria] IF Tem Novas Linhas`** (NOVO)
12. `[Telemetria] Criar Snapshot` (só executa se IF true)
13. **`[Telemetria] Merge Pos-Snapshot`** (NOVO — convergência)
14. `[Telemetria] Montar Digest HTML`
15. `[Telemetria] Enviar Telegram`
16. `[Telemetria] Set Status Final`

**Wiring (`connections`):**

```js
'[Telemetria] Calcular Metricas': { main: [[{ node: '[Telemetria] IF Tem Novas Linhas', type: 'main', index: 0 }]] },
'[Telemetria] IF Tem Novas Linhas': {
  main: [
    [{ node: '[Telemetria] Criar Snapshot', type: 'main', index: 0 }],
    [{ node: '[Telemetria] Merge Pos-Snapshot', type: 'main', index: 1 }]
  ]
},
'[Telemetria] Criar Snapshot': { main: [[{ node: '[Telemetria] Merge Pos-Snapshot', type: 'main', index: 0 }]] },
'[Telemetria] Merge Pos-Snapshot': { main: [[{ node: '[Telemetria] Montar Digest HTML', type: 'main', index: 0 }]] },
```

**Atenção:** IF output `main[0]` (true branch) → Criar Snapshot · `main[1]` (false branch) → Merge Pos-Snapshot input 1. Criar Snapshot → Merge Pos-Snapshot input 0. Convergência garante que digest sempre dispara.

### 3.4. PS1 — atualizar

Linha 31:
```ps1
throw "Workflow must have exactly 16 nodes; found $($workflow.nodes.Count)"
```

`$requiredNodeNames` — adicionar:
```ps1
'[Telemetria] IF Tem Novas Linhas',
'[Telemetria] Merge Pos-Snapshot',
```

Validação de `metricCode` — adicionar aos snippets esperados:
```ps1
'sentinel: true',
'itemsParaCriar',
'return itemsParaCriar'
```

E **remover** `'return toCreate.map'` do array de snippets (era esperado no a01, agora obsoleto).

Validação de `Criar Snapshot` — a verificação atual usa `versaoConsulta = 'Vers' + [char]0x00e3 + 'o da consulta'`. **Adicionar** verificação análoga pra `Chave da métrica`:
```ps1
$chaveDaMetrica = 'Chave da m' + [char]0x00e9 + 'trica'
if (-not $createJson.Contains($chaveDaMetrica)) {
  throw "Criar Snapshot is missing property 'Chave da métrica' (with accent)"
}
```

Wiring tests — substituir `expectedLinear`:
```ps1
$expectedLinear = @(
  @('[Telemetria] Schedule Trigger', '[Telemetria] Set Contexto', 0),
  @('[Telemetria] Calcular Metricas', '[Telemetria] IF Tem Novas Linhas', 0),
  @('[Telemetria] Criar Snapshot', '[Telemetria] Merge Pos-Snapshot', 0),
  @('[Telemetria] Merge Pos-Snapshot', '[Telemetria] Montar Digest HTML', 0),
  @('[Telemetria] Montar Digest HTML', '[Telemetria] Enviar Telegram', 0),
  @('[Telemetria] Enviar Telegram', '[Telemetria] Set Status Final', 0)
)
```

Adicionar verificação específica do IF:
```ps1
$ifOutputs = $workflow.connections.'[Telemetria] IF Tem Novas Linhas'.main
if ($ifOutputs.Count -ne 2) {
  throw 'IF Tem Novas Linhas must have 2 outputs (true/false)'
}
if ($ifOutputs[0][0].node -ne '[Telemetria] Criar Snapshot') {
  throw 'IF true branch must go to Criar Snapshot'
}
if ($ifOutputs[1][0].node -ne '[Telemetria] Merge Pos-Snapshot') {
  throw 'IF false branch must go to Merge Pos-Snapshot'
}
```

### 3.5. Regenerar JSONs

```bash
cd onboarding/telemetria
node generate_export.js
```

Verificar que `workflow.json` e `sandbox_export.json` foram regenerados.

### 3.6. Executar suíte PS1 — deve passar

```ps1
pwsh onboarding/telemetria_tests.ps1
# Esperado: "Telemetria workflow structural tests passed."
```

Se falhar, NÃO commitar. Debugar até passar.

---

## 4. Alternativa MAIS MÍNIMA (se quiser skip B2)

Se preferir NÃO refatorar pra 16 nodes (manter 14), pode resolver B3 + B4 com:

1. Aplicar 3.1 (B4 acento) — mantém igual
2. Aplicar 3.2 (sentinel pattern) — mantém igual
3. **No `Criar Snapshot`**, adicionar parâmetro `continueOnFail: true` ou usar expressão pra skip quando `sentinel === true`:
   ```js
   // Hipótese alternativa — no node Criar Snapshot, condicionar a propriedade Title:
   title: '={{ $json.sentinel ? null : $json.titulo }}',
   ```
   
   Problema: pode criar linha vazia. Não recomendo.

**Recomendação:** vai de B2 completo (IF + Merge + 16 nodes). É a forma elegante e o que Antigravity sugeriu.

---

## 5. Critérios de aceite

- [ ] `generate_export.js` linha 242: `'Chave da métrica|rich_text'` (com acento Unicode)
- [ ] `generate_export.js` metricCode: padrão sentinel + `itemsParaCriar` + sempre retorna ≥1 item
- [ ] Se aplicar B2: `workflow.json` tem 16 nós com `IF Tem Novas Linhas` + `Merge Pos-Snapshot`
- [ ] Se aplicar B2: PS1 espera 16 nós e valida IF outputs
- [ ] `sandbox_export.json` ≡ `workflow.json` estruturalmente
- [ ] Suíte PS1 **verde**
- [ ] Mantém `active: false`
- [ ] Re-export sanitizada (chat_id `<TELEGRAM_CHAT_ID_redacted>`, creds redacted)
- [ ] Sem mojibake, sem secrets, UTF-8 sem BOM

---

## 6. O que NÃO mudar

- ❌ **NÃO mexa no digestCode** — G1 já foi corrigido em `327872d`. Não reintroduza `parse_mode=HTML`.
- ❌ Manter 19 chamadas `add()` — decisão consolidada (16 métricas conceituais = 19 snapshot rows)
- ❌ Não tocar padrões inegociáveis Lote 1 herdados
- ❌ Não mudar DB target (sempre Snapshots `32404398-6751-4bbd-be28-4ad591e22bf7`)
- ❌ Não introduzir Gemini Flash neste lote (Lote 3 entra)

---

## 7. Commit pattern sugerido

```
telemetria-minima a03: B3 sentinel + B4 acento + B2 IF/Merge 16 nodes

Correcoes pos-veredito Antigravity REJEITADO (commit a01 b15e8dd +
a02 G1 fix em 327872d):

B1 (G1 parse_mode=HTML):
- Ja corrigido em 327872d (Claude). Nao retocado.

B3 (cadeia quebra com 0 items na 2a execucao):
- metricCode com padrao sentinel: sempre retorna >=1 item, com flag
  sentinel: true quando idempotencia zera linhas_novas

B4 (acento Chave da metrica):
- Criar Snapshot passa a escrever em 'Chave da métrica|rich_text'
  (com acento Unicode é). Bate com a leitura no metricCode.

B2 (16 nodes IF + Merge):
- Adicionados [Telemetria] IF Tem Novas Linhas e [Telemetria]
  Merge Pos-Snapshot. Sentinel passa via false branch -> Merge ->
  Digest. Itens reais passam via true branch -> Criar -> Merge -> Digest.

Suite ps1 atualizada e verde (exactly 16 nodes, IF outputs validados,
sentinel snippets, Chave da metrica com acento).

Antigravity rodada 2 obrigatoria antes do smoke (foco em B3 e B4 e
confirmar 16 nodes). B1 ja confirmado corrigido visualmente em 327872d.

https://claude.ai/code/session_016ynQo7kzoCN4hP5nmZnV2L
```

---

## 8. Após Codex entregar

1. **Antigravity rodada 2** revê os fixes (foco B3 + B4 + 16 nodes + B1 ja corrigido)
2. **Olavo** aciona smoke E2E:
   - DB Snapshots = **19 rows** novas com `Data = hoje`
   - Telegram chega no chat `930549271`
   - 2ª execução no mesmo dia = **0 rows novas** mas digest **ainda dispara**
3. **Catálogo:** Versão atualiza pra `prod 2026-06-11` + Estado `Em revisão → Vivo`
4. **ESTADO-DO-PROJETO:** T6 marcada `Resolvida`
5. **Aprendizado se houver surpresa** no smoke

---

## 9. Verificação obrigatória pós-push (Aprendizado #19 retificado)

Após `git push`, rodar **NA ORDEM**:
```bash
git push -u origin claude/agentic-agency-planning-KwJEw   # captura o SHA do output
git fetch origin claude/agentic-agency-planning-KwJEw     # OBRIGATÓRIO antes da verificação
git log origin/claude/agentic-agency-planning-KwJEw --oneline -1   # confirma SHA no remote
git rev-parse HEAD                                        # SHA local
```

Confirmar que SHA local bate com SHA do remote pós-fetch. Se divergir, NÃO declarar entrega — investigar.

**Lição retificada:** o problema NÃO é compactação de contexto ou drift de worktree. É que `git branch -r --contains <SHA>` consulta refs remotos **locais** que ficam stale sem fetch. Antes de qualquer verificação que use `origin/<branch>` ou `remotes`, fazer `git fetch` explicitamente.

---

## 10. Tensões / decisões em aberto (não bloqueiam Codex)

- **T13** (Telemetria alimenta Curador) — relevante quando Curador Lote 5+ entrar
- **G2** (Buscar Snapshots Existentes sem filtro de data) — Lote 2 da Telemetria
- **G3** (`cur.tempo_medio_aplicacao_dias = 0`) — Mudança de Escopo futura adiciona campo `Data de aplicação` no DB Mudanças

Nada disso bloqueia a entrega `a03`.

---

Boa sorte. Pergunte se algo no checklist ficou ambíguo.
