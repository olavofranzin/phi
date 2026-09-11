# Spec — Contrato de dados: Agregador "Unified Marketing Reports" → Módulo de Análise T28

> **Status:** Fase 1 (coleta) implementada em 2026-06-11. Esta spec define o **contrato de saída**
> que liga o agregador à camada de análise (Módulo 28), preparando a **Fase 2** (gravação em
> Notion/BigQuery + consumo pelos agentes).
>
> **Workflow:** `Unified marketing reports with Google Analytics, Google Ads, Meta Ads` (`4sdG2UKMCBuFq8xn`).
> **Substrato de referência:** `docs/pesquisa-trafego-pago.md`, `docs/Gestão de Tráfego Pago, Métricas e Benchmarks (2026).md`.
> **Consumidores:** Agente 1 (Leitura & Anomalia) e Maestro do `docs/modulo-28-analise-cognitiva.md`.

## 1. Contexto e objetivo
O agregador é a camada **"Observar" (Sense)** do ciclo O.D.A.E.: coleta semanal/mensal de Google Ads
(GAQL 3 níveis), GA4 (orgânico + pago), GBP, Clarity, Meta (level=ad) e search terms. Hoje ele termina
emitindo um resumo **nível-campanha** para Google Sheets + blocos de Slack, com "insights" qualitativos
hard-coded. Os agentes do T28 não conseguem consumir essa saída: ela não tem IDs/níveis/contexto de
negócio, descarta dados já coletados (receita, impression share) e mistura conclusão (trabalho dos
agentes) com coleta (trabalho do agregador).

**Objetivo da spec:** definir o **schema-alvo** normalizado que o agregador deve emitir, **onde** gravá-lo,
e **o que** parar de fazer — sem que o agregador tire conclusões (isso é dos agentes, ancorado no substrato).

## 2. Princípio do contrato
- O agregador **coleta e normaliza**; **não interpreta**. Nenhum campo `insight`/`recommendation`
  qualitativo na saída.
- Toda métrica derivada segue o **mapa do substrato** `CPM→CPC→CTR→CVR→CPA→CAC→ROAS→LTV:CAC`, com
  guarda de divisão por zero.
- A saída é **por entidade × nível × janela**, com **IDs** (para casar Notion/BigQuery) e **contexto de
  negócio** (para o Maestro decidir por métrica primária).
- Emitir o **gate estatístico** (`volume_suficiente`) como dado — quem decide é o agente, mas o número
  vem pronto.

## 3. Schema-alvo de saída (1 registro por entidade × nível × janela)
```jsonc
{
  // --- Identidade & janela ---
  "client_id": "CLI-4",
  "conta": "Nome do cliente",
  "platform": "google_ads | meta_ads",
  "level": "campaign | adset | ad",
  "entity_id": "21149189736",            // id_google_camp / id_meta_camp / adset / ad
  "entity_name": "BR-CONV-SEARCH-...",
  "notion_id": "<notion_id_camp|adset|ad>",
  "id_padrao": "CAMP-123 | ADSET-45 | AD-9",
  "period": "weekly | monthly",
  "date_start": "2026-06-09",
  "date_end": "2026-06-15",
  "panorama_30d": { "start": "2026-05-17", "end": "2026-06-15" },

  // --- Contexto de negócio (do Notion clientes/campanhas) ---
  "objetivo": "CONV | LEAD | TRAF | ...",
  "modelo_negocio": "Lead Gen | E-Commerce | Infoproduto",
  "metrica_mae": "CPA | CPL | ROAS | CPC | Taxa de Conversão",
  "margem_contribuicao": 0.30,
  "ticket_ltv": 2400,
  "meta_cpa": 80,
  "meta_roas": 5.0,
  "mudancas_recentes": { "verba": null, "criativo": null, "oferta": null, "pagina": null },

  // --- Métricas cruas (numeradores/denominadores) ---
  "impressions": 287, "clicks": 12, "cost_brl": 6.63,
  "conversions": 0, "conversion_type": "purchase | lead",
  "revenue": 0, "leads": 0, "frequency": null,
  "search_impression_share": 0.42, "budget_lost_is": 0.08,

  // --- Derivadas (mapa do substrato; null quando denominador = 0) ---
  "cpm": 23.10, "cpc": 0.55, "ctr_pct": 4.18, "cvr_pct": 0.0,
  "cpa": null, "cpl": null, "roas": 0.0, "cac": null, "ltv_cac": null,

  // --- Gate estatístico (ESPERAR) ---
  "n_conversions": 0, "n_days": 7, "volume_suficiente": false,   // ≥30 conv E ≥14 dias

  // --- Secundárias / diagnóstico (contexto, não conclusão) ---
  "ga4": { "sessions": 0, "users": 0, "engagement_rate": null, "conversions": 0, "revenue": 0 },
  "gbp": {}, "clarity": {}, "search_terms_resumo": {}
}
```

