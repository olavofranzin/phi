# [REPORT Codex] Keystone Pipeline_v2 - gate tecnico antes do fix

> Data: 2026-07-03  
> Executor: Codex  
> Branch: `claude/saude-digital-phi-midia-score-0ko12c`  
> Workflow alvo: `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`)  
> Decisao de publicacao: Olavo  
> Status: **BLOQUEADO ANTES DE DML/EDICAO DO DRAFT**

## 0. Veredito curto

Nao apliquei a Fase 1 nem editei o draft do `Pipeline_v2`.

O brief da Fase 1 dizia para parar se o schema real de `phi_prod.model_config` divergisse. Ele diverge de forma material:

- `valid_until` e `valid_from` sao `DATE`, nao `TIMESTAMP`.
- existem colunas `NOT NULL` adicionais nao contempladas no `INSERT` do brief: `phi_threshold_min`, `phi_threshold_max`, `valid_from`, `created_by`, `created_at`.
- portanto o DML fornecido para v1.2 nao e executavel contra o schema atual sem ajustar a lista de colunas/valores.

Tambem ha outro gate antes da semantica `INSUFFICIENT_DATA`: `phi_prod.phi_score_history.phi_value` esta `NOT NULL`, mas o SQL proposto grava `phi_value = NULL` quando `calculation_status != 'SUCCESS'`.

## 1. Estado live verificado

### Pipeline_v2

| Campo | Valor |
|---|---|
| workflow_id | `ITWG3Ge0asXtUM8U` |
| name | `PHI - Pipeline_v2` |
| active | `true` |
| versionId | `4b723285-dacb-4c96-9728-dcdf6a804421` |
| activeVersionId | `4b723285-dacb-4c96-9728-dcdf6a804421` |
| updatedAt | `2026-07-02T17:19:28.476Z` |

Nenhum `update_workflow` foi aplicado ao `Pipeline_v2`.

### Daily Entry

| Campo | Valor |
|---|---|
| workflow_id | `zGgIqiLlo5iAn8ud` |
| name | `Daily Entry` |
| active | `false` |
| versionId | `b8cffb00-d2aa-4721-86e8-b9484bdd495a` |
| activeVersionId | `null` |
| updatedAt | `2026-06-08T01:00:32.589Z` |

Achado de cobertura: o Daily Entry esta inativo. Isso, sozinho, explica por que ele nao prova cobertura diaria das campanhas ativas. A query BQ abaixo tambem mostra que, para D-1, as linhas `DAILY_ENTRY` existem com `client_id=''`, nao `CLI-4`.

### client_config sync

| Campo | Valor |
|---|---|
| workflow_id | `SI5NSzRb8lVUz74RwOhIT` |
| name | `client_config` |
| active | `true` |
| versionId | `99abdada-8a61-42b3-b8c4-3699a96ea405` |
| activeVersionId | `99abdada-8a61-42b3-b8c4-3699a96ea405` |

O sync nao cobre a correcao pedida para `phi_prod.client_config`:

- O MERGE aponta para `project-0e7c58d4-656f-49e8-807.phi_dev.client_config`, nao `phi_prod.client_config`.
- O codigo faz `if (!is_active) continue;`, entao clientes inativos do Notion sao descartados e nao atualizam BQ para `is_active=false`.

## 2. Execucoes temporarias usadas

Workflow temporario BQ: `TEMP Keystone Pipeline_v2 BQ Audit` (`Sn8C3r8CKS7C621p`)

| execution_id | status | observacao |
|---|---|---|
| `13783` | error | sem credencial BigQuery autoatribuida |
| `13784` | error | credencial OK; parametro `location='US'` incorreto para o dataset |
| `13785` | error | query parou no alias reservado `rows` |
| `13786` | success | evidencias BQ coletadas |

O workflow temporario `Sn8C3r8CKS7C621p` foi arquivado apos a coleta.

## 3. Evidencias BQ brutas

### Q client_config prod CLI5

