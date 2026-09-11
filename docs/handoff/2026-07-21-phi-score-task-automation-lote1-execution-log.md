# [EXECUTION-LOG Claude] Automação de Tasks do PHI Score — Lote 0 + Lote 1 — PUBLICADO

> **Data:** 2026-07-21. **Executor:** Claude (orquestrador), branch `claude/agentic-agency-planning-KwJEw`.
> **Workflow:** `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`, keystone — score + tasks inline).
> **Resultado:** Lote 0 (consolidação) + Lote 1 (falhas silenciosas + P3/P4) **publicados em produção**.
> **Brief-fonte:** `docs/handoff/2026-07-21-phi-score-task-automation-fix-brief.md`.
> **Versão:** `activeVersionId` migrou `efc14eb4-65ed-4e06-8a2e-71c246ea6316` → **`1a7b3aa6-eed2-4417-ba5b-e83889fd55bd`**.

## 1. O que foi aplicado (10 nós no draft, via MCP, bytes preservados)

### Lote 0 — arquitetura (fim do double-write)
- `Chamar Loop Alerta Fase 1` **desabilitado** (`disabled:true`) no Pipeline_v2.
- `PHI - Loop Alerta Fase 1` (`JqPwFD9udCq2hRPw`) **desativado** (unpublish) + renomeado
  `[APOSENTADO 2026-07-21] PHI - Loop Alerta Fase 1 — NÃO REUTILIZAR` + sticky note explicativa.
  **Não** arquivado/apagado (histórico auditável). Regra: não reabrir salvo necessidade estrutural via ADR.

### Lote 1 — falhas silenciosas + Prioridade/execution_id
| Nó | Correção |
|---|---|
| `Check Auto-Close` | Passa a ler de `$('Enrich for Sync').item.json`: `['GOOD','EXCELLENT'].includes(phi_classification)` **e** `good_streak >= 2` (histerese). Antes lia o objeto-página do `Sync Scores to Notion` (sem `phi_classification`) → sempre falso (código morto). |
| `Get All Current Scores (Sync)` | Query ganhou coluna **`good_streak`** (CTE `datas_recentes` + `dias_bons`, padrão simétrico ao da abertura). `WHERE {{ }}` e `projectId` preservados (modo-expressão intacto). |
| `Auto-Close Task (Notion)` | `Status = "Concluído"` (era `"Conclu�do"` U+FFFD). |
| `Auto-Close: Desativar Otimização` | Chave corrigida → `{key:"Otimização Ativa?|checkbox", checkboxValue:false}` (era JSON-em-string malformado). pageId mantém `Enrich for Sync.notion_page_id` (flag vive na página da campanha, confirmado no schema). |
| `Get Task para Fechar` | Filtro `Status ≠ "Concluído"` (era U+FFFD). |
| `Update Escalar Tarefa` | Reduzido a **só `Prazo=$today`** → elimina o clobber (Tier 1-B). Gravidade/Prioridade/Observação/Data Programada saíram (passam a ser responsabilidade única do `Update a database page`). |
| `Update a database page` | Gravidade `= phi_classification`; **+Prioridade** (CRITICAL→Crítica, WARNING→Alta, GOOD→Média, EXCELLENT→Baixa); **+execution_id** (run atual); Observação vira **append datado** (lê `$json.properties['Observação']`, prepend + cap 1800, fallback seguro). |
| `Create a database page` | Gravidade `= phi_classification` (era "Crítica" fixo); Prioridade pelo mesmo mapa (era banda de `priority_score`). Demais 14 props intactos. |
| `Code Criar Checklist` | Reescrito limpo (0 U+FFFD): `mapPrioridade` deriva de `phi_classification` (corrige `'M�éia'`→`'Média'` e alinha P3). |
| `Update Hipótese na Tarefa` | Chave `"Hipótese Sugerida (IA)|rich_text"` (era `"Hip�tese…"` U+FFFD). |

**Disciplina:** todas as edições por `update_workflow` (MCP), **nunca UI**; V1 read-back byte-a-byte com **U+FFFD=0** nos 10 nós; produção só tocada no publish final.

## 2. Verificação (smoke manual 20066 — `success`, rodou o draft sem publicar)

| Critério | Esperado | Resultado |
|---|---|---|
| Lote 0 | zero tasks `[PHI] Otimizacao` novas | ✅ **zero tasks criadas** (query Notion pós-smoke vazia) |
| Cenário A (TSK-135 / Barbearia WARNING) | Prioridade=Alta, Gravidade=WARNING, execution_id de hoje, Observação append | ✅ Prioridade=**Alta**, Gravidade=**WARNING**, execution_id=**EXEC-PHI-20260721234700-…** (≠ FALLBACK), Observação com linha nova no topo + histórico preservado |
| Escalada | sem clobber | ✅ `Update Escalar Tarefa` só Prazo; Gravidade/Obs corretas via Update |
| Histerese (dado) | `good_streak` popula por campanha | ✅ Salão `good_streak=1`, Barbearia `good_streak=0` |
| Controle negativo | nenhuma WARNING fecha | ✅ Check Auto-Close 6/6 → não-fecha; `Get Task para Fechar` não executou |
| Sem duplicação | `Create` não dispara | ✅ não executou |

## 3. Pendência conhecida — teste POSITIVO de auto-close

Hoje (2026-07-21) **nenhuma campanha está GOOD/EXCELLENT** (Salão e Barbearia ambas WARNING) → o caminho
de *fechamento* (task de campanha recuperada → `Concluído`) não teve como disparar com dado real. A lógica está
**byte-verificada** (roteamento, `Status→Concluído`, chave do flag, filtro) e o **controle negativo passou**.
**Decisão do Olavo:** publicar agora e **confirmar o positivo na 1ª recuperação natural** (monitorar a 1ª
campanha que ficar GOOD/EXCELLENT por 2 dias consecutivos; `good_streak>=2` → deve fechar a task automática dela).
Hotfix se necessário.

## 4. Idempotência
Estruturalmente garantida: `Tarefa Existe?` roteia campanha com task aberta para **Update** (não Create) →
sem duplicar task; Observação **append** com cap de 1800 chars. Não foi rodado o 2º smoke dedicado (opção
descartada pelo Olavo em favor de publicar + monitorar).

## 5. Escopo NÃO tocado (fica para Lote 2)
P1 `Dias em Alerta` (streak real gravado), P2 título/datas (sem-data + `Data de Detecção` fixa), P6 Log de
Otimizações (nó + relation), S2 `Workflow`/`Última Execução`, campos novos no DB Tasks. Frente separada S1
(qual anúncio pesou) = design, não patch. Cadeia de ingestão/cálculo do score **intocada** (guardrail).

## 6. Âncoras
- Keystone: `PHI - Pipeline_v2` `ITWG3Ge0asXtUM8U` · versão publicada **`1a7b3aa6`** · anterior `efc14eb4`.
- Aposentado: `JqPwFD9udCq2hRPw`.
- DBs: Tasks `19fb65e5-c72b-812d-a734-de9a4d5b980f`; Log de Otimizações `19fb65e5-c72b-8106-8e76-f1e684197316`.
- Smoke: execução **20066** (manual, draft). Exec de referência pré-fix: 19859.
- Brief: `docs/handoff/2026-07-21-phi-score-task-automation-fix-brief.md`.