### Fórmulas derivadas (guarda de divisão por zero obrigatória)
| Métrica | Fórmula | Unidade |
|---|---|---|
| `cpm` | `cost_brl / impressions * 1000` | R$ |
| `cpc` | `cost_brl / clicks` | R$ |
| `ctr_pct` | `clicks / impressions * 100` | % |
| `cvr_pct` | `conversions / clicks * 100` | % |
| `cpa` | `cost_brl / conversions` | R$ |
| `cpl` | `cost_brl / leads` | R$ |
| `roas` | `revenue / cost_brl` | x |
| `cac` | `(cost_brl + custos_aquisição) / novos_clientes` | R$ (requer contexto) |
| `ltv_cac` | `ticket_ltv / cac` | x |
| `volume_suficiente` | `n_conversions >= 30 && n_days >= 14` | bool |

## 4. Gap campo a campo (produz hoje → precisa)
| Campo necessário (T28) | Produz hoje? | Onde já está | Ação |
|---|---|---|---|
| `client_id` / `conta` | ❌ | `Set dados.id_client` | repropagar (existe, é dropado no Calculate KPIs) |
| `entity_id` + `notion_id` + `id_padrao` | ❌ | `Set dados`, GAQL `campaign.id` | repropagar |
| `level` (campaign/adset/ad) | 🟡 só campaign | GAQL 3 níveis já buscados | incluir conjuntos/anúncios |
| `date_start/end` + `panorama_30d` por linha | 🟡 só isWeekly/isMonthly | `Code prepara datas` | anexar a cada registro |
| `revenue` (`conversions_value`) | ❌ | **buscado** na GAQL | parar de descartar |
| `roas`, `cpm`, `cpc`, `cvr_pct` (por entidade) | ❌ | derivável | derivar |
| `search_impression_share`, `budget_lost_is` | ❌ | **buscado** na GAQL | parar de descartar |
| `frequency` (Meta) | ❌ | fetch Meta | incluir |
| `n_conversions` / `n_days` / `volume_suficiente` | ❌ | derivável | adicionar gate ESPERAR |
| `objetivo/margem/ticket-LTV/metas/métrica-mãe` | ❌ | Notion clientes/campanhas (lido) | propagar (habilita CAC, LTV:CAC, métrica primária) |
| `cac`, `ltv_cac` | ❌ | precisa contexto acima | derivar |
| `mudancas_recentes` | ❌ | — | capturar (Maestro exige) |
| `impressions/clicks/cost/conversions`, `ctr_pct`, `cpa/cpl` | ✅ | `Calculate KPIs` | OK (ver §5) |
| `ga4 engagement_rate` | 🟡 só sessions/users | `websiteKPIs` | incluir engagement |
| `insight` qualitativo | ⚠️ hard-coded | `Calculate KPIs` | **remover** (é função dos agentes) |

## 5. Inconsistências a normalizar
- **Naming Google×Meta:** Google usa `conversions/cpa`; Meta usa `leads/cpl`. `totalConversions =
  googleConversions + metaLeads` **mistura conversão e lead**. → padronizar `conversions` +
  `conversion_type`; manter `cpl` apenas para `modelo_negocio = Lead Gen`.
