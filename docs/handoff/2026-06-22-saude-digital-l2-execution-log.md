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

## a04 - deduplicacao cadeia de erro

Data: 2026-06-27

Contexto: pre-revisao apos a03 identificou duas cadeias paralelas de error handling
no Agregador. A cadeia canonica tinha o Roteador a03, mas 8 nodes criticos ainda
apontavam para `[Err] Roteador Payload1` + `[Err] Call Handler1` com contrato a02.
Tambem havia mapping/schema antigo no `[Err] Call Handler` canonico para
`error_details`.

Alteracoes aplicadas no n8n:

- Agregador T28 (`4sdG2UKMCBuFq8xn`):
  - Draft versionId pos-edit a04: `ae1b3964-e49f-42d4-becc-50b83b2e7671`
  - activeVersionId permanece: `66997885-de29-4761-8e46-c034475ad321`
  - Rewire dos 8 nodes para `[Err] Roteador Payload`: `Adaptador Input T28`, `Normalizador T28`, `[T28] BQ Insert t28_campaign`, `[T28] BQ Insert t28_adset`, `[T28] BQ Insert t28_ga4_landing`, `[T28] BQ Insert t28_gbp_daily`, `[T28] BQ Insert t28_clarity_daily`, `[T28] BQ Insert t28_meta_campaign`.
  - Removidos os duplicados `[Err] Roteador Payload1` e `[Err] Call Handler1`.
  - `[Err] Call Handler`: mapping corrigido para `error_details = ={{ $json.error_details }}`.
  - `[Err] Call Handler`: schema `error_details` corrigido para `type: string`.
  - Node count pos-edit: `62`.
- Sub-WF `WF-T28-Error-Handler` (`rTS5pE34eElfuMPl`):
  - Publicado o draft a03/a04-compatible.
  - Novo activeVersionId: `31307f4d-843d-4f96-ab75-f9d552bc2e40`.

Validacoes a04 executadas:

- `validate_node_config` do `[Err] Call Handler` corrigido: PASS.
- `update_workflow` do Agregador: PASS, 11 operacoes aplicadas.
- `publish_workflow` do sub-WF: PASS, activeVersionId `31307f4d-843d-4f96-ab75-f9d552bc2e40`.
- `get_workflow_details` pos-edit confirmou:
  - apenas 1 conexao canonica `[Err] Roteador Payload` -> `[Err] Call Handler`;
  - 15 error outputs apontando para `[Err] Roteador Payload`: `HTTP Request GBP`, `HTTP Request GA4 Organico`, `HTTP Request GA4 Pago (LPs)`, `HTTP Request Clarity`, `Google Ads Conjuntos (GAQL)`, `Google Ads Anuncios (GAQL)`, `[T28] BQ Read raw_campaign_data`, `Adaptador Input T28`, `Normalizador T28`, `[T28] BQ Insert t28_campaign`, `[T28] BQ Insert t28_adset`, `[T28] BQ Insert t28_ga4_landing`, `[T28] BQ Insert t28_gbp_daily`, `[T28] BQ Insert t28_clarity_daily`, `[T28] BQ Insert t28_meta_campaign`;
  - sub-WF com `activeVersionId` igual a versao cujo trigger usa `error_details` type `string`;
  - sem publicacao do Agregador nesta rodada.

Warnings preexistentes retornados pelo `update_workflow` do Agregador:

- `HTTP Request Clarity` com header `Authorization` hardcoded.
- `Loop` batchSize reportado como nao expressao.
- filtros Notion em `Get database anuncios` / `Get database conjuntos` reportados como invalidos.
- `AI Agent` disabled sem subnodes.
- `[T28] BQ Read raw_campaign_data` warning `sqlQuery` vs displayOptions.

## a05 - truncar Notion + Call Handler best-effort + errMessage string

Data: 2026-06-27

Contexto: revisao pos-a04 identificou tres ajustes residuais no fluxo global de erro:
risco de body Notion acima do limite de 2000 caracteres, propagacao de erro caso o
sub-WF falhe dentro do `[Err] Call Handler`, e perda de mensagem quando `j.error`
chega como string no `[Err] Roteador Payload`.

