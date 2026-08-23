
# Dashboard PHI™ — MVP com Mock Data

Dashboard dark-mode estilo executivo para monitorar campanhas de tráfego pago do framework PHI™. Esta primeira versão roda 100% com dados mockados realistas — depois plugamos a Notion API sem mexer na UI.

## Arquitetura

- **Layout com sidebar** (shadcn `Sidebar`, `collapsible="icon"`) navegando entre Overview e Campanhas
- **Dark mode como padrão** (classe `dark` aplicada no root, sem toggle nesta fase)
- **React Query** com `staleTime: 5min` e auto-refresh no Overview
- **Camada de dados isolada** num hook `usePhiData` que hoje retorna mocks e amanhã vira `useNotionData` — assinatura idêntica para troca indolor
- **TypeScript estrito** com tipos `Campaign`, `Task`, `OptimizationLog`, `CampaignStatus` espelhando o schema Notion da spec

## Mock Data

Gerador determinístico (`src/lib/mock/phi.ts`) que produz:
- ~24 campanhas distribuídas entre os 5 status (EXCELLENT, GOOD, WARNING, CRITICAL, LEARNING)
- 6 clientes fictícios, mix Google Ads / Meta Ads
- Scores, investimento, CPA alvo/real, conversões, CTR coerentes com o status
- ~40 tarefas PHI ligadas às campanhas, distribuídas em P0/P1/P2
- Histórico de 30 dias de score por campanha (curvas suaves com ruído)
- Log de otimizações com marcadores datados

## Página 1 — Overview Geral (rota `/`, página inicial)

**Header:** título "PHI™ Overview", indicador "Última atualização HH:MM", botão Refresh manual, badge de auto-refresh ativo (5 min)

**KPI Cards (grid 5 colunas → 2 em mobile):**
- Total de campanhas ativas
- CRITICAL (nº + %) — destaque vermelho
- WARNING (nº + %) — destaque âmbar
- Score médio geral (mono font, 0–100)
- Tarefas P0/P1 abertas

**Donut de Distribuição de Status** (Recharts `PieChart`) com a paleta exata da spec:
EXCELLENT `#10B981` · GOOD `#34D399` · WARNING `#F59E0B` · CRITICAL `#EF4444` · LEARNING `#3B82F6`. Legenda lateral com contagem.

**Timeline de Alertas (7 dias)** — line chart empilhado mostrando contagem por status ao longo do tempo, para identificar tendência de piora/melhora.

**Tabela de Campanhas Críticas** — só CRITICAL e WARNING, ordenada por score crescente. Colunas: Nome · Cliente · Plataforma · Score (com mini-bar) · Status (badge colorido) · Tarefas Abertas. Linha clicável → drill-down.

## Página 2 — Visão por Campanha (rota `/campanhas/:id`)

**Header da campanha:** Nome grande, Cliente · Plataforma como subtítulo, badge de status grande, gauge radial 0–100 com o score atual, "Última atualização PHI".

**Evolução do Score (30 dias)** — line chart com:
- Linhas de threshold horizontais em 80 (EXCELLENT), 60 (WARNING), 40 (CRITICAL)
- Markers nas datas das otimizações com tooltip mostrando ação + resultado
- Nota visível: "Histórico mockado — fonte real será conectada na Fase 2"

**Métricas Operacionais** — 6 cards: Investimento, CPA Alvo, CPA Real, Conversões, CTR, ROAS. Cada card mostra valor atual + delta % vs período anterior (verde/vermelho).

**Tarefas Ativas** — agrupadas por prioridade (P0 → P1 → P2), cada item com título, métrica afetada e Hipótese de Solução em accordion expansível.

**Histórico de Otimizações** — timeline reversa, card por entrada com Data, Ação, badge de Resultado (Sucesso/Neutro/Insucesso) e Impacto no Score.

## Estados de UI

- **Loading:** skeletons em todos os blocos
- **Empty:** mensagens amigáveis (ex: "Nenhuma campanha em estado crítico 🎉")
- **Erro:** card de erro com botão Retry (preparado para quando vier API real)

## Design System

- Tokens HSL no `index.css` para o tema dark-first da spec: bg `#0F172A`, surface `#1E293B`, border `#334155`, text `#F1F5F9` / `#94A3B8`
- Status colors expostos como CSS vars (`--status-excellent`, etc.) para reuso em badges, donut e tabelas
- Tipografia: **Inter** para UI, **JetBrains Mono** para scores e números — carregadas do Google Fonts no `index.html`
- Cards shadcn com radius 8px, shadows sutis, badges de status consistentes

## Fora do escopo desta fase

Kanban de Tarefas, Analytics avançado, autenticação, conexão real ao Notion, persistência de snapshots — todos ficam para fases seguintes, mas a arquitetura de dados já está preparada para receber a integração trocando apenas o hook `usePhiData`.
