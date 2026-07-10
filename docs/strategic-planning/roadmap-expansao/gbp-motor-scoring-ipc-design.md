# Design — Motor de Scoring GBP + IPC (Prospecção & Enriquecimento C2)

> **Origem:** arquitetura proposta por Olavo (2026-07-10), a partir de 2 testes reais do actor
> Apify "Google Maps Scraper" (`compass/crawler-google-places`). **Força de evidência: A** (metodologia
> do dono). **Escopo:** alimenta a frente **Prospecção** (descoberta) e o agente **C2** (enriquecimento).
> **Consome:** rubrica dos 10 pilares (`docs/conhecimento/rubricas/gbp-auditoria-10-pilares.md`) como
> lente; catálogo (`SVC-GBP`/`SVC-SITE`/`SVC-ADS`). **Modelo do agente:** Gemini Flash (reforçado — ver §Princípio).

## Princípio central — REGRAS antes de IA (determinismo → IA só redige)
Fluxo antigo `Busca → JSON → Relatório` deixa a IA "inventar" a análise (inconsistente, alucina).
Fluxo novo:
```
Busca → JSON bruto → Motor de Regras → JSON enriquecido → IA → Relatório
```
Toda pontuação, força, fraqueza, oportunidade e prioridade é calculada por **regra de negócio determinística**.
A IA (Gemini Flash) **não pensa — só transforma o JSON enriquecido em linguagem natural consultiva**. Isso:
- torna a saída **padronizada e reproduzível** (mesmo lead → mesmo diagnóstico);
- **reduz alucinação** (alinha ao princípio da Camada de Conhecimento: "D nunca sustenta [CERTEZA]" e ao guardrail "a IA descreve, não age");
- **valida a escolha do modelo barato** — sem carga de raciocínio, Flash basta (a IA só redige e, no início, gera as buscas).

## Arquitetura — 5 módulos de responsabilidade única
```
01_scraper → 02_normalizer → 03_scoring_engine → 04_benchmark_engine → 05_ai_report
```
| Módulo | Faz | IA? |
|---|---|---|
| `01_scraper` | chama o actor Apify (modo busca ou place) | não |
| `02_normalizer` | achata o JSON bruto num schema estável (campos → nomes canônicos) | não |
| `03_scoring_engine` | calcula os índices por dimensão + Lead Opportunity Score + **IPC** | não |
| `04_benchmark_engine` | médias dos concorrentes vs o alvo (Δ por métrica) | não |
| `05_ai_report` | recebe o JSON enriquecido e **redige** o relatório consultivo | **sim (Flash)** |
Nota: há **um segundo ponto de IA opcional a montante** — geração das buscas a partir da categoria (§Visibilidade). O miolo (02–04) é 100% determinístico.

## Reconciliação com "dois níveis" — o que é barato é a IA e a profundidade, não o scrape
O funil de dois níveis já decidido mapeia assim:
- **Camada 1 — Qualificação do Lead (rápida, barata, SEM IA).** Roda o `03_scoring_engine` sobre um scrape
  raso/discovery e responde só: *"vale abordar?"* Saída: `leadScore` (0–100) + `chanceDeVenda` + `motivos`.
  Meta < 2s, pura regra. **O custo que economizamos aqui é o da IA e o do scrape profundo — não o scrape em si.**
- **Camadas 2–4 — Enriquecimento (pesado, só no lead qualificado).** Scrape profundo (reviews 30, concorrentes
  10+) → normalizer → scoring → benchmark → **05_ai_report** (IA redige). Saída: `analise_gbp_ia` + `dados_enriquecimento`.

⚠️ **Tensão resolvida:** os pesos do `leadScore` incluem "diferença para concorrentes" e "categorias
secundárias/atributos" — que o **Auditor leve NÃO retorna**. Solução: a Camada 1 roda em **modo busca** do
scraper cru (não no wrapper Auditor). O modo busca já devolve, por resultado, `totalScore`/`reviewsCount`/
`imagesCount`/`claimThisBusiness` **e o conjunto de concorrentes é a própria lista da busca** (os N lugares do
mesmo termo/geo). Ou seja: 1 run de busca alimenta o `leadScore` COM comparação de concorrentes, barato, sem IA.

