# Metricas de Anuncios - Execution Log

Data: 2026-07-01
Branch: claude/agentic-agency-planning-KwJEw
Workflow: sw metricas anuncios
WorkflowId: vVAdXAJh6MW2Z5Hp
Brief: docs/handoff/2026-06-30-metricas-anuncios-codex-brief.md
Fonte de implementacao: docs/handoff/2026-06-30-metricas-anuncios-implementacao.md

## Estado inicial observado

- name: sw metricas anuncios
- workflowId: vVAdXAJh6MW2Z5Hp
- versionId antes: 789ef6c5-426f-49fd-9f86-6db58d326371
- active antes: true
- activeVersionId antes: 789ef6c5-426f-49fd-9f86-6db58d326371
- nodeCount antes: 36

Observacao: o brief dizia `active:false`, mas o estado live do n8n estava `active:true`.
O workflow foi despublicado ao final para cumprir a restricao de permanecer inactive
ate smoke verde.

## Mudancas aplicadas no n8n

Batch MCP `update_workflow`, 13 operacoes atomicas:

- Adicionado node ASCII `Normalizar Trigger` entre `Schedule Trigger` e `Get database anuncios`.
- Adicionado node ASCII `Dedup page_id` entre `Get database anuncios` e `Loop Over Items`.
- Adicionado node ASCII `IF Gate PMAX` entre `Code Montar SQL` e `Execute SQL inserir daily entry`.
- Atualizado `Code Montar SQL` para MERGE idempotente em `phi_dev.raw_ad_data`.
- `Code Montar SQL` agora retorna `_bq_sql=''`, `_skip_ingestion=true` e `_skip_reason` quando nao ha `ad_id` ou `campaign_id`.
- Removida conexao `Schedule Trigger` -> `Get database anuncios`.
- Adicionadas conexoes `Schedule Trigger` -> `Normalizar Trigger` -> `Get database anuncios`.
- Removida conexao `Get database anuncios` -> `Loop Over Items`.
- Adicionadas conexoes `Get database anuncios` -> `Dedup page_id` -> `Loop Over Items`.
- Removida conexao `Code Montar SQL` -> `Execute SQL inserir daily entry`.
- Adicionadas conexoes `Code Montar SQL` -> `IF Gate PMAX` -> `Execute SQL inserir daily entry` no output true.

Ja estavam no estado live antes deste patch:

- `Code Calcula Metricas` ja fazia fan-out para `Code Recupera Metas p Comparacao` e `Code Montar SQL`.
- `Update a database page` ja retornava para `Loop Over Items`.
- `Code Preparar Payload de Observacao` ja apontava direto para `Create a database page Create Observation`.
- `Code Debug` nao apareceu no grafo live.
- No node `Create a database page Create Observation`, nao apareceu referencia a `Code prepara contexto para observacao`; o campo de relation visivel para anuncio ja usava `Loop Over Items`.

## Estado final confirmado

- versionId depois: 34cf5a6a-7849-4ef4-9abd-8ad262ecb013
- active depois: false
- activeVersionId depois: null
- nodeCount depois: 39
- publish/activate: nao executado
- unpublish: executado porque o workflow estava ativo antes do patch

Conexoes finais relevantes confirmadas via `get_workflow_details`:

- `Schedule Trigger` -> `Normalizar Trigger`
- `Normalizar Trigger` -> `Get database anuncios`
- `Get database anuncios` -> `Dedup page_id`
- `Dedup page_id` -> `Loop Over Items`
- `Code Calcula Metricas` -> `Code Recupera Metas p Comparacao`
- `Code Calcula Metricas` -> `Code Montar SQL`
- `Code Montar SQL` -> `IF Gate PMAX`
- `IF Gate PMAX` true -> `Execute SQL inserir daily entry`
- `Update a database page` -> `Loop Over Items`

## Validacao

- `validate_node_config` PASS para `Normalizar Trigger`.
- `validate_node_config` PASS para `Dedup page_id`.
- `validate_node_config` PASS para `IF Gate PMAX`.
- `validate_node_config` PASS para `Code Montar SQL`.
- `update_workflow` aceitou o batch e retornou `appliedOperations=13`.
- `get_workflow_details` confirmou os novos nodes e o novo `versionId`.
- `get_workflow_details` confirmou `active=false` e `activeVersionId=null`.

Avisos do validador MCP apos update:

- `Execute SQL inserir daily entry`: aviso de expression prefix em `sqlQuery`.
- `BigQuery Serie Diaria`: aviso de expression prefix em `sqlQuery`.
- `Create a database page Create Observation`: aviso de schema Notion (`resource=databasePage` esperado pelo node live, mas o validador MCP esperava `block`).
- `Execute SQL inserir daily entry` e `BigQuery Serie Diaria`: falso positivo conhecido de BigQuery `executeQuery` com `useLegacySql=false`.

