# Brief para Codex — Correção: "sw metricas anuncios" (Google Ads sem dados)

**Workflow n8n:** `sw metricas anuncios`
**ID:** `vVAdXAJh6MW2Z5Hp`
**Instância:** n8n self-hosted 2.25.7 — acessível via MCP `mcp__n8n__*`
**Data do reporte:** 06/07/2026
**Status do diagnóstico:** ✅ CAUSA-RAIZ CONFIRMADA (execução real #14811 analisada)

---

## 1. Sintoma

Todos os nós que chamam a Google Ads API — `HTTP Request Google Ontem (D1)`,
`(D3)`, `(D7)`, e `v23 Bloco 1 Core / 2 Termos / 3 Canais` — retornam **sem
dados**. Corpo de resposta observado (200 OK):

```json
[
  {
    "fieldMask": "campaign.id,campaign.name,adGroup.id,...,metrics.averageCpc",
    "requestId": "tTqZKHbtOL29Jg7mJFlY6Q",
    "queryResourceConsumption": "949"
  }
]
```

`fieldMask` presente + **`results` ausente** = query válida, executada, com
**ZERO linhas**. Não é erro de sintaxe nem de autenticação.

---

## 2. CAUSA-RAIZ CONFIRMADA — Campanha Performance Max consultada como `ad_group_ad`

Analisando a execução real **#14811**, o nó `Code clean propriedades` resolveu:

```
clean_id_google_camp:      21116045403
clean_id_google_adset:     6494448229
clean_id_google_ad:        6494448229   ← IDÊNTICO ao adset
clean_customer_id_google:  1422520966
clean_nome_campanha:  "GG_VISITA NEGÓCIO LOCAL_PMAX LOCAL_SALÃO.BELEZA_SP.CAP_2025 v.01"
clean_nome_anuncio:   "AD01-PMAX_CORTE.CABELO_06/07/26"
```

**Três provas de que é uma campanha Performance Max (PMax):**
1. `clean_id_google_ad` (6494448229) é **idêntico** a `clean_id_google_adset` —
   PMax não tem entidades `ad_group_ad` distintas; o ID de "anúncio" acaba sendo
   o mesmo do asset_group/ad_group.
2. Nome da campanha contém **"PMAX LOCAL"**.
3. Nome do anúncio contém **"PMAX"**.

**Por que retorna vazio:** TODAS as 6 queries usam
```
FROM ad_group_ad WHERE ad_group_ad.ad.id = 6494448229 AND segments.date ...
```
Campanhas **Performance Max não expõem o recurso `ad_group_ad`**. As métricas de
PMax vivem em nível de `campaign`, `asset_group` ou `asset_group_asset`. Logo,
`WHERE ad_group_ad.ad.id = <qualquer>` **nunca casa** para PMax → zero linhas,
em todos os períodos e todos os blocos. 100% consistente com o sintoma.

> Isto NÃO era a hipótese inicial (ID=0). O ID é um número válido, mas do
> **recurso errado** para o tipo de campanha. Só a inspeção da execução real
> revelou isso.

---

## 3. Problema secundário — roteamento PMax ausente/incorreto

O workflow tem um nó `IF Gate PMAX`, indicando que o autor pretendia tratar
PMax. Mas ele está mal posicionado:

- Sua condição é apenas `{{ $json._bq_sql }}` **notEmpty** → roteia para
  `Execute SQL inserir daily entry`. **Não** decide o tipo de query por tipo de
  campanha.
- O nó `If Plataforma` só bifurca **Google vs Meta** (out 0 → `v23 Bloco 1 Core`,
  out 1 → `HTTP Request Meta Ads`). Não existe bifurcação **PMax vs
  Search/Display**.

Ou seja: campanhas PMax entram no mesmo caminho `ad_group_ad` das campanhas de
Search/Display, e falham silenciosamente.

---

## 4. Correção a implementar

### 4.1 Detectar o tipo de campanha
Adicionar detecção de PMax. Opções (da mais robusta à mais simples):

- **(A) Via API** — query curta de tipo:
  `SELECT campaign.advertising_channel_type FROM campaign WHERE campaign.id = <id>`
  → `PERFORMANCE_MAX` identifica PMax de forma canônica.
- **(B) Heurística estrutural** — `clean_id_google_ad === clean_id_google_adset`
  sinaliza PMax (sem entidade de anúncio distinta).
- **(C) Convenção de nome** — nome da campanha/anúncio contém `PMAX`
  (o projeto PHI usa convenções de nomenclatura fortes).

Recomendado: (A) como fonte de verdade; (B)/(C) como fallback rápido sem custo
de API. Expor um campo `clean_channel_type` (ou `is_pmax`) no
`Code clean propriedades`.

### 4.2 Query correta para PMax (nível de campanha)
Para campanhas PMax, trocar `FROM ad_group_ad WHERE ad_group_ad.ad.id = X` por
consulta **em nível de campanha** (o `campaign.id = 21116045403` já resolve
corretamente):

```sql
SELECT campaign.id, campaign.name, segments.date,
       metrics.cost_micros, metrics.clicks, metrics.impressions,
       metrics.conversions, metrics.conversions_value,
       metrics.ctr, metrics.average_cpc
FROM campaign
WHERE campaign.id = <clean_id_google_camp>
  AND segments.date = '<date_d1>'
```
D3/D7/D30 usam `segments.date BETWEEN '<start>' AND '<date_d1>'`.

> Observação: campos como `ad_group.*` e `ad_group_ad.ad.*` **não existem** no
> recurso `campaign` — remova-os do SELECT no caminho PMax, senão gera
> `INVALID_ARGUMENT`. Se quiser granularidade por asset_group, usar
> `FROM asset_group WHERE asset_group.id = <id>` — mas para o daily entry,
> nível de campanha é suficiente e confiável.

### 4.3 Bifurcar o fluxo
- No `If Plataforma` (ou logo após), adicionar ramo PMax → nós HTTP que usam a
  query de `campaign`; ramo não-PMax → mantém os nós `ad_group_ad` atuais.
- Alternativamente, tornar o `jsonBody` de cada nó HTTP condicional ao
  `is_pmax`, montando a query certa dinamicamente. Bifurcar em nós separados é
  mais legível e testável.

### 4.4 Guardas e vazio legítimo
- Se `clean_id_google_ad`/`clean_id_google_camp` vier `0`/vazio, lançar erro
  explícito em vez de query que retorna vazio silencioso.
- O nó `Code Valida Dados` já detecta `no_results`; garantir que
  `Code Unificar Períodos` e `Code Montar SQL` produzam zeros (não `NaN`)
  quando um período legítimo vier vazio.

---

## 5. Validação

1. `mcp__n8n__validate_workflow` após as alterações.
2. Reexecutar com **esta mesma campanha PMax** (`campaign.id 21116045403`,
   customer `1422520966`) e confirmar que `data.results[0].metrics` vem
   preenchido pela query de `campaign`.
3. Reexecutar com um anúncio **Search/Display** normal e confirmar que o caminho
   `ad_group_ad` continua funcionando (não regredir).
4. Confirmar gravação em `phi_prod.raw_campaign_data`.

---

## 6. Regras do projeto PHI

- Code nodes em sintaxe v2: `$input.first()`, `$('Nó').item`.
- BigQuery: `phi_prod.tabela` (sem project ID).
- Google Ads API v23: `developer-token` vai no header manualmente.
- v23: `metrics.cost_per_conversion` incompatível com
  `segments.conversion_action_name/category`.
- PHI **não executa otimizações** — apenas coleta, valida e classifica.

---

## Apêndice — Mapa dos nós relevantes

| Nó | Papel | Situação |
|---|---|---|
| `Code clean propriedades` | Resolve IDs/datas do Notion | OK — expõe IDs; falta `is_pmax`/`clean_channel_type` |
| `If Plataforma` | Bifurca Google vs Meta | Falta bifurcar PMax vs ad_group_ad |
| `HTTP Request Google Ontem (D1/D3/D7)` | GAQL por período | **Usa `FROM ad_group_ad` — quebra p/ PMax** |
| `v23 Bloco 1 Core / 2 Termos / 3 Canais` | GAQL detalhado | **Idem — `FROM ad_group_ad`** |
| `IF Gate PMAX` | Gate por `_bq_sql` notEmpty | Mal posicionado; não roteia por tipo de campanha |
| `Code Valida Dados` | Detecta `no_results` | OK |
| `Code Unificar Períodos (D1,3D,7D)` | Consolida métricas | Lê `data.results[0].metrics` |
| `Code Montar SQL` | Monta MERGE BigQuery | Verificar robustez a vazio |
| `Execute SQL inserir daily entry` | Grava `raw_campaign_data` | — |

**Campanha de teste (PMax):** `campaign.id 21116045403`, customer `1422520966`,
cliente KIL, anúncio "AD01-PMAX_CORTE.CABELO_06/07/26".
