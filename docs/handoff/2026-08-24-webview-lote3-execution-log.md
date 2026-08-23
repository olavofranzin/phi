# Execution-log — Webview · Lote 3 (backend BigQuery, self-hosted VPS)

- **Data:** 2026-08-24
- **Frente:** Webview de métricas de campanha + dados de cliente
- **Branch:** `claude/webview-metricas-clientes-lxps0l`
- **Mudança de rota:** saímos do Lovable/Supabase para self-hosted no VPS da
  Hostinger (ver ADR-webview-002). Motivo: build do backend no Lovable travou
  (>1h), além de custo/opacidade. Código agora vive em git (`webview/`).

## O que foi feito

1. **Base trazida para o git.** O repo `phi-dashboard` (sync do Lovable) estava
   desatualizado (sem W2). Clonei-o como base e copiei para `webview/`.
2. **W2 reaplicado no git** (a partir do conteúdo já validado): `clientTypes.ts`,
   `sections.ts`, `clientMock.ts`, `useClientData.ts`, `DossierField.tsx`,
   `ClientsList.tsx`, `ClientDetail.tsx` + edições em `App.tsx` e `AppSidebar.tsx`.
3. **W3 backend Node/Express** (`webview/server/`):
   - Auth service account: JWT RS256 (crypto nativo) → access token OAuth2
     (escopo bigquery.readonly), com cache.
   - `runBigQuery(sql)`: chama a API REST `jobs.query` (projeto de billing),
     mapeia colunas por nome.
   - `GET /api/phi-snapshot`: lê `phi_score_current` + `raw_campaign_data`
     (janela de 3 dias, partição `date`), junta por campanha, mapeia para o tipo
     `Campaign`. Guardrails: `conversions=0` ⇒ CPA/ROAS null; erro/ausente ⇒ null.
     `?debug=1` retorna colunas cruas das duas tabelas (p/ descobrir nomes reais).
   - `GET /api/phi-score-history?campaign=`: série (date, score) de
     `phi_score_history`.
   - Serve o build estático (`../dist`) + SPA fallback.
   - Config `COLS` centralizada (candidatos de nome de coluna) — ponto único de
     ajuste após ver o debug.
4. **Front:** `usePhiData` agora faz `fetch('/api/phi-snapshot')`; em erro,
   propaga (UI mostra erro/N/D) — não inventa dados. `useClientData` segue mock
   (W4). `VITE_PHI_API_BASE` para dev.
5. **Docs:** ADR-webview-002 (pivot self-hosted) + GUIA-DEPLOY-VPS (deploy +
   credenciais + validação KIL) + README do webview.

## Verificação (feita)

- `npm run build` do front: **passou** (2531 módulos, sem erro TS).
- Backend: `node --check` OK; sobe na porta; `/api/health` →
  `{ok:true,hasSecret:false}`; `/api/phi-snapshot` sem segredo → **502 JSON
  tratado** (sem crash).
- `node_modules`/`dist`/`.env` ignorados pelo git (conferido).

## Onde parei / o que falta (ações do Olavo)

1. No VPS: `git pull`, `webview/ npm install && npm run build`,
   `server/ npm install`, criar `server/.env` com `GCP_SA_KEY` (chave JSON da
   service account) e subir (pm2 recomendado). Guia passo a passo em
   `docs/strategic-planning/webview/GUIA-DEPLOY-VPS.md`.
2. Abrir `/api/phi-snapshot?debug=1`, conferir nomes de coluna e ajustar `COLS`
   se necessário (commit + pull + restart).
3. Validar KIL (`GADS-21149189736`): score no webview == `phi_score_current`.
4. Depois: **W4** (dossiê real via Notion) e **W5/W6** (refinos de view).

## Nota
Backend Supabase do Lovable foi habilitado antes do pivot; ficou sem uso.
Pode ser desabilitado no Lovable quando o Olavo quiser (não afeta o VPS).
