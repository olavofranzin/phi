# Prompt — Análise Técnica: sw metricas campanhas

## Contexto

Você é um especialista em n8n, Google Ads API (GAQL) e automações de marketing.
Analise tecnicamente o workflow **"sw metricas campanhas"** em busca de erros,
bugs e oportunidades de melhoria.

Acesse o workflow via MCP do n8n:
```
Use n8n_list_workflows para localizar "sw metricas campanhas"
Use n8n_get_workflow com o ID encontrado para obter o JSON completo
```

---

## Erro Conhecido — Prioridade Alta

O nó **"HTTP Request Google Ontem (D7)"** está falhando com:

```json
{
  "errorCode": { "queryError": "EXPECTED_FROM" },
  "message": "FROM clause must be specified in a query."
}
```

**API afetada:** Google Ads API v23  
**HTTP Status:** 400 INVALID_ARGUMENT  
**Data do erro:** 15/06/2026 22:08:20  
**n8n versão:** 2.25.7

### O que investigar neste nó:

1. **Localizar o campo de query GAQL** no nó HTTP Request — verifique o body
   ou query string enviada à API Google Ads
2. **Verificar se a query contém cláusula `FROM`** — uma query GAQL válida exige:
   ```sql
   SELECT campo1, campo2
   FROM recurso
   WHERE condição
   DURING período
   ```
3. **Checar expressões dinâmicas** — se o campo da query usa `{{ }}`, verifique
   se a expressão pode estar retornando vazio ou undefined, gerando uma query
   incompleta
4. **Comparar com nós similares** — o workflow provavelmente tem outros nós de
   HTTP Request Google (D1, D3). Compare a estrutura do body/query entre eles e
   identifique a diferença no nó D7
5. **Verificar versão da API** — o erro referencia `v23`. Confirme se a URL do
   endpoint no nó D7 aponta para `v23` ou uma versão diferente dos outros nós

---

## Análise Geral do Workflow

Além do erro acima, avalie **todos os nós** do workflow em busca de:

### 1. Sintaxe de Code Nodes (n8n v2)
- Uso correto de `$input.first()` e `$input.all()` (não `items[0]`)
- Referências a outros nós: `$('NomeDoNo').item` (não `.first()` dentro de loops)
- Tratamento de valores `null`/`undefined` com `??` ou optional chaining `?.`
- Erros de JavaScript silenciosos que não lançam exceção mas retornam dados errados

### 2. Nós HTTP Request
- Todos os endpoints da Google Ads API estão na **mesma versão** (v22 ou v23)?
  Mistura de versões causa incompatibilidade de campos
- Os campos `customer_id`, `date_range` e filtros estão sendo passados corretamente?
- Autenticação OAuth2 está corretamente referenciada?
- Há tratamento de erro para respostas 4xx/5xx?

### 3. Queries GAQL
- Todas as queries têm: `SELECT ... FROM ... WHERE ... DURING ...`?
- Os campos selecionados existem no recurso indicado no `FROM`?
- Os filtros de data (`DURING YESTERDAY`, `DURING LAST_7_DAYS`) estão corretos
  para cada nó (D1 = ontem, D3 = últimos 3 dias, D7 = últimos 7 dias)?
- Campos de métricas como `metrics.cost_micros`, `metrics.clicks`,
  `metrics.impressions` estão escritos corretamente?

### 4. Fluxo de Dados entre Nós
- Os campos de output de cada nó correspondem aos campos esperados pelo próximo?
- Há nós que podem receber `undefined` quando o nó anterior não retorna dados?
- O workflow tem tratamento para campanhas sem dados no período consultado
  (zero impressões/cliques)?

### 5. Convenções do Projeto PHI
- Campos de saída seguem o prefixo `clean_*`?
- O `execution_id` está sendo propagado corretamente se necessário?
- Há consistência com o formato de saída esperado pelo workflow pai que chama
  este subworkflow?

---

## Output Esperado

Para cada problema encontrado, forneça:

```
### [NÍVEL: CRÍTICO | ALTO | MÉDIO | BAIXO] Nome do Nó — Descrição Curta

**Problema:** Descrição técnica exata do que está errado
**Causa Raiz:** Por que acontece
**Correção:** O que exatamente deve ser alterado (campo, valor, expressão)
**Código/Valor Atual:** `...`
**Código/Valor Corrigido:** `...`
```

Ao final, aplique as correções diretamente no workflow usando `n8n_update_partial_workflow`
e confirme quais nós foram atualizados.

---

## Referências

- Google Ads GAQL: recursos válidos no `FROM` → `campaign`, `ad_group`, `ad_group_ad`,
  `campaign_budget`, `keyword_view`
- Google Ads API v23 changelog: verificar campos deprecated vs v22
- Projeto PHI convenções: campos `clean_*`, sintaxe Code node v2 (`$input.first()`)
