# A.6c - Implementacao do ADR-010 (Opcao A)

Status desta execucao: **JSONs reconciliados no repo, commitados nesta sessao, publicacao remota ainda bloqueada por erro 500 no endpoint de update do n8n**.

Commit de reconciliacao dos JSONs:

- `bc5ee0d` - `A6c commit ADR-010 workflow JSON patches`
- branch remota atualizada ate `88cab10` em `claude/agentic-agency-planning-KwJEw`

## 1. Audit do filtro `ingestion_step`

Resultado do passo 1: **bifurcacao (a)**. Nao foi encontrado filtro downstream por `ingestion_step = 'DAILY_ENTRY'` no escopo auditado.

Escopo auditado:

- `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`)
- `PHI - Fase 2 Calculo Score`
- `PHI - Fase 3 Operacional`
- `phi-production`

Evidencia:

- Busca por `ingestion_step`, `DAILY_ENTRY` e `GADS_INSERT` nos SQLs consumidores retornou sem matches relevantes.
- A unica escrita relevante encontrada para `ingestion_step='GADS_INSERT'` segue no subworkflow `PHI - Subworkflow Campanhas`, no no `Execute SQL  INSERT raw_campaign_data`.

Conclusao:

- A suspeita de filtro downstream por `ingestion_step='DAILY_ENTRY'` foi falsa.
- Nao houve remocao de query consumidora nesta entrega.

## 2. Decisao sobre `client_config sync`

Decisao: **manter no subworkflow**.

Justificativa:

- O no `Execute SQL client_config sincronizado` atualiza `phi_prod.client_config.primary_metric_type`.
- `primary_metric_type` e usado downstream em consultas do proprio pipeline e em consumidores operacionais.
- O subworkflow continua existindo legitimamente pelo ADR-010 para lookup Notion, fetch de goal e sync operacional.
- Mover esse side effect nesta mesma entrega aumentaria a superficie de regressao sem ganho claro.

SQL auditado:

```sql
UPDATE `phi_prod.client_config`
SET
  primary_metric_type = '{{ $('Code transformar retorno Google Ads').item.json.primary_metric_type }}',
  updated_at          = CURRENT_TIMESTAMP()
WHERE client_id = '{{ $('Code transformar retorno Google Ads').item.json.client_id }}';
```

## 3. Reconciliacao do repo

Problema de origem desta retomada:

- o handoff anterior afirmava que os JSONs haviam sido alterados
- porem o commit remoto `a907144` havia levado apenas o `.md`
- `phi_subworkflow_campanhas_fixed.json` e `phi_pipeline_v2.json` versionados ainda estavam em estado pre-A.6c

Acao desta sessao:

- os JSONs versionados foram reconciliados a partir do estado de `HEAD` do repo, aplicando apenas os patches A.6c necessarios e evitando carregar metadata transitiente do dump bruto da API

Arquivos reconciliados:

- `phi_subworkflow_campanhas_fixed.json`
- `phi_pipeline_v2.json`

## 4. Patches aplicados nos JSONs versionados

### 4.1 Subworkflow `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`)

Mudancas aplicadas em `phi_subworkflow_campanhas_fixed.json`:

- removido o no `Execute SQL  INSERT raw_campaign_data`
- reroute:
  - `Code transformar retorno Google Ads` -> `Execute SQL client_config sincronizado`
- `Start` atualizado para declarar inputs:
  - `execution_id`
  - `client_id`
  - `source_execution_id`
- `Code in JavaScript` atualizado para ler e propagar `source_execution_id` como read-only

Resultado funcional:

- o subworkflow continua executando seus papeis legitimos
- o writer concorrente `GADS_INSERT` deixa de existir no JSON versionado

### 4.2 Pipeline `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`)

Mudancas aplicadas em `phi_pipeline_v2.json`:

- `Buscar ID de Sucesso Hoje`
  - gera `execution_id = EXEC-PHI-*`
  - resolve `source_execution_id` em `raw_campaign_data`
  - fallback para `FALLBACK-DE-*`
- `Code INSERT execution_id`
  - passa a propagar `execution_id` e `source_execution_id`
- `Call Subworkflow Campanhas`
  - adiciona `source_execution_id` em `workflowInputs`
- `Code Receber 1 Item Ingestão`
  - passa a devolver o par `execution_id` / `source_execution_id`
- `Log INGESTION RUNNING`
- `Log CALCULATION RUNNING`
- `Log OPERATIONAL RUNNING`
  - passam a gravar o par `(execution_id, source_execution_id)` em `workflow_execution_log`
- `Log INGESTION SUCCESS`
  - passa a contar `raw_campaign_data` por `source_execution_id`
- `Calcular e Persistir PHI Score`
  - passa a ler `raw_campaign_data` por `source_execution_id`
  - passa a persistir `execution_id=EXEC-PHI-*` e `source_execution_id=EXEC-DE-*` em `phi_score_history`
- `Log Notion Mapping Missing`
  - passa a inserir o par no `workflow_execution_log`

SQL aplicado no seletor:

