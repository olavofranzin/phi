# Brief para Codex — Correção: "sw metricas anuncios" (Google Ads sem dados)

**Workflow n8n:** `sw metricas anuncios`
**ID:** `vVAdXAJh6MW2Z5Hp`
**Instância:** n8n self-hosted 2.25.7 — acessível via MCP `mcp__n8n__*`
**Data do reporte:** 06/07/2026

---

## 1. Sintoma

Todos os nós que chamam a Google Ads API (`HTTP Request Google Ontem (D1)`,
`(D3)`, `(D7)`, e os blocos `v23 Bloco 1/2/3`) retornam **sem os dados
solicitados**. O corpo de resposta observado é:

```json
[
  {
    "fieldMask": "campaign.id,campaign.name,adGroup.id,adGroup.name,adGroupAd.ad.id,adGroupAd.ad.name,adGroupAd.status,segments.date,metrics.costMicros,metrics.clicks,metrics.impressions,metrics.conversions,metrics.conversionsValue,metrics.ctr,metrics.averageCpc",
    "requestId": "tTqZKHbtOL29Jg7mJFlY6Q",
    "queryResourceConsumption": "949"
  }
]
```

## 2. Diagnóstico (já apurado — NÃO é erro de sintaxe)

A resposta contém `fieldMask` + `requestId` + `queryResourceConsumption`, mas
**não contém a chave `results`**. Na Google Ads API `searchStream`, isso
significa **HTTP 200 com ZERO linhas retornadas** — a query foi aceita e
executada, mas nenhuma linha casou com o filtro `WHERE`.

> A presença do `fieldMask` prova que: a query tem `FROM`, os nomes de campos
> são válidos, a autenticação e o `developer-token` estão corretos. O problema
> é **exclusivamente o filtro `WHERE` não encontrar linhas**.

### Query real enviada (nó D1)

```
SELECT campaign.id, campaign.name, ad_group.id, ad_group.name,
       ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.status,
       segments.date, metrics.cost_micros, metrics.clicks,
       metrics.impressions, metrics.conversions, metrics.conversions_value,
       metrics.ctr, metrics.average_cpc
FROM ad_group_ad
WHERE ad_group_ad.ad.id = <clean_id_google_ad>
  AND segments.date = '<date_d1>'
```

D3/D7/D30 são idênticos, mudando apenas o filtro de data para
`segments.date BETWEEN '<start>' AND '<date_d1>'`.

### Como os valores do filtro são montados (nó `Code clean propriedades`)

```js
clean_id_google_ad: extractNumber(adProps['id_google_ad']) || extractNumber(adProps['google_ad_id']),
clean_customer_id_google: extractNumber(conjuntoProps['customer_id_google'])
    || extractNumber(campanhaProps['id_google_account'])
    || extractNumber(adProps['id_google_account']),
```

## 3. Causas prováveis (investigar nesta ordem)

### Hipótese A — `clean_id_google_ad` resolvendo para `0` (MAIS PROVÁVEL)
`extractNumber()` retorna `0` quando a propriedade do Notion não existe com esse
nome exato, ou é do tipo rollup/formula que a função não consegue parsear.
Se o resultado for `0`, a query vira `WHERE ad_group_ad.ad.id = 0` → zero linhas
**em todos os períodos**, exatamente o sintoma sistêmico observado.

**Verificar:** rode o workflow com pin/execução real e inspecione o output do
nó `Code clean propriedades`. Confirme se `clean_id_google_ad` é um ID numérico
real e não-zero. Confira o nome exato da propriedade no Notion (DB `anuncios`) —
pode ser `id_google_ad`, `google_ad_id`, `ID Google Ad`, ou outro.

### Hipótese B — `clean_customer_id_google` incorreto
Se o customer_id não bate com a conta dona do anúncio, a API não encontra o
`ad.id` naquele customer → zero linhas. Confirmar que o customer_id resolvido
pertence à mesma conta do anúncio consultado.

### Hipótese C — ID armazenado é de outro recurso
O valor em `id_google_ad` pode ser, na verdade, o `ad_group.id`,
`ad_group_ad` resource name, ou o ID do criativo/asset — não o
`ad_group_ad.ad.id`. Nesse caso o filtro nunca casa.

