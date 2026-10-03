# Log de execucao - agregador-t28-l1

- Workflow n8n editado: `4sdG2UKMCBuFq8xn` (`PHI - Agregador de Metricas Multi-fonte`)
- Data: 2026-06-21
- Base local isolada: `cf29d418f6d8be3879a78c592de26d8aa96ae766`
- Workflow pos-edit: `versionId=be446d4f-65d7-4cef-8148-2dfc5f8abfbd`, `active=false`, `nodeCount=62`
- Credencial reutilizada: `Google BigQuery account` (`googleBigQueryOAuth2Api`, id `UhLRAanVarQeOpQy`)

## Pre-flight

- `get_sdk_reference`: lidas as secoes `guidelines` e `design`. A secao `bigquery` nao existe no enum do MCP; BigQuery foi coberto por `search_nodes` + `get_node_types`.
- `get_suggested_nodes`: consultado para `data_persistence`, `data_extraction`, `data_transformation`.
- `search_nodes`: confirmado `n8n-nodes-base.googleBigQuery` v2.1 com operations `executeQuery` e `insert`; `set`, `code`, `http request` tambem conferidos.
- `get_node_types`: lidos `googleBigQuery executeQuery`, `googleBigQuery insert`, `code runOnceForAllItems`, `set manual`, `filter`.
- Notion contexto: pagina `386b65e5c72b811f80cec8d9f1bf9614` lida.

## DDL lido

Arquivo canonico: `docs/strategic-planning/agregador-t28/ddl/phi_dev_t28_tables.sql`.

Tabelas:

- `phi_dev.t28_campaign`: chaves `client_id`, `campaign_id`, `business_date`, `janela`; contexto; metricas Google Ads; KPIs; features Search Terms; bloco audit.
- `phi_dev.t28_adset`: chaves `client_id`, `campaign_id`, `adset_id`, `business_date`, `janela`; metricas adset; KPIs; `criativos_json`; bloco audit.
- `phi_dev.t28_ga4_landing`: `client_id`, `business_date`, `janela`, `canal`, `landing_page`, `source`; metricas GA4; bloco audit.
- `phi_dev.t28_gbp_daily`: `client_id`, `business_date`, `janela`; metricas GBP; bloco audit.
- `phi_dev.t28_clarity_daily`: `client_id`, `business_date`, `janela`; metricas Clarity; bloco audit.
- `phi_dev.t28_meta_campaign`: `client_id`, `campaign_id_meta`, `business_date`, `janela`; metricas Meta; KPIs; `actions_json`; bloco audit.

Views:

- `phi_dev.t28_campaign_d1`
- `phi_dev.t28_campaign_d3`
- `phi_dev.t28_adset_d1`
- `phi_dev.t28_adset_d3`
- `phi_dev.t28_meta_campaign_d1`
- `phi_dev.t28_meta_campaign_d3`

## Mudancas aplicadas

- M1/D4-b: removido `Google Ads Campanhas (GAQL)`; adicionado `[T28] BQ Read raw_campaign_data` com `executeQuery` em `phi_prod.raw_campaign_data`, parametros nomeados `client_id`, `start_date`, `end_date`.
- M2/D5: `Search Terms Checker` preservado; parser/prompt ajustados para classificacao sem texto bruto; adicionado `[T28] Search Terms Features`, que emite somente `pct_brand_terms`, `pct_problem_solving_terms`, `pct_competitor_terms`, `pct_other_terms`.
- M3/D2: `Adaptador Input T28` e `Normalizador T28` atualizados para emitir linhas por `target_table`; adicionados filtros/strips e 6 BigQuery inserts: `t28_campaign`, `t28_adset`, `t28_ga4_landing`, `t28_gbp_daily`, `t28_clarity_daily`, `t28_meta_campaign`.
- M4/ADR-009: bloco audit comum emitido para todas as tabelas: `execution_id`, `source_execution_id`, `versao_contract_aplicada`, `versao_sop_aplicada`, `source_status`, `volume_suficiente`, `ingested_at`.
- M5/SOP v1.0: `calcVolumeSuficiente` implementado no `Normalizador T28`: campanha nova (`<=14d`) exige `conversoesNaJanela >= 50` e `diasDaJanela >= 7`; campanha madura retorna `true`.
- M6/ADR-19: todos os inserts usam dataset `={{ $env.BQ_DATASET || "phi_dev" }}`.

## Validacao MCP

- `update_workflow` primeira escrita: `appliedOperations=15`.
- `update_workflow` segunda escrita: `appliedOperations=36`.
- `get_workflow_details` pos-edit confirmou `active=false`, node `[T28] BQ Read raw_campaign_data`, 6 inserts BQ e conexoes `Normalizador T28 -> Filter -> Strip -> BQ Insert`.
- `prepare_test_pin_data`: executado com sucesso; gerou schemas para testes pinados.

Avisos de validacao retornados pelo MCP:

- Pre-existentes: `HTTP Request Clarity` com header sensivel hardcoded; `Loop.batchSize`; filtros Notion de `Get database anuncios`/`conjuntos`; `AI Agent` sem `subnodes`; trilha legada desativada.
- Novo/limitacao do validador: `[T28] BQ Read raw_campaign_data` reporta que `sqlQuery` so seria permitido com `/options.useLegacySql=true`. A configuracao usa Standard SQL com parametros nomeados, conforme BigQuery moderno e o DDL/query exigidos; trocar para legacy quebraria a query.

## Observacoes

- `Google Ads Conjuntos (GAQL)` e `Google Ads Anuncios (GAQL)` foram preservados.
- A trilha legada continua desativada.
- Search Terms brutos nao sao conectados ao `Merge1` nem ao contract T28; o `Normalizador T28` tambem falha com `D5: search terms brutos não podem persistir em t28_*` se detectar arrays de termos no payload.
- Meta Ads permanece desativado no extrator atual; o insert `t28_meta_campaign` existe e recebera linhas se o extrator voltar a emitir campanhas Meta.

## Proximo

Olavo deve ativar manualmente com `BQ_DATASET=phi_dev` e executar o smoke real descrito no brief.
