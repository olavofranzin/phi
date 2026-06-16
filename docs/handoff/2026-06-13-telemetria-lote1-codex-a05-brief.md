# Brief Codex — Telemetria Lote 1 `a05` (numberInputs no Merge Pre-Calcular)

> **PARA CODEX.** Correção cirúrgica de 1 parâmetro. Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `a05` do WF-DOC-Telemetria-Diaria — corrigir 1 parâmetro faltante no `a04`.

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** o commit mais novo (faça `git fetch origin claude/agentic-agency-planning-KwJEw` antes; provavelmente `b579816` ou posterior).
- O `a04` (`b579816`) **passou a ps1** e a pré-revisão Claude confirmou a topologia correta (7 leituras em inputs distintos 0..6, Merge → Calcular Metricas, metricCode/digestCode intocados). **Mas a pré-revisão REJEITOU** por 1 defeito: falta `numberInputs`.

## Defeito

O node `[Telemetria] Merge Pre-Calcular` tem:

```javascript
parameters: { mode: 'append' },
```

A definição oficial do n8n Merge v3 (mode append):

```
numberInputs?: 2 | 3 | ... | 10   @default 2
"The number of data inputs you want to merge. The node waits for all connected inputs to be executed."
```

**O Merge só espera os inputs declarados.** Com o default de 2, ele espera apenas `Buscar Clientes` (input 0) e `Buscar Etapas` (input 1). As outras 5 leituras — Mudanças Escopo (2), Catálogo (3), Decisões ADR (4), Aprendizados (5) e **crucialmente Snapshots Existentes (6)** — não são esperadas. Isso reabre o bug:

- `Calcular Metricas` pode disparar antes de `Buscar Snapshots Existentes` resolver → `$('[Telemetria] Buscar Snapshots Existentes').all()` vazio → `existingKeys` vazio → **idempotência quebra** (variante do bug que o smoke do `a03` pegou).
- Possivelmente métricas de Curador/Global zeradas se as leituras órfãs (inputs 2..6) não executarem.

A ps1 atual não detecta porque não valida `numberInputs`.

## O que implementar (`a05`)

### 1. `generate_export.js` — adicionar `numberInputs: 7`

No node `[Telemetria] Merge Pre-Calcular`:

```diff
-    parameters: { mode: 'append' },
+    parameters: { mode: 'append', numberInputs: 7 },
```

> 7 inputs = as 7 leituras Notion. O Merge passa a esperar TODAS antes de emitir.

### 2. `telemetria_tests.ps1` — adicionar check

Logo após o bloco que valida `$mergePre` mode append (procure `Merge Pre-Calcular must use append mode`):

```powershell
if ([int]$mergePre.parameters.numberInputs -ne 7) {
  throw 'Merge Pre-Calcular must declare numberInputs = 7 (waits for all 7 reads)'
}
```

### 3. Regenerar exports

`node onboarding/telemetria/generate_export.js` → `workflow.json` + `sandbox_export.json` idênticos byte-a-byte.

### 4. Rodar ps1

`pwsh onboarding/telemetria_tests.ps1` (ou Windows PowerShell) deve passar verde.

## NÃO fazer

- ❌ Não mexer na topologia do `a04` — está correta (7 leituras em inputs 0..6, Merge → Calcular Metricas)
- ❌ Não tocar `metricCode`, `digestCode`, IF Tem Novas Linhas, Merge Pos-Snapshot
- ❌ Não mudar contagem de nodes (continua 17) nem de `add()` (continua 19)
- ❌ Não mudar `active: false`

## Critérios de aceite

- [ ] `Merge Pre-Calcular` parameters = `{ mode: 'append', numberInputs: 7 }`
- [ ] ps1 valida `numberInputs === 7` e passa verde
- [ ] 17 nodes, 7 leituras em inputs 0..6 (inalterado)
- [ ] `workflow.json ≡ sandbox_export.json` byte-a-byte
- [ ] metricCode/digestCode com hash inalterado vs `b579816`
- [ ] sem BOM, sem secrets, sem mojibake, `active: false`

## Commit + push + verificação

```bash
git add onboarding/telemetria/ onboarding/telemetria_tests.ps1
git commit -m "telemetria-minima a05: numberInputs=7 no Merge Pre-Calcular (espera as 7 leituras)"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Depois: pré-revisão Claude → Antigravity rodada 3 → **smoke real** (decisivo — esperado 19 linhas na 1ª execução, 0 na 2ª).

--- END COPY ---