Alteracoes aplicadas no n8n:

- Sub-WF `WF-T28-Error-Handler` (`rTS5pE34eElfuMPl`):
  - `[ErrHdl] Set Contexto`: adiciona `error_details_block = detailsStr.slice(0, 1800)`.
  - `[ErrHdl] Notion Criar Tarefa Demanda`: bloco JSON passa a usar `$json.error_details_block`.
  - Sub-WF publicado apos o fix.
  - Novo activeVersionId: `5ce0bf17-f176-40cb-9814-12473d43064c`.
- Agregador T28 (`4sdG2UKMCBuFq8xn`):
  - Draft versionId pos-edit a05: `c2da5d62-b7b2-4107-8468-dc9585a18297`.
  - activeVersionId permanece: `66997885-de29-4761-8e46-c034475ad321`.
  - `[Err] Call Handler`: `onError` ajustado para `continueRegularOutput`.
  - `[Err] Roteador Payload`: `errMessage` passa a preservar `j.error` quando vier como string.
  - `[Err] Roteador Payload`: mantido texto UTF-8 real em `Code prepara datas para extração`.
  - `Adaptador Input T28` nao foi alterado nesta rodada.

Validacoes a05 executadas:

- Teste local RED/GREEN:
  - RED: implementacao antiga retornava `unknown` para `{ error: "Adaptador Input T28: fonte estrutural ausente" }`.
  - GREEN: implementacao nova preserva a mensagem string.
  - RED: bloco Notion antigo com `error_details` de 3296 caracteres gerava 3304 caracteres.
  - GREEN: bloco Notion novo com `error_details_block` gera 1808 caracteres.
- `validate_node_config` no `[ErrHdl] Set Contexto` modificado: PASS.
- `validate_node_config` no `[Err] Roteador Payload` modificado: PASS.
- `update_workflow` do sub-WF: PASS, 2 operacoes aplicadas.
- `update_workflow` do Agregador: PASS, 2 operacoes aplicadas.
- `publish_workflow` do sub-WF: PASS, activeVersionId `5ce0bf17-f176-40cb-9814-12473d43064c`.
- Check de mojibake no Roteador pos-edit: zero ocorrencias do marcador de mojibake proibido; texto alvo preservado como `Code prepara datas para extração`.

Warnings preexistentes retornados pelo `update_workflow` do Agregador:

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


## a05 + hotfix rename (2026-06-27)

Estado encontrado: o a05 (P1 errMessage string, R1 Call Handler `onError:
continueRegularOutput`, B1 truncar corpo Notion) ja estava implementado E
PUBLICADO no Agregador (`4sdG2UKMCBuFq8xn`) e no sub-WF `rTS5pE34eElfuMPl`.

Smoke do Adaptador falhou: `Referenced node doesn't exist [line 81]`.
Causa-raiz: NAO era mojibake (`Ã`) — era o acento ACHATADO para ASCII na
referencia `$('Code prepara datas para extracao')` (linha 97) enquanto o node
se chamava `Code prepara datas para extração` (com ç/ã). A linha 48 do
Adaptador tambem tinha mojibake `'Data de InÃ­cio'`.

Correcao do Adaptador (Olavo, manual no editor n8n): renomeou o node
`Code prepara datas para extração` -> `Code prepara datas para extracao`
(ASCII, sem ç/ã) e corrigiu a linha 48 -> `Data de Início`. O rename do n8n
auto-propagou a nova referencia para 8 nodes (`Adaptador Input T28`,
`[T28] BQ Read raw_campaign_data`, `HTTP Request GBP`, `HTTP Request GA4 Pago (LPs)`,
`Google Ads Conjuntos (GAQL)`, `Google Ads Anúncios (GAQL)`,
`HTTP Request GA4 Orgânico`, `Fetch Meta Ads`).

