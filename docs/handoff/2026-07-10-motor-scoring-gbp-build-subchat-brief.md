# [BRIEF sub-chat] Build — Motor de Scoring GBP (Prospecção + Enriquecimento C2) no n8n

> **Cole como 1ª mensagem de uma sessão nova.** Frente: Comercial/Prospecção. Runtime: **n8n**
> (MCP conectado; alcança HubSpot e internet). Objetivo: implementar o motor que descobre e pontua
> leads a partir do Google Business Profile (via Apify) e roteia cada lead para a oferta certa
> (SVC-GBP / SVC-SITE / SVC-ADS). **Toda decisão de design já está tomada e calibrada** — este build
> é execução, não redesenho. Repo `phi`, branch `claude/agentic-agency-planning-KwJEw` (dar `git pull`).

## 0. Leia primeiro (nesta ordem) — decisões já fechadas, não reabrir
1. `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md` — **o design mestre** (5 módulos, IPC, roteamento de oferta, calibração v0/v1, reviews fora da prospecção).
2. `scripts/gbp_scoring_prototype.py` — **a especificação executável** dos módulos 02–04. Portar para **JS (Code node)** preservando as fórmulas. Rodar `python3 scripts/gbp_scoring_prototype.py <dataset.json>` reproduz os números de referência.
3. `docs/conhecimento/rubricas/gbp-auditoria-10-pilares.md` — a lente (10 pilares → 6 dimensões).
4. `docs/handoff/2026-07-05-comercial-c2-enriquecimento-gbp-brief.md` — o C2 (parte de enriquecimento + HubSpot).

## 1. Arquitetura — 5 módulos (REGRAS antes de IA)
```
01_scraper → 02_normalizer → 03_scoring_engine → 04_benchmark_engine → 05_ai_report
```
- **02–04 são determinísticos** (Code nodes JS, porta do protótipo). A IA (Gemini Flash) aparece só em `05_ai_report` (redige o relatório a partir do JSON enriquecido) e, opcional, na geração do array de buscas (upfront).
- Princípio inegociável: **a IA não pontua, não “analisa” — só redige.** Reduz alucinação e valida o modelo barato.

## 2. Dois pipelines que compartilham 02–04
| Pipeline | 01_scraper (modo) | Termina em | Uso |
|---|---|---|---|
| **A. Discovery (prospecção)** | Apify **modo busca** (query+geo, N lugares) | ranking por Potencial Comercial + oferta | descobrir leads de um segmento/cidade |
| **B. Enriquecimento (C2)** | Apify **modo place** (place_id/URL, 1 lugar, profundo) | `05_ai_report` → **HubSpot** (`analise_gbp_ia`+`dados_enriquecimento`) | deep-dive de lead qualificado |

**Ordem de build:** Lote 1 (core 02–04) → Lote 2 (Pipeline A, discovery) → Lote 3 (Pipeline B, enriquecimento+HubSpot).

## 3. Apify — actor `compass/crawler-google-places` (Google Maps Scraper)
Credencial **`APIFY_TOKEN`** no cofre do n8n (ADR-19), nunca em código. Chamada: nó **Apify** nativo **ou** HTTP
Request (`POST /v2/acts/{actor}/runs?token=…` → poll `GET /v2/actor-runs/{id}` → `GET .../dataset/items`).

**Params por modo (validado 2026-07-10):**
| Param | Discovery (A) | Enriquecimento (B) |
|---|---|---|
| `searchStringsArray` | `["<segmento> <cidade>"]` (ex.: "dentista São José do Rio Preto") | 1 termo/place, ou usar place_id/URL |
| `maxCrawledPlacesPerSearch` | **20** | 1 |
| `maxReviews` | **0–2** (barato; agregados bastam) | **~20** (padrões/respostas do dono) |
| `maxImages` | 0 | **~10** (passe de visão fase 2) |
| `maxCompetitorsToAnalyze` / `enableCompetitorAnalysis` | a própria lista da busca é o set | 10–20 se quiser bloco comparativo |
| `scrapeSocialMediaProfiles.instagrams` | — | `true` (cross-sell IG + Conversão) |
| `skipClosedPlaces` | `true` | `true` |
| `language` / `locationQuery` | `pt-BR` / cidade | idem |

⚠️ **Ignorar** o `score`/`grade`/`enableCompetitorAnalysis` LLM do actor (rubrica genérica; ela caiu na armadilha de volume — rankeou perfil de 1 review em 1º). A lente é a nossa.