| client_id | client_name | model_id | primary_metric_type | is_active | created_at | updated_at |
|---|---|---|---|---|---|---|
| `CLI-5` | `IMPACTO WEB CURSOS` | `MODEL-VAREJO-001` | `ROAS` | `true` | `2025-02-19T16:10:00.000-03:00` | `2026-03-05T15:52:04.220-03:00` |

### Q client_config dev CLI5

| client_id | client_name | model_id | primary_metric_type | is_active | created_at | updated_at |
|---|---|---|---|---|---|---|
| `CLI-5` | `IMPACTO WEB CURSOS` | `MODEL-VAREJO-001` | `ROAS` | `true` | `2025-02-19T16:10:00.000-03:00` | `2026-03-05T15:52:04.220-03:00` |

### Q model_config schema

| column_name | data_type | is_nullable |
|---|---|---|
| model_id | STRING | NO |
| business_model | STRING | NO |
| model_version | STRING | NO |
| mas | FLOAT64 | NO |
| tss | FLOAT64 | NO |
| fis | FLOAT64 | NO |
| es | FLOAT64 | NO |
| rs | FLOAT64 | NO |
| os | FLOAT64 | NO |
| threshold | FLOAT64 | NO |
| phi_threshold_min | FLOAT64 | NO |
| phi_threshold_max | FLOAT64 | NO |
| valid_from | DATE | NO |
| valid_until | DATE | YES |
| created_by | STRING | NO |
| created_at | TIMESTAMP | NO |

### Q model_config versions

| model_id | model_version | business_model | mas | tss | fis | es | rs | os | threshold | valid_until |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| MODEL-VAREJO-001 | v1.1 | VAREJO_LOCAL | 0.2 | 0.2 | 0.2 | 0.15 | 0.15 | 0.1 | 0.75 | NULL |

### Q workflow_log schema

| column_name | data_type | is_nullable |
|---|---|---|
| execution_id | STRING | NO |
| execution_date | DATE | NO |
| phase | STRING | NO |
| status | STRING | NO |
| is_reprocessing | BOOL | NO |
| started_at | TIMESTAMP | NO |
| finished_at | TIMESTAMP | YES |
| records_processed | INT64 | YES |
| tasks_attempted | INT64 | YES |
| tasks_created | INT64 | YES |
| total_duration_seconds | INT64 | YES |
| ingestion_last_step | STRING | YES |
| calculation_last_step | STRING | YES |
| operational_last_step | STRING | YES |
| operational_status | STRING | YES |
| error_message | STRING | YES |
| source_execution_id | STRING | YES |

### Q phi_score_history schema

| column_name | data_type | is_nullable |
|---|---|---|
| execution_id | STRING | NO |
| client_id | STRING | NO |
| campaign_id | STRING | NO |
| calculated_date | DATE | NO |
| business_model | STRING | NO |
| model_id | STRING | NO |
| model_version | STRING | NO |
| phi_value | FLOAT64 | NO |
| mas | FLOAT64 | NO |
| tss | FLOAT64 | NO |
| fis | FLOAT64 | NO |
| es | FLOAT64 | NO |
| rs | FLOAT64 | NO |
| os | FLOAT64 | NO |
| threshold_used | FLOAT64 | NO |
| calculation_status | STRING | NO |
| calculation_last_step | STRING | YES |
| snapshot_timestamp | TIMESTAMP | NO |
| reprocessed | BOOL | NO |
| reprocessed_at | TIMESTAMP | YES |
| reprocessed_by | STRING | YES |
| miv | FLOAT64 | YES |
| miv_normalizado | FLOAT64 | YES |
| priority_score | FLOAT64 | YES |
| phi_classification | STRING | YES |
| mas_janela | STRING | YES |
| rs_data_insufficient | BOOL | YES |
| os_data_unavailable | BOOL | YES |
| source_execution_id | STRING | YES |

### Q raw CLI4 coverage

