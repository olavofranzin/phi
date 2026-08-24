# Checklist vivo — Frente Webview (métricas de campanha + dados de cliente)

> Consolidação de 2 projetos Lovable num único webview view-only.
> Base escolhida: **Projeto B — PHI Dashboard** (ver ADR-webview-001).
> Atualizar ao fim de cada lote.

## Referências fixas
- Projeto A (Dossiê Cliente): `01153f8e-9d6a-409b-b3d5-746130017057`
- Projeto B (PHI Dashboard, **BASE**): `ff1059aa-df66-44dc-b8b1-9c2c5b09f22e` · `phi-framework.lovable.app`
- Workspace Lovable: `tUxzFKbgJBJ1EQ564UNx` (Olavo's Lovable)
- ADR base: `docs/strategic-planning/webview/ADR-webview-001-base-consolidacao.md`

## Lotes

- [x] **W1 — Inspeção + escolha da base (ADR).** Concluído 2026-08-21.
      Inspecionados os 2 projetos; base = Projeto B; lista de migração definida.
- [x] **W2 — Merge estrutural.** Concluído 2026-08-22 (commit Lovable
      `6c3399478`, 5 créditos). Dossiê do Cliente (9 seções, read-only) portado
      para a base: `clientTypes`/`sections`/`clientMock`/`useClientData`/
      `DossierField` + páginas `ClientsList` (`/clientes`) e `ClientDetail`
      (`/clientes/:client`) + nav "Clientes". Guardrails verificados (view-only,
      não recalcula score, N/D honesto). Preview:
      https://id-preview--ff1059aa-df66-44dc-b8b1-9c2c5b09f22e.lovable.app
- [x] **W3 — Backend BigQuery.** CONCLUÍDO e VALIDADO em prod (EasyPanel/VPS).
      Backend Node `webview/server/` autentica na service account
      (`antigravity-agent`), lê `phi_score_current` + `raw_campaign_data`,
      deriva KPIs (CPA/CTR/ROAS de cost/clicks/impressions/conversions/revenue),
      guardrails aplicados. `usePhiData` busca do backend. Validado com KIL
      (`GADS-21149189736`, score 59/WARNING confere). Página de detalhe à prova
      de nulos (N/D). Deploy via EasyPanel (Dockerfile). ADR-002.
- [~] **W4 — Backend Notion.** INICIADO: nomes de campanha e cliente vindos do
      Notion (`webview/server/notion.js`), best-effort com `NOTION_TOKEN`.
      Falta: Visão Cliente ler dados REAIS do Notion (hoje o dossiê é mock).
      Projetos / Observações Diárias / PHI-ANÁLISES + `client_config` /
      `client_goal_history`.
- [x] **W5 — View métricas de campanha.** CONCLUÍDO. score+classificação, KPIs
      (derivados), status e **tendência real** (gráfico Evolução do Score ligado a
      `/api/phi-score-history` → `phi_score_history`). N/D honesto.
- [x] **W6 — View cliente + navegação.** CONCLUÍDO. Lista de clientes reais (com
      campanhas), página híbrida (cadastro Notion + dossiê a preencher), e
      navegação cliente ⇄ campanha (cliente clicável no detalhe da campanha;
      campanhas clicáveis na página do cliente).

## Guardrails (sempre)
- Exibe, não escreve. Score é fato (não recalcula — ADR-003).
- Segredos só no backend (edge functions), nunca no client.
- `conversions=0` ⇒ CPA/ROAS = N/D. `source_status` error/missing ⇒ N/D (não 0).
- Créditos: sem rodada cara de Lovable sem OK do Olavo.

## Registro (§8 do brief)
- Ledger Notion "PHI — Registro de Execuções (Sub-chats)" `8d8eb685f66249c7ba4f298d744feec3`
- Execution-logs: `docs/handoff/<data>-webview-<lote>-execution-log.md`
- Snapshot: `docs/strategic-planning/ESTADO-DO-PROJETO.md`
- ADRs de design: `docs/strategic-planning/webview/`
