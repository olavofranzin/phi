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
  (achata pra Sheets) → Sort por `potencial_comercial` → Google Sheets **upsert** (match por `id`).
- **Saída (revisão 2026-07-10, Olavo):** wireado na planilha **real** de leads já usada pela
  frente Comercial — https://docs.google.com/spreadsheets/d/1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM
  (aba `leads`, gid=0). Essa planilha já é alimentada por outra pipeline de discovery (colunas
  `id`=place_id, `nome`, `setor`, `site`, `enriquecimento` — texto livre de IA num framework B2B
  diferente do nosso, sem `[CERTEZA]`/`[HIPÓTESE]`/guarda de volume — , `Categoria 1/2`,
  `Searchstring`, `Posição Pesquisa`, `Quantidade reviews`, geo, `status hubspot`). Ela **não tinha
  nenhum campo determinístico** (score/IPC/oferta) — exatamente o gap que este motor fecha.
  Decisão (Olavo): **upsert de colunas novas na mesma aba**, sem tocar nas colunas existentes.
  Adicionei 14 colunas novas no cabeçalho (`V1:AI1`): `score_tecnico`, `ipc`,
  `potencial_comercial`, `oferta_recomendada`, `dim_saude`/`dim_seo`/`dim_autoridade`/
  `dim_conversao`/`dim_engajamento`/`dim_conteudo`, `site_tipo`, `nao_reivindicado`,
  `flags_score`, `data_processamento_score`. `Salvar Ranking (Google Sheets)` agora é
  `appendOrUpdate` com `matchingColumns:["id"]`.
- Testado no n8n real com Apify mockado (pin data, 2 perfis) — motor + flatten + sort rodaram
  certo, roteamento de oferta bateu com a fórmula (`weakGbp` via `attrRef` pequeno em amostra de 2).
- **Teste real contra a planilha de produção:** rodei o L2 com o place_id real da p9.digital
  (`ChIJu70J8aKyvZQR0xb4Eznsqgs`, já existente na linha 2) e confirmei via leitura direta que o
  upsert caiu na linha certa — as 21 colunas antigas (`nome`, `enriquecimento`, `status hubspot`
  etc.) ficaram intactas, e as 14 colunas novas foram gravadas (score_tecnico 79, ipc 6,
  potencial_comercial 90, oferta_recomendada SVC-GBP, as 6 dimensões, site_tipo, etc.).

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
