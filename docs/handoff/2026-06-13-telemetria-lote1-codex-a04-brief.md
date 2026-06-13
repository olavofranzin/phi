# Brief Codex — Telemetria Lote 1 `a04` (fix multi-fan-in)

> **PARA CODEX.** Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: implementar `a04` do WF-DOC-Telemetria-Diaria pra corrigir regressão arquitetural detectada no smoke E2E.

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **HEAD a aplicar em cima de:** o commit mais novo (faça `git fetch origin claude/agentic-agency-planning-KwJEw` antes; provavelmente `7e1f37b` ou posterior). Não rebase sobre commit antigo.
- **a03 estava APROVADO estruturalmente** (`6a9c745`, Antigravity rodada 2 APROVADO 2026-06-11). O bug é arquitetural — nem ps1 nem Antigravity detectam.

## Pré-leitura

- `onboarding/telemetria/generate_export.js` — gerador canônico
- `onboarding/telemetria/workflow.json` — export canônico
- `onboarding/telemetria_tests.ps1` — suíte atual
- `docs/handoff/2026-06-05-telemetria-lote1-antigravity-brief.md` — brief original (§7 sequência de smoke)
- `docs/handoff/2026-06-05-telemetria-lote1-codex-fix-brief.md` — brief a03
- Aprendizado novo no DB PHI™ Aprendizados (criado 2026-06-13): "Multi-fan-in para Code node em n8n dispara N execuções do jsCode (1× por upstream trigger) — usar Merge mode append antes" (Status `Em análise`)

## Bug observado no smoke (2026-06-13)

Workflow `VubalOUaoBteCyC6` (n8n produção), `active: false`, smoke manual:

- **1ª execução**: 133 linhas no DB Snapshots em vez das 19 esperadas. Exatos **7 × 19**.
- **2ª execução (mesmo dia)**: outras 133 linhas em vez de 0. Idempotência ZERO.
- Cleanup: as 266 linhas foram apagadas manualmente. DB Snapshots agora vazio pra hoje.

## Causa-raiz confirmada

7 nodes de leitura Notion (Buscar Clientes, Etapas, Mudanças Escopo, Catálogo, Decisões ADR, Aprendizados, **Buscar Snapshots Existentes**) conectam TODOS em `[Telemetria] Calcular Metricas in[0]`.

No n8n, múltiplas conexões no mesmo input port disparam o node downstream **1× por conjunto de items recebido** (1 batch por upstream), **mesmo em modo `runOnceForAllItems`**. Logo o `metricCode` executou 7×. Cada iteração gerou 19 métricas (19 `add()` calls) → 133 linhas.

A idempotência quebrou porque em iterações triggadas por upstreams ≠ Snapshots Existentes, `$('[Telemetria] Buscar Snapshots Existentes').all()` pode retornar vazio (branch ainda não resolveu) → `existingKeys` vazio → `toCreate.filter(m => !existingKeys.has(m.idempotency_key))` não filtra nada.

## O que implementar (`a04`)

### 1. Adicionar node `[Telemetria] Merge Pre-Calcular`

- `id`: `telemetria-merge-pre-calcular`
- `name`: `[Telemetria] Merge Pre-Calcular`
- `type`: `n8n-nodes-base.merge`
- `typeVersion`: 3
- `position`: entre as 7 leituras e Calcular Metricas (sugerido `[560, 0]`)
- `parameters`: `{ mode: 'append' }`

> Merge mode `append` recebe N inputs (até 10) e concatena todos os items em 1 output. Downstream recebe **1 batch único** e roda **1×**.

### 2. Rewire das conexões

Em `connections` do workflow:

**ANTES (a03):**
```
[Telemetria] Buscar Clientes → out[0] → Calcular Metricas in[0]
[Telemetria] Buscar Etapas → out[0] → Calcular Metricas in[0]
...todas as 7 leituras...
```

**DEPOIS (a04):**
```
[Telemetria] Buscar Clientes → out[0] → Merge Pre-Calcular in[0]
[Telemetria] Buscar Etapas → out[0] → Merge Pre-Calcular in[1]
[Telemetria] Buscar Mudancas Escopo → out[0] → Merge Pre-Calcular in[2]
[Telemetria] Buscar Catalogo → out[0] → Merge Pre-Calcular in[3]
[Telemetria] Buscar Decisoes ADR → out[0] → Merge Pre-Calcular in[4]
[Telemetria] Buscar Aprendizados → out[0] → Merge Pre-Calcular in[5]
[Telemetria] Buscar Snapshots Existentes → out[0] → Merge Pre-Calcular in[6]
[Telemetria] Merge Pre-Calcular → out[0] → Calcular Metricas in[0]
```