```sql
SELECT
  CONCAT(
    'EXEC-PHI-',
    FORMAT_TIMESTAMP('%Y%m%d%H%M%S', CURRENT_TIMESTAMP(), 'America/Sao_Paulo'),
    '-',
    SUBSTR(REPLACE(GENERATE_UUID(), '-', ''), 1, 8)
  ) AS execution_id,
  COALESCE(
    (
      SELECT execution_id
      FROM `phi_prod.raw_campaign_data`
      WHERE execution_id LIKE 'EXEC-DE-%'
        AND date = DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY)
        AND ingestion_status = 'SUCCESS'
      ORDER BY ingested_at DESC
      LIMIT 1
    ),
    CONCAT(
      'FALLBACK-DE-',
      FORMAT_DATE('%Y%m%d', CURRENT_DATE('America/Sao_Paulo')),
      '-',
      SUBSTR(REPLACE(GENERATE_UUID(), '-', ''), 1, 8)
    )
  ) AS source_execution_id
```

## 5. Tentativas no n8n

### 5.1 Ajuste inicial de payload

Primeira tentativa de PUT no subworkflow retornou:

- `2026-05-11 19:54:19 GMT`
- HTTP `400 Bad Request`
- body: `{"message":"request/body/settings must NOT have additional properties"}`

Acao:

- foram gerados payloads saneados com `settings` minimo
- tambem foram gerados payloads minimos contendo apenas `name`, `nodes`, `connections` e `settings`

### 5.2 Teste com patch A.6c

Tentativa com payload saneado do subworkflow:

- `2026-05-11 19:56:23 GMT`
- HTTP `500 Internal Server Error`

### 5.3 Teste no-op para isolar origem do erro

Foi reenviado o **subworkflow atual sem mudanca funcional**:

- `2026-05-11 20:00:23 GMT`
- HTTP `500 Internal Server Error`

Foi reenviado o **Pipeline_v2 atual sem mudanca funcional**:

- `2026-05-11 20:02:01 GMT`
- HTTP `500 Internal Server Error`

Conclusao operacional:

- o bloqueio nao esta no patch A.6c em si
- o endpoint de update do n8n continua falhando com `500` ate para PUT no-op dos workflows atuais
- GETs continuam funcionando normalmente

Evidencias locais:

- `C:\tmp\a6c_subworkflow_put_headers.txt`
- `C:\tmp\a6c_subworkflow_put_response.txt`
- `C:\tmp\a6c_subworkflow_put_headers_current.txt`
- `C:\tmp\a6c_subworkflow_put_response_current.txt`
- `C:\tmp\a6c_pipeline_put_headers_current.txt`
- `C:\tmp\a6c_pipeline_put_response_current.txt`

## 6. Validacao ponta-a-ponta

**Nao executada**.

Motivo:

- a publicacao remota dos workflows nao foi possivel por bloqueio no endpoint de update do n8n

Itens pendentes de validacao operacional:

- `raw_campaign_data` para `CLI-4` / `CURRENT_DATE('America/Sao_Paulo') - 1`
  - `execution_id = EXEC-DE-*`
  - `ingestion_step = 'DAILY_ENTRY'`
- retry controlado do `PHI - Pipeline_v2`
  - `execution_id = EXEC-PHI-*`
  - `source_execution_id = EXEC-DE-*`
  - `phi_score_history` com o par
  - `workflow_execution_log` com o par
  - `mas` e `tss` saindo de fallback para `GADS-21149189736`
- smoke retroativo 1h depois

## 7. Criterio de parada acionado

Parada acionada por **dependencia externa de plataforma**:

- a instancia n8n responde para leitura
- o caminho de update (`PUT /api/v1/workflows/...`) retorna `500 Internal Server Error` mesmo em PUT no-op

Isso bloqueia:

- publicacao do patch do subworkflow
- publicacao do patch do pipeline
- validacao ponta-a-ponta
- smoke retroativo

## 8. Estado final desta sessao

- os JSONs versionados foram corrigidos e commitados nesta sessao no commit `bc5ee0d`
- os commits desta sessao ja foram enviados ao remote; head remoto atual: `86f6126`
- o deploy automatico no n8n segue pendente
- o card deve permanecer `Em andamento`
- **nao mover para `Aguardando aceite`**

Nenhum rollback foi necessario, porque nenhuma alteracao remota foi efetivamente aplicada no n8n.

## 9. Deploy manual pendente

Se o endpoint de update do n8n continuar quebrado, o caminho correto passa a ser:

- **JSONs commitados no repo; deploy manual pendente pelo time (Olavo + Cerebro) via UI do n8n a partir dos JSONs versionados**

Arquivos de referencia para deploy manual:

- `phi_subworkflow_campanhas_fixed.json`
- `phi_pipeline_v2.json`

## 10. Proximo passo recomendado

1. concluir o rebase desta branch
2. publicar o commit reconciliado no remote
3. se o `PUT` do n8n continuar quebrado, seguir com deploy manual via UI a partir dos JSONs versionados
4. so depois do deploy, executar a validacao ponta-a-ponta e o smoke retroativo
5. mover o card para `Aguardando aceite` apenas quando os criterios completos forem satisfeitos
