# Strategic Planning — PHI / PHI-Compass™

Esta pasta é um índice navegável (versionado em git) da documentação estratégica do projeto PHI.

> **🗺️ Comece por [`MAPA-DE-DOCUMENTACAO.md`](MAPA-DE-DOCUMENTACAO.md)** — porta única de entrada: onde procurar cada documento e quando criar cada tipo (ADR / SOP / Aprendizado / Mudança de Escopo / strawman / handoff). Evita reler vários docs e recriar o que já existe.

> **Fonte da verdade: Notion.** Aqui ficam apenas ponteiros e, quando faz sentido versionar (ex: snapshots críticos, exports de auditoria), arquivos `.md` exportados manualmente.

Artefatos operacionais entre agentes (Cérebro ↔ Codex ↔ Antigravity) ficam em `../handoff/`.

---

## Bases canônicas no Notion

| Base | Função | Link |
|---|---|---|
| Painel de Entregas | Fila viva A.x | https://www.notion.so/fad6713af36d4c17a8db1dfca158b0fa |
| Decisões (ADR) | Decisões arquiteturais | https://www.notion.so/237a5e127f5142eeb9c04ddfb16b6400 |
| Aprendizados | Lições e observações | https://www.notion.so/2e49a766781841fda4a2681d358bc98f |
| PHI-Compass™ | Guia Estratégico | https://www.notion.so/356b65e5c72b812dbb34f0180cfccd75 |
| Documentação Técnica v1.4 | Especificação completa | https://www.notion.so/328b65e5c72b81039ad0d2fb81dd8055 |
| Gerenciamento de Documentos | Hub de SOPs | https://www.notion.so/9d6b65e5c72b82e7856d81bc34933316 |

---

## ADRs vigentes

| # | Título | Status | Link |
|---|---|---|---|
| 001 | Escolha Supabase como Database Primário | Aceito | https://www.notion.so/357b65e5c72b81779c02f29d091fd924 |
| 002 | Estratégia de Free Tier Intencional na Fase 0 | Aceito | https://www.notion.so/358b65e5c72b8172ac90daf2a6846976 |
| 003 | Autoridade única do PHI Score | Aceito | https://www.notion.so/359b65e5c72b81068959ce8615009166 |
| 004 v2 | Fórmula do PHI Score (FIS, MAS, TSS, MIV) | Aceito | https://www.notion.so/359b65e5c72b819c981cfc1eaf79555f |
| 005 | Heterogeneidade temporária Google x Meta no upstream | Aceito | https://www.notion.so/35ab65e5c72b81d38157c81a9636d51e |
| 009 | Semântica do execution_id no PHI: espelho vs run_id próprio | Aceito (2026-05-09 — Opção 2) | https://www.notion.so/35bb65e5c72b81f3a4e0e05ad9a82f04 |

ADRs em planejamento: 006 (Log de Otimizações), 007 (Onboarding), 008 (CPA-only vs polimórfico).

---

## Aprendizados