## Índice de Visibilidade Local (multi-busca)
Um perfil pode ser 1º em "clínica médica" e sumir em "clínico geral", "médico perto de mim", "policlínica".
Medir **visibilidade num conjunto de buscas relevantes**, não num ranking único.
- **Geração das buscas:** a IA gera o array a partir da **categoria principal** (upfront, barato). Ex.:
  - policlínica → `["clínica médica","policlínica","clínico geral","médico","consulta médica"]`
  - dentista → `["dentista","clínica odontológica","implante dentário","clareamento dental","ortodontista"]`
  - advogado → `["advogado","advogado trabalhista","advogado civil","escritório de advocacia"]`
- **Cálculo:** roda o scraper em cada termo (geo fixo) → posição do alvo em cada um → **Índice de Visibilidade
  Local** (ex.: média ponderada de 1/rank, ou % de buscas em que aparece no top-3). Muito mais útil que 1 rank.
- **Custo:** multiplica runs de busca (5 termos = 5×). É a alavanca de custo da discovery — parametrizar o tamanho do array.

## Score Técnico multi-dimensional (mapeado nos 10 pilares)
Em vez de nota única "85/100", **6 dimensões** — que são um reagrupamento dos 10 pilares (a rubrica segue a fonte da verdade):
| Dimensão (%) | Pilares que a compõem |
|---|---|
| **Saúde do Perfil** | 1 (completude) + itens técnicos (verificado, **claimed**, sem suspensão, horários) |
| **SEO Local** | 2 (keywords/descrição/NAP) + 1 (categoria principal + **secundárias**) + 6 (serviços) |
| **Autoridade** | 4 (volume+nota+crescimento de avaliações) + 9 (posição vs concorrentes) |
| **Conversão** | 8 (proposta, CTAs, `bookingLinks`, site, telefone, pagamentos) |
| **Engajamento** | 4 (**respostas do dono**) + 5 (Q&A respondidas) |
| **Conteúdo** | 3 (fotos: qtd/qualidade/diversidade) + 7 (postagens/frequência) |
Pilar 10 (Performance) fica fora (só cliente gerenciado). O `05_ai_report` narra dimensão por dimensão.

## Benchmark automático (o que mais vende)
Não dizer "você tem 50 avaliações" — dizer **onde ele está vs quem aparece com ele**. O `04_benchmark_engine`
calcula médias do conjunto de concorrentes e o Δ:
| Métrica | Alvo | Média concorrentes | Δ |
|---|---|---|---|
| Avaliações | 46 | 198 | −152 |
| Fotos | 87 | 243 | −156 |
| Postagens/mês | 1 | 5 | −4 |
| Nota | 4,8 | 4,9 | −0,1 |
Isso "vende sozinho". Requer `maxCompetitorsToAnalyze` alto (**10–20**, não 2).

## Motor de Regras (o coração — transforma número em oportunidade)
Determinístico, sem IA. Exemplos de regras:
| Condição | Resultado |
|---|---|
| `reviews < média_concorrentes` | oportunidade, **prioridade Alta** |
| `fotos < 20` | oportunidade, **prioridade Alta** |
| `categorias == 1` (sem secundárias) | oportunidade, **prioridade Média** |
| `nota > 4.8` **com volume alto** | **ponto forte** (guarda de volume: 4.8/n=1 NÃO é forte) |
| `claimThisBusiness == true` | **🔴 Crítica** — perfil não reivindicado |
| `bookingLinks` ausente | oportunidade Conversão |
Saída: `{ strengths[], weaknesses[], opportunities[], priority[] }` — **antes** de a IA participar.

## Lead Opportunity Score — pesos (Camada 1)
| Indicador | Peso |
|---|---|
| Número de avaliações | 25 |
| Diferença para os concorrentes | 20 |
| Quantidade de fotos | 15 |
| Categoria principal | 10 |
| Categorias secundárias | 10 |
| Site | 5 |
| Horário | 5 |
| Atributos | 5 |
| Nota média | 5 |
Saída: `{ leadScore, chanceDeVenda, motivos[] }`. Sem IA.

## IPC — Índice de Potencial Comercial (o diferencial)
Dois números que respondem perguntas diferentes:
- **Score Técnico:** "quão otimizado o perfil está **hoje**?"
- **IPC:** "quanto valor a **consultoria** ainda pode gerar?"

Casos: A (téc 95 / IPC 12 → quase perfeito, lead fraco) · B (téc 54 / IPC 96 → lead excelente) · C (téc 82 / IPC 79 → bom prospect). Evita descartar perfil tecnicamente bom que ainda é ótima venda. **Para prospecção, IPC > score técnico.**