## 4. 02_normalizer — edge cases OBRIGATÓRIOS (descobertos nos dados reais)
- **`totalScore`/`reviewsCount` vêm `null`** (não 0) em negócio sem review → **coagir null→0** ou o scoring quebra.
- **`website` pode ser rede social** (Instagram) → classificar `site` / `social` / `none`; `social` vira sinal de **SVC-SITE**.
- **Q&A não é extraída** por este actor (`questionsAndAnswers:[]` em 4/4 negócios) → pilar 5 = "verificar manual" (ou actor dedicado). Não depender dela.
- **Posts = `ownerUpdates`** (não Q&A). **Taxa de resposta do dono** = % de reviews com `responseFromOwnerText` (só confiável com `maxReviews≈20`).
- **Grupos de `additionalInfo`** = proxy de completude/atributos.

## 5. 03_scoring + 04_benchmark (portar do protótipo — não reinventar)
- **6 dimensões** (Saúde/SEO/Autoridade/Conversão/Engajamento/Conteúdo) → **Score Técnico**.
- **Benchmark por segmento** (a lista da busca + `peopleAlsoSearch`), com **percentil** (robusto a outliers) e **prevalência** de features (só é gap o que os pares de fato têm: no exemplo, site 43% é gap; booking 27% não).
- **Guarda de volume:** `totalScore` só pontua Autoridade ponderado por volume (`min(reviews/25,1)`) — 5,0 com 1 review ≈ autoridade 3, não 98.
- **Roteamento de oferta** (duas forças): fraco→SVC-GBP/SITE; forte+site→**SVC-ADS**. **Potencial = max(gap_fundação, prontidão_ADS) × viabilidade** (perfil forte NÃO é descartado — vira lead de ADS).
- Refino **v1.1** anotado (não bloqueia): ponderar valor do SVC-SITE pela força do GBP.

## 6. 05_ai_report — Gemini Flash (só redige)
Entrada: o JSON enriquecido (scores + benchmark + strengths/weaknesses/opportunities + oferta). Saída: relatório
consultivo PT-BR percorrendo as 6 dimensões, com os 4 níveis de prioridade (🔴🟠🟡🟢), o bloco **"Potencial
Perdido"** e a **oferta recomendada**. Cada afirmação ancorada no dado (`[CERTEZA]`/`[HIPÓTESE]`, guarda de volume).
No Pipeline B, esse texto vai para `analise_gbp_ia`; resumo + `leadScore`/`IPC`/oferta em `dados_enriquecimento`.

## 7. HubSpot (só Pipeline B)
Escrever **apenas** `analise_gbp_ia` + `dados_enriquecimento` (campos C1 já criados/verificados). Nunca tocar
`closedwon`/`closedlost`. Futuro (lote posterior): `leadScore`/`IPC`/oferta como **campos numéricos/enum**. HubSpot é PRODUÇÃO — a IA descreve, não age.

## 8. Guardrails
- `APIFY_TOKEN`/credenciais só no cofre do n8n (ADR-19). Respeitar ToS/cota do Apify; sem PII além do público do GBP.
- **Custo:** discovery barata (maxReviews baixo); enriquecimento profundo só em lead qualificado. Logar custo/lead.
- Idempotência: reprocessar sobrescreve; registrar `execution_id`/data/modo.
- **Validação de porte:** a saída dos Code nodes 02–04 no n8n deve **bater com os números do protótipo** no mesmo dataset (é o teste de aceitação do port).

## 9. Lotes
- **L1 — core:** 02_normalizer + 03_scoring + 04_benchmark como Code nodes JS; teste contra `gbp_scoring_prototype.py` (mesmos números) usando o dataset de 30 dentistas.
- **L2 — Discovery (Pipeline A):** trigger (segmento+cidade) → Apify busca → core → ranking por Potencial + oferta → saída (Google Sheet/Notion, ou criar Deals no HubSpot — decidir no sub-chat).
- **L3 — Enriquecimento (Pipeline B / C2):** lead qualificado (place_id ou Deal) → Apify place profundo → core → 05_ai_report (Flash) → update HubSpot. Smoke com 1 lead real (ex.: um dentista do set, ou Charles/CLI-13).
- **L4 — refinos:** v1.1 (valor do site × força GBP), Índice de Visibilidade multi-termo, passe de visão (`maxImages`), reativar Engajamento/reputação com `maxReviews≈20`.

## 10. Âncoras
- Design: `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md`
- Spec executável: `scripts/gbp_scoring_prototype.py`
- Rubrica: `docs/conhecimento/rubricas/gbp-auditoria-10-pilares.md`
- C2/HubSpot: `docs/handoff/2026-07-05-comercial-c2-enriquecimento-gbp-brief.md` · Catálogo: `docs/strategic-planning/catalogo-produtos-servicos.md`
- Frente: `docs/strategic-planning/roadmap-expansao/BRUTO-v0.1-frentes-paralelas.md` §3
- n8n: usar SDK (get_sdk_reference + best_practices antes de codar). Agregador de referência: `4sdG2UKMCBuFq8xn`.
