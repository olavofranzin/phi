# Log de execucao - Saude Digital L2 Error Handler global

Data: 2026-06-23
Branch: `claude/agentic-agency-planning-KwJEw`

## Entregas versionadas

- DDL criado:
  - `docs/strategic-planning/agregador-t28/ddl/phi_dev_t28_errors.sql`
  - `docs/strategic-planning/agregador-t28/ddl/phi_prod_t28_errors.sql`
- Sub-WF exportado/sanitizado:
  - `workflows/wf-t28-error-handler/generate_export.js`
  - `workflows/wf-t28-error-handler/workflow.json`
  - `workflows/wf-t28-error-handler/sandbox_export.json`
- Teste estrutural:
  - `onboarding/saude_digital_l2_tests.ps1`

## n8n

- Sub-WF criado: `WF-T28-Error-Handler`
- workflowId: `rTS5pE34eElfuMPl`
- URL: `https://n8n-n8n-editor.1unqx7.easypanel.host/workflow/rTS5pE34eElfuMPl`
- Projeto: `Olavo Franzin <olavofranzin@franzcomunicacao.com>` (personal)
- versionId inicial: `b3e71455-a273-47f9-92ea-ca8bc7a30abd`
- active: `false`

Credenciais auto-atribuídas pelo MCP:

- `[ErrHdl] BQ Insert t28_errors` -> `Google BigQuery account`
- `[ErrHdl] Notion Criar Tarefa Demanda` -> `Notion account`
- `[ErrHdl] Telegram Notificar` -> `Telegram account`

Observacao: o export git mantem `<TELEGRAM_CHAT_ID_redacted>`. No live n8n, o node
`[ErrHdl] Telegram Notificar` foi ajustado com o chat_id operacional ja
documentado no historico do projeto. O valor nao foi regravado neste log.

## Agregador T28

- Workflow alvo: `4sdG2UKMCBuFq8xn`
- Draft versionId pos-edit F3: `7cb1aa76-53e0-47fe-9a2d-443008ff7712`
- Draft versionId pos-edit F4: `ae0e79af-753f-452c-9b05-c7866dbd7197`
- Draft versionId pos-edit A02: `a35e1d56-046c-4d31-b61b-f4e0fadedb49`
- activeVersionId permanece: `66997885-de29-4761-8e46-c034475ad321`
- Nodes adicionados:
  - `[Err] Roteador Payload`
  - `[Err] Call Handler`
- Error outputs conectados ao roteador para:
  - `[T28] BQ Read raw_campaign_data`
  - `[T28] BQ Insert t28_campaign`
  - `[T28] BQ Insert t28_adset`
  - `[T28] BQ Insert t28_ga4_landing`
  - `[T28] BQ Insert t28_gbp_daily`
  - `[T28] BQ Insert t28_clarity_daily`
  - `[T28] BQ Insert t28_meta_campaign`
  - `HTTP Request GA4 Orgânico`
  - `HTTP Request GA4 Pago (LPs)`
  - `HTTP Request GBP`
  - `HTTP Request Clarity`
  - `Google Ads Conjuntos (GAQL)`
  - `Google Ads Anúncios (GAQL)`
  - `Adaptador Input T28`
  - `Normalizador T28`
- F4 concluido no `Adaptador Input T28`:
  - `safe()` removido do jsCode.
  - `readOrThrow` aplicado nas fontes estruturais: `Set dados`, `Get database campanhas`, `Get database clientes`, `Code prepara datas para extracao`, `[T28] BQ Read raw_campaign_data`, `HTTP Request GA4 Organico`, `HTTP Request GA4 Pago (LPs)`, `HTTP Request GBP`, `HTTP Request Clarity`.
  - `safeOptional` aplicado nas fontes opcionais: `Get database conjuntos`, `Get database anuncios`, `Google Ads Conjuntos (GAQL)`, `Google Ads Anuncios (GAQL)`, `Fetch Meta Ads`, `[T28] Search Terms Features`.
  - Topologia preservada: `nodeCount=62`, `connections` inalteradas, unico node alterado = `Adaptador Input T28`.
- A02 aplicado no `[Err] Roteador Payload`:
  - Adicionado `safeGetNodeJson(name)` para evitar excecao `NodeNotExecuted` ao ler `Set dados` / `Code prepara datas para extracao`.
  - `sourceFor(nodeName)` passa a testar `bq` antes de `ga4`, evitando classificar `[T28] BQ Insert t28_ga4_landing` como `ga4`.
  - Topologia preservada: `nodeCount=62`, `connections` inalteradas, unico node alterado = `[Err] Roteador Payload`.

## Validacoes executadas

- `validate_node_config` nos nodes novos do sub-WF: PASS
- `validate_workflow` do SDK do sub-WF: PASS sem warnings na versao final
- `create_workflow_from_code`: PASS, workflow `rTS5pE34eElfuMPl`
- Teste local: `powershell -ExecutionPolicy Bypass -File onboarding\saude_digital_l2_tests.ps1`
  - Resultado: `Saude Digital L2 structural tests passed.`
- `test_workflow` pinado do sub-WF:
  - A chamada MCP retornou timeout, mas a execucao n8n `10147` foi registrada como `success`.
  - Nodes executados com pin data: Trigger -> Set Contexto -> BQ Insert pinado + Notion pinado -> Telegram pinado.
- `validate_node_config` no `Adaptador Input T28` modificado: PASS.
- Check pos-F4 no workflow vivo:
  - `safe(` ausente no jsCode.
  - `readOrThrow` e `safeOptional` presentes antes das leituras do adaptador.
  - `update_workflow` aplicou 1 operacao (`updateNodeParameters`) e manteve `nodeCount=62`.
