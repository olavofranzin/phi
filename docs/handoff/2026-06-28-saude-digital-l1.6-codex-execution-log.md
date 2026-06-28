# Execution log Codex - L1.6 idempotencia BQ T28

Data: 2026-06-28

## Contexto

Brief executado: `docs/handoff/2026-06-28-saude-digital-l1.6-codex-merge-idempotencia-brief.md`.

Workflow alvo: `4sdG2UKMCBuFq8xn` (`PHI - Agregador de Metricas Multi-fonte`).

## Estado n8n

- Antes: `versionId=4839f7da-5548-4ec1-9c58-2f1c2c168475`
- Depois: `versionId=14457c88-d047-41f9-943d-6a32e648e5e0`
- `activeVersionId=412d874b-875c-450e-9792-cf728e95a4a1` preservado
- Workflow continua `active=true`; alteracao feita em draft via MCP `update_workflow`
- Sem publish nesta etapa

## Mudancas aplicadas no draft

Substituidos os 6 pares `Strip target_table` + `BQ Insert` por builders MERGE + BigQuery `executeQuery`:

- `[T28] Build MERGE t28_campaign` -> `[T28] BQ Merge t28_campaign`
- `[T28] Build MERGE t28_adset` -> `[T28] BQ Merge t28_adset`
- `[T28] Build MERGE t28_ga4_landing` -> `[T28] BQ Merge t28_ga4_landing`
- `[T28] Build MERGE t28_gbp_daily` -> `[T28] BQ Merge t28_gbp_daily`
- `[T28] Build MERGE t28_clarity_daily` -> `[T28] BQ Merge t28_clarity_daily`
- `[T28] Build MERGE t28_meta_campaign` -> `[T28] BQ Merge t28_meta_campaign`

Os builders:

- usam `DATASET='phi_dev'` para smoke inicial;
- removem `target_table`;
- retornam `[]` quando nao ha linhas de entrada;
- montam `MERGE` por chave de negocio;
- usam type-map explicito do DDL para `STRING`, `DATE`, `TIMESTAMP`, `INT64`, `FLOAT64`, `BOOL` e `JSON`;
- atualizam todas as colunas nao-chave e inserem todas as colunas.

Os nodes BigQuery:

- usam `operation='executeQuery'`;
- usam `projectId=project-0e7c58d4-656f-49e8-807` (`phi-production`);
- usam `sqlQuery={{ $json._merge_sql }}`;
- mantem `onError=continueErrorOutput` ligado a `[Err] Roteador Payload`.

## Arquivo versionado

Criado `docs/strategic-planning/agregador-t28/ddl/phi_prod_t28_dedup_oneshot.sql` com dedup one-shot para as 6 tabelas `phi_prod.t28_*`, mantendo a linha mais recente por chave de negocio (`ORDER BY ingested_at DESC`).

## Validacao

- `get_node_types` consultado para `n8n-nodes-base.googleBigQuery` v2.1 `executeQuery` e `n8n-nodes-base.code` v2 `runOnceForAllItems`.
- `validate_node_config` PASS para Code node.
- `validate_node_config` retornou warning/erro de displayOptions para `googleBigQuery.sqlQuery`; o mesmo warning aparece no node preexistente `[T28] BQ Read raw_campaign_data`, entao foi tratado como falso positivo do validador MCP para este node.
- `update_workflow` aplicou 30 operacoes atomicas.
- `get_workflow_details` pos-update confirmou conexoes draft com `Filter -> Build MERGE -> BQ Merge` e error outputs dos 6 `BQ Merge` para `[Err] Roteador Payload`.

## Warnings nao introduzidos por L1.6

- `HTTP Request Clarity` com header `Authorization` hardcoded.
- `Loop` com warning em `parameters.batchSize`.
- filtros de Notion com warning de expression em `condition`.
- `AI Agent` com warning de `subnodes`.
- falso positivo do validador para `googleBigQuery.sqlQuery` em executeQuery.

## Smoke pendente

Nao executei smoke manual. Proximo passo: Olavo rodar 2x em `phi_dev`, verificar contagens estaveis e unicidade por chave; depois trocar builders para `phi_prod`, rodar smoke prod, e aplicar o dedup one-shot.
