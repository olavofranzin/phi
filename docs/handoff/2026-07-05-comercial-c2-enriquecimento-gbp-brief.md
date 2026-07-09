# [BRIEF sub-chat] Comercial C2 — Agente de enriquecimento GBP (prospects)

> Sessão nova, cole como 1ª mensagem. **Frente:** Comercial (C2, primeiro agente da cadeia
> de enriquecimento). **Objetivo:** dado um lead (Deal), analisar o **GBP do prospect** e gravar
> um diagnóstico acionável em `analise_gbp_ia`, mapeando gaps → oferta `SVC-GBP`. **Nível:** N2
> (tático, 1 lente). **Runtime:** n8n (alcança HubSpot). **Depende do C1** (✅ campos criados/verificados
> 2026-07-05). **Design:** `comercial-hubspot-subchat-brief.md` + Guia de Agentes §4 (dose N2).

## 0. Campos-alvo (verificados no HubSpot 2026-07-05)
Deal (grupo `ia_enriquecimento`): `analise_gbp_ia` (multi-line, saída deste agente) + consolida em
`dados_enriquecimento`. Não tocar `closedwon`/`closedlost`.

## 1. ⚠️ DECISÃO QUE GATEIA O BUILD — fonte de dados do GBP de PROSPECT
O `HTTP Request GBP` que já existe no Agregador usa a **Business Profile Performance API** — que só
funciona para GBPs que a agência **gerencia** (OAuth de dono). **Prospect não gerenciamos** → essa API
não serve. O que o Olavo quer analisar (descrição, produtos/serviços, **Q&A**, avaliações **+ respostas
da empresa**) exige dado público/externo. Opções:

| Opção | Cobre | Custo | Fragilidade |
|---|---|---|---|
| A. Google Places API | nota, nº avaliações, até 5 reviews, categorias, horário, site | barato | ❌ sem Q&A / respostas do dono / posts — **descartada** (rubrica exige mais) |
| B. Local API paga (SerpAPI/Outscraper) | + Q&A, respostas do dono, atributos, produtos, fotos | pago/consulta | baixa |
| C. Agente navegador/visão (Playwright) | potencialmente tudo | infra própria | média-alta (anti-bot, manutenção) |
| **✅ D. Apify (actor de Google Maps/Business Profile)** — **ESCOLHIDA (Olavo, 2026-07-05)** | **avaliações + respostas do dono, Q&A, fotos, categorias, atributos, popular times, posts; busca de concorrentes** | pago por resultado/CU (tem free tier) | **baixa — scraping gerenciado pelo Apify** |

**Decisão travada:** fonte = **Apify** (o Olavo indicou que há actor pronto de Business Profile). É a
opção B/C "gerenciada": riqueza de dados (cobre pilares 1–9 da rubrica) sem manter scraper próprio.
Pilar 10 (Performance) segue só para clientes gerenciados (Business Profile API), não prospects.
Qualidade de foto (P3) e proposta de valor (P8): Apify traz as URLs das fotos → um **passe de visão**
opcional (fase 2) avalia o qualitativo. **Ver `docs/conhecimento/rubricas/gbp-auditoria-10-pilares.md`.**

### Integração Apify (a definir no sub-chat)
- **Actor:** escolher o de Google Maps/Business que retorne **reviews com owner responses + Q&A** (ex.: família "Google Maps Scraper"/"Google Maps Reviews"/"Google Maps Q&A"). Confirmar os campos do dataset.
- **Chamada:** nó **Apify** nativo do n8n **ou** HTTP Request → `POST /v2/acts/{actor}/runs?token=…` → aguardar/poll `GET /v2/actor-runs/{id}` → `GET .../dataset/items`. Credencial **`APIFY_TOKEN`** no cofre do n8n (ADR-19), nunca em código.
- **Input:** URL do Maps/place_id ou "nome + cidade" (resolver via search do próprio actor).
- **Custo:** por resultado/compute unit — monitorar custo por lead; começar com 1 perfil no smoke.
- **ToS/limite:** scraping via terceiro gerenciado; respeitar cota; sem PII além do público do GBP.

## 2. Resolver o lead → GBP (input)
- Precisa de **nome do negócio + localização** (cidade) OU uma **URL do Maps/place_id** por lead.
- HubSpot tem Company `name`/`website`/city? **Verificar** se há cidade/endereço na Company associada;
  se faltar, o 1º passo é `Places Text Search` por nome (+ cidade quando houver) → `place_id`.
- Se o lead não tiver GBP encontrável → gravar `analise_gbp_ia = "GBP não localizado"` + flag (não travar).

## 3. Fluxo n8n (fatia)
1. **Trigger:** sweep agendado dos Deals em estágios 1–6 sem `analise_gbp_ia` (ou on-demand). (Estágios em `comercial-hubspot-subchat-brief.md` §1.)
2. Buscar Deal + Company associada (nome/site/cidade).
3. Resolver `place_id` (Text Search) → **buscar dados GBP** (fonte da Decisão §1).
4. **LLM N2** diagnostica → JSON estruturado (§4).
5. **Update Deal:** `analise_gbp_ia` (texto legível) + mesclar resumo em `dados_enriquecimento`.
6. Idempotente: reprocessar sobrescreve; registrar `execution_id`/data.

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
- **Modelo:** N2 estruturado → Gemini Flash (barato, ADR Tiering) é suficiente; Claude se quiser mais nuance. Decidir por custo.
- HubSpot é **produção**: só escrever `analise_gbp_ia`/`dados_enriquecimento`; nunca `closedwon`/`closedlost`. A IA **descreve**, não age.
- **Fonte externa:** respeitar ToS/cota; sem PII além do público do GBP. Se B (API paga), credencial no cofre n8n (ADR-19), custo por lead monitorado.
- Smoke com 1 Deal real (idealmente um lead Negócio Local com GBP — ex.: perfil do próprio Charles/CLI-13 ou um lead real) → conferir `analise_gbp_ia` legível e ancorado.

## 6. Lotes
- **C2.0:** decidir fonte (§1) + verificar campos de localização na Company.
- **C2.1:** workflow n8n (resolver place_id → fetch → LLM → update Deal), smoke 1 lead.
- **C2.2:** endurecer (não-encontrado, cota, idempotência) + ligar sweep agendado.
- Depois: **C3** (NBA + produtos ofertáveis, consumindo `analise_gbp_ia` + `analise_site_ia`).

## 7. Âncoras
- Campos: `get_properties(deals, ["analise_gbp_ia","dados_enriquecimento"])`. Pipeline/estágios: `comercial-hubspot-subchat-brief.md` §1.
- Fonte de raciocínio comercial: G4 (DB Fontes de Conhecimento `533a0d0c…`). Guia de Agentes §4 (dose N2).
- ⚠️ NÃO reusar o `HTTP Request GBP` do Agregador (é Performance API de cliente gerenciado, não serve p/ prospect).
