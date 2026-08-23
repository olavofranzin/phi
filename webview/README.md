# PHI Webview

Webview view-only do PHI: métricas por campanha (BigQuery) + dossiê por cliente.
Consolidação dos dois projetos Lovable, agora self-hosted (VPS).

- **Frontend:** React + Vite + shadcn/ui (esta pasta).
- **Backend:** Node/Express em `server/` — guarda o segredo da service account e
  lê o BigQuery (`phi_prod`). View-only; o score vem de `phi_score_current`
  (fato) e nunca é recalculado.

## Rodar em dev
```bash
npm install
# backend (noutro terminal)
cd server && npm install && cp .env.example .env  # preencha GCP_SA_KEY
node --env-file=.env index.js
# frontend (aponta para o backend)
VITE_PHI_API_BASE=http://localhost:8080 npm run dev
```

## Deploy no VPS
Ver `docs/strategic-planning/webview/GUIA-DEPLOY-VPS.md` (passo a passo + credenciais).

## Guardrails
Exibe, não escreve. Segredos só no backend. `conversions=0` ⇒ CPA/ROAS = N/D.
Fonte com erro/ausente ⇒ N/D (nunca 0). O dossiê do cliente está em mock até o W4
(ligação com o Notion).