15 aprendizados registrados (#1–#15). Lista viva e atualizada: https://www.notion.so/2e49a766781841fda4a2681d358bc98f

Destaques recentes:

- **#7** — `cost_3d`/`cost_7d` zerado em `phi_prod.raw_campaign_data` (insumo de A.0 e ADR-005).
- **#12** — Auditoria de workflow n8n: priorizar versão de produção via MCP sobre arquivo do repo (https://www.notion.so/35ab65e5c72b81008fc8f40a31d31c86).
- **#13** — MCP de produção é canal de escrita: SOP-03 precisa explicitar quando isso é autorizado (https://www.notion.so/35ab65e5c72b81e3a5afe1754c6278c8).
- **#14** — Bugs upstream mascaram bugs downstream: critério de aceite deve testar ponta-a-ponta (https://www.notion.so/35ab65e5c72b81bbb2a4e70b2996b3d7).
- **#15** — Anti-pattern de fallback silencioso pervasivo no PHI: `prop() ?? 0`, classificador `GADS`/`META` e `FALLBACK-*` são instâncias do mesmo estilo de codificação. Causa raiz arquitetural de #14. (https://www.notion.so/35bb65e5c72b81e4994cf2e54b1976bf)

---

## Entregas em curso

| ID | Título | Status | Agente | Link |
|---|---|---|---|---|
| A.0 | Correção upstream de cost_3d/cost_7d (Google-only) | Aprovado (Olavo, 2026-05-09) | Codex (executou) → Antigravity (validação) | https://www.notion.so/359b65e5c72b81459cafd7705d38866f |
| A.5 | Sub-auditoria do execution_id em FALLBACK no PHI-Pipeline_v2 | Aprovado (Olavo, 2026-05-09) | Codex | https://www.notion.so/35ab65e5c72b81f6b64ef59c8a5935a8 |
| A.7 | Refactor going-forward das tabelas PHI (descoberta) | Aprovado (Olavo, 2026-05-09) | Codex | https://www.notion.so/35bb65e5c72b8186bd28e2132a80c7f0 |
| A.7b | DDL nas 2 BASE TABLES + reescrita da VIEW phi_score_current | Backlog | Codex → Antigravity | https://www.notion.so/35bb65e5c72b8193ad08e247d7235a1d |
| A.6 | Fix cirúrgico do seletor de execution_id no PHI-Pipeline_v2 (reescopado para Opção 2) | Backlog (bloqueada por A.7b) | Codex → Antigravity | https://www.notion.so/35bb65e5c72b81dbbbc7f29a5e38c3d0 |

**ADR-009 aceito 2026-05-09 — Opção 2 (run_id próprio + source_execution_id).** Faseamento decidido (Olavo): **A.7 primeiro** (DDL going-forward em `phi_score_history`/`phi_score_current`/`workflow_execution_log` + mapeamento de consumidores), **A.6 depois** (nó passa a gerar `EXEC-PHI-*` e popular `source_execution_id`). Logs históricos em FALLBACK ficam intocados (going-forward, NULL retroativo).

**A.0 aprovada 2026-05-09.** Antigravity validou as 3 frentes (diff estático + BQ snapshot pré/pós + smoke retroativo da canária `GADS-21149189736`). Dados pré-2026-05-07 mantêm `cost_3d=cost_7d=0` (going-forward, sem backfill — consistente com a política do ADR-009 e Aprendizado #15).

**A.7 aprovada 2026-05-09 como entrega de descoberta.** Codex acionou corretamente o critério de parada do briefing original ao verificar via `INFORMATION_SCHEMA.TABLES` que `phi_score_current` é `VIEW`, não `BASE TABLE`. Auditoria isolada em workflows temporários `TMP - A7 BigQuery *` (arquivados ao final). Trabalho de DDL migrado para A.7b com escopo correto: 2 ALTERs em `phi_score_history`/`workflow_execution_log` + `CREATE OR REPLACE VIEW` para `phi_score_current` projetando `source_execution_id`.

Blocker reports publicados (todos em `docs/handoff/`):
- [2026-05-09-A5-auditoria-execution-id.md](../handoff/2026-05-09-A5-auditoria-execution-id.md) — Codex, sub-auditoria H1 confirmada (11/11 execuções históricas em FALLBACK).
- [2026-05-09-A7-refactor-source-execution-id.md](../handoff/2026-05-09-A7-refactor-source-execution-id.md) — Codex, descoberta de `phi_score_current` como `VIEW` (motivou A.7b).
- [2026-05-09-A0-validacao-bq-smoke.md](../handoff/2026-05-09-A0-validacao-bq-smoke.md) — Antigravity, validação completa de A.0.

---

## SOPs

| SOP | Função |
|---|---|
| SOP-01 | Abertura de Entrega |
| SOP-02 | Handoff entre Agentes |
| SOP-03 | Aceite de Entrega |
| SOP-04 | Criação de ADR |

Acesso pelo hub: https://www.notion.so/9d6b65e5c72b82e7856d81bc34933316

---

## Sincronização Notion ↔ git

Hoje: **manual.** Quem precisar de cópia `.md` versionada exporta do Notion e coloca em subpasta dedicada (`adr/`, `learnings/`, etc.) — não existem subpastas ainda porque não houve necessidade.

Se a sincronização virar dor recorrente, ver Aprendizado #12 e propor SOP de mirror Notion → git.
