# Brief Codex — Auditoria de workflows pelo bug multi-fan-in

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: **auditoria de workflows existentes em produção** procurando o mesmo bug que detonou o smoke do `a03` da Telemetria. **NÃO corrigir nada nesta tarefa** — só relatar.

## Contexto

Smoke do WF-DOC-Telemetria-Diaria (`a03` / `6a9c745`) em 2026-06-13 revelou regressão arquitetural: 7 leituras Notion conectadas todas no mesmo input port (`Calcular Metricas in[0]`) dispararam o Code node **1× por upstream trigger**, mesmo em `runOnceForAllItems`. Resultado: 7×19 = 133 linhas em vez de 19; idempotência zero. Fix aplicado em `a05` (`dddb84f`): nó `Merge Pre-Calcular` (typeVersion 3, `mode: append`, `numberInputs: 7`) consolidando os 7 inputs em 1 batch único. Smoke real verde 2026-06-13 confirmou (19 + 0). **Aprendizado aplicado**: https://app.notion.com/p/37eb65e5c72b815b9c79f9e9a14a191f

**Padrão inegociável agora ativo** (precisa virar lei retroativa):

1. Multi-fan-in (≥2 conexões) para Code/jsCode/Function node em n8n EXIGE nó Merge antes pra consolidar N batches upstream em 1 batch único.
2. Nó Merge consolidador DEVE declarar `numberInputs` = nº exato de upstreams (default n8n v3 = 2; só esperaria 2 das N conexões).

## Workflows-alvo (em produção)

| # | Codename | n8n ID | Área | Estado |
|---|---|---|---|---|
| 1 | WF-PRIOR-L1-Abertura-Projeto-Setup | `cgw7ozJ7Zk9jBrj1` | Priorização | Ativo prod |
| 2 | WF-COM-Deduplicar-Leads-HubSpot | `izimrLm19H4i6LOq` | Comercial | Ativo prod (gatilho manual) |
| 3 | A2.1 Onboarding (5 WFs Lote 1) | localize via `search_workflows` | Onboarding | Ativo prod desde 2026-05-29 |
| 4 | A2.2 Onboarding | idem | Onboarding | Ativo prod |
| 5 | A2.5 Onboarding | idem | Onboarding | Ativo prod |
| 6 | A2.9 Onboarding | idem | Onboarding | Ativo prod |
| 7 | A2.11 Onboarding | idem | Onboarding | Ativo prod |
| 8 | A2.3 Onboarding (Lote 2) | idem | Onboarding | Ativo prod |
| 9 | A2.7 Onboarding (Lote 2) | idem | Onboarding | Ativo prod |
| 10 | A2.10 Onboarding (Lote 2) | idem | Onboarding | Ativo prod |

Pros 8 do Onboarding (A2.X), use `search_workflows` com queries variadas: "Onboarding", "A2.1", "Receber Briefing", "Classificar", "Digest", "Validação", "Gate", etc. Se algum não localizar, registre como "não localizado" no relatório — sem chute.

## Fonte de verdade

**Versão em produção (n8n via MCP) é canônica** — não os arquivos exportados no repo. Aprendizado #12 já registra isso: "Auditoria de workflow n8n: priorizar versão de produção (MCP) sobre arquivo do repo". Use `get_workflow_details(id)`.

## Como detectar

Pra cada workflow:

1. Liste todos os nodes do tipo `n8n-nodes-base.code`, `n8n-nodes-base.function`, `n8n-nodes-base.functionItem` (qualquer Code/Function node).
2. Pra cada Code/Function node `N`, conte as conexões `main` que **chegam** em `N` (varrendo `connections` reverso: pra cada `from` no objeto, vê se aponta pra `N` em algum índice).
3. Se `N` recebe **≥2 conexões diretas** (qualquer input port), e **nenhum nó Merge** está consolidando esses upstreams antes → **AFETADO**.
4. Se `N` recebe **1 conexão direta** (Merge antes consolidando, ou upstream único) → **NÃO AFETADO**.
5. Caso ambíguo (ex.: SubWorkflow ou Wait no caminho) → **INCERTO**, descrever.

Atenção especial: o input port (`index`) importa só pra confirmar topologia; o bug ocorre mesmo com `index: 0` distribuído em múltiplas conexões.

## Output

Versionar em `docs/audits/2026-06-14-multi-fan-in-audit-report.md`. Não publicar nada além disso. Formato fixo (preciso pra eu integrar limpo):

```markdown
# Auditoria multi-fan-in — 2026-06-14

## Sumário
- Total workflows auditados: N
- AFETADOS: N
- NÃO AFETADOS: N
- INCERTOS: N
- NÃO LOCALIZADOS: N

## WF-NOME-CANONICO — `id_n8n`
- **Área:** X
- **Status:** AFETADO / NÃO AFETADO / INCERTO / NÃO LOCALIZADO
- **Code/Function nodes auditados:** N (lista de nomes)
- **Evidência:**
  - Node `"[Foo] Calcular X"` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 3 conexões diretas de `"[Foo] A"`, `"[Foo] B"`, `"[Foo] C"`, todas em `in[0]`, **sem Merge antes** → afetado
  - (ou) Node `"[Foo] Y"`: recebe 1 conexão, OK
- **Recomendação:** Adicionar Merge (mode append, `numberInputs: <N>`) entre `[Foo] A/B/C` e `[Foo] Calcular X` / Nenhuma ação necessária / Investigar manualmente

(repete por workflow)

## Padrões inegociáveis aplicáveis (referência)
[copiar os 2 itens do brief]

## Observações gerais
[se houver: padrões recorrentes, dificuldades de detecção, falsos positivos esperados]
```

## NÃO fazer

- ❌ Não consertar nenhum workflow
- ❌ Não desativar nenhum workflow
- ❌ Não editar arquivos exportados no repo (`onboarding/**/workflow.json`, etc.)
- ❌ Não criar Mudanças de Escopo no Notion
- ❌ Não chutar IDs n8n que não conseguir localizar — marca como "NÃO LOCALIZADO"

## Critérios de aceite

- [ ] Os 10 workflows da tabela auditados ou marcados "NÃO LOCALIZADO"
- [ ] Cada workflow tem status claro (AFETADO / NÃO AFETADO / INCERTO / NÃO LOCALIZADO)
- [ ] Cada AFETADO tem evidência citando nomes de nodes e contagem de inputs
- [ ] Cada AFETADO tem recomendação com `numberInputs` esperado
- [ ] Relatório versionado em `docs/audits/2026-06-14-multi-fan-in-audit-report.md`

## Commit + push + verificação

```bash
git add docs/audits/
git commit -m "audit: multi-fan-in em workflows prod (relatorio)"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Depois eu (Claude) leio o relatório, classifico severidade por workflow, e a partir dos AFETADOS preparo briefs de fix individuais (1 por workflow, mesmo padrão do `a05`).

--- END COPY ---