- `validate_node_config` no `[Err] Roteador Payload` modificado: PASS.
- Teste local A02 do roteador:
  - RED antes do fix: `NodeNotExecuted: Set dados`.
  - GREEN depois do fix: `A02_ROUTER_TEST_PASS`.
  - Cenario coberto: `[T28] BQ Insert t28_ga4_landing` retorna `source='bq'` e `client_id/business_date=null` quando os nodes de contexto nao foram executados.
- Check pos-A02 no workflow vivo:
  - `safeGetNodeJson` presente.
  - `bq` avaliado antes de `ga4`.
  - `update_workflow` aplicou 1 operacao (`updateNodeParameters`) e manteve `nodeCount=62`.
  - `get_workflow_details` confirmou `connections` inalteradas e unico node alterado = `[Err] Roteador Payload`.

## a03 - fix smoke triste

Data: 2026-06-27

Contexto: smoke triste real das execucoes `11372` (Agregador `4sdG2UKMCBuFq8xn`)
e `11373` (sub-WF `rTS5pE34eElfuMPl`) mostrou 429 do GBP exercitando o
Error Handler end-to-end, mas com `node_name='unknown'`, `source='other'`
e falha posterior de tipo em `error_details` quando o erro nasceu de Code node.

Alteracoes aplicadas no n8n:

- Sub-WF `WF-T28-Error-Handler` (`rTS5pE34eElfuMPl`):
  - Draft versionId pos-edit a03: `31307f4d-843d-4f96-ab75-f9d552bc2e40`
  - activeVersionId permanece: `81f56a35-022a-43a6-9026-f2bd5cc04728`
  - `[ErrHdl] Execute Workflow Trigger`: input `error_details` alterado de `object` para `string`.
  - `[ErrHdl] Set Contexto`: `detailsStr` evita double-stringify quando `error_details` ja chega como string JSON; `payload.error_details` e `demanda_observacoes` usam `detailsStr`.
- Agregador T28 (`4sdG2UKMCBuFq8xn`):
  - Draft versionId pos-edit a03: `fe173cdd-b7bc-4d11-aee2-5221eb780519`
  - activeVersionId permanece: `66997885-de29-4761-8e46-c034475ad321`
  - `[Err] Roteador Payload`: adiciona `$prevNode?.name` como fallback de `node_name`.
  - `[Err] Roteador Payload`: `source` passa a derivar de `sourceFromName(nodeName) || sourceFromError(j)`.
  - `[Err] Roteador Payload`: `error_details` agora trafega como `JSON.stringify(j)`.
  - Retry 3x/2s aplicado nos 6 HTTP estruturais: `HTTP Request GA4 Organico`, `HTTP Request GA4 Pago (LPs)`, `HTTP Request GBP`, `HTTP Request Clarity`, `Google Ads Conjuntos (GAQL)`, `Google Ads Anuncios (GAQL)`.
  - `onError: continueErrorOutput` preservado nesses 6 nodes.

Validacoes a03 executadas:

- `get_node_types` consultado para `executeWorkflowTrigger`, `httpRequest` e `code` modo `runOnceForAllItems`.
- `validate_node_config` nos 3 nodes alterados: PASS.
- `update_workflow` sub-WF: PASS, 2 operacoes aplicadas, sem warnings.
- `update_workflow` agregador: PASS, 7 operacoes aplicadas.
- Teste local RED antes do fix: roteador antigo retornava `source='other'` para erro GBP quando `nodeName='unknown'`.
- Teste local GREEN apos fix: `A03_LOCAL_GREEN_PASS` para fallback GBP por description e ausencia de double-stringify.
- `get_workflow_details` pos-edit confirmou:
  - trigger do sub-WF com `error_details` type `string`;
  - Set Contexto usando `detailsStr`;
  - novos versionIds de draft;
  - sem publicacao nesta rodada.

Nota: `$prevNode` segue experimental neste fan-in de error output. O smoke a03 deve
confirmar se resolve `node_name`; se ainda vier `unknown`, a04 deve avaliar stamps por node.

Warnings preexistentes retornados pelo `update_workflow` do agregador:

- `HTTP Request Clarity` com header `Authorization` hardcoded.
- `Loop` batchSize reportado como nao expressao.
- filtros Notion em `Get database anuncios` / `Get database conjuntos` reportados como invalidos.
- `AI Agent` disabled sem subnodes.
- `[T28] BQ Read raw_campaign_data` warning `sqlQuery` vs displayOptions.
## Warnings / pendencias

1. DDL `t28_errors` foi versionado, mas nao foi aplicado diretamente no BigQuery por este agente.
2. Smoke real feliz/triste nao foi executado; apenas teste pinado sem side effects reais.
3. O roteador unico ainda depende de o error output do n8n carregar `error.node.name`, `node.name`, `nodeName` ou `node_name` para preencher `node_name`; A02 removeu a excecao `NodeNotExecuted`, mas o smoke triste real ainda precisa confirmar que `node_name` nao chega `unknown`.
4. Warnings de validacao do agregador pos-edit:
   - `HTTP Request Clarity` tem header `Authorization` hardcoded (preexistente).
   - `Loop` batchSize reportado como nao expressao (preexistente).
   - filtros Notion em `Get database anuncios` / `Get database conjuntos` reportados como invalidos (preexistente).
   - `AI Agent` disabled sem subnodes (preexistente).
   - `[T28] BQ Read raw_campaign_data` warning `sqlQuery` vs displayOptions (ja observado no L1).

## Proximo passo recomendado

1. Aplicar DDL `phi_prod_t28_errors.sql` no BigQuery.
2. Rodar smoke triste controlado no BQ Read e verificar se `node_name` chega preenchido.
3. Depois da pre-revisao, publicar `WF-T28-Error-Handler` e publicar a draft do agregador.