Orfao remanescente (corrigido por Claude via `update_workflow`): o
`[Err] Roteador Payload` referenciava o nome ANTIGO acentuado dentro de
`safeGetNodeJson('Code prepara datas para extração')` (linha 48). O renomeador
do n8n nao detecta refs indiretas (string passada para funcao custom), entao
ficou orfa -> retornava `null` em `business_date` (nao-fatal, mas perde a data
nos logs de `t28_errors`). Fix: jsCode do Roteador setado com a ref em ASCII
`'Code prepara datas para extracao'`. Pos-edit verificado: ZERO bytes
nao-ASCII no Roteador; nenhuma ref ao nome antigo no workflow (so sobra o
comentario `// Janelas de extração` dentro do proprio node de datas).

Versionid pos-fix:
- Agregador DRAFT: `276e7e22-7b3b-4b55-840e-dfbb5d8e7c6b` (Adaptador rename +
  a05 + Roteador orfao corrigido — limpo).
- Agregador ACTIVE: `fad66104-45c4-4a11-8991-9dcd20892209` (mesma coisa, mas
  ainda com o orfao do Roteador — nao-fatal; sera substituido no publish pos-smoke).

Proximo passo: smoke a05 no DRAFT (Execute Workflow manual). Se verde ->
publish do Agregador -> L2 fecha.

## l2cirurgico - Adaptador resiliente (2026-06-27)

Contexto: execucao real `11655` terminou `success` no n8n, mas o node
`Adaptador Input T28` saiu pelo error output com `Cannot read properties of
undefined (reading 'json') [line 81]`. O brief executado foi
`docs/handoff/2026-06-27-saude-digital-l2-codex-l2cirurgico-brief.md`.

Alteracoes aplicadas no Agregador T28 (`4sdG2UKMCBuFq8xn`):

- `Adaptador Input T28`:
  - adicionados helpers `nodeFirst`, `nodeAll` e `optionalSource`;
  - removidos acessos `.item.json` e `.first().json`;
  - mantidas como fatais apenas as fontes core: `Set dados`, `Get database campanhas`,
    `Get database clientes`, `Code prepara datas para extracao` e
    `[T28] BQ Read raw_campaign_data`;
  - `HTTP Request GA4 Organico`, `HTTP Request GA4 Pago (LPs)`, `HTTP Request GBP`,
    `HTTP Request Clarity`, GAQL/Meta/Search Terms passam por `optionalSource`;
  - output passa a incluir `source_status`.
- `Normalizador T28`:
  - `source_status` do Adaptador passa a ser considerado na coluna JSON;
  - fonte ausente/erro em `gbp` -> zero linhas em `t28_gbp_daily`;
  - fonte ausente/erro em `clarity` -> zero linhas em `t28_clarity_daily`;
  - fonte ausente/erro em `ga4_organic` ou `ga4_paid` -> zero linhas daquele canal em
    `t28_ga4_landing`.

Aplicacao:

- Tentativa preferida via MCP `update_workflow` foi evitada para nao colar 20KB de
  jsCode pelo chat e reintroduzir risco de encoding.
- API publica n8n `PATCH` nao existe (`405 Method Not Allowed`).
- API publica n8n `PUT` foi testada com no-op antes da escrita real; body valido:
  `name`, `nodes`, `connections`, `settings: {}`.
- Escrita real aplicada via `PUT /api/v1/workflows/4sdG2UKMCBuFq8xn`, alterando
  somente `parameters.jsCode` dos nodes `Adaptador Input T28` e `Normalizador T28`.
- Observacao importante: embora nao tenha sido chamado `publish_workflow`, o PUT da
  API publica atualizou `versionId` e `activeVersionId` juntos. Portanto a alteracao
  esta ativa no workflow.

VersionIds pos-edit:

- Agregador `versionId`: `412d874b-875c-450e-9792-cf728e95a4a1`
- Agregador `activeVersionId`: `412d874b-875c-450e-9792-cf728e95a4a1`
- Sub-WF Error Handler nao alterado: `rTS5pE34eElfuMPl`

Validacoes executadas:

