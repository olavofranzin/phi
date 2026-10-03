# [BRUTO v0.4] Execução de Demandas — delta v0.3→v0.4 (Lote 2 escopado)

> **STATUS:** v0.4 travada 2026-06-18. 3 decisões consolidadas. Delta enxuto sobre v0.3.
> Próximo: migração schema DB Demandas (text→relation em `versao_sop_aplicada`) → SOP no DB SOPs → brief Codex em batches.
>
> **PRÉ-LEITURA:**
> - v0.3 (`docs/strategic-planning/execucao-demandas/BRUTO-v0.3-design.md`) — escopo do Lote 1 + DB SOPs introduzido.
> - v0.2 (`docs/strategic-planning/execucao-demandas/BRUTO-v0.1-design.md`) — design completo Lote 0/1/2.
> - Lote 1 CONCLUÍDO 2026-06-18 (3 WFs ATIVOS); este v0.4 cobre Lote 2.

---

## 1. Decisões travadas 2026-06-18

| # | Item | Decisão | Trade-off escolhido |
|---|---|---|---|
| Q1 | Arquitetura do Padronizador | **Sub-WF `WF-EXEC-Padronizador-Flash` chamado pelo QG via Execute Workflow** | Sem race condition; QG vira orquestrador do quality-gate; Padronizador vira validador isolado e auditável; permite expansão futura (Lote 3+) pra mais tipos sem inflar o QG |
| Q2 | Relations no DB Demandas | **Apenas `versao_sop_aplicada` (text → relation pra `PHI - SOPs`)** — projeto_origem/etapa_origem ficam text até Lote 3+ | Destrava drift detection do Curador Lote 1+ (consumer crítico); outras 2 relations não têm consumer downstream ainda → não justifica refactor |
| Q3 | Escopo de tipos do Padronizador | **Só Pacing/verba** (mesma cobertura do QG Lote 1) | Coerente com filtro do QG; DoDs específicos por tipo viram trabalho pro Lote 3+ quando o tipo aparecer |

