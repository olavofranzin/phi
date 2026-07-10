# Execution log — Build do Motor de Scoring GBP no n8n (L1-L3)

> Executa `docs/handoff/2026-07-10-motor-scoring-gbp-build-subchat-brief.md`. Runtime n8n
> (projeto pessoal Olavo Franzin). Todas as decisões de design já estavam fechadas — este log
> registra a execução (build + testes), não redesenho.

## L1 — Core engine (02_normalizer + 03_scoring_engine + 04_benchmark_engine)

- **Port:** `scripts/gbp_scoring_core.js` — porte linha a linha de `scripts/gbp_scoring_prototype.py`,
  preservando as fórmulas. Único desvio necessário: JS `Math.round` arredonda half-up, Python 3
  `round()` arredonda half-to-even (banker's rounding) — implementei `pyRound()` para bater exato
  em empates (ex.: 42.5 → Python 42, `Math.round` daria 43).
- **Validação:** rodei o script Python e o port JS (via Node puro) sobre o mesmo dataset sintético
  (5 perfis, cobrindo `null`→0, site/social/none, não-reivindicado, guarda de volume) — saída
  **idêntica**. Repeti com dataset de 20 perfis gerado aleatoriamente (seed fixa) — **idêntica**.
- **Workflow n8n:** `GBP Scoring - L1 Core Engine (teste)` — `dtXFdLAHp7HmUh7o`
  (https://n8n-n8n-editor.1unqx7.easypanel.host/workflow/dtXFdLAHp7HmUh7o). Manual Trigger → Code
  (dataset de 5 perfis embutido) → Code (motor de regras: normalizer+scoring+benchmark num nó só)
  → Sort por `potencialComercial`. Executado no n8n real (execução `15968`): números batem
  exatamente com a saída do `gbp_scoring_prototype.py` no mesmo dataset (Alfa 87/12/92, MundiDents
  59/17/75, Gama Estrela 19/57/57, Beta 12/34/34, Quineli 63/27/27) — teste de aceitação do port ✅.

## L2 — Discovery (Pipeline A)

- **Workflow n8n:** `GBP Scoring - L2 Discovery (Pipeline A)` — `5j79f7oR8x1Nxs4q`
  (https://n8n-n8n-editor.1unqx7.easypanel.host/workflow/5j79f7oR8x1Nxs4q).
- Fluxo: Manual Trigger → Set (`segmento`+`cidade`, editável) → nó **Apify** nativo
  (`compass~crawler-google-places`, "Run actor and get dataset", modo busca:
  `maxCrawledPlacesPerSearch:20`, `maxReviews:1`, `maxImages:0`, `skipClosedPlaces:true`) → Motor
  de Regras (mesmo Code node do L1, copy-paste — ADR-25: n8n não tem import real) → Set
  (achata pra Sheets) → Sort por `potencialComercial` → Google Sheets append.
- **Saída escolhida:** Google Sheets (não HubSpot) — decisão default deste build: discovery gera
  uma *lista de leads candidatos* pra triagem humana, não deals automáticos no CRM de produção
  (alinhado ao guardrail "HubSpot é produção, a IA descreve/lista, não age" — criar Deals em massa
  fica pra decisão explícita futura). `documentId`/`sheetName` ficaram deliberadamente em branco
  (resource locator mode `list`) — **não inventei ID de planilha**; selecionar antes de ativar.
- Testado no n8n real com Apify mockado (pin data, 2 perfis) — motor + flatten + sort rodaram
  certo, roteamento de oferta bateu com a fórmula (`weakGbp` via `attrRef` pequeno em amostra de 2).

## L3 — Enriquecimento (Pipeline B / C2)

- **Workflow n8n:** `GBP Scoring - L3 Enriquecimento (Pipeline B / C2)` — `EFD7Drr0LDMqfDXw`
  (https://n8n-n8n-editor.1unqx7.easypanel.host/workflow/EFD7Drr0LDMqfDXw).
- Fluxo: Execute Workflow Trigger (`dealId`+`placeUrl`) → Apify modo place (deep-dive:
  `maxReviews:20`, `maxImages:10`, `scrapePlaceDetailPage:true`,
  `scrapeSocialMediaProfiles.instagrams:true`) → Motor de Regras (mesmo Code node) → **05_ai_report**
  (Basic LLM Chain + Gemini Flash `models/gemini-2.5-flash`, temperature 0.3 — prompt de sistema
  reforça "só redige, não pontua", 6 dimensões, `[CERTEZA]`/`[HIPÓTESE]`, guarda de volume, 4 níveis
  de prioridade, bloco "Potencial Perdido", oferta recomendada tirada do JSON) → Set (monta
  `analise_gbp_ia`+`dados_enriquecimento`) → HubSpot update Deal (só esses 2 campos; nunca
  `closedwon`/`closedlost`).
- **Teste real no n8n:** Apify e HubSpot mockados via pin data; a chamada ao Gemini Flash rodou de
  verdade (subnode de IA não é pinável) — o relatório saiu em PT-BR, seguiu a estrutura pedida,
  ancorou cada achado no dado (`"nota de 87"`, `"120 avaliações"`), classificou gaps nos 4 níveis, e
  fechou com "Oferta Recomendada: SVC-GBP" — **sem inventar número nem oferta fora do JSON**
  (validação do princípio "regras antes de IA").

## Pendências (L4 / decisões operacionais, fora deste lote)

- Selecionar a planilha de destino do L2 (Google Sheets) antes de ativar em produção.
- `dealId`/lookup de `placeUrl` a partir do Deal/Company (hoje o L3 espera os dois já resolvidos —
  falta o passo "resolver lead → GBP" descrito no brief C2 §2, ou um subworkflow que faça Places
  Text Search por nome+cidade quando não houver `placeUrl`).
- Sweep agendado (Schedule Trigger) chamando o L3 via Execute Workflow para Deals qualificados sem
  `analise_gbp_ia` — hoje o trigger é só Execute Workflow manual/on-demand.
- v1.1 (peso do site × força do GBP), Índice de Visibilidade multi-termo, `leadScore`/IPC como
  campos numéricos no HubSpot — ver §"Decisões em aberto" do design mestre.

## Âncoras

- Design: `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md`
- Brief do build: `docs/handoff/2026-07-10-motor-scoring-gbp-build-subchat-brief.md`
- Spec executável (Python): `scripts/gbp_scoring_prototype.py`
- Port JS (Node standalone, mesma lógica dos Code nodes n8n): `scripts/gbp_scoring_core.js`
