# ADR-webview-001 — Escolha da base para consolidar os dois projetos Lovable

- **Status:** Aceito (proposto pelo sub-chat Webview, aguarda ratificação do Olavo)
- **Data:** 2026-08-21
- **Frente:** Webview de métricas de campanha + dados de clientes
- **Lote:** W1 (inspeção + escolha da base)
- **Contexto de governança:** Git (`docs/strategic-planning/`) é canônico para design/ADRs; Notion é canônico para estado operacional.

---

## Contexto

A missão da frente Webview é **unificar DOIS projetos Lovable num único webview**
que exibe, por cliente e por campanha, as métricas de tráfego (PHI Score + KPIs)
e os dados do cliente (metas, config), lendo das fontes canônicas (BigQuery
`phi_prod` e Notion). A view **exibe — não recalcula score (ADR-003)** e
**não escreve** (guardrail §6 do brief).

Os dois projetos de partida (workspace `Olavo's Lovable`, `tUxzFKbgJBJ1EQ564UNx`):

| | **Projeto A — Client Dossier Revival** | **Projeto B — PHI Dashboard** |
|---|---|---|
| ID | `01153f8e-9d6a-409b-b3d5-746130017057` | `ff1059aa-df66-44dc-b8b1-9c2c5b09f22e` |
| Domínio | Dossiê do Cliente (dados estratégicos) | Métricas de campanha (score, KPIs, tarefas) |
| Stack | `tanstack_start_ts_2026-05-29` (TanStack Start, SSR, file-routes) | `vite_react_shadcn_ts_2026-04-20` (Vite + React + shadcn/ui) |
| Natureza | **Formulário** — escreve em `localStorage` (`STORAGE_KEY`) | **Dashboard read-only** — lê snapshot, exibe |
| Maturidade | Recente (2026-06-07), 0% preenchido, não publicado | Publicado (`phi-framework.lovable.app`), com testes (vitest) |
| Estrutura | 9 seções de dossiê em `src/components/dossier/sections.ts` | `Overview` + `CampaignsList` + `CampaignDetail`, layout com sidebar |
| Modelo de dados | `Section`/`Field` (formulário genérico) | `Campaign`/`Task`/`OptimizationLog`/`ScorePoint`/`AlertTimelinePoint` |
| Ponto de integração | `lib/api` + `config.server.ts` (server functions p/ escrita) | `src/hooks/usePhiData.ts` (hook único, desenhado p/ trocar mock→backend) |

---

## Decisão

**Adotar o Projeto B (PHI Dashboard) como base de consolidação.**
Migrar do Projeto A apenas a **arquitetura de informação do Dossiê do Cliente**
(as 9 seções) e sua linguagem visual, reconvertidas para **exibição read-only**.

## Justificativa

1. **Domínio central bate com a missão.** A missão é métricas por cliente e
   campanha; o Projeto B já é exatamente isso, com modelo de dados completo
   (`Campaign`, `Task`, `OptimizationLog`, `ScorePoint`, `AlertTimelinePoint`)
   e os guardrails de status (`STATUS_ORDER/LABEL/VAR`) já embutidos.
2. **Coerente com os guardrails "exibe, não escreve" e ADR-003.** O Projeto B
   já nasce view-only ("Notion é fonte da verdade; dashboard é VIEW-ONLY") e o
   hook `usePhiData` traz, no próprio código, o comentário: *"Tomorrow: swap the
   queryFn for a Notion-backed fetcher with the same shape."* Esse é
   literalmente o ponto de entrada dos Lotes 3–4 (backend BigQuery/Notion).
   O Projeto A é um **formulário que escreve** — contra o guardrail §6.
3. **Stack mais padrão e consolidável.** `vite_react_shadcn_ts` é a stack
   padrão do Lovable, mais simples de manter e evoluir. TanStack Start (SSR,
   file-routes) é mais nichada e traria atrito para deduplicar rotas/estado.
4. **Mais madura.** Publicado, com sidebar, gráficos Recharts, `StatusBadge`,
   skeleton/loading states e testes (vitest). Menos retrabalho.
5. **Ponto único de integração de backend.** `usePhiData` centraliza o fetch —
   casa com a arquitetura §3 do brief (edge functions no backend, API fina por
   fonte, cache curto), sem segredos no client.

## O que migrar do Projeto A → base (B)

- **Modelo de informação do Dossiê** (`src/components/dossier/sections.ts`):
  9 seções — Presença Digital, Marca, Comunicação, Mercado, Contatos,
  Comercial, Arquivos, Branding, Metas. Reaproveitar como estrutura da
  **"Visão Cliente"** (§4 do brief: dados do cliente).
- **Conversão de editável → leitura:** os `Field`/`FieldType` viram linhas de
  exibição (rótulo + valor, com **N/D honesto** quando vazio — guardrail §2).
- **Linguagem visual do dossiê** (títulos serif, numeração "01/09", header
  "CONTEXTO ESTRATÉGICO"). O Projeto A já foi criado "seguindo o mesmo padrão
  de cores do PHI Dashboard", então há continuidade natural.
- **Navegação por cliente** (lista → dossiê), a compor com a navegação por
  campanha no Lote 6.

## O que NÃO migrar

- Camada de escrita / `localStorage` (`STORAGE_KEY`, estado de formulário).
- A stack TanStack Start (SSR, `router.tsx`, `routeTree.gen.ts`, `server.ts`).
- Arquivos de erro/report específicos do Projeto A.

## Consequências

- **Positivas:** menor retrabalho; guardrails honrados por construção; um único
  hook de dados como fronteira de backend; consolidar em vez de recriar (§1).
- **Custos/risco:** remodelar o dossiê de "formulário" para "exibição" exige
  mapear cada campo às fontes canônicas (Notion Clientes/`client_config`/
  `client_goal_history`); campos sem fonte canônica ficam **N/D** ou fora de
  escopo até haver origem de dado — nunca preenchidos com placeholder.
- **Créditos Lovable (guardrail §6):** `create_project`/`send_message` gastam
  créditos do Olavo. Nenhuma rodada grande de merge (Lote 2) sem OK de budget.

## Alternativas descartadas

- **Base = Projeto A:** rejeitada — é formulário de escrita (contra guardrail),
  stack mais nichada, e o domínio de campanha (núcleo da missão) teria de ser
  construído do zero.
- **Recriar do zero (create_project):** rejeitada — o brief pede
  *consolidar, não recriar* (§1) e gastaria créditos sem reaproveitar a
  maturidade do Projeto B.

## Verificação (como sei que está certo)

- A base escolhida cobre o núcleo da missão (métricas de campanha) sem violar
  ADR-003 (não recalcula score) nem o guardrail "exibe, não escreve".
- O modelo de dados do Projeto B mapeia 1:1 com as fontes canônicas do §2
  (score → `phi_score_current`; tendência → `phi_score_history`; KPIs →
  `raw_campaign_data`/`t28_*`; status → Notion Campanhas).
- O que falta (Visão Cliente) tem origem identificada no Projeto A + Notion
  Clientes/`client_config`/`client_goal_history`, a ser portado no Lote 2.