⚠️ **Refino (IPC ≠ inverso do técnico):** `IPC = gap_endereçável × viabilidade`, não `100 − técnico`.
- **gap_endereçável:** soma dos déficits **corrigíveis** ponderada por quanto cada um casa com um serviço que vendemos (`SVC-GBP`/`SVC-SITE`/`SVC-ADS`). `claimThisBusiness:true` puxa forte.
- **viabilidade:** sinais de que é negócio **real e ativo** (horário aberto, `skipClosedPlaces`, categoria com valor comercial, baseline de demanda). Sem isso, um negócio morto com perfil péssimo teria IPC alto falso.
- Consequência: IPC alto pode coexistir com técnico médio; técnico baixo **não** garante IPC alto.
- **Destino:** IPC/leadScore priorizam a fila comercial → futuro campo numérico no HubSpot + input da NBA (C3).

## Bloco "Potencial Perdido" (no relatório)
Reframe que muda a percepção mesmo em perfil já bom: "seu perfil tem nota máxima e está bem configurado,
porém há oportunidades claras de gerar mais clientes" → aumentar avaliações · cadastrar serviços · responder
avaliações · produzir conteúdo · otimizar palavras-chave · ampliar categorias. Alimentado pelo `opportunities[]` do motor de regras.

## Parâmetros do actor por modo (a partir do input real testado 2026-07-10)
Input testado tinha: `maxReviews:2`, `maxCompetitorsToAnalyze:2`, `maxCrawledPlacesPerSearch:2`,
`enableCompetitorAnalysis:true`, `scrapePlaceDetailPage:true`, `scrapeSocialMediaProfiles.instagrams:true`,
`skipClosedPlaces:true`, `scrapeContacts:false`, `maximumLeadsEnrichmentRecords:0`. Ajustes:

| Param | Discovery (Camada 1) | Enriquecimento (C2) | Porquê |
|---|---|---|---|
| `searchStringsArray` | **conjunto gerado** (visibilidade) | 1 termo OU place/URL do lead | visibilidade multi-busca vs deep-dive |
| `maxCrawledPlacesPerSearch` | **20** | 1 (o lead) | discovery precisa do local pack |
| `maxReviews` | 0–2 | **30** | padrões de review (sentimento/reclamações) |
| `maxCompetitorsToAnalyze` | (a lista da busca já serve) | **10–20** | benchmark é o que vende |
| `maxImages` (ausente no teste) | 0 | **>0** | ⚠️ por isso `imageUrls:[]` veio vazio → ligar p/ passe de visão (fase 2) |
| `scrapePlaceDetailPage` | false (rápido) | true | detalhe só no lead qualificado |
| `scrapeSocialMediaProfiles.instagrams` | — | true | cross-sell (análise de IG) + Conversão |
| `maximumLeadsEnrichmentRecords` | 0 | opcional (pago) | contatos p/ outreach — só se valer o custo |
| `skipClosedPlaces` | true | true | filtro de viabilidade (alinha ao IPC) |

**Q&A — RESOLVIDO (2026-07-10):** `questionsAndAnswers` veio `[]` nos **4 negócios** testados (inclusive o
dentista com 435 reviews) → **este actor NÃO extrai Q&A**. Pilar 5 fica "verificar manual" OU exige actor
dedicado de Q&A. **Posts (pilar 7) vêm de `ownerUpdates`** (Leandro: 10; demais: 0) — não do Q&A.

## Calibração v0 (perfis reais, 2026-07-10) — `scripts/gbp_scoring_prototype.py`
Rodado nos 6 perfis (buscas "clínica médica" e "clínica odontológica", Rio Preto). **Edge cases do normalizer
descobertos nos dados** (a serem portados pro n8n Code):
- ⚠️ `totalScore`/`reviewsCount` vêm **`null`** (não `0`) quando o negócio não tem review → **coagir null→0** ou o scoring quebra.
- `website` pode ser **rede social** (Quineli: `instagram.com`) → classificar `site` vs `social` vs `none`; `social` vira **sinal de SVC-SITE**.
- **Q&A ausente** (ver acima); **posts = `ownerUpdates`**; **taxa de resposta ao dono** = % de reviews com `responseFromOwnerText` (Quineli 95%, Leandro 71%).
- Número de **grupos de `additionalInfo`** é proxy de completude/SEO (Leandro 8, Estrela 4, Quineli 1).