Esses avisos sao de nodes preexistentes e/ou do validador MCP; o batch foi aplicado.

## Guard de mojibake

Auditoria visual no payload de `get_workflow_details`:

- Novos nodes ASCII: `Normalizar Trigger`, `Dedup page_id`, `IF Gate PMAX`.
- Nomes criticos preservados no grafo: `Code Calcula Metricas`, `Code Preparar Payload de Observacao`, `Code Unificar Periodos (D1, 3D, 7D)` aparecem com seus acentos no n8n.
- Observacao: ja havia U+FFFD em comentarios antigos do node `Code Valida Dados` antes deste patch. Nao foi alterado por esta entrega.

## Smoke

Nao executado por Codex.

Motivo:

- O brief atribui a Olavo a execucao de `phi_dev_raw_ad_data.sql` antes do smoke.
- Sem a confirmacao da tabela `phi_dev.raw_ad_data`, executar o workflow poderia falhar no BigQuery.

Pendencias para smoke:

- Olavo rodar `docs/strategic-planning/agregador-t28/ddl/phi_dev_raw_ad_data.sql`.
- Rodar subworkflow/orquestrador para cliente com anuncios Google nao-PMAX.
- Olavo rodar `docs/strategic-planning/agregador-t28/ddl/phi_dev_raw_ad_data_smoke.sql`.
- Registrar resultados V1-V5, contagem de linhas e prova de idempotencia.

## Fora de escopo respeitado

- Nenhuma promocao para `phi_prod`.
- Nenhuma troca de `phi_dev` para `phi_prod`.
- Nenhuma ativacao/publicacao.
- Nenhuma mudanca de credencial.

## Smoke complementar apos DDL

Executado por Codex apos Olavo confirmar que `phi_dev_raw_ad_data.sql` foi rodado.

### Tentativa 1

- Orquestrador: `operador unico metricas` (`cLcimNoefTOnVVbd`)
- ExecutionId orquestrador: `12812`
- ExecutionId anuncios: `12815`
- Status anuncios: `error`
- Causa: `Code Montar SQL` estava em `runOnceForEachItem`, mas o codigo usava `$input.first()`.
- Correcao aplicada: `Code Montar SQL.parameters.mode = runOnceForAllItems`.

### Tentativa 2

- ExecutionId orquestrador: `12817`
- ExecutionId campanhas: `12818` (`success`)
- ExecutionId conjuntos: `12819` (`success`)
- ExecutionId anuncios: `12820` (`success`)
- Observacao: o workflow processou 2 anuncios PMAX unicos, sem multiplicacao.
- Falha funcional detectada: `Code Montar SQL` gerou `_bq_sql` para 2 anuncios PMAX porque usava fallback de ids do Notion quando a GAQL vinha vazia.
- Impacto: `Execute SQL inserir daily entry` executou 2 MERGEs em `phi_dev.raw_ad_data`.
- Correcao aplicada: `Code Montar SQL` passou a exigir ids vindos da GAQL (`campaign.id`, `ad_group.id`, `ad_group_ad.ad.id`) antes de gerar SQL. Se ausentes, retorna `_bq_sql=''` e `_skip_ingestion=true`.

Limpeza necessaria em `phi_dev` antes do smoke SQL V1-V5:

```sql
DELETE FROM `project-0e7c58d4-656f-49e8-807.phi_dev.raw_ad_data`
WHERE execution_id IN ('EXEC-DE-20260701020621', 'EXEC-DE-20260701020634')
  AND date = DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY);
```

### Tentativa 3

- ExecutionId orquestrador: `12821`
- ExecutionId campanhas: `12822` (`success`)
- ExecutionId conjuntos: `12823` (`success`)
- ExecutionId anuncios: `12824` (`success`)
- `Code Montar SQL`: 2 runs, ambos com `_bq_sql=''`, `_skip_ingestion=true`, `_skip_reason='sem_ad_id (PMAX ou GAQL vazia)'`.
- `IF Gate PMAX`: 2 runs, output true vazio e output false com 1 item em cada run.
- `Execute SQL inserir daily entry`: nao executou na `12824`.
- Resultado PMAX: 0 MERGEs novos na execucao final, sem erro.

Pendencias para smoke BQ:

- Olavo rodar o DELETE de limpeza acima, porque a tentativa `12820` contaminou `phi_dev.raw_ad_data` com 2 linhas PMAX antes da correcao final.
- Olavo rodar `docs/strategic-planning/agregador-t28/ddl/phi_dev_raw_ad_data_smoke.sql`.
- Cliente/anuncio Google nao-PMAX nao foi encontrado nesta execucao; os anuncios `Iniciado` observados eram PMAX. Portanto V1-V4/V2 com dados reais nao foram comprovados por Codex, apenas o caminho PMAX/skip e a deduplicacao operacional.
