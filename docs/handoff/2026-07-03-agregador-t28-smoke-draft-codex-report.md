# [REPORT Codex] Smoke do draft Agregador T28 - ctx por campanha + leitura defensiva

> Data: 2026-07-03  
> Executor: Codex  
> Branch: `claude/saude-digital-phi-midia-score-0ko12c`  
> Commit base antes do report: `69ddf18d240ca23019b32d964376f706cb276021`  
> Workflow: `PHI - Agregador de Metricas Multi-fonte` (`4sdG2UKMCBuFq8xn`)

## Verificacao de versionIds

| Momento | versionId draft | activeVersionId | status |
|---|---|---|---|
| Antes do smoke | `cbd3568d-d5f5-473e-88a2-825ba7bf3eda` | `a46d5a6a-e5bc-4dee-babe-a002872277bd` | OK para executar |
| Depois da execucao 1 | `cbd3568d-d5f5-473e-88a2-825ba7bf3eda` | `a46d5a6a-e5bc-4dee-babe-a002872277bd` | Intocados |

Nao publiquei, nao ativei e nao editei nenhum no do Agregador.

## Execucoes n8n

| Ordem | workflow | execution_id | status | startedAt | stoppedAt | observacao |
|---|---|---:|---|---|---|---|
| BQ baseline | `wIKa3KFmHB8vE0B6` temp readonly | `13696` | `error` | `2026-07-03T15:25:27.969Z` | `2026-07-03T15:25:31.946Z` | B1/B2 rodaram; E1 falhou porque `source_ingestion_step` nao existe em `t28_campaign` |
| Agregador execucao 1 | `4sdG2UKMCBuFq8xn` | `13697` | `success` | `2026-07-03T15:25:42.269Z` | `2026-07-03T15:26:36.337Z` | Rodou draft manual semanal |
| BQ pos tentativa | `wIKa3KFmHB8vE0B6` temp readonly | `13700` / `13701` | `error` | `2026-07-03T15:26:34.261Z` | `2026-07-03T15:26:36.852Z` | B1/B2 rodaram; E1 falhou igual |
| BQ extra | `k1tFPek9mveRJvOd` temp readonly | `13702` | `error` | `2026-07-03T15:27:52.321Z` | `2026-07-03T15:27:53.897Z` | Capturou linhas `EXEC-T28-13697`; E2 literal do brief falhou por `TIMESTAMP >= DATE` |
| BQ E2/schema extra | `rilCWFb4GikvnEMR` temp readonly | `13703` | `success` | `2026-07-03T15:28:34.736Z` | `2026-07-03T15:28:36.613Z` | E2 com `TIMESTAMP(CURRENT_DATE())` e schema check |

Workflows temporarios arquivados ao final: `wIKa3KFmHB8vE0B6`, `k1tFPek9mveRJvOd`, `rilCWFb4GikvnEMR`.

Execucao 2 do Agregador: **nao executada**. Apos a execucao 1, C2/C3/C5 ja estavam quebrados; apliquei o guardrail "se algo falhar, capturar e parar".

## B1 baseline bruto

