# Brief Antigravity — Telemetria Lote 1 rodada 3 (`a05`)

**Addendum 2** ao brief original (`docs/handoff/2026-06-05-telemetria-lote1-antigravity-brief.md`) e ao addendum 1 da rodada 2 (`docs/handoff/2026-06-11-telemetria-lote1-antigravity-rodada2-brief.md`). Tudo daqueles continua valendo. Este addendum cobre só o que mudou de `a03` (rodada 2, APROVADO) → `a05` (alvo desta rodada).

---

## Comando rápido

```bash
git fetch origin claude/agentic-agency-planning-KwJEw
git checkout dddb84f   # HEAD do a05; pode haver commits de doc posteriores tocando só ESTADO/handoff — sem efeito no código
git log --oneline -6
```

HEAD do código: **`dddb84f`**. Commits posteriores podem tocar só `docs/strategic-planning/ESTADO-DO-PROJETO.md` e `docs/handoff/` — não afetam `onboarding/telemetria/*` nem `onboarding/telemetria_tests.ps1`.

## Por que rodada 3

Após APROVADO rodada 2 do `a03` (`6a9c745`), Olavo executou o **smoke E2E real em 2026-06-13** no n8n prod (workflow `VubalOUaoBteCyC6`, `active: false`):

- 1ª execução criou **133 linhas** no DB Snapshots (esperado: 19; é exatamente 7×19)
- 2ª execução criou outras **133 linhas** (esperado: 0; idempotência zero)
- Cleanup manual: 266 linhas apagadas. DB Snapshots zerado pra hoje. Workflow continua `active: false`.

### Causa-raiz

7 nodes de leitura Notion (Clientes, Etapas, Mudanças Escopo, Catálogo, Decisões ADR, Aprendizados, **Snapshots Existentes**) conectavam todos em `[Telemetria] Calcular Metricas in[0]`. No n8n, multi-fan-in no mesmo input port dispara o node downstream **1× por conjunto de items recebido** (1 batch por upstream), **mesmo em `runOnceForAllItems`**. O `metricCode` rodou 7×. Em iterações triggadas por upstreams ≠ Snapshots Existentes, `$('[Telemetria] Buscar Snapshots Existentes').all()` ficava vazio → `existingKeys` vazio → `toCreate.filter` não filtrava → 19 linhas por iteração → 133.

Nenhuma das duas rodadas anteriores detectou — bug **runtime**, não estrutural. ps1 + revisão nó-a-nó não capturam. Confirmado: a única defesa contra esta classe de bug é smoke real.

### Aprendizado novo registrado

DB PHI™ Aprendizados, Status `Em análise` (vira `Aplicado` após smoke verde): "Multi-fan-in para Code node em n8n dispara N execuções do jsCode (1× por upstream trigger) — usar nó Merge mode append antes pra consolidar em 1 batch". URL: https://app.notion.com/p/37eb65e5c72b815b9c79f9e9a14a191f

### Padrão inegociável NOVO (consolidado em duas partes)

1. Multi-fan-in (≥2 inputs) para Code/jsCode/Function node em n8n EXIGE nó Merge antes pra consolidar N batches upstream em 1 batch único.
2. Nó Merge consolidador DEVE declarar `numberInputs` = nº exato de upstreams. Default n8n v3 = 2 — só esperaria 2 das N conexões.

## O que mudou em `a04` (commit `b579816`)

- Adicionado node `[Telemetria] Merge Pre-Calcular` (`n8n-nodes-base.merge` typeVersion 3, mode `append`, position `[560, 0]`)
- Rewire: 7 leituras → Merge Pre-Calcular nos inputs **0..6 distintos** (não mais Calcular Metricas)
- Merge Pre-Calcular → Calcular Metricas
- 17 nodes total
- ps1 atualizada (17 nodes, checks novos do Merge)
- `metricCode`/`digestCode`: intocados (sentinel B3 + acentos B4 + IF/Merge Pos-Snapshot B2 da rodada 2 todos preservados)