### 3. `metricCode` NÃO MUDA

O `metricCode` (jsCode do Calcular Metricas) já busca dados via `$('node-name').all()` — independe de items input. Continua igual. Sentinel B3, acentos B4, IF+Merge B2 — tudo igual.

### 4. Atualizar `telemetria_tests.ps1`

- Contagem: `17 nodes` (era 16)
- `requiredNodeNames` ganha `[Telemetria] Merge Pre-Calcular`
- Adicionar checks pro novo Merge:
  ```powershell
  $mergePre = $nodeMap['[Telemetria] Merge Pre-Calcular']
  if ($mergePre.type -ne 'n8n-nodes-base.merge') {
    throw 'Merge Pre-Calcular must use n8n Merge node'
  }
  if ($mergePre.parameters.mode -ne 'append') {
    throw 'Merge Pre-Calcular must use append mode'
  }
  ```
- **Mudar o check de fan-in**: as 7 leituras agora conectam em `Merge Pre-Calcular`, NÃO em `Calcular Metricas`:
  ```powershell
  foreach ($name in $expectedFanOut) {
    $next = Get-NextNodes $workflow $name
    if ($next.Count -ne 1 -or $next[0] -ne '[Telemetria] Merge Pre-Calcular') {
      throw "$name must connect to Merge Pre-Calcular"
    }
  }
  ```
- Adicionar edge em `$expectedLinear`:
  ```
  @('[Telemetria] Merge Pre-Calcular', '[Telemetria] Calcular Metricas', 0)
  ```
- Validar que `Merge Pre-Calcular` recebe 7 inputs ocupados (conferir via `wf.connections` reverso — ou só validar que as 7 leituras apontam pra ele e confiar)

### 5. Regenerar `workflow.json` e `sandbox_export.json`

`node onboarding/telemetria/generate_export.js`. Garantir `sandbox == workflow` byte-a-byte.

### 6. Executar ps1

`pwsh onboarding/telemetria_tests.ps1` deve passar verde.

## Padrões inegociáveis

Tudo do `a03` continua valendo. Em particular:

- jsCode ASCII-safe
- Telegram `text` string única, `parse_mode: HTML`
- Idempotência por chave (data|chave|janela)
- `execution_id`, `tenant_id`, `versao_consulta` em cada métrica
- Re-export sanitizada (chat_id redacted, credential_ids redacted)
- Sem secrets em arquivo
- Sem mojibake
- UTF-8 sem BOM
- `active: false` mantido (não publica em prod ainda)
- Manter os 16 nodes existentes + adicionar 1 (total 17)

**Padrão NOVO inegociável:**
- Multi-fan-in (≥2 inputs) para Code/jsCode/Function node EXIGE Merge antes pra consolidar em 1 batch único. Caso contrário o jsCode roda N vezes silenciosamente.

## NÃO fazer

- ❌ Não tocar `metricCode` (idempotência via `existingKeys` está OK arquiteturalmente — o bug era execução múltipla)
- ❌ Não tocar `digestCode`
- ❌ Não tocar IF Tem Novas Linhas ou Merge Pos-Snapshot (B2/B3 da `a03` continuam corretos)
- ❌ Não tocar `Buscar Snapshots Existentes` (vai pro Lote 2 — G2 latent risk)
- ❌ Não mudar contagem de 19 `add()`

## Critérios de aceite

- [ ] Node `[Telemetria] Merge Pre-Calcular` presente, type merge typeVersion 3 mode append
- [ ] 7 leituras conectam em `Merge Pre-Calcular` (não mais em `Calcular Metricas`)
- [ ] `Merge Pre-Calcular → Calcular Metricas` wired
- [ ] 17 nodes total
- [ ] ps1 atualizada e VERDE
- [ ] `workflow.json ≡ sandbox_export.json` byte-a-byte (mesma SHA-256)
- [ ] Sem secrets, sem mojibake, sem BOM
- [ ] `active: false` mantido
- [ ] `digestCode` e `metricCode` intocados (exceto regeneração do export que pode reordenar — OK)

## Commit + push + verificação

```bash
git add onboarding/telemetria/ onboarding/telemetria_tests.ps1
git commit -m "telemetria-minima a04: Merge Pre-Calcular consolida 7 leituras antes do Code node"
git push -u origin claude/agentic-agency-planning-KwJEw

# Verificação SHA pós-push (Aprendizado #19 retificado):
git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Depois disso eu (Claude) faço pré-revisão; se passar, Antigravity rodada 3; depois SMOKE REAL é decisivo. Sem smoke verde, não fechamos T6 nem publish.

--- END COPY ---
