# Análise de Configuração dos Nós — Google Ads v2

## 1. Schedule Trigger
**Tipo:** `n8n-nodes-base.scheduleTrigger` v1.3

```
triggerAtHour: 5
```

- Dispara uma vez por dia às 05h00 (horário do servidor n8n)
- Sem `timezone` definido — depende da timezone do servidor
- Sem `triggerAtMinute` — dispara em :00

**Problema:** Sem timezone explícito, o horário pode variar com fuso horário do servidor.
**Recomendação:** Adicionar `timezone: "America/Sao_Paulo"` ao nó.

---

## 2. Notion: Get Campanhas Ativas
**Tipo:** `n8n-nodes-base.notion` v2.2

```
resource:   databasePage / getAll
databaseId: 19fb65e5-c72b-8043-a82d-f47ede397928  ("Campanhas")
returnAll:  true
simple:     false
```

**Filtros aplicados (matchType: allFilters):**
| Campo          | Condição       | Valor          |
|----------------|----------------|----------------|
| `Status|status` | equals        | `Em execução`  |
| `Fonte|multi_select` | is_not_empty | —           |

- `simple: false` → retorna o objeto Notion completo (com todas as properties), necessário para o Code seguinte acessar `id_google_account` e `id_google_camp`
- `returnAll: true` → sem paginação, traz todas as campanhas ativas de uma vez

**Observação:** A propriedade `Fonte` com `is_not_empty` garante que só campanhas com fonte de mídia definida entram no pipeline, evitando erros nas chamadas à API.

---

## 3. Code Preparar Contexto
**Tipo:** `n8n-nodes-base.code` v2

**Entrada consumida:**
```javascript
props.id_google_account?.number   → customer_id (inteiro → string)
props.id_google_camp?.number      → campaign_id  (inteiro → string)
props['Nome Campanha']?.formula?.string  || props['Name']?.title?.[0]?.plain_text
```

**Períodos calculados (com base em `new Date()`):**
```
periodo_7d:  [hoje - 7d,  ontem]
periodo_30d: [hoje - 30d, ontem]
periodo_mes: [1º do mês,  ontem]
hoje:        data atual
```

**Problemas identificados:**

1. **`$input.item.json`** — O código usa `$input.item.json` em vez de `$json`. Funcional, mas verbose e inconsistente com a forma canônica do n8n v2.

2. **Período 7d inclui D-7 (7 dias completos):** `start = hoje - 7d`, `end = ontem (D-1)`. Isso resulta em **6 dias** de diferença entre start e end, mas a query GAQL interpreta o BETWEEN como inclusivo, então cobre 7 dias. Correto.

3. **Timezone não controlado:** `new Date()` usa o timezone do servidor n8n. Se o servidor estiver em UTC, o "ontem" calculado às 05h BRT (08h UTC) ainda estará no dia correto, mas é um ponto de atenção.

4. **Sem validação de IDs:** Se `id_google_account` ou `id_google_camp` for `null` ou `0`, as queries à API retornarão erro. O `parseInt(... || 0)` silencia o problema em vez de falhar visivelmente.

---

## 4. Loop Campanhas
**Tipo:** `n8n-nodes-base.splitInBatches` v3

```
options: {}   (batchSize padrão = 1)
```

**Conexões de saída:**
```
output[0] → Code Montar HTML
output[1] → HTTP Core 7d
```

**PROBLEMA CRÍTICO — Estrutura de loop quebrada:**

No `SplitInBatches` v3, os outputs são:
- `output[0]` = **"Done"** — dispara **uma única vez**, após todos os itens processados
- `output[1]` = **"Loop"** — dispara com o batch atual, a cada iteração

O workflow está conectado ao **contrário do esperado**:
- `output[0]` (Done) → **Code Montar HTML** → recebe o sinal de fim, sem dados úteis
- `output[1]` (Loop) → **HTTP Core 7d** → correto, processa cada campanha

Além disso, **não existe conexão de retorno** (`Code Merger Unificado → Loop Campanhas`), que é obrigatória para continuar para o próximo item. O resultado prático é que **o loop processa apenas a primeira campanha** e para.

---

## 5–11. Nós HTTP (Google Ads API v22)

Todos compartilham a mesma estrutura base:

```
method:           POST
url:              https://googleads.googleapis.com/v22/customers/{customer_id}/googleAds:search
authentication:   predefinedCredentialType (googleAdsOAuth2Api)
specifyBody:      json
alwaysOutputData: true
```

**Headers fixos em todos os nós:**
```
developer-token:   o0hGRr2vcX3jGF6aI3a_0w
login-customer-id: 7595536100
```

**PROBLEMA DE SEGURANÇA:** O `developer-token` está **hardcoded em plaintext** em todos os 9 nós HTTP. Deveria ser uma credencial ou variável de ambiente n8n (`{{ $env.GOOGLE_ADS_DEVELOPER_TOKEN }}`).

### 5. HTTP Core 7d e 6. HTTP Core 30d
**Recurso:** `campaign`

