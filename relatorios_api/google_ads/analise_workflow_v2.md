# Análise: Workflow Google Ads v2

## Visão Geral

O workflow **Google Ads v2** coleta métricas de campanhas ativas via Google Ads API (v22),
consolida os dados em múltiplos períodos e gera um relatório HTML/PDF por campanha.
Executa automaticamente todos os dias às **05h00**.

---

## Fonte de Dados

- **Plataforma:** Notion (banco de dados "Campanhas")
- **Filtros aplicados:**
  - `Status` = `Em execução`
  - `Fonte` não está vazio
- **Campos consumidos por campanha:**
  - `id_google_account` → `customer_id`
  - `id_google_camp` → `campaign_id`
  - `Nome Campanha` / `Name` → `campaign_name`

---

## Fluxo de Execução

```
Schedule Trigger (05h)
  └─► Notion: Get Campanhas Ativas
        └─► Code Preparar Contexto
              └─► Loop Campanhas (SplitInBatches)
                    ├─► [saída 0] Code Montar HTML ──► Convert HTML to PDF
                    └─► [saída 1] HTTP Core 7d
                                    └─► HTTP Core 30d
                                          └─► HTTP Grupo Recursos 7d
                                                └─► HTTP Grupo Recursos 30d
                                                      └─► HTTP Termos 7d
                                                            └─► HTTP Schedule 7d
                                                                  └─► HTTP Schedule 30d
                                                                        └─► HTTP Audiência
                                                                              └─► HTTP Pacing
                                                                                    └─► HTTP Canais
                                                                                          └─► Code Merger Unificado
```

---

## Períodos Consultados

| Variável       | Descrição                          |
|----------------|------------------------------------|
| `periodo_7d`   | D-7 até D-1 (ontem)                |
| `periodo_30d`  | D-30 até D-1 (ontem)               |
| `periodo_mes`  | 1º do mês atual até D-1 (ontem)    |
| `hoje`         | Data atual (YYYY-MM-DD)            |

---

## Consultas GAQL (Google Ads Query Language)

### 1. HTTP Core 7d / 30d — Métricas da Campanha
**Recurso:** `campaign`

**Campos selecionados:**
- `campaign.id`, `campaign.name`
- `campaign.bidding_strategy_type`, `campaign.advertising_channel_type`
- `campaign.target_cpa.target_cpa_micros`, `campaign.target_roas.target_roas`
- `metrics.impressions`, `metrics.clicks`, `metrics.ctr`
- `metrics.average_cpc`, `metrics.cost_micros`
- `metrics.phone_calls`
- `metrics.conversions_from_interactions_rate`, `metrics.cost_per_conversion`, `metrics.conversions`
- `metrics.active_view_impressions`, `metrics.active_view_measurable_impressions`
- `metrics.average_cpm`

**Filtro:** `campaign.id = '{campaign_id}'` + intervalo de data

---

### 2. HTTP Grupo Recursos 7d / 30d — Métricas por Grupo de Anúncios
**Recurso:** `ad_group`

**Campos selecionados:**
- `ad_group.id`, `ad_group.name`, `campaign.name`
- `campaign.bidding_strategy_type`, `campaign.target_cpa.*`, `campaign.target_roas.*`
- Mesmas métricas do Core acima

**Filtro:** `campaign.id = '{campaign_id}'` + `ad_group.status != 'REMOVED'`
**Ordenação:** `metrics.cost_micros DESC`

---

### 3. HTTP Termos 7d — Termos de Pesquisa
**Recurso:** `search_term_view`

**Campos selecionados:**
- `search_term_view.search_term`, `search_term_view.status`
- `metrics.impressions`, `metrics.clicks`, `metrics.ctr`
- `metrics.average_cpc`, `metrics.cost_micros`
- `metrics.conversions`, `metrics.conversions_from_interactions_rate`, `metrics.cost_per_conversion`

**Ordenação:** `metrics.cost_micros DESC` · **Limite:** 50 termos

---

### 4. HTTP Schedule 7d / 30d — Programação por Dia e Hora
**Recurso:** `campaign`

**Segmentos:** `segments.day_of_week`, `segments.hour`

