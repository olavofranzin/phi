# Checklist vivo — Frente Webview (métricas de campanha + dados de cliente)

> Consolidação de 2 projetos Lovable num único webview view-only.
> Base escolhida: **Projeto B — PHI Dashboard** (ver ADR-webview-001).
> Atualizar ao fim de cada lote.
>
> 🔴 **Nota de 2026-10-02:** este arquivo vivia **só** na branch
> `claude/webview-metricas-clientes-lxps0l`. Foi trazido para a
> `claude/consolidacao-2026-08` **pelo chat-mãe**, porque checklist que mora numa branch
> que ninguém abre é checklist que não existe (**R2 regra 5**).

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
- [x] **W4 — Backend Notion. CONCLUÍDO E PUBLICADO em 2026-10-02.**
      **No ar:** `https://app-app.1unqx7.easypanel.host/` ·
      HEAD/rollback `c37d0b0c9dcd169609eff4060b04fa72a37de8be`.
      O dossiê do cliente **deixou de ser mock** e lê a DB Clientes do Notion:
      **41 chaves, 41 com fonte**, em 9 seções. `readProp` passou a ler arquivo
      hospedado pelo Notion (o `Documentos Legais` caía em `null` em silêncio).
      **Os 10 critérios fecharam** — os três últimos só existiam depois de publicar:
      **CA1** `GET /api/clients` devolve o KIL real (`site` + `endereco`
      preenchidos, `telefone` `N/D`, que é o correto na fonte);
      **CA4** telefone **0 → 6 de 11** (CLI-2, 3, 5, 7, 8, 13);
      **CA10** `/api/phi-snapshot` igual antes e depois — 2 campanhas, mesmos
      ids, scores, investimentos, tarefas, logs e alertas; **só o `generatedAt`
      mudou**.
      🔴 **O arquivo vivo é `server/notion.js` na RAIZ, não `webview/server/notion.js`** —
      a pasta `webview/` é resíduo morto e o EasyPanel usa o `Dockerfile` da raiz
      com contexto `/`. (Esta linha dizia o caminho errado até 02/10.)
      ⚠️ **O dossiê vai aparecer quase todo `N/D`, e está certo:** medido na fonte,
      **o melhor cliente tem 3 de 41 campos preenchidos**, e nenhum dos 11 tem nada
      em Marca, Comunicação, Mercado, Comercial, Arquivos, Branding ou Metas.
      **É vazio real da fonte** — a página publicada é a lista do que falta preencher.
      **Dívidas declaradas, fora de escopo por decisão do Olavo:** `package-lock.json`
      não fecha com o `package.json` e o `Dockerfile` usa `npm install` (não `npm ci`);
      **12 vulnerabilidades** pré-existentes (10 altas); `.env` da raiz versionado;
      limpeza da pasta `webview/`.
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
