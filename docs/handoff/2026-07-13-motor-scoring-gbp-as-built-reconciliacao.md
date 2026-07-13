# AS-BUILT / Reconciliação — Motor de Scoring GBP no n8n (2026-07-13)

> **O que é:** snapshot autoritativo do estado REAL dos workflows do motor de scoring GBP, verificado por
> leitura direta no n8n (MCP) em 2026-07-13. Reconcilia os docs (que descreviam um plano / um build inicial)
> com o que existe vivo — os workflows evoluíram além do log de build original.
> **Motivo:** o log `2026-07-10-motor-scoring-gbp-build-execution-log.md` (branch `claude/gbp-scoring-motor-n8n-0zri0i`)
> ficou defasado — descrevia L2 gravando só `score_tecnico` e `analise_gbp_ia` só no HubSpot; a realidade já é
> uma cadeia **L2→L3→L4** com `score_gbp`/`analise_gbp_ia`/`enriquecimento_site` também na planilha.
> **Não houve edição de workflow nesta passada** (só documentação; Olavo confirmou que ninguém estava editando).

## 1. Cadeia real (tudo on-demand — sem Schedule)
```
L2 Discovery (manual)  ──chama──▶  L3 Enriquecimento  ──chama──▶  L4 Enriquecimento Site
```
Todos `active:true` mas **`triggerCount:0`** — disparados à mão (Manual Trigger no L2) ou por Execute Workflow.
Nenhum gatilho de produção (Schedule/Webhook) — o motor **não roda sozinho ainda**.

## 2. Workflows (IDs verificados)
| Módulo | Nome n8n | ID | Última edição |
|---|---|---|---|
| L1 Core (teste) | `GBP Scoring - L1 Core Engine (teste)` | `dtXFdLAHp7HmUh7o` | (build 2026-07-10) |
| L2 Discovery (Pipeline A) | `GBP Scoring - L2 Discovery (Pipeline A)` | `5j79f7oR8x1Nxs4q` | **2026-07-13 20:44** |
| L3 Enriquecimento (Pipeline B / C2) | `GBP Scoring - L3 Enriquecimento (Pipeline B / C2)` | `EFD7Drr0LDMqfDXw` | **2026-07-13 19:00** |
| L4 Enriquecimento Site | `Enriquecimento Site L4` | `5L3SyzDkZqf1N6vW` | (repurposado do antigo discovery) |

> **Nota L4:** `5L3SyzDkZqf1N6vW` era o workflow de discovery antigo que o Contrato de Dados dava como
> "inativo/abandonado" — foi **repurposado** para enriquecimento do site (grava `enriquecimento_site`). Seus
> internos não foram re-auditados nesta passada (tentativas anteriores de `get_workflow_details` nele deram
> "not available in MCP" — habilitar acesso MCP pela workflow card se for auditar).

## 3. O que cada estágio grava (verificado nos nós)
### L2 Discovery (`5j79f7oR8x1Nxs4q`)
- **Nós:** Manual Trigger + Execute Workflow Trigger → Apify (modo busca) → `02+03+04 Motor de Regras` (Code) →
  `Preparar Linha` (Set) → `Ordenar por Potencial Comercial` (Sort) → `Salvar Ranking` (Sheets upsert por `id`)
  → `Ja tem Deal no HubSpot?` (IF) → `Atualizar Deal (HubSpot - scores GBP)`. Sub-fluxo de backfill de
  `id_hubspot` (`Buscar deal hubspot`, `Buscar/Update id_hubspot planilha`, loops) e nó
  `Call 'GBP Scoring - L3 Enriquecimento'` (executeWorkflow → `EFD7Drr0LDMqfDXw`).
- **Planilha `leads` (upsert por `id`=place_id):** `score_tecnico`, `ipc`, `potencial_comercial`,
  `oferta_recomendada`, 6× `dim_*`, `site_tipo`, `nao_reivindicado`, `flags_score`, `data_processamento_score`,
  **`score_gbp`**.
- **HubSpot (Deal):** as 14 propriedades de scoring (grupo `ia_enriquecimento`).

### L3 Enriquecimento (`EFD7Drr0LDMqfDXw`)
- **Nós:** `Start (chamado por L2)` (Execute Workflow Trigger) → Apify (modo place, deep-dive `maxReviews:20`,
  `maxImages:10`, `scrapeSocialMediaProfiles.instagrams`) → `Motor de Regras` (Code) →
  `05 AI Report (Gemini Flash - so redige)` (`chainLlm` + `Gemini Flash` `gemini-2.5-flash`, temp 0.3) →
  `Montar Campos HubSpot` (Set) → `Atualizar Deal` (HubSpot) → `Call 'Enriquecimento Site L4'`
  (executeWorkflow → `5L3SyzDkZqf1N6vW`). Também `Buscar Lead` + `Update row in sheet` (planilha).
- **HubSpot (Deal):** **`analise_gbp_ia`**, `dados_enriquecimento`, as 14 de scoring, `enriquecido_profundo`
  (bool — marca que passou pelo deep-dive; dado profundo sobrescreve o raso do L2, comportamento correto).
- **Planilha:** `analise_gbp_ia` (via `Update row in sheet`).

### L4 Enriquecimento Site (`5L3SyzDkZqf1N6vW`)
- Grava **`enriquecimento_site`** na planilha. (Internos não re-auditados — ver nota §2.)

## 4. Delta vs. o log de build 2026-07-10 (por que o log ficou defasado)
| Aspecto | Log 2026-07-10 | Realidade 2026-07-13 |
|---|---|---|
| Coluna de score na planilha | `score_tecnico` (14 colunas) | + **`score_gbp`** |
| `analise_gbp_ia` | só no HubSpot | HubSpot **e** planilha |
| Orquestração | L2 e L3 separados; L3 = trigger manual | **L2 chama L3 chama L4** (cadeia) |
| L4 | não existia | **`Enriquecimento Site L4`** (`5L3SyzDkZqf1N6vW`) |
| Backfill `id_hubspot` | — | loop no L2 preenche `id_hubspot` na planilha |

## 5. Lacunas remanescentes (não bloqueiam; são o próximo trabalho)
1. 🟠 **Autonomia** — sem Schedule Trigger; falta a varredura agendada de Deals qualificados sem `analise_gbp_ia`
   chamando o L3 via Execute Workflow. Hoje só roda disparado à mão pelo L2.
2. 🟡 **Resolução lead→`placeUrl`** — L3 tem `Buscar Lead` (planilha) + refs a Places; confirmar se resolve
   `Deal/nome+cidade → placeUrl` sozinho ou ainda exige `placeUrl` pronto.
3. 🟡 **v1.1** — peso do SVC-SITE × força do GBP; Índice de Visibilidade multi-termo; passe de visão (`maxImages`).
4. 🟢 **Reconciliação de branch** — `scripts/gbp_scoring_core.js` + log de build em
   `claude/gbp-scoring-motor-n8n-0zri0i`; design + contrato + este doc em `claude/agentic-agency-planning-KwJEw`.
   No merge, garantir que os dois convivam (arquivos distintos, sem conflito de conteúdo).

## 6. Âncoras
- Design mestre (com seção AS-BUILT): `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md`.
- Contrato da planilha (colunas do motor, §1.5): `docs/comercial/planilha-quantidade-leads-por-mes-colunas.md`.
- Spec executável: `scripts/gbp_scoring_prototype.py` · Port JS (branch do motor): `scripts/gbp_scoring_core.js`.
- Log de build original (branch do motor): `docs/handoff/2026-07-10-motor-scoring-gbp-build-execution-log.md`.
