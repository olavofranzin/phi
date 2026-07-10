# [BRIEF sub-chat] Comercial C2 — Agente de enriquecimento GBP (prospects)

> Sessão nova, cole como 1ª mensagem. **Frente:** Comercial (C2, primeiro agente da cadeia
> de enriquecimento). **Objetivo:** dado um lead (Deal), analisar o **GBP do prospect** e gravar
> um diagnóstico acionável em `analise_gbp_ia`, mapeando gaps → oferta `SVC-GBP`. **Nível:** N2
> (tático, 1 lente). **Runtime:** n8n (alcança HubSpot). **Depende do C1** (✅ campos criados/verificados
> 2026-07-05). **Design:** `comercial-hubspot-subchat-brief.md` + Guia de Agentes §4 (dose N2).

## 0. Campos-alvo (verificados no HubSpot 2026-07-05)
Deal (grupo `ia_enriquecimento`): `analise_gbp_ia` (multi-line, saída deste agente) + consolida em
`dados_enriquecimento`. Não tocar `closedwon`/`closedlost`.

## 1. Fonte de dados do GBP de PROSPECT — ✅ RESOLVIDA: Apify em DOIS NÍVEIS (Olavo 2026-07-09)
O `HTTP Request GBP` que já existe no Agregador usa a **Business Profile Performance API** — que só
funciona para GBPs que a agência **gerencia** (OAuth de dono). **Prospect não gerenciamos** → essa API
não serve. Places API foi **descartada** (não traz Q&A/respostas do dono/posts). Fonte = **Apify**, mas
o teste real (2026-07-09) mostrou que o actor pronto "GBP Auditor" é **raso** → decisão é **dois níveis**:

| Nível | Actor / config | Retorna (campos reais confirmados no teste) | Uso |
|---|---|---|---|
| **LEVE** | `"GBP Auditor on Apify Store"` (roda `compass/crawler-google-places`) — **testado 2026-07-09** | `profile.{rating,reviewCount,reviewsDistribution,hasWebsite,website,phone,address,imageCount,categories,permanentlyClosed}`. **NÃO retorna** (o próprio `manualChecks` admite): descrição, `questionsAndAnswers`, serviços/menu, posts, e nas reviews só distribuição (**sem `responseFromOwnerText`/texto/datas**). | Triagem barata de **todos** os leads |
| **COMPLETO** | `compass/crawler-google-places` **cru** (testado 2026-07-10) | ✅ confirmado: `reviews[].text` + **`responseFromOwnerText`** + datas, `reviewsTags[]` (tópicos agregados), `additionalInfo` (atributos/pagamentos), `openingHours`, `popularTimesHistogram`, `bookingLinks`, `peopleAlsoSearch` (concorrentes), **`claimThisBusiness`**. ⚠️ residual: `questionsAndAnswers:[]`, `description:null`, `imageUrls:[]`, `menu/servicesLink:null` | Só no **lead qualificado** (pilares 1–4,8,9 fortes; 5/6/7 parciais) |

**Decisão travada:** funil de dois níveis — **LEVE** triagem geral → **COMPLETO** no lead qualificado.
**Confirmado no teste 2026-07-10** (ver rubrica §"Campos confirmados"): o COMPLETO entrega respostas do dono,
tópicos de review e atributos; **mas Q&A (`[]`), descrição (`null`) e imageUrls (`[]`) NÃO vêm por padrão** —
o sub-chat roda 1× com a flag de Q&A/imagens pra saber se é ausência real ou config. **Sinais de ouro** que o
agente eleva a 🔴: `claimThisBusiness:true` (perfil não reivindicado = lead SVC-GBP quentíssimo) e guarda de
volume (`totalScore` só vale com `reviewsCount` alto — ex.: 5.0/n=1 é ruído, 5.0/n=101 é forte).
⚠️ **Ignorar o `score`/`grade`/`issues`/`recommendations` que o Auditor devolve** — é rubrica genérica em
inglês; a nossa lente é a de 10 pilares PT-BR (`docs/conhecimento/rubricas/gbp-auditoria-10-pilares.md`),
aplicada pelo nosso LLM. Do Apify só queremos o **dado**. Pilar 10 (Performance) segue só para clientes
gerenciados. Fotos (P3) e proposta (P8): passe de visão opcional (fase 2) sobre as URLs do nível COMPLETO.

### Integração Apify (a aterrissar no sub-chat)
- **Nível LEVE:** actor `GBP Auditor` (já validado; input = "nome + cidade" ou place_id — no teste resolveu
  "Niti Odontologia … Rio Preto" → `placeId ChIJw97SGvGzvZQRtT6_JH7z7T0`). Barato, 1 chamada.
- **Nível COMPLETO:** `compass/crawler-google-places` com `maxReviews` limitado (ex.: 30–50 recentes),
  `reviewsSort=newest`, `scrapeReviewsPersonalData=false`, e flags de Q&A/additionalInfo. Confirmar nomes
  exatos dos campos rodando 1×.
- **Chamada:** nó **Apify** nativo do n8n **ou** HTTP Request → `POST /v2/acts/{actor}/runs?token=…` →
  poll `GET /v2/actor-runs/{id}` → `GET .../dataset/items`. Credencial **`APIFY_TOKEN`** no cofre do n8n
  (ADR-19), nunca em código.