| client_id | campaign_id | date | ingestion_step | ingestion_status | row_count | cost | conversions | goal |
|---|---|---|---|---|---:|---:|---:|---:|
| CLI-4 | GADS-21116045403 | 2026-07-02 | GADS_INSERT | SUCCESS | 1 | 26.8 | 5 | 3.5 |
| CLI-4 | GADS-21149189736 | 2026-07-02 | GADS_INSERT | SUCCESS | 1 | 0 | 0 | 5.2 |
| CLI-4 | GADS-21116045403 | 2026-07-01 | GADS_INSERT | SUCCESS | 1 | 35.57 | 10 | 3.5 |
| CLI-4 | GADS-21149189736 | 2026-07-01 | GADS_INSERT | SUCCESS | 1 | 0 | 0 | 5.2 |
| CLI-4 | GADS-21116045403 | 2026-06-30 | GADS_INSERT | SUCCESS | 1 | 24.25 | 8 | 3.5 |
| CLI-4 | GADS-21149189736 | 2026-06-30 | GADS_INSERT | SUCCESS | 1 | 0.37 | 0 | 5.2 |
| CLI-4 | GADS-21116045403 | 2026-06-27 | GADS_INSERT | SUCCESS | 1 | 31.56 | 6 | 3.5 |
| CLI-4 | GADS-21149189736 | 2026-06-27 | GADS_INSERT | SUCCESS | 1 | 0 | 0 | 5.2 |
| CLI-4 | GADS-21116045403 | 2026-06-26 | GADS_INSERT | SUCCESS | 1 | 37.89 | 2 | 3.5 |
| CLI-4 | GADS-21149189736 | 2026-06-26 | GADS_INSERT | SUCCESS | 1 | 0 | 0 | 5.2 |

### Q raw D1 by client step

| client_id | ingestion_step | ingestion_status | row_count | campaigns | cost | conversions |
|---|---|---|---:|---:|---:|---:|
| `` | DAILY_ENTRY | SUCCESS | 2 | 2 | 26.8 | 6 |
| CLI-4 | GADS_INSERT | SUCCESS | 2 | 2 | 26.8 | 5 |

### Q pipeline logs recent

| execution_id | execution_date | phase | status | records_processed | error_message | started_at | finished_at |
|---|---|---|---|---:|---|---|---|
| FALLBACK-20260703-d9bb885e-f520-4a65-b97c-5091c1ea9992 | 2026-07-03 | CALCULATION | SUCCESS | 0 | NULL | 2026-07-03T07:01:24.336-03:00 | 2026-07-03T07:01:27.925-03:00 |
| FALLBACK-20260703-d9bb885e-f520-4a65-b97c-5091c1ea9992 | 2026-07-03 | INGESTION | SUCCESS | 2 | NULL | 2026-07-03T07:00:53.698-03:00 | 2026-07-03T07:01:22.918-03:00 |
| FALLBACK-20260702-d65d27f1-1a4b-43a7-a7d8-be18f8959416 | 2026-07-02 | OPERATIONAL | SUCCESS | 2 | NULL | 2026-07-02T07:01:49.337-03:00 | 2026-07-02T07:01:59.902-03:00 |
| FALLBACK-20260702-d65d27f1-1a4b-43a7-a7d8-be18f8959416 | 2026-07-02 | CALCULATION | SUCCESS | 2 | NULL | 2026-07-02T07:01:32.185-03:00 | 2026-07-02T07:01:36.476-03:00 |
| FALLBACK-20260702-d65d27f1-1a4b-43a7-a7d8-be18f8959416 | 2026-07-02 | INGESTION | SUCCESS | 2 | NULL | 2026-07-02T07:00:53.765-03:00 | 2026-07-02T07:01:25.785-03:00 |

### Q score recent summary

| calculated_date | execution_id | client_id | calculation_status | phi_classification | row_count | null_phi | avg_phi |
|---|---|---|---|---|---:|---:|---:|
| 2026-07-01 | FALLBACK-20260702-d65d27f1-1a4b-43a7-a7d8-be18f8959416 | CLI-4 | SUCCESS | WARNING | 2 | 0 | 50 |
| 2026-06-30 | FALLBACK-20260701-2a0d9e3f-48d5-473e-9f16-01dde8ea1e0e | CLI-4 | SUCCESS | WARNING | 2 | 0 | 50 |
| 2026-06-27 | FALLBACK-20260628-7c4650a2-e41b-44f0-a9cd-e10c466f5ce0 | CLI-4 | SUCCESS | WARNING | 2 | 0 | 50 |
| 2026-06-26 | FALLBACK-20260627-641cea84-429a-493b-aa64-9cf96b14e78e | CLI-4 | SUCCESS | WARNING | 2 | 0 | 50 |