**Campos selecionados:**
- `metrics.impressions`, `metrics.clicks`, `metrics.ctr`
- `metrics.average_cpc`, `metrics.cost_micros`
- `metrics.conversions`, `metrics.conversions_from_interactions_rate`, `metrics.cost_per_conversion`

**Filtro:** `metrics.impressions > 0` · **Ordenação:** `metrics.conversions DESC` · **Limite:** 500

---

### 5. HTTP Audiência — Segmentos de Audiência (30d)
**Recurso:** `campaign_audience_view`

**Campos selecionados:**
- `campaign_audience_view.resource_name`
- `metrics.impressions`, `metrics.clicks`, `metrics.ctr`
- `metrics.cost_micros`, `metrics.conversions`, `metrics.cost_per_conversion`
- `metrics.average_cpm`, `metrics.active_view_impressions`, `metrics.active_view_measurable_impressions`

**Ordenação:** `metrics.cost_micros DESC`

---

### 6. HTTP Pacing — Ritmo de Investimento (mês atual)
**Recurso:** `campaign`

**Campos selecionados:**
- `campaign.id`
- `campaign_budget.amount_micros`, `campaign_budget.period`
- `metrics.cost_micros`

**Filtro:** período do mês corrente

---

### 7. HTTP Canais — Origem das Conversões (30d)
**Recurso:** `campaign`

**Segmentos:** `segments.conversion_action_name`, `segments.conversion_action_category`

**Campos selecionados:**
- `campaign.advertising_channel_type`
- `metrics.conversions`, `metrics.conversions_value`, `metrics.cost_per_conversion`

**Filtro:** `metrics.conversions > 0` · **Ordenação:** `metrics.conversions DESC`

---

## Estrutura do Output (Code Merger Unificado)

```json
{
  "campaign_name": "...",
  "campaign_id": "...",
  "periodo_7d": "YYYY-MM-DD a YYYY-MM-DD",
  "periodo_30d": "YYYY-MM-DD a YYYY-MM-DD",

  "campanha_7d": {
    "impressoes", "impressoes_visiveis", "impressoes_nao_visiveis",
    "cliques", "custo", "ctr", "cpc", "cpa", "cpm",
    "conversoes", "tx_conversao", "ligacoes",
    "estrategia", "tipo_canal", "cpa_alvo", "roas_alvo"
  },

  "campanha_30d": {
    "impressoes", "cliques", "custo", "conversoes", "ligacoes"
  },

  "historico_deltas": {
    "impressoes", "cliques", "custo", "conversoes"
  },

  "grupo_recursos_7d":  [ { "nome", "impressoes", "cliques", "ctr", "cpc", "custo", ... } ],
  "grupo_recursos_30d": [ { "nome", "impressoes", "cliques", "ctr", "custo", ... } ],

  "termos_pesquisa": [ { "termo", "status", "impressoes", "cliques", "ctr", "cpc", "custo", ... } ],

  "schedule_7d":  [ { "dia", "faixa", "impressoes", "cliques", "ctr", "cpc", "custo", ... } ],
  "schedule_30d": [ { "dia", "faixa", "impressoes", "cliques", "ctr", "cpc", "custo", ... } ],

  "audiencia": [ { "recurso", "impressoes", "impr_visiveis", "cliques", "ctr", "custo", "cpa", "cpm" } ],

  "pacing": {
    "orcamento_diario", "orcamento_mensal",
    "gasto_mes_atual", "previsto_ate_hoje",
    "pacing_ratio", "status", "dias_decorridos", "dias_no_mes"
  },

  "canais_conversao": [ { "canal", "acao", "categoria", "conversoes", "valor", "cpa" } ]
}
```

---

## Output Final

- **Code Montar HTML:** Gera relatório HTML completo com KPIs, tabelas e seção de pacing
- **Convert HTML to PDF:** Converte o HTML em arquivo PDF para envio/armazenamento

---

## Credenciais Necessárias

| Item                  | Valor / Tipo                   |
|-----------------------|-------------------------------|
| Autenticação          | `googleAdsOAuth2Api` (OAuth2) |
| `developer-token`     | `o0hGRr2vcX3jGF6aI3a_0w`     |
| `login-customer-id`   | `7595536100`                  |
| API Version           | `v22`                         |
| Notion (fonte)        | OAuth / Integration Token     |

---

*Gerado a partir da análise do arquivo `google_ads_v2.json` · PHI™*
