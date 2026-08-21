# Execution-log — Webview · Lote 1 (inspeção + base)

- **Data:** 2026-08-21
- **Frente:** Webview de métricas de campanha + dados de cliente
- **Branch:** `claude/webview-metricas-clientes-lxps0l`
- **Objetivo do lote (W1):** inspecionar os 2 projetos Lovable, comparar
  maturidade, escolher UM como base e listar o que migrar do outro. Registrar (ADR).

## O que foi feito

1. **Inspeção dos 2 projetos Lovable** (get_project / list_files / read_file):
   - Projeto A — *Client Dossier Revival* (`01153f8e-…`): TanStack Start,
     formulário do Dossiê do Cliente (9 seções em `dossier/sections.ts`),
     escreve em `localStorage`, 0% preenchido, não publicado.
   - Projeto B — *PHI Dashboard* (`ff1059aa-…`): Vite+React+shadcn, dashboard
     view-only de campanhas (Overview / CampaignsList / CampaignDetail),
     modelo `Campaign/Task/OptimizationLog/ScorePoint/AlertTimelinePoint`,
     hook único `usePhiData` (mock, pronto p/ trocar por backend), publicado.
2. **Decisão:** base = **Projeto B**. Justificativa completa no ADR.
3. **Lista de migração** (A→B): arquitetura de informação do Dossiê (9 seções)
   + linguagem visual, reconvertidas para exibição read-only. Não migrar:
   camada de escrita/localStorage, stack TanStack, arquivos de erro do A.

## Artefatos gerados (git)
- `docs/strategic-planning/webview/ADR-webview-001-base-consolidacao.md`
- `docs/strategic-planning/webview/CHECKLIST-webview.md`
- Snapshot em `docs/strategic-planning/ESTADO-DO-PROJETO.md` (seção Webview)
- Este execution-log.

## Verificação
- A base cobre o núcleo da missão (métricas de campanha) sem violar ADR-003
  (não recalcula score) nem "exibe, não escreve".
- Modelo do Projeto B mapeia 1:1 com as fontes canônicas do §2 do brief.
- Origem dos dados de cliente (para a Visão Cliente) identificada: Projeto A +
  Notion Clientes / `client_config` / `client_goal_history`.

## Onde parei / o que falta
- **Próximo lote: W2 (merge estrutural).** Portar o Dossiê (read-only) para a
  base, unificar design/rotas/estado, deduplicar.
- ⚠️ **BLOQUEIO DE BUDGET:** W2 usa `send_message` (gasta créditos do Olavo).
  Não iniciar sem OK explícito de budget (guardrail §6).
- Pendente (não bloqueante): registrar este lote no Ledger Notion
  `8d8eb685f66249c7ba4f298d744feec3`.