### Q table constraints

Retornou vazio.

Observacao: nao ha constraint de valores para `phi_classification`, mas ha `NOT NULL` em `phi_value` e componentes numericos.

## 4. Execucao 07:00 de 2026-07-03

Execution n8n: `13614`  
Workflow: `ITWG3Ge0asXtUM8U`  
Status n8n: `error`  
Started: `2026-07-03T10:00:51.105Z`  
Stopped: `2026-07-03T10:01:32.475Z`

Nos principais:

| Node | Resultado |
|---|---|
| Buscar ID de Sucesso Hoje | `execution_id=FALLBACK-20260703-d9bb885e-f520-4a65-b97c-5091c1ea9992` |
| Log INGESTION SUCCESS | success |
| Calcular e Persistir PHI Score | success, output vazio `{}` |
| Log CALCULATION SUCCESS | success |
| Log Notion Mapping Missing | error |

Erro final:

```text
Required field is_reprocessing cannot be null
```

O erro ocorreu porque `Log Notion Mapping Missing` faz `INSERT INTO phi_prod.workflow_execution_log (execution_id, execution_date, phase, status, started_at, error_message)` sem preencher a coluna obrigatoria `is_reprocessing`.

Esse erro e posterior ao calculo. O log BQ confirma que a fase `CALCULATION` marcou `SUCCESS` com `records_processed=0`.

## 5. Gates e criterios do brief

| Item | Status | Evidencia |
|---|---|---|
| 0.1 CLI-5 inativo | FAIL/BLOQUEADO | `phi_prod.client_config` e `phi_dev.client_config` ainda mostram `CLI-5 is_active=true`; sync escreve em `phi_dev` e descarta inativos, portanto nao corrige `phi_prod`. |
| 0.2 Cobertura Daily Entry | FAIL/GATED | Daily Entry esta `active=false`; em D-1 existem `DAILY_ENTRY` com `client_id=''`, enquanto `CLI-4` segue apenas `GADS_INSERT`. |
| Fase 1 model_config v1.2 | BLOQUEADO | Schema real diverge do DML do brief. |
| Fase 2 editar draft Pipeline_v2 | NAO EXECUTADO | Gate da Fase 1 bloqueou antes; nenhum `update_workflow` aplicado ao workflow alvo. |
| Fase 3 standalone MERGE | NAO EXECUTADO | O SQL proposto depende de model_config v1.2 e da semantica `phi_value=NULL`; schema atual de `phi_score_history` tem `phi_value NOT NULL`. |
| Fase 4 desligar GADS_INSERT | NAO EXECUTAR | Gate do Daily Entry nao satisfeito. |

## 6. Recomendacao objetiva para o proximo lote

Antes de reaplicar o brief de fix:

1. Ajustar o DML de `model_config v1.2` para o schema real:
   - preencher `phi_threshold_min`, `phi_threshold_max`, `valid_from`, `created_by`, `created_at`;
   - usar `DATE` em `valid_until`, ou decidir migracao de tipo se isso for intencional.
2. Decidir se a semantica `INSUFFICIENT_DATA` exige DDL em `phi_score_history` para permitir `NULL` em `phi_value`, `mas`, `tss`, `fis`, `es`, `rs`, `os`, `threshold_used`.
3. Corrigir `client_config` de `CLI-5` em `phi_prod` por caminho registrado, ja que o sync atual nao cobre inativacao.
4. Corrigir Daily Entry antes da Fase 4:
   - ativacao/cobertura diaria;
   - `client_id` populado corretamente nas linhas `DAILY_ENTRY`.
5. Corrigir `Log Notion Mapping Missing` para incluir `is_reprocessing`, pois hoje ele transforma o run em erro mesmo depois de `CALCULATION SUCCESS`.

