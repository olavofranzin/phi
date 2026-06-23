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

## Warnings / pendencias

1. DDL `t28_errors` foi versionado, mas nao foi aplicado diretamente no BigQuery por este agente.
2. Smoke real feliz/triste nao foi executado; apenas teste pinado sem side effects reais.
3. O roteador unico depende de o error output do n8n carregar `error.node.name`, `node.name`, `nodeName` ou `node_name`. Se o smoke mostrar `node_name=unknown`, substituir por Set/Code por fonte ou enriquecer payload antes do roteador.
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