**`a04` foi REJEITADO pela pré-revisão Claude.** Razão: `Merge Pre-Calcular.parameters` tinha só `{ mode: 'append' }`, sem `numberInputs`. Pela definição oficial do n8n Merge v3 (consultada via MCP n8n `get_node_types`):

```
numberInputs?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10   @default 2
"The number of data inputs you want to merge.
 The node waits for all connected inputs to be executed."
```

Com default 2, o Merge esperaria só 2 das 7 leituras → reabriria a quebra de idempotência (Snapshots Existentes em input 6 não seria esperada) + métricas Curador/Global potencialmente zeradas.

## O que mudou em `a05` (commit `dddb84f`)

Diff cirúrgico, 1 linha em cada arquivo:

```diff
# onboarding/telemetria/generate_export.js (Merge Pre-Calcular node)
-    parameters: { mode: 'append' },
+    parameters: { mode: 'append', numberInputs: 7 },
```

```diff
# onboarding/telemetria_tests.ps1 (após o check de mode)
+if ([int]$mergePre.parameters.numberInputs -ne 7) {
+  throw 'Merge Pre-Calcular must declare numberInputs = 7 (waits for all 7 reads)'
+}
```

Exports regenerados. Nada mais foi tocado.

## Pré-revisão Claude (este addendum)

Reproduzi a suíte ps1 em Node (pwsh indisponível neste ambiente; Codex confirmou ps1 verde em Windows PowerShell). **115 checks, 115 PASS, 0 FAIL.**

Específicos do `a05`:
- `Merge Pre-Calcular.parameters.numberInputs === 7` ✓
- 7 leituras em inputs `[0,1,2,3,4,5,6]` distintos ✓
- `Merge Pre-Calcular → Calcular Metricas in[0]` ✓

Hashes preservados (sha256 dos blocos `String.raw\` ... \``):
- `metricCode`: `85065f64cbdcbd66…` (idêntico ao `a03` `6a9c745`) ✓
- `digestCode`: `d6d72424ec17c8ca…` (idêntico ao `a03` `6a9c745`) ✓
- `sandbox_export.json` ≡ `workflow.json` byte-a-byte: `42c08612da011a8e…`

Padrões inegociáveis: sem BOM nos 3 arquivos; sem `930549271|AIza|secret|api[_-]?key|token`; sem mojibake; 19 `add()` preservadas; `active: false`; schedule 08:30 America/Sao_Paulo; Telegram HTML + chat_id redacted + text=digest_html; metricCode com sentinel/itemsParaCriar; IF linhas_novas gt 0; Merge Pos-Snapshot mode append; digest sem `parse_mode=HTML`.

## O que Antigravity deve confirmar nesta rodada

- [ ] `numberInputs: 7` é o número correto (= número exato de upstream connections)
- [ ] Topologia Merge Pre-Calcular (typeVersion 3, mode append, inputs 0..6) é a forma idiomática de resolver multi-fan-in pra Code node em n8n
- [ ] Nada mais regrediu (metricCode/digestCode/IF Tem Novas Linhas/Merge Pos-Snapshot/Set Contexto/Schedule/Telegram intocados)
- [ ] `active: false` mantido
- [ ] Brief original §"Tensões relacionadas" continua aplicável (G2 e G3 ficam pro Lote 2)

## Veredito esperado

**APROVADO**. Se houver, aponte qualquer regressão não-óbvia — porque o próximo passo é **smoke real**, e ele é decisivo: esperado 19 linhas na 1ª execução, 0 na 2ª (idempotência). Sem smoke verde, T6 não fecha e workflow não publica.

## Formato de retorno

Mesmo das rodadas anteriores. Por blob (numberInputs + topologia herdada do `a04`): `APROVADO` / `OBSERVAÇÃO (não bloqueia)` / `REJEITADO (com correção)`. Mais veredito macro.