```sql
SELECT
  campaign.id, campaign.name,
  campaign.bidding_strategy_type, campaign.advertising_channel_type,
  campaign.target_cpa.target_cpa_micros, campaign.target_roas.target_roas,
  metrics.impressions, metrics.clicks, metrics.ctr,
  metrics.average_cpc, metrics.cost_micros, metrics.phone_calls,
  metrics.conversions_from_interactions_rate, metrics.cost_per_conversion,
  metrics.conversions,
  metrics.active_view_impressions, metrics.active_view_measurable_impressions,
  metrics.average_cpm
FROM campaign
WHERE campaign.id = '{campaign_id}'
  AND segments.date BETWEEN '{start}' AND '{end}'
```

- Sem `ORDER BY` e sem `LIMIT` — correto para query de campanha única
- `alwaysOutputData: true` — evita quebra do pipeline se a campanha não tiver dados no período

### 7. HTTP Grupo Recursos 7d e 8. HTTP Grupo Recursos 30d
**Recurso:** `ad_group`

```sql
SELECT
  ad_group.id, ad_group.name, campaign.name,
  campaign.bidding_strategy_type, campaign.target_cpa.*, campaign.target_roas.*,
  metrics.*  (mesmo conjunto do Core)
FROM ad_group
WHERE campaign.id = '{campaign_id}'
  AND segments.date BETWEEN '{start}' AND '{end}'
  AND ad_group.status != 'REMOVED'
ORDER BY metrics.cost_micros DESC
```

- Filtra `ad_group.status != 'REMOVED'` — correto
- Sem `LIMIT` — pode retornar muitos grupos em contas grandes

### 9. HTTP Termos 7d
**Recurso:** `search_term_view`

```sql
SELECT
  search_term_view.search_term, search_term_view.status,
  metrics.impressions, metrics.clicks, metrics.ctr,
  metrics.average_cpc, metrics.cost_micros, metrics.conversions,
  metrics.conversions_from_interactions_rate, metrics.cost_per_conversion
FROM search_term_view
WHERE campaign.id = '{campaign_id}'
  AND segments.date BETWEEN '{start_7d}' AND '{end_7d}'
ORDER BY metrics.cost_micros DESC
LIMIT 50
```

- `LIMIT 50` — pode excluir termos relevantes em campanhas com muitos termos
- Sem filtro de cliques mínimos — pode trazer termos com 0 cliques

### 10. HTTP Schedule 7d e 11. HTTP Schedule 30d
**Recurso:** `campaign` com segmentação por `day_of_week` e `hour`

```sql
SELECT
  segments.day_of_week, segments.hour,
  metrics.impressions, metrics.clicks, metrics.ctr,
  metrics.average_cpc, metrics.cost_micros, metrics.conversions,
  metrics.conversions_from_interactions_rate, metrics.cost_per_conversion
FROM campaign
WHERE campaign.id = '{campaign_id}'
  AND segments.date BETWEEN '{start}' AND '{end}'
  AND metrics.impressions > 0
ORDER BY metrics.conversions DESC
LIMIT 500
```

- Filtro `metrics.impressions > 0` — correto, remove horários sem dados
- `LIMIT 500` — adequado (7d × 24h × 7 dias = 168 linhas máx; 30d × 24h = 720, pode truncar)

### 12. HTTP Audiência
**Recurso:** `campaign_audience_view`

```sql
SELECT
  campaign_audience_view.resource_name,
  metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost_micros,
  metrics.conversions, metrics.cost_per_conversion,
  metrics.average_cpm,
  metrics.active_view_impressions, metrics.active_view_measurable_impressions
FROM campaign_audience_view
WHERE campaign.id = '{campaign_id}'
  AND segments.date BETWEEN '{start_30d}' AND '{end_30d}'
ORDER BY metrics.cost_micros DESC
```

- Sem `LIMIT` — pode retornar muitos segmentos
- Apenas período 30d (sem versão 7d)
- `resource_name` retorna o caminho completo do recurso (ex: `customers/123/campaignAudienceViews/456~789`) — o Merger usa `.split('/').pop()` para extrair o ID. Não retorna o nome legível do segmento de audiência

**Problema:** O nome real da audiência não é recuperável diretamente deste recurso; seria necessário um join com `user_list` ou `user_interest`.

### 13. HTTP Pacing
**Recurso:** `campaign`

```sql
SELECT
  campaign.id,
  campaign_budget.amount_micros, campaign_budget.period,
  metrics.cost_micros
FROM campaign
WHERE campaign.id = '{campaign_id}'
  AND segments.date BETWEEN '{start_mes}' AND '{end_mes}'
```

- Usa período do mês corrente — correto para cálculo de pacing
- Não verifica `campaign_budget.period` — assume que o orçamento é **diário**. Se o orçamento for **mensal** (`MONTHLY`), o cálculo de pacing estará errado

### 14. HTTP Canais
**Recurso:** `campaign` com segmentação por conversão