### Hipótese D — Anúncio sem impressões no período (legítimo)
`FROM ad_group_ad` com `segments.date` só retorna linhas para combinações
entidade+data que tiveram **pelo menos uma impressão**. Para um único anúncio
num único dia (D1), vazio pode ser legítimo. Porém, como D30 também está vazio,
esta hipótese sozinha não explica o sintoma sistêmico — priorize A/B/C.

## 4. Passos de correção para o Codex

1. **Confirmar o ID resolvido:** Execute o workflow (`mcp__n8n__test_workflow`
   ou `execute_workflow`) e leia o output de `Code clean propriedades`. Registre
   os valores reais de `clean_id_google_ad` e `clean_customer_id_google`.

2. **Query de diagnóstico (sem filtro de ad.id):** Monte temporariamente uma
   query só com `customer_id` + range amplo de datas, ordenada por impressões,
   para listar os `ad_group_ad.ad.id` que realmente serviram:
   ```
   SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, segments.date, metrics.impressions
   FROM ad_group_ad
   WHERE segments.date DURING LAST_30_DAYS AND metrics.impressions > 0
   ORDER BY metrics.impressions DESC
   ```
   Compare os IDs retornados com o `clean_id_google_ad` do passo 1. Se não bater,
   a origem do ID no Notion está errada (Hipótese A ou C).

3. **Corrigir a origem do ID:**
   - Se o nome da propriedade Notion estiver errado em `Code clean propriedades`,
     ajustar o `extractNumber(adProps['...'])` para o nome correto.
   - Se `extractNumber` não parsear o tipo (rollup/formula), estender a função
     ou o acesso à propriedade.
   - Adicionar um **guard**: se `clean_id_google_ad` for `0`/vazio, lançar erro
     explícito ("ad.id não resolvido para o anúncio X") em vez de disparar uma
     query que silenciosamente retorna vazio.

4. **Tratar vazio legítimo com clareza:** O nó `Code Valida Dados` já detecta
   `no_results`. Garantir que, quando o vazio for legítimo (Hipótese D), o
   fluxo insira zeros no BigQuery e registre `has_data=false` — sem quebrar o
   pipeline. Confirmar que `Code Unificar Períodos` e `Code Montar SQL`
   funcionam com todos os períodos vazios (não devem gerar `NaN`).

5. **Padronizar versão da API:** Todos os nós Google usam `/v23/`. Confirmar que
   os nomes de campos batem com v23 (ex.: `metrics.cost_micros` no request,
   `costMicros` no response). O código downstream já lida com ambos
   (`m.costMicros || m.cost_micros`) — manter essa robustez.

## 5. Validação final

- Rodar `mcp__n8n__validate_workflow` após as alterações.
- Executar o workflow com um anúncio sabidamente ativo (com impressões nos
  últimos dias) e confirmar que `data.results[0].metrics` vem preenchido.
- Confirmar gravação correta no BigQuery (`phi_prod.raw_campaign_data`).

## 6. Regras do projeto PHI a respeitar

- Code nodes em sintaxe v2: `$input.first()`, `$('Nó').item`.
- BigQuery: referenciar tabelas como `phi_prod.tabela` (sem project ID).
- Google Ads API: `developer-token` vai no header manualmente (não é injetado
  pelo `googleAdsOAuth2Api`).
- v23: `metrics.cost_per_conversion` é incompatível com
  `segments.conversion_action_name/category` — não misturar.
- PHI **não executa otimizações** — apenas coleta, valida e classifica.

---

## Apêndice — Nós relevantes do workflow

| Nó | Papel |
|---|---|
| `Code clean propriedades` | Resolve IDs e datas a partir do Notion — **origem provável do bug** |
| `HTTP Request Google Ontem (D1/D3/D7)` | Chamadas GAQL por período |
| `v23 Bloco 1 Core` | Serve como fonte D30 (fallback no `Code Unificar Períodos`) |
| `Code Valida Dados` | Detecta `no_results` / campos ausentes |
| `Code Unificar Períodos (D1, 3D, 7D)` | Consolida métricas dos períodos; lê `data.results[0].metrics` |
| `Code Montar SQL` | Monta o MERGE para BigQuery |
| `Execute SQL inserir daily entry` | Grava em `phi_prod.raw_campaign_data` |