```text
campaign_id      business_date  janela  objetivo              metrica_mae  meta_metrica_mae  landing_page                              source_execution_id                                  ingested_at
GADS-21116045403 2026-06-30     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260701-2a0d9e3f-48d5-473e-9f16-01dde8ea1e0e 2026-07-01T09:01:24.946-03:00
GADS-21149189736 2026-06-30     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260701-2a0d9e3f-48d5-473e-9f16-01dde8ea1e0e 2026-07-01T09:01:24.940-03:00
GADS-21116045403 2026-06-27     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260628-7c4650a2-e41b-44f0-a9cd-e10c466f5ce0 2026-07-01T09:01:24.941-03:00
GADS-21149189736 2026-06-27     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260628-7c4650a2-e41b-44f0-a9cd-e10c466f5ce0 2026-07-01T09:01:24.944-03:00
GADS-21116045403 2026-06-26     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260627-641cea84-429a-493b-aa64-9cf96b14e78e 2026-06-27T21:06:10.685-03:00
GADS-21116045403 2026-06-26     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260627-641cea84-429a-493b-aa64-9cf96b14e78e 2026-07-01T09:01:24.941-03:00
GADS-21149189736 2026-06-26     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260627-641cea84-429a-493b-aa64-9cf96b14e78e 2026-06-27T21:06:10.685-03:00
GADS-21149189736 2026-06-26     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260627-641cea84-429a-493b-aa64-9cf96b14e78e 2026-07-01T09:01:24.944-03:00
GADS-21116045403 2026-06-25     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260626-cddb8e8f-454d-4bc9-86da-73c4ea7ba91f 2026-06-27T21:06:10.685-03:00
GADS-21116045403 2026-06-25     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260626-cddb8e8f-454d-4bc9-86da-73c4ea7ba91f 2026-07-01T09:01:24.946-03:00
GADS-21149189736 2026-06-25     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260626-cddb8e8f-454d-4bc9-86da-73c4ea7ba91f 2026-07-01T09:01:24.941-03:00
GADS-21149189736 2026-06-25     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260626-cddb8e8f-454d-4bc9-86da-73c4ea7ba91f 2026-06-27T21:06:10.685-03:00
GADS-21116045403 2026-06-24     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260625-10bce9ac-94ce-45fd-b0cd-21565ed5dd41 2026-06-27T21:06:10.685-03:00
GADS-21116045403 2026-06-24     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260625-10bce9ac-94ce-45fd-b0cd-21565ed5dd41 2026-07-01T09:01:24.945-03:00
GADS-21149189736 2026-06-24     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260625-10bce9ac-94ce-45fd-b0cd-21565ed5dd41 2026-06-27T21:06:10.685-03:00
GADS-21149189736 2026-06-24     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260625-10bce9ac-94ce-45fd-b0cd-21565ed5dd41 2026-07-01T09:01:24.946-03:00
GADS-21116045403 2026-06-23     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260624-6a1519d8-f37e-4a30-a18e-d333c373a484 2026-07-01T09:01:24.941-03:00
GADS-21116045403 2026-06-23     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260624-6a1519d8-f37e-4a30-a18e-d333c373a484 2026-06-27T21:06:10.685-03:00
GADS-21149189736 2026-06-23     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260624-6a1519d8-f37e-4a30-a18e-d333c373a484 2026-07-01T09:01:24.944-03:00
GADS-21149189736 2026-06-23     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260624-6a1519d8-f37e-4a30-a18e-d333c373a484 2026-06-27T21:06:10.685-03:00
GADS-21116045403 2026-06-22     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260623-2ae392f3-cebd-4c4a-8d8b-5772de0fcd4c 2026-06-27T21:06:10.685-03:00
GADS-21116045403 2026-06-22     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260623-2ae392f3-cebd-4c4a-8d8b-5772de0fcd4c 2026-07-01T09:01:24.944-03:00
GADS-21149189736 2026-06-22     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260623-2ae392f3-cebd-4c4a-8d8b-5772de0fcd4c 2026-06-27T21:06:10.685-03:00
GADS-21149189736 2026-06-22     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260623-2ae392f3-cebd-4c4a-8d8b-5772de0fcd4c 2026-07-01T09:01:24.946-03:00
GADS-21116045403 2026-06-21     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260622-fc34066b-7127-4d95-91c0-16da0dd71e13 2026-06-27T21:06:10.685-03:00
GADS-21116045403 2026-06-21     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260622-fc34066b-7127-4d95-91c0-16da0dd71e13 2026-07-01T09:01:24.940-03:00
GADS-21149189736 2026-06-21     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260622-fc34066b-7127-4d95-91c0-16da0dd71e13 2026-06-27T21:06:10.685-03:00
GADS-21149189736 2026-06-21     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260622-fc34066b-7127-4d95-91c0-16da0dd71e13 2026-07-01T09:01:24.944-03:00
GADS-21116045403 2026-06-19     D-30    VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260620-17a88693-6c1b-4a47-9ef5-7e2d5d9878ec 2026-07-01T09:01:24.944-03:00
GADS-21116045403 2026-06-19     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/   FALLBACK-20260620-17a88693-6c1b-4a47-9ef5-7e2d5d9878ec 2026-06-22T22:32:11.342-03:00
```

## B2 baseline bruto

```text
<0 rows>
```

## B1 pos-execucao bruto

O B1 pos-execucao (`13700`) retornou as mesmas 30 linhas do baseline para `client_id='CLI-4'`; nenhuma linha `EXEC-T28-13697` apareceu sob `CLI-4`.

## B2 pos-execucao bruto

```text
<0 rows>
```

## E1 bruto do brief

Query literal do brief:

```sql
SELECT campaign_id, business_date, janela, objetivo, metrica_mae,
       meta_metrica_mae, landing_page, source_ingestion_step,
       execution_id, ingested_at
FROM `phi_prod.t28_campaign`
WHERE client_id='CLI-4' AND execution_id LIKE 'EXEC-T28-%'
ORDER BY ingested_at DESC, campaign_id LIMIT 30;
```

Resultado bruto:

```text
ERROR 400 INVALID_ARGUMENT
Unrecognized name: source_ingestion_step at [1:99]
```

Checagem isolada de schema:

```text
SELECT column_name, data_type
FROM `phi_prod.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name='t28_campaign'
  AND column_name='source_ingestion_step';