Aceitos sem revisitação (herdado do v0.3 + Lote 1 em produção):
- Tier Flash do Padronizador (per ADR Tiering; validação mecânica frequente)
- ADR Eventos canônicos: Padronizador emite `demanda.entregue` / `demanda.reaberta` (igual ao QG hoje)
- Padrão `.all().find()` por `demanda_id` pra lookups pós Notion native v2.2 (per Aprendizado #N PHI Aprendizados, 2026-06-18)
- `alwaysOutputData: false` em search nodes (defensivo)
- Guards `page.id`/`demanda_id` em Code nodes
- `utcNow` date-only nos timestamps

---

## 2. Arquitetura — Padronizador como sub-WF chamado pelo QG

### Antes (Lote 1, em produção)

```
QG Schedule 5min
  → Buscar SOP Vigente
  → Buscar Demandas Em Revisao
  → Montar Evento demanda.em_revisao
  → Criar Evento demanda.em_revisao
  → [LÓGICA DoD INLINE: Validar DoD Pacing Flash + Gemini decorativo]
  → Restaurar Payload DoD
  → IF Resultado PASS?
  → {Marcar Entregue / Reabrir Demanda} → Criar Evento → Telegram
```

### Depois (Lote 2)

```
QG Schedule 5min
  → Buscar SOP Vigente
  → Buscar Demandas Em Revisao
  → Montar Evento demanda.em_revisao
  → Criar Evento demanda.em_revisao
  → [Execute Workflow: WF-EXEC-Padronizador-Flash com payload {demanda, sop}]
  ← retorna { quality_gate, missing, text, novo_estado, evento_tipo, ... }
  → IF Resultado PASS?
  → {Marcar Entregue / Reabrir Demanda} → Criar Evento → Telegram
```

### Mudanças no QG (refactor)

- **Remover:** `[Exec QG] Validar DoD Pacing Flash` + `[Exec QG] Gemini Flash DoD Pacing` + `[Exec QG] Restaurar Payload DoD`.
- **Adicionar:** `[Exec QG] Chamar Padronizador` (`n8n-nodes-base.executeWorkflow`) que dispara o sub-WF.
- **Manter** o resto do QG byte-a-byte: Schedule, Buscar SOP, Buscar Demandas, Montar Evento em_revisao, Criar Evento em_revisao, IF Resultado PASS?, Marcar Entregue, Reabrir Demanda, Criar Evento entregue/reaberta, Telegram.

### Novo WF: `WF-EXEC-Padronizador-Flash`

| Node | Tipo | Função |
|---|---|---|
| `[Exec Padr] Execute Workflow Trigger` | `n8n-nodes-base.executeWorkflowTrigger` | Recebe input do QG (demanda + sopData) |
| `[Exec Padr] Validar DoD Pacing` | `n8n-nodes-base.code` | Lógica do `Validar DoD Pacing Flash` atual do QG (sem mudança funcional) |
| `[Exec Padr] Gemini Flash DoD Pacing` | `@n8n/n8n-nodes-langchain.googleGemini` | Decorativo, mesma config do QG atual (`continueOnFail: true`) |
| `[Exec Padr] Restaurar Payload` | `n8n-nodes-base.code` | Devolve output do Validar (preserva pareamento) |

Output do sub-WF: items com `{ demanda_id, quality_gate, novo_estado, versao_sop_aplicada, evento_tipo, entidade_id, entidade_area, payload_json, timestamp, execution_id, tenant_id, tier_agente: 'flash', text, missing? }` — exatamente o shape que o QG espera hoje no `Restaurar Payload DoD`.

**Por que sub-WF e não WF independente:** evita race condition (QG e Padronizador buscando demandas em revisao em paralelo); preserva idempotência via Schedule do QG (5min); facilita rollback (delete WF-EXEC-Padronizador-Flash → QG volta ao Lote 1 sem perder dados).

---

## 3. DB Demandas: `versao_sop_aplicada` text → relation

### Schema antes (v0.3)

```
versao_sop_aplicada: rich_text  # text livre, ID do SOP como string
```

### Schema depois (v0.4)

```
versao_sop_aplicada: relation → PHI - SOPs  # relation pareando com a page Vigente
```

### Impacto nos 3 WFs Execução Lote 1

Hoje, cada propertyValue do Notion native v2.2 que escreve `versao_sop_aplicada` está como:

```js
{ key: 'versao_sop_aplicada|rich_text', type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' }
```

Vira:

```js
{ key: 'versao_sop_aplicada|relation', type: 'relation', mode: 'list', value: '={{ $json.versao_sop_aplicada }}' }
```

(Ou formato Resource Locator equivalente — confirmar via MCP n8n `get_node_types` antes de cristalizar o brief.)

**Nodes afetados** (Cataloguei via grep no commit `2452b1c`):

| WF | Nodes que escrevem `versao_sop_aplicada` |
|---|---|
| Intake-Pacing | `Criar Demanda` (Notion create) — 1 ocorrência |
| Orquestrador | `Atualizar Demanda Priorizada` (Notion update) — 1 ocorrência |
| QualityGate-Pacing | `Marcar Entregue` (Notion update) + `Reabrir Demanda` (Notion update) — 2 ocorrências |
| **PHI - Eventos** | Não afeta — `versao_sop_aplicada` lá continua `rich_text` (Eventos é log imutável, não precisa de relation) |

Total: **4 nodes refatorados** no Notion native v2.2.

### Migração de dados existentes

Demandas criadas no Lote 1 (3 hoje no DB) têm `versao_sop_aplicada` como text com o UUID da page SOP. Notion API permite conversão text→relation em runtime (a relation lê o UUID e cria o link). Mas pra **dados históricos**, Notion não converte automaticamente — vou precisar:

1. **Listar todas as demandas existentes** com `versao_sop_aplicada` populado (3 demandas hoje).
2. **Pra cada uma**, fazer update via MCP convertendo o UUID text em relation value.

OK pra 3 demandas. Se o número crescer entre v0.4 aprovado e implementação, faço script rápido.

---

## 4. SOP "Padronizador DoD Pacing v1.0" — entrada nova no DB PHI - SOPs

Schema da nova entrada:

| Campo | Valor |
|---|---|
| `titulo` | `Padronizador DoD Pacing v1.0` |
| `area` | `Execução` |
| `versao` | `v1.0` |
| `estado` | `Vigente` |
| `data_vigencia` | `2026-06-18` (ou data de ativação do Lote 2) |
| `substitui` | (vazio — base) |
| `link_documento` | URL do strawman v0.4 no GitHub |
| `tenant_id` | `phi-agencia` |
| `observacoes` | "DoD do Padronizador para tipo=Pacing/verba. Cobre Lote 2 da Execução de Demandas. 4 checks via regex sobre `observacoes`: Diagnóstico, Ação, Impacto, Audit. Falha em ≥1 check → Reabrir Demanda + Telegram. PASS → Marcar Entregue + evento canônico." |

Conteúdo da página (markdown):

```
# SOP — Padronizador DoD Pacing v1.0

## Objetivo
Validar quality-gate da Demanda tipo=Pacing/verba antes da entrega final.

## Atores
- WF-EXEC-QualityGate-Pacing (orquestrador do quality-gate)
- WF-EXEC-Padronizador-Flash (sub-WF que executa este SOP — tier Flash)

## Checklist DoD (4 checks via regex sobre observacoes da Demanda)

1. **Diagnóstico** — `/diagnostico|anomalia/`
2. **Ação tomada** — `/acao tomada|ajuste|pausad|reduz|aument|justificativa|sem acao necessaria/`
3. **Impacto esperado** — `/impacto esperado|impacto/`
4. **Audit** — `/execution_id|fonte/`

## Regra

- 4/4 checks → `quality_gate=pass` → Demanda vira `Entregue` + evento `demanda.entregue` em PHI - Eventos.
- ≤3/4 checks → `quality_gate=fail` + `missing=[...]` → Demanda volta a `Em execucao` + evento `demanda.reaberta` + Telegram com checklist da FAIL.

## Padrões inegociáveis aplicados (per ADR Eventos + Aprendizado Notion native v2.2)

- `timestamp` no payload: date-only `YYYY-MM-DD`.
- `entidade_id` = page.id da Demanda original (consumido via `.all().find(o => o.json.demanda_id === $json.id)` no QG downstream).
- `tier_agente=flash` no payload (Gemini decorativo).
- Guards `page.id`/`demanda_id` no Code do Padronizador (falha cedo com mensagem clara).

## Reavaliar quando

- Tipo de demanda novo for adicionado (Daily Entry, PHI Score degradação, etc) → SOP novo por tipo OU expansão deste com switch por tipo.
- Regex tiver falsos positivos repetidos (atual: "sem acao tomada" em texto descritivo bate como PASS).
- Gemini Flash for trocado por tier diferente.
```

---

## 5. Plano de execução em batches

Pra reduzir blast radius (lição Lote 1: bugs latentes não-estruturais em smoke real), 2 batches sequenciais com smoke isolado entre eles.

### Batch 1 — `a05-relations` (migração schema)

**Escopo:**
1. Migrar schema do DB `PHI - Demandas`: `versao_sop_aplicada` text → relation pra `PHI - SOPs` (via MCP Notion `update_data_source`).
2. Migrar dados das 3 demandas existentes (`versao_sop_aplicada` text → relation value).
3. Refactor dos 4 nodes Notion native nos 3 WFs Execução: `{ key: 'versao_sop_aplicada|rich_text' }` → `{ key: 'versao_sop_aplicada|relation' }` com formato Resource Locator.

**Pré-flight:** confirmar via MCP n8n `get_node_types` o formato exato de relation no `propertyValues` do `databasePage.create/update` (não tive smoke real ainda com relation; provavelmente `{ type: 'relation', relationValue: ['<page_id>'] }` ou Resource Locator).

**Smoke:** rodar Intake (POST webhook) + Orq (Manual Trigger) + QG (criar demanda Em revisao manual). Esperado: as 3 demandas têm `versao_sop_aplicada` como **relation** (visível como link clickável pro SOP no DB Demandas).

**Critério de fechamento:** demanda nova criada via Intake já tem relation; demanda atualizada via QG mantém relation; relação visível na UI Notion como link.

### Batch 2 — `a05-padronizador` (sub-WF + refactor QG)

**Escopo:**
1. Criar `WF-EXEC-Padronizador-Flash` (sub-WF, trigger=Execute Workflow Trigger).
2. Mover lógica do `[Exec QG] Validar DoD Pacing Flash` + Gemini + Restaurar pro Padronizador.
3. Refactor QG: remove os 3 nodes movidos, adiciona `[Exec QG] Chamar Padronizador` (Execute Workflow).
4. Criar entrada `SOP Padronizador DoD Pacing v1.0` no DB SOPs como `Vigente`.

**Pré-flight:** confirmar via MCP n8n `get_node_types` o shape de `executeWorkflow` (input/output mapping; provavelmente passa todo o `$json` por default).

**Smoke:** mesmo do QG Lote 1 (criar 1 PASS + 1 FAIL manual no DB Demandas). Esperado: QG dispara Padronizador, recebe resultado, atualiza Demanda + cria evento + Telegram FAIL. Output funcional idêntico ao Lote 1.

**Critério de fechamento:** demanda PASS vira Entregue, FAIL vira Em execucao com Telegram, 4 eventos canônicos (em_revisao + entregue/reaberta = 2 por demanda × 2 demandas). Idempotência confirmada na 2ª execução.

### Pós-batch 2

- Catálogo Notion +1: `WF-EXEC-Padronizador-Flash` (Estado=Vivo, Área=Execução).
- Catálogo Notion +1: `SOP Padronizador DoD Pacing v1.0` (Tipo=SOP, Área=Execução).
- Aprendizado Notion novo (se aparecer algo novo no smoke; tipicamente não, porque é refactor sem mudança funcional).
- ESTADO §13 nova versão (v0.1.32) — Lote 2 Concluído.

---

## 6. Fora do escopo do Lote 2

Explicito pra evitar scope creep:

- ❌ Relations `projeto_origem` / `etapa_origem` (deixa pra Lote 3+ quando o consumer aparecer).
- ❌ Cobertura de outros tipos de demanda (Daily Entry, PHI Score degradação, etc) — Lote 3+ trata.
- ❌ Padronizador como agente "autônomo" (i.e. Gemini Flash deixa de ser decorativo, vira parte do veredito) — Lote 3+ quando houver dado pra calibrar.
- ❌ Espelho Miro do fluxo — Lote 3 separado.
- ❌ Sink BQ dos eventos — Lote 4 (per ADR Eventos).

---

## 7. Próximos passos imediatos pós aprovação deste v0.4

1. Olavo aprova / red-lina v0.4 (este doc).
2. Claude executa migração schema DB Demandas via MCP Notion (`update_data_source`).
3. Claude migra dados das 3 demandas existentes (via MCP).
4. Claude cria entrada SOP "Padronizador DoD Pacing v1.0" no DB SOPs (via MCP).
5. Claude escreve brief Codex `a05-relations` → Codex implementa → pré-revisão Claude → smoke real.
6. Verde → Claude escreve brief Codex `a05-padronizador` → mesmo ciclo.
7. Verde → activate `WF-EXEC-Padronizador-Flash` + ESTADO v0.1.32 + Catálogo +2.
8. Lote 2 Execução CONCLUÍDO.
