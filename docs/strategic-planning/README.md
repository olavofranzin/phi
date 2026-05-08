# Strategic Planning — PHI / PHI-Compass™

Esta pasta é um índice navegável (versionado em git) da documentação estratégica do projeto PHI.

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

ADRs em planejamento: 006 (Log de Otimizações), 007 (Onboarding), 008 (CPA-only vs polimórfico), 009 (execution_id).

---

## Aprendizados

12 aprendizados registrados (#1–#12). Lista viva e atualizada: https://www.notion.so/2e49a766781841fda4a2681d358bc98f

Destaques recentes:

- **#7** — `cost_3d`/`cost_7d` zerado em `phi_prod.raw_campaign_data` (insumo de A.0 e ADR-005).
- **#12** — Auditoria de workflow n8n: priorizar versão de produção via MCP sobre arquivo do repo (https://www.notion.so/35ab65e5c72b81008fc8f40a31d31c86).

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