- Reexport live salvo em `tmp/agregador_after_l2cirurgico.json`.
- `node --check` PASS no jsCode live reexportado do `Adaptador Input T28`.
- `node --check` PASS no jsCode live reexportado do `Normalizador T28`.
- Verificacao estrutural live:
  - `Adaptador Input T28`: `.item.json=0`, `.first().json=0`;
  - helpers `nodeFirst`, `nodeAll`, `optionalSource` presentes;
  - `source_status` presente no output;
  - `readOrThrow('HTTP Request GA4...')`, `readOrThrow('HTTP Request GBP')` e
    `readOrThrow('HTTP Request Clarity')` ausentes;
  - zero U+00C3 e zero U+FFFD no jsCode live.
- `Normalizador T28`: `sourceAvailable` presente, `source_status` presente, zero
  U+00C3 e zero U+FFFD no jsCode live.
- `get_workflow_details` pos-edit confirmou `nodeCount=62`, `settings` preservado
  como `executionOrder=v1`, `availableInMCP=true`, `binaryMode=separate`.

Nao executado:

- Smoke manual feliz/triste. Proximo passo continua sendo executar o workflow e
  conferir counts esperados + comportamento com GBP/Clarity/GA4 ausente.

## Smoke l2cirurgico - exec 11755 PASS (2026-06-28)

Smoke do L2 cirurgico na versao ativa `412d874b`. Mode manual, status `success`.

Resultado (contagem real do Normalizador, sem truncamento):
- t28_campaign = 12 (2 campanhas GADS-21149189736 + GADS-21116045403 x 6 datas)
- t28_adset = 0 (PMAX, esperado)
- t28_ga4_landing = 2 (organic + paid)
- t28_gbp_daily = 0  <- GBP falhou de verdade nesta run
- t28_clarity_daily = 0  <- Clarity falhou de verdade nesta run
- t28_meta_campaign = 0 (sem campanha Meta)

source_status emitido pelo Adaptador (gravado em cada linha, coluna JSON):
`{"gaql_adsets":"ok","gaql_ads":"ok","meta":"ok","ga4_organic":"ok",
"ga4_paid":"ok","gbp":"missing","clarity":"missing","search_terms":"error"}`

Veredito: PASS — e a resiliencia foi provada ORGANICAMENTE (nao precisou
forcar erro: GBP e Clarity cairam sozinhos). Comportamento exatamente como
projetado:
- Adaptador concluiu `success` SEM error output (main[1] vazio) -> o crash de
  11655 esta morto;
- GBP+Clarity caindo degradaram SO `t28_gbp_daily`/`t28_clarity_daily` para 0;
  `t28_campaign`=12 e `t28_ga4_landing`=2 escritos normalmente (um 429 nao
  derruba mais a agregacao inteira);
- cadeia de erro (`[Err] Roteador` + `[Err] Call Handler`) executou logando os
  erros; Call Handler best-effort nao cascateou; run final `success`;
- KPIs coerentes (ex.: GADS-21116045403 22/06: imp 1605, clk 43, cost 44.52,
  conv 9, CPA 4.95, ROAS 0.1123).

Pre-revisao Claude independente (pre-smoke) deu PASS: zero `.item.json`/
`.first().json`; helpers presentes; so 5 fontes core em readOrThrow; GBP/
Clarity/GA4 em optionalSource; refs acentuados preservados (`GA4 Organico`,
`Anuncios`); zero mojibake; fix do Roteador (ref ASCII) e cadeia a04/a05
sobreviveram ao PUT da API publica.

Observacoes (deferidas, nao bloqueiam L2):
- GBP+Clarity caindo: STAND-BY (decisao Olavo 2026-06-28). Se persistir,
  investigar causa. Ate la, as 2 tabelas ficam vazias.
- search_terms=error: item GAQL "Bad request" ja conhecido/deferido.
- campaign_name=null (property Notion nao lida) + landing_page da campanha 1
  aplicado a campanha 2 (mis-atribuicao multi-campanha = Task 3 deferida;
  campaign_id por linha esta CORRETO).
- Idempotencia: inserts append-only -> este smoke gravou +12 t28_campaign;
  re-runs duplicam (lote L1.6).

L2 fechado. ESTADO §3.8 -> Concluido; §5 +2 pendencias; §13 v0.1.42.
