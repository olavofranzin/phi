# Execution-log — Webview · Lote 2 (merge estrutural)

- **Data:** 2026-08-22
- **Frente:** Webview de métricas de campanha + dados de cliente
- **Branch:** `claude/webview-metricas-clientes-lxps0l`
- **Base Lovable:** Projeto B — PHI Dashboard (`ff1059aa-df66-44dc-b8b1-9c2c5b09f22e`)
- **Commit Lovable:** `6c3399478a2026a1bb3682d3adb88b0866f18e1d` (edit `edt-05e0b427`)
- **Custo:** 5 créditos Lovable (budget aprovado pelo Olavo)
- **Objetivo (W2):** portar o Dossiê do Cliente (9 seções, read-only) do Projeto A
  para a base; unificar design/rotas/estado; deduplicar.

## O que foi feito (na base Lovable)

Nova área "Visão Cliente" consolidada no dashboard PHI, sem alterar Overview/Campanhas:

- **Modelo de dados** `src/lib/phi/clientTypes.ts` — `ClientDossier` (`client` +
  `fields: Record<string,string>`), `DossierSection`, `DossierFieldDef`,
  `DossierFieldType` (text|url|textarea|email|tel).
- **Metadados das 9 seções** `src/lib/phi/sections.ts` — Presença Digital, Marca,
  Comunicação, Mercado, Contatos, Comercial, Arquivos, Branding, Metas
  (portadas do Projeto A como EXIBIÇÃO, não formulário).
- **Mock** `src/lib/phi/clientMock.ts` — dossiê para os 6 clientes do mock de
  campanhas (Aurora, Helix, Nimbus, Verdant, Orbit, Forge), em pt-BR, com campos
  vazios propositais por cliente (exercita N/D).
- **Hook** `src/hooks/useClientData.ts` — mesmo padrão do `usePhiData`
  (React Query, staleTime 5min, latência 300ms) + comentário de swap para
  backend Notion/BigQuery (ponto de entrada dos Lotes 3–4).
- **Componente** `src/components/phi/DossierField.tsx` — linha label→valor
  read-only; N/D muted; links para url/email/tel; multi-linha para textarea.
- **Navegação** `AppSidebar.tsx` — item "Clientes" (ícone Users) após "Campanhas".
- **Páginas**:
  - `ClientsList.tsx` (`/clientes`) — lista de clientes com nº de campanhas,
    score médio (agregação de EXIBIÇÃO, `aggregateClient` — não recalcula score)
    e pior status; skeleton + empty state.
  - `ClientDetail.tsx` (`/clientes/:client`) — header serif numerado, 9 seções
    read-only, bloco "Campanhas deste cliente" com link para `/campanhas/:id`;
    trata cliente inexistente.
- **Rotas** em `src/App.tsx` acima do catch-all; rotas existentes preservadas.

## Verificação (feita)

Revisão dos 8 arquivos novos/alterados no commit contra os guardrails:
- View-only: nenhum input/form/localStorage/escrita; botões só navegam. ✓
- Não recalcula score: `aggregateClient` comentado "Does not recalculate any
  campaign score"; média é agregação de exibição. ✓
- N/D honesto: campo vazio, score/status ausentes e links tratados como N/D. ✓
- Reusa design system (Card, StatusBadge, sidebar, tokens, NavLink). ✓
- Nomes de cliente no mock batem 1:1 com o mock de campanhas. ✓
- Preview: https://id-preview--ff1059aa-df66-44dc-b8b1-9c2c5b09f22e.lovable.app

## Onde parei / o que falta

- **Próximo: W3 (backend BigQuery)** — edge functions lendo `phi_score_current`,
  `phi_score_history`, `raw_campaign_data`, `t28_campaign`/`t28_meta_campaign`;
  trocar `usePhiData` mock → fetch real. Segredos só no servidor.
- Depois W4 (backend Notion), W5 (view métricas), W6 (view cliente + navegação —
  em grande parte já entregue estruturalmente aqui).
- Nota: o código vive no Lovable (não neste repo git). Estes docs são o handoff.