- **Só nível campanha:** os 3 níveis GAQL são buscados, mas só campanha entra no agregado. T28 e os
  `sw*` operam também em conjunto/anúncio.
- **`insight` viola o Bloco Comum:** limiares genéricos (`spend>3000`, `ctr<1`, `conv===0`) sem âncora no
  substrato e sem gate estatístico. Sai do agregador.

## 6. Destino da saída (Fase 2)
Gravar o registro normalizado **onde os agentes leem**, não em Sheets/Slack:
- **BigQuery** `raw_campaign_data` (e tabelas por nível, se aplicável) — fonte do panorama 30d já citado
  no `Code prepara datas`. É o store dos `sw*` e do T28.
- **Notion** (Campanhas/Conjuntos/Anúncios) — para leitura humana e como entrada do Maestro/Agente 1.
- Remover/segregar: nó Google Sheets (placeholder `your-document-id-here`), transformador de blocos
  Slack, resíduo `hubspotSummary` em `Prepare Report Data2`, e o nó `AI Agent` vazio.

## 7. Os 3 passos do contrato
1. **Substituir `Calculate KPIs & Campaign Insights`** por um **Normalizador** que emite o schema-alvo
   (§3) por entidade × nível × janela, derivando o mapa completo de métricas a partir do que já é
   coletado, propagando IDs (`Set dados`) e contexto de negócio (Notion).
2. **Rotear a saída para Notion/BigQuery** (§6).
3. **Tirar o `insight`** do agregador — interpretação passa a ser dos agentes T28, ancorada no substrato.

## 8. Verificação
- **Schema:** um registro de exemplo (CLI-4, campanha GADS-21149189736) contém todos os campos de §3,
  com IDs preenchidos e `insight` ausente.
- **Derivadas:** conferir `cpm/cpc/ctr_pct/cvr_pct/cpa/roas` contra cálculo manual; `null` quando
  denominador = 0 (sem NaN/Infinity).
- **Gate:** registro com `n_conversions < 30` ou `n_days < 14` → `volume_suficiente: false`.
- **Níveis:** verificar que existem registros `level: "adset"` e `level: "ad"`, não só `campaign`.
- **Contexto:** `metrica_mae`, `margem_contribuicao` e `meta_cpa/meta_roas` presentes (vindos do Notion).
- **Destino:** confirmar gravação em BigQuery/Notion e ausência de escrita em Sheets/Slack.

## 9. Status dos TODOs (atualizado)
| TODO | Status | Resolução |
|---|---|---|
| `margem_contribuicao` / `ticket_ltv` ausentes | ✅ resolvido | Campos criados na base **Clientes** (`Margem de Contribuição` percent, `Ticket/LTV` real); adaptador lê de `Get database clientes`. Habilita break-even ROAS = 1/margem. |
| Mapas Notion da Meta | ✅ resolvido | Adaptador constrói mapas por `adset_id_meta` / `ad_id_meta` (além dos por id Google). |
| Normalização do GA4 | ✅ resolvido | `ga4Norm()` soma o runReport; `ga4` agora é `{ organic, paid }` com `{sessions,users,conversions(keyEvents),engagement_rate,revenue:null}`. Refinamento do §3 (antes era flat). |
| camelCase do GAQL | ⏳ confirmar em execução real | Fallback snake_case já incluso no adaptador. |
| CAC / LTV:CAC | ⏳ por design | Ficam `null` até `custos_aquisicao_extra` ser modelado (não conflar CPA com CAC). Margem/ticket já disponíveis. |

> **Decisão registrada:** `margem`/`ticket_ltv` vivem em **Clientes** (economia por cliente). Se variarem por
> oferta/campanha, mover para a base Campanhas e ajustar o `pNum(cliProps...)` → `pNum(campProps...)`.
>
> **Inserção concluída:** nós `Adaptador Input T28` e `Normalizador T28` já estão no workflow
> `4sdG2UKMCBuFq8xn` (ramo paralelo a partir de `Merge1`), inativos. Saída do Normalizador ainda não
> roteada (Notion/BigQuery — decisão pendente).
