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
- [ ] **W2 — Merge estrutural.** Portar Dossiê do Cliente (9 seções, read-only)
      do Projeto A para a base; unificar design/rotas/estado; deduplicar.
      ⚠️ Requer OK de budget do Olavo (send_message gasta créditos).
- [ ] **W3 — Backend BigQuery.** Edge functions lendo `phi_score_current`,
      `phi_score_history`, `raw_campaign_data`, `t28_campaign`/`t28_meta_campaign`.
      Segredos só no servidor. Trocar `usePhiData` mock → fetch real.
- [ ] **W4 — Backend Notion.** Edge functions lendo Clientes / Campanhas /
      Projetos / Observações Diárias / PHI-ANÁLISES + `client_config` /
      `client_goal_history`.
- [ ] **W5 — View métricas de campanha.** score+classificação, KPIs, tendência,
      status. N/D honesto sempre.
- [ ] **W6 — View cliente + navegação.** Lista de clientes + dossiê read-only;
      navegação cliente ⇄ campanha.

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