<0 rows>
```

Linhas escritas pela execucao 1, sem selecionar `source_ingestion_step` porque a coluna nao existe:

```text
client_id  campaign_id      business_date  janela  objetivo              metrica_mae  meta_metrica_mae  landing_page                             execution_id     ingested_at
NULL       GADS-21149189736 2026-06-26     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/  EXEC-T28-13697   2026-07-03T12:26:29.269-03:00
NULL       GADS-21149189736 2026-06-27     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/  EXEC-T28-13697   2026-07-03T12:26:29.269-03:00
NULL       GADS-21149189736 2026-06-30     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/  EXEC-T28-13697   2026-07-03T12:26:29.269-03:00
NULL       GADS-21149189736 2026-07-01     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/  EXEC-T28-13697   2026-07-03T12:26:29.269-03:00
NULL       GADS-21149189736 2026-07-02     D-7     VISITA NEGOCIO LOCAL  CPA          5.2               https://kbbecker.com.br/lp-corte-barba/  EXEC-T28-13697   2026-07-03T12:26:29.269-03:00
```

Evidencia do proprio n8n para o problema de `client_id`: `Normalizador T28` gerou `client_id: ""`; o builder de MERGE tratou string vazia como blank e emitiu `CAST(NULL AS STRING) AS client_id`.

## E2 bruto

Query literal do brief falhou:

```text
ERROR 400 INVALID_ARGUMENT
No matching signature for operator >= for argument types: TIMESTAMP, DATE
at [1:72]
```

Consulta read-only equivalente com `TIMESTAMP(CURRENT_DATE())`, usada apenas para sanidade:

```text
t                   c
t28_campaign        5
t28_adset           0
t28_ga4_landing     2
t28_gbp_daily       0
t28_clarity_daily   1
```

## Erros/degradacoes observadas na execucao 1

| Node | Severidade | Mensagem | Observacao |
|---|---|---|---|
| `HTTP Request GBP` | degradacao aceitavel | `The service is receiving too many requests from you` | Quota `businessprofileperformance.googleapis.com`; roteado pelo handler como `gbp` |
| `Search Terms` | degradacao | `source_status.search_terms = "error"` | Presente no output do Adaptador |
| `[T28] BQ Read raw_campaign_data` | OK | sem erro | Retornou `source_ingestion_step: GADS_INSERT` no output do node |
| `Adaptador Input T28` | OK tecnico, mas dados incompletos | sem erro | Contexto da campanha processada apontou landing de Barbearia |
| `Normalizador T28` / MERGE | FAIL de contrato | `client_id` vazio -> `NULL`; `source_ingestion_step` nao persistido | C2/C3/C5 quebrados |

## Veredito C1-C6

| Criterio | Veredito | Evidencia |
|---|---|---|
| C1 - Execucoes 1 e 2 terminam success | **FAIL** | Execucao 1 `13697` terminou `success`; execucao 2 nao foi rodada por criterio de parada apos falhas materiais na execucao 1. |
| C2 - Contexto por campanha | **FAIL** | E1 literal nao roda por coluna ausente. Query alternativa mostra apenas `GADS-21149189736` com `client_id NULL`; nao ha linhas CLI-4 para comparar Barbearia x Salao. |
| C3 - `source_ingestion_step` populado em E1 | **FAIL** | O BQ Read retornou `source_ingestion_step = GADS_INSERT`, mas `phi_prod.t28_campaign` nao tem essa coluna e o MERGE de `t28_campaign` nao a inclui. |
| C4 - Idempotencia | **INCONCLUSIVO / FAIL operacional** | B2 para a chave declarada continua vazio, mas a execucao 2 foi bloqueada; alem disso a execucao 1 criou/atualizou 5 linhas com `client_id NULL`, fora do contrato CLI-4. |
| C5 - Sem regressao de counts | **FAIL** | Sanidade com cast: `t28_campaign=5`, `t28_adset=0`, `t28_ga4_landing=2`, `t28_gbp_daily=0`, `t28_clarity_daily=1`. `t28_adset=0` e campanha abaixo do esperado; as 5 linhas de campanha estao com `client_id NULL`. |
| C6 - Draft/ativo intocados | **PASS** | Pos-smoke: draft `cbd3568d-d5f5-473e-88a2-825ba7bf3eda`; ativo `a46d5a6a-e5bc-4dee-babe-a002872277bd`. |

## Estranhezas fora dos criterios

1. O report de 2026-07-02 fala em propagar `source_ingestion_step`, mas o builder `[T28] Build MERGE t28_campaign` ainda nao tem esse campo no `SCHEMA`; tambem nao ha coluna na tabela BQ.
2. O `Normalizador T28` perdeu `client_id`: `ctx.client_id` veio `null`, row normalizada veio `client_id: ""`, e o MERGE gravou `NULL`.
3. A query E2 literal do brief compara `ingested_at` (`TIMESTAMP`) com `CURRENT_DATE()` (`DATE`) e falha no BigQuery Standard SQL. Para sanidade usei `TIMESTAMP(CURRENT_DATE())`.
4. `HTTP Request GBP` estourou quota; isso era aceitavel pelo brief, mas apareceu duas vezes e foi roteado para o handler.

## Conclusao

Smoke do draft `cbd3568d` **NAO PASSOU**. A execucao manual 1 concluiu sem erro fatal, mas nao validou o objetivo do smoke: gravou linhas de `t28_campaign` com `client_id NULL`, nao persistiu `source_ingestion_step`, nao produziu evidencia E1 para CLI-4 e nao permitiu comparar Barbearia x Salao. Parei antes da execucao 2 conforme guardrail.