**Resultado (ordenado por IPC = prioridade comercial):**
| Perfil | score/reviews/imgs | Técnico | leadOpp | **IPC** | Flag |
|---|---|---:|---:|---:|---|
| Clínica médica (Cidade Nova) | 0 / 0 / 1 | 26 | 78 | **68** | não reivindicado |
| Clínica Médica Estrela | 5 / 1 / 1 | 21 | 83 | **64** | não reivindicado; volume fraco |
| Quineli & Sallum (odonto) | 4,8 / 259 / 109 | 63 | 19 | **32** | site=rede-social → SVC-SITE |
| Dr. Leandro Cusinato | 4,9 / 435 / 21 | 86 | 6 | **6** | perfil forte — não perturbar |

**Interpretação:** o IPC faz o que o score único não faz — Leandro (técnico **86** / IPC **6**) seria "ótimo perfil"
num score só, e descartado como lead pelo motivo errado; o IPC diz "está ótimo, não há o que vender". Os 2 perfis
**não reivindicados** (técnico ~20 / IPC ~65) sobem como leads quentes; o Quineli isola um ângulo de **SVC-SITE**.
**Prova do "regras > IA":** a IA embutida do actor (`enableCompetitorAnalysis`, arquivo de comparação) rankeou a
Estrela em **1º** citando "perfect 5-star rating **despite having only one review**" como força — exatamente a
falha de guarda de volume que o nosso motor determinístico evita (autoridade da Estrela = 3/100, não 98).

**Run de segmento único (dentistas, 2026-07-10) — confirma benchmark por categoria:** com o benchmark só de
dentistas (avgImages 65, puxado pela Quineli/109 + `peopleAlsoSearch`), o **único gap do Leandro (21 fotos)
apareceu** — conteúdo 75→53, IPC 6→11. No set misturado (avgImages 33) esse gap sumia. Conclusão: **benchmark
por segmento é mais discriminante** e deve incluir o `peopleAlsoSearch` (reflete o local pack real, não só os líderes).

**Refino v1 (implementar com set de ~20 lugares):** o `04_benchmark_engine` deve calcular também a **prevalência**
de features binárias no segmento (% de pares com booking / site próprio / posts / cada grupo de atributo). O motor
de regras então **só marca gap no que os pares de fato têm** — ex.: se 0% dos dentistas tem `bookingLinks`, não
penalizar a ausência (não é gap do segmento); se a Quineli tem 109 fotos, o Leandro com 21 **é** gap. Isso torna
IPC/leadScore **relativos ao segmento** e elimina falsos gaps. v0 usa média absoluta; requer `maxCrawledPlacesPerSearch≈20`.

**Ajuste pendente de calibração:** pesos v0 plausíveis; refinar com set maior (20+ por segmento). Benchmark **por
termo/categoria** (confirmado — não misturar segmentos).

## Decisões em aberto (para o sub-chat do build)
1. **Onde roda o motor de regras (02–04):** nós **Code** no n8n (JS puro) vs micro-serviço. Recomendo Code no n8n (fica tudo num WF, sem infra nova). O `scripts/gbp_scoring_prototype.py` é a spec a portar.
2. **Refino dos pesos** do IPC/leadScore/dimensões — v0 já validado (ver Calibração); calibrar com set maior (20+ perfis, benchmark por categoria).
3. **`maxImages`** — 1 run com o param ligado para popular `imageUrls` (passe de visão, fase 2). Q&A já resolvido (actor não extrai).
4. **Persistir `leadScore`/`IPC` como campos numéricos no HubSpot** (lote comercial futuro) — hoje cabem em `dados_enriquecimento`.
5. **Tamanho do array de buscas** (custo da visibilidade) — começar com 5.
6. **Benchmark por termo/categoria** (não misturar segmentos) — regra confirmada na calibração.

## Âncoras
- Rubrica (lente): `docs/conhecimento/rubricas/gbp-auditoria-10-pilares.md` (§"Campos confirmados").
- Brief do agente: `docs/handoff/2026-07-05-comercial-c2-enriquecimento-gbp-brief.md`.
- Frente Prospecção: `docs/strategic-planning/roadmap-expansao/BRUTO-v0.1-frentes-paralelas.md` §3.
- Catálogo: `docs/strategic-planning/catalogo-produtos-servicos.md`.
