# Brief Antigravity — Telemetria Lote 1 rodada 2 (`a03`)

**Addendum ao brief original** (`docs/handoff/2026-06-05-telemetria-lote1-antigravity-brief.md`).

Tudo do brief original continua válido. Este addendum descreve só o que **mudou** entre a versão revisada na rodada 1 (`b15e8dd` / `a01`) e a versão atual (`6a9c745` / `a03`) que precisa de aprovação.

---

## Comando rápido

```bash
git fetch origin claude/agentic-agency-planning-KwJEw
git checkout 6a9c745   # ou HEAD da branch
git log --oneline -5
```

HEAD esperado da revisão: **`6a9c745`** (commit isolado `a03`). Commits posteriores (`0070137`, `de33efc`) só tocam `docs/strategic-planning/ESTADO-DO-PROJETO.md` — não afetam código da telemetria.

## Por que rodada 2

Veredito rodada 1: **REJEITADO** com 4 itens (B1-B4). Análise factual posterior (2026-06-11):

- **B1 (linha residual `parse_mode=HTML` no digestCode)** → **falso positivo**. Já estava corrigido em `327872d` (pré-revisão Claude antes do brief Antigravity). Provavelmente a rodada 1 revisou estado de `b15e8dd` sem pegar `327872d`/`ed3d4be`. Confirmado por grep: o snippet `parse_mode=HTML` não aparece em nenhuma versão pós-`327872d` do `digestCode`.
- **B2 (16 nodes IF+Merge)** → sugestão arquitetural, agora **implementada** em `a03`.
- **B3 (sentinel)** → bug real, **corrigido** em `a03`.
- **B4 (acento "Chave da métrica")** → bug real, **corrigido** em `a03`.

Detalhe completo do raciocínio: `docs/handoff/2026-06-05-telemetria-lote1-codex-fix-brief.md`.

## O que mudou em `a03` (1 commit, 4 arquivos)

```
onboarding/telemetria/generate_export.js  | 50 ++++++++++++++++++--
onboarding/telemetria/sandbox_export.json | 77 ++++++++++++++++++++++++++++++-
onboarding/telemetria/workflow.json       | 77 ++++++++++++++++++++++++++++++-
onboarding/telemetria_tests.ps1           | 75 ++++++++++++++++++++++++------
4 files changed, 257 insertions(+), 22 deletions(-)
```

### B3 — sentinel pattern no `metricCode`

`generate_export.js` linhas ~128-134 (após `const toCreate = ...`):

```javascript
const itemsParaCriar = toCreate.map((m) => ({ json: { ...m, metricas_do_dia: metricas, linhas_novas: toCreate.length } }));
if (itemsParaCriar.length === 0) {
  itemsParaCriar.push({ json: { sentinel: true, metricas_do_dia: metricas, linhas_novas: 0, data_snapshot, execution_id, tenant_id, versao_consulta } });
}
return itemsParaCriar;
```

Garantia: o node sempre emite ≥1 item. Sentinel carrega `linhas_novas: 0` + contexto pra digest funcionar.

### B4 — acento "Chave da métrica"

`generate_export.js` linha ~267 do array de `propertyValues` em Criar Snapshot:

```diff
- { key: 'Chave da metrica|rich_text', textContent: '={{ $json.chave }}' },
+ { key: 'Chave da métrica|rich_text', textContent: '={{ $json.chave }}' },
```

ASCII-safe via escape `é` (mantém padrão inegociável "jsCode ASCII-safe"). Bate com a leitura em outro ponto do código (linha ~70) que já usava o acento. **Bônus**: também corrigiu `'Versão da consulta'` → `'Versão da consulta'` no mesmo bloco — latent bug similar, agora resolvido.

### B2 — IF + Merge → 16 nodes

Adicionou 2 nodes:

1. `[Telemetria] IF Tem Novas Linhas` (`n8n-nodes-base.if` typeVersion 2, posição `[832, 0]`)
   - condição: `={{ $json.linhas_novas }}` `gt` `0`
2. `[Telemetria] Merge Pos-Snapshot` (`n8n-nodes-base.merge` typeVersion 3, mode `append`, posição `[1056, 120]`)

Wiring novo:
- Calcular Metricas → IF
- IF main[0] (true, `linhas_novas > 0`) → Criar Snapshot
- IF main[1] (false, sentinel) → Merge index 1
- Criar Snapshot → Merge index 0
- Merge → Montar Digest HTML

Resultado: o sentinel **bypassa** o Criar Snapshot, evitando linha fantasma no DB Snapshots. Resolve B3 elegantemente.

### `telemetria_tests.ps1` — atualizada

75 linhas adicionadas. Cobertura nova:
- 16 nodes esperados (incluindo IF + Merge)
- `sentinel: true`, `itemsParaCriar`, `return itemsParaCriar` no metricCode
- Proíbe `return toCreate.map` direto (regressão de B3)
- IF condição: `={{ $json.linhas_novas }}` / 0 / gt
- Merge mode `append`
- Outputs do IF: true → Criar Snapshot, false → Merge
- Mantém todos os checks anteriores (sem BOM, sandbox==workflow, sem secrets/mojibake/chat_id raw, schedule 08:30, 7 leituras Notion com databaseId, Telegram HTML + chat_id redacted + text=digest_html)

## Pré-revisão Claude (este addendum)

Reproduzi a suíte ps1 em Node (pwsh indisponível no ambiente de pré-revisão). **119 checks, 119 PASS, 0 FAIL.** Codex confirmou que a ps1 passou em Windows PowerShell no ambiente dele. SHAs:

- workflow.json e sandbox_export.json: SHA-256 idênticos (`6fcdf65e08728ed43dfc1f5cabc7568242d457a2dcf5d946a9f6cb707509a18c`)
- 19 `add()` calls preservadas (não mudou contagem)
- Sem `930549271|AIza|secret|api[_-]?key|token|NÃ|Ã£|Ã§|Ã©|Ã³` em nenhum dos 3 arquivos

## O que Antigravity deve confirmar nesta rodada

- [ ] Padrão sentinel é a abordagem correta (vs. retornar vazio + IF antes do node, ou outra arquitetura)
- [ ] Wiring IF/Merge está estruturalmente correto (output index 0=true, index 1=false; Merge append converge sem perda)
- [ ] B4 com `é` é coerente com o padrão "jsCode ASCII-safe" (vs. literal `é` em outras strings do projeto que NÃO são jsCode)
- [ ] Não houve regressão silenciosa em outro lugar (nodes não tocados, `digestCode` intacto, padrões inegociáveis ainda válidos)
- [ ] `active: false` mantido → workflow ainda não publica em prod sozinho
- [ ] Brief original (`2026-06-05-telemetria-lote1-antigravity-brief.md`) §"Tensões relacionadas" continua aplicável

## Veredito esperado

**APROVADO** se nenhuma regressão acima for encontrada. Próximo passo após aprovação: smoke E2E (sequência de 9 passos no brief original §"sequência de smoke E2E em 9 passos") → publish (active=true) → fechar T6 no ESTADO.

## Formato de retorno

Mesmo do brief original. Por blob (B2/B3/B4): `APROVADO` / `OBSERVAÇÃO (não bloqueia)` / `REJEITADO (com correção sugerida)`. Mais veredito macro.