```sql
SELECT
  campaign.advertising_channel_type,
  segments.conversion_action_name, segments.conversion_action_category,
  metrics.conversions, metrics.conversions_value, metrics.cost_per_conversion
FROM campaign
WHERE campaign.id = '{campaign_id}'
  AND segments.date BETWEEN '{start_30d}' AND '{end_30d}'
  AND metrics.conversions > 0
ORDER BY metrics.conversions DESC
```

- Filtro `metrics.conversions > 0` — correto, exclui ações sem conversão
- Sem `LIMIT` — adequado dado o filtro restritivo

---

## 15. Code Merger Unificado
**Tipo:** `n8n-nodes-base.code` v2

Consolida todas as respostas das APIs usando referências cruzadas com `$('nodeName').first().json`.

**Padrão de leitura dos nós:**
```javascript
const getResults = (nodeName) => {
  try {
    const r = $(nodeName).first().json;
    return Array.isArray(r.results) ? r.results : [];
  } catch(e) { return []; }
};
```

- `.first()` — lê apenas o primeiro item de cada nó. Em campanhas com múltiplos itens de saída, dados podem ser perdidos
- `try/catch` com retorno silencioso `[]` — erros de API passam sem aviso

**Mapeamento de campos da API:**

A API Google Ads retorna campos em `camelCase` (ex: `costMicros`, `activeViewImpressions`).
O código acessa `r.metrics.costMicros` — correto para a resposta HTTP direta.

**Cálculo de Deltas:**
```javascript
const delta = (v7, base30, casoBom) => {
  const base = base30 * 7;
  ...
};
```
Compara os últimos 7d contra a média semanal equivalente dos 30d. Lógica correta.

**PROBLEMA CRÍTICO — Sem conexão de saída:**

O `Code Merger Unificado` **não possui conexão de saída** para nenhum nó. Isso significa:
1. Os dados consolidados são processados mas **não chegam ao Code Montar HTML**
2. O loop **não retorna** ao `Loop Campanhas`, portanto **só a primeira campanha é processada**

---

## 16. Code Montar HTML
**Tipo:** `n8n-nodes-base.code` v2 | Posição: [880, -200]

Recebe dados via `$json` e gera um HTML completo.

**PROBLEMA:** Está conectado ao `Loop Campanhas output[0]` (sinal "Done"), portanto **recebe dados do sinal de fim do loop, não do Code Merger Unificado**. O `$json` estará vazio ou incorreto.

**Estrutura do HTML gerado:**
- Header com nome de campanha e períodos
- Grid de KPIs (4 colunas, 12 cards)
- Tabela histórico 7d vs 30d
- Tabela grupos de recursos 7d
- Tabela termos de pesquisa 7d
- Tabela audiência 30d
- Tabela canais de conversão 30d
- Box de pacing
- Tabelas schedule 7d e 30d
- Tabela grupos de recursos 30d
- Footer com data

**CSS inline** — não depende de recursos externos, correto para PDF.

---

## 17. Convert HTML to PDF
**Tipo:** `n8n-nodes-htmlcsstopdf.htmlcsstopdf` v1

```
output_format: file
```

- Nó de terceiros (`n8n-nodes-htmlcsstopdf`) — requer plugin instalado no n8n
- Sem configurações de página (tamanho, orientação, margens) — usa defaults
- **Sem destino configurado:** o PDF é gerado mas não há nó de envio (email, Drive, Notion, Slack, etc.)

---

## Resumo dos Problemas Encontrados

### Críticos (quebram o funcionamento)
| # | Nó | Problema |
|---|-----|----------|
| 1 | Loop Campanhas | Output[0]/[1] invertidos: o sinal "Done" vai para Code Montar HTML, não o dado |
| 2 | Code Merger Unificado | Sem conexão de saída — dados não chegam ao HTML e o loop não avança |
| 3 | Loop Campanhas | Sem loop-back — apenas a primeira campanha é processada |

### Segurança
| # | Nó | Problema |
|---|-----|----------|
| 4 | Todos os HTTP | `developer-token` hardcoded em plaintext (9 nós) |

### Funcionais / Qualidade
| # | Nó | Problema |
|---|-----|----------|
| 5 | Schedule Trigger | Timezone não definido explicitamente |
| 6 | Code Preparar Contexto | Sem validação de IDs nulos/zero |
| 7 | HTTP Pacing | Assume budget diário; quebra para orçamentos mensais |
| 8 | HTTP Audiência | `resource_name` sem nome legível da audiência |
| 9 | HTTP Termos 7d | LIMIT 50 pode excluir termos relevantes |
| 10 | HTTP Schedule 30d | LIMIT 500 pode truncar dados (720 linhas possíveis) |
| 11 | Code Merger Unificado | `.first()` descarta dados se nós tiverem múltiplos outputs |
| 12 | Convert HTML to PDF | Sem destino de envio do PDF configurado |

---

*Análise gerada a partir do arquivo `google_ads_v2.json` · PHI™*
