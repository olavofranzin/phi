# [EXECUTION-LOG Claude] Automação de Tasks do PHI Score — Lote 2 (rastreabilidade + log) — PUBLICADO

> **Data:** 2026-07-21/22. **Executor:** Claude (orquestrador), branch `claude/agentic-agency-planning-KwJEw`.
> **Workflow:** `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`, keystone).
> **Resultado:** Lote 2 (P1/P2/P6/S2 + campos novos) **publicado em produção**.
> **Versão:** `activeVersionId` migrou `1a7b3aa6` (Lote 1) → **`38da5bf6`** (Lote 2).
> **Brief-fonte:** `docs/handoff/2026-07-21-phi-score-task-automation-fix-brief.md` §3 Lote 2.

## 1. Contrato de Dados — campos novos no DB Tasks (registrar como ADR)

> **ADR-31 já está ocupado** (Contrato de Dados da planilha de leads). Estes campos precisam de um **ADR próprio**
> (número atribuído na publicação do Notion). Criados via `notion-update-data-source` (DDL) no data source
> `collection://19fb65e5-c72b-813f-a6d9-000b8cfd603a` ("Tasks").

| Campo | Tipo | Origem/uso |
|---|---|---|
| `Dias em Alerta` | number | P1 — streak consecutivo real (BQ `phi_score_history`), gravado no create+update |
| `Data de Detecção` | date | P2 — data fixa de criação da task (não bumpa) |
| `Workflow` | text (rich_text) | S2 — `{{ $workflow.name }}` |
| `Última Execução` | date+hora | S2 — `{{ $now }}` (atualiza a cada run) |
| `Log de Otimização` | relation → Log de Otimizações (DUAL) | P6 — reverso `Tarefa PHI` no DB Log; setado pelo nó de log via `Tarefa PHI` |

Nenhum campo existente foi apagado/renomeado.

## 2. Edições no workflow (draft → smoke → publish, bytes preservados)

| Nó | Mudança |
|---|---|
| `Buscar Campanhas Alertas` | +CTE `streak_real` (gaps-and-islands) e coluna `dias_em_alerta_real` (streak consecutivo **sem** `LIMIT 2`). Filtros existentes e `WHERE {{ }}` preservados; comentários U+FFFD limpos. |
| `Code Enriquecer Campanha` | carrega `dias_em_alerta: $json.dias_em_alerta_real ?? 0`. |
| `Create a database page` | título → `[{client_slug}] PHI ALERT - {nome_campanha}` (**sem data**, P2); +`Dias em Alerta` (P1), +`Data de Detecção` (P2), +`Workflow`/`Última Execução` (S2). |
| `Update a database page` | +`Dias em Alerta`, +`Workflow`, +`Última Execução`. |
| **`Criar Log Otimizacoes`** (novo) | cria entrada no DB Log de Otimizações com nomes de propriedade **corretos e acentuados** (o nó antigo do WF aposentado usava chaves sem acento → falhava). Seta `Tarefa PHI\|relation` → auto-popula `Log de Otimização` na task. `onError: continueRegularOutput` + retry (uma falha de log **não** quebra a criação da task). Inserido entre `Create` e `Update otimização ativa`. |

**Número como string (BQ):** o BigQuery devolve INTEGER como **string** (`"32"`), e o campo `number` do Notion
rejeita string. Corrigido com `numberValue = {{ Number(...) || 0 }}`.

## 3. Verificação (smoke manual, draft)

- **20078 (erro, esperado):** expôs o número-como-string em `Dias em Alerta` → aplicado `Number()`.
- **20082 (success):** V3 na TSK-135 (Barbearia, WARNING crônico):
  - `Dias em Alerta = 32` ✅ **streak real** (antes capado em 2 — prova o gaps-and-islands).
  - `Workflow = "PHI - Pipeline_v2"` ✅ · `Última Execução = 2026-07-22 00:37Z` ✅.
  - Regressão Lote 1 intacta: Prioridade=Alta, Gravidade=WARNING, execution_id da run.

## 4. Pendência de verificação — caminho de CRIAÇÃO (P2 título / Data de Detecção / P6 log)

Só dispara quando uma **task nova** é criada (campanha 2+ dias em alerta **sem** task aberta). Hoje só a
Barbearia entrou no ramo (já tinha TSK-135 → caminho Update); o Salão está a 1 dia GOOD (fora do gate de 2).
**Config byte-verificada** contra o schema real do Log de Otimizações; rede `onError` ativa. **Monitorar a 1ª
criação natural** para confirmar: título sem-data, `Data de Detecção` fixa, 1 entrada no Log ligada via
`Log de Otimização` (idempotente). (Task tracker #10 cobre isso + o positivo de auto-close.)

## 5. Âncoras
- Keystone: `ITWG3Ge0asXtUM8U` · versão publicada **`38da5bf6`** · anterior `1a7b3aa6` (Lote 1).
- DBs: Tasks `19fb65e5-c72b-812d-a734-de9a4d5b980f`; Log de Otimizações `19fb65e5-c72b-8106-8e76-f1e684197316`.
- Smokes: 20078 (erro→fix), 20082 (PASS). Lote 1: `2026-07-21-phi-score-task-automation-lote1-execution-log.md`.