- **Input:** URL do Maps/place_id ou "nome + cidade" (resolvido pelo próprio actor).
- **Custo:** LEVE ~1 result/lead; COMPLETO paga scraping de reviews — monitorar custo por lead; smoke = 1 perfil.
- **ToS/limite:** scraping via terceiro gerenciado; respeitar cota; sem PII além do público do GBP.

## 2. Resolver o lead → GBP (input)
- Precisa de **nome do negócio + localização** (cidade) OU uma **URL do Maps/place_id** por lead.
- HubSpot tem Company `name`/`website`/city? **Verificar** se há cidade/endereço na Company associada;
  se faltar, o 1º passo é `Places Text Search` por nome (+ cidade quando houver) → `place_id`.
- Se o lead não tiver GBP encontrável → gravar `analise_gbp_ia = "GBP não localizado"` + flag (não travar).

## 3. Fluxo n8n (fatia) — dois níveis
1. **Trigger:** sweep agendado dos Deals em estágios 1–6 sem `analise_gbp_ia` (ou on-demand). (Estágios em `comercial-hubspot-subchat-brief.md` §1.)
2. Buscar Deal + Company associada (nome/site/cidade).
3. **Nível LEVE (todos):** actor `GBP Auditor` por "nome + cidade" → `placeId` + números básicos. Grava um
   diagnóstico curto de triagem. Se lead **qualificado** (estágio avançado / flag comercial) → passo 4.
4. **Nível COMPLETO (qualificado):** `compass/crawler-google-places` cru (reviews+Q&A+additionalInfo) no `placeId`.
5. **LLM N2 (Gemini Flash)** aplica a rubrica → JSON estruturado (§4). No nível LEVE, campos sem dado = "verificar manual".
6. **Update Deal:** `analise_gbp_ia` (texto legível) + mesclar resumo em `dados_enriquecimento`.
7. Idempotente: reprocessar sobrescreve; registrar `execution_id`/data/nível usado.

## 4. Saída (diagnóstico N2 — a lente tem que transparecer)
**A lente = a rubrica dos 10 pilares** (`docs/conhecimento/rubricas/gbp-auditoria-10-pilares.md`) — o
agente percorre os 10 pilares e fecha com o plano de ação nos 4 níveis (🔴 Crítica / 🟠 Alta / 🟡 Média /
🟢 Baixa). Essa rubrica vira o corpo do prompt do agente. Formato do texto em `analise_gbp_ia` (Guia §4 dose N2): 
- **Completude** (0–100) + o que falta.
- **Por área:** descrição (existe? clara?), produtos/serviços (listados?), **Q&A** (tem? respondidas?),
  avaliações (nota, volume, **respostas da empresa?**), categorias corretas, fotos.
- Cada afirmação **ancorada** (ex.: "nota 3,9 com 12 avaliações [Places]") e marcada `[CERTEZA]`/`[HIPÓTESE]`.
- **Guarda de volume** (Tema 10): poucas avaliações → "sinal fraco", não conclusão.
- **Gap → oferta:** se há gaps materiais de GBP, sinalizar `SVC-GBP` como serviço ofertável (input p/ C3/NBA).

## 5. Modelo e guardrails
- **Modelo:** ✅ **Gemini Flash** (decidido Olavo 2026-07-09) — N2 estruturado sobre JSON, alinhado ao ADR de tiering. Passe de visão (fase 2, fotos) pode subir de tier se preciso.
- HubSpot é **produção**: só escrever `analise_gbp_ia`/`dados_enriquecimento`; nunca `closedwon`/`closedlost`. A IA **descreve**, não age.
- **Fonte externa:** respeitar ToS/cota; sem PII além do público do GBP. Se B (API paga), credencial no cofre n8n (ADR-19), custo por lead monitorado.
- Smoke com 1 Deal real (idealmente um lead Negócio Local com GBP — ex.: perfil do próprio Charles/CLI-13 ou um lead real) → conferir `analise_gbp_ia` legível e ancorado.

## 6. Lotes
- **C2.0:** ✅ fonte decidida (Apify dois níveis, §1) + modelo (Gemini Flash). Falta: verificar campos de localização na Company (nome/cidade) e confirmar os campos exatos do dataset rodando cada actor 1×.
- **C2.1:** workflow n8n **nível LEVE** (nome+cidade → GBP Auditor → placeId+números → LLM triagem → update Deal), smoke 1 lead.
- **C2.2:** **nível COMPLETO** (scraper cru reviews+Q&A+additionalInfo no lead qualificado) + rubrica inteira.
- **C2.3:** endurecer (não-encontrado, cota, idempotência, gate de qualificação) + ligar sweep agendado.
- Depois: **C3** (NBA + produtos ofertáveis, consumindo `analise_gbp_ia` + `analise_site_ia`).

## 7. Âncoras
- Campos: `get_properties(deals, ["analise_gbp_ia","dados_enriquecimento"])`. Pipeline/estágios: `comercial-hubspot-subchat-brief.md` §1.
- Fonte de raciocínio comercial: G4 (DB Fontes de Conhecimento `533a0d0c…`). Guia de Agentes §4 (dose N2).
- ⚠️ NÃO reusar o `HTTP Request GBP` do Agregador (é Performance API de cliente gerenciado, não serve p/ prospect).
