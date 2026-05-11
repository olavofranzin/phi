# A.6 — pipeline execution_id fix

Status final desta execução: **bloqueada / rollback aplicado**.

O patch cirúrgico no nó `Buscar ID de Sucesso Hoje` foi implementado e validado parcialmente, mas a execução ponta a ponta revelou uma dependência estrutural fora do escopo aceito da A.6: o workflow `PHI - Subworkflow Campanhas` continua tratando `execution_id` como ID de ingestão de `raw_campaign_data`. Quando o `PHI - Pipeline_v2` passou a gerar `EXEC-PHI-*`, o subworkflow sobrescreveu `raw_campaign_data` com esse novo ID, quebrando a própria checagem de ingestão e invalidando o objetivo da entrega. O `PHI - Pipeline_v2` foi restaurado ao estado pré-A.6 para não deixar produção degradada.

## 1. Passos 0 e 1 — confirmações iniciais

### 1.1 Campo timestamp confiável em `raw_campaign_data`

Query executada:

```sql
SELECT column_name, data_type, ordinal_position
FROM `phi_prod.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'raw_campaign_data'
ORDER BY ordinal_position;
```

Resultado relevante:

- `ingested_at TIMESTAMP` existe e é o campo confiável para ordenar snapshots.

Evidência operacional:

- Workflow temporário: `TMP - A6 BigQuery Audit`
- Workflow ID: `m8unFD0ksEc1Zvbk`
- Execução relevante: `5063`

### 1.2 Exclusividade do prefixo `EXEC-DE-*`

Checagens executadas:

1. Busca textual nos JSONs reais dos workflows exportados do n8n.
2. Query em BigQuery sobre prefixes existentes em `raw_campaign_data`.

Veredito:

- O literal `EXEC-DE-` aparece no workflow `Daily Entry` (`zGgIqiLlo5iAn8ud`).
- Não foi encontrada colisão textual com outro workflow usando esse prefixo como padrão nominal.

Observação importante:

- Isso **não** significa que `raw_campaign_data` preserve `EXEC-DE-*` como última versão da linha. A execução da A.6 mostrou justamente o contrário: o snapshot do `Daily Entry` é sobrescrito depois por outro caminho de ingestão.

## 2. Patch aplicado inicialmente

Workflow alvo:

- Nome: `PHI - Pipeline_v2`
- ID: `ITWG3Ge0asXtUM8U`

Versão pré-patch:

- `versionId`: `9855b399-ec57-4749-8728-81889b4b27b5`
- `updatedAt`: `2026-05-04T01:02:24.018Z`

Versão pós-patch inicial:

- `versionId`: `aaab04dd-ba9c-469a-a9bd-1a17f4ad1d1c`
- `updatedAt`: `2026-05-11T00:29:42.317Z`

### 2.1 `Buscar ID de Sucesso Hoje`

Antes:

```sql
SELECT
  COALESCE(
    (SELECT execution_id
     FROM `phi_prod.workflow_execution_log`
     WHERE DATE(started_at) = CURRENT_DATE()
       AND status = 'SUCCESS'
       AND phase = 'INGESTION'
     ORDER BY started_at DESC
     LIMIT 1),
    CONCAT('FALLBACK-', FORMAT_DATE('%Y%m%d', CURRENT_DATE()), '-', GENERATE_UUID())
  ) AS execution_id
```

Depois:

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
      FROM phi_prod.raw_campaign_data
      WHERE execution_id LIKE 'EXEC-DE-%'
        AND DATE(ingested_at, 'America/Sao_Paulo') = CURRENT_DATE('America/Sao_Paulo')
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

Justificativa:

- Separa semanticamente `execution_id` do PHI (`EXEC-PHI-*`) do snapshot consumido (`source_execution_id`).
- Remove a autorreferência descrita na A.5.

### 2.2 Nós de log e persistência

Foram atualizados para gravar `source_execution_id` em:

- `workflow_execution_log`
- `phi_score_history`

Justificativa:

- A.7b já havia liberado o schema para essa dupla.
- A view `phi_score_current` projeta a nova coluna automaticamente a partir de `phi_score_history`.

## 3. Evidência crítica encontrada na validação

### 3.1 Retry controlado do `Daily Entry`

Execução disparada:

- Workflow: `Daily Entry`
- Workflow ID: `zGgIqiLlo5iAn8ud`
- Retry controlado: execução `5310`
- Base do retry: execução falha `4781`

No `Code Montar SQL`, o SQL emitido estava correto:

```sql
'EXEC-DE-20260511004745' AS execution_id,
...
'DAILY_ENTRY' AS ingestion_step,
CAST(14.521818 AS FLOAT64) AS cost_3d,
CAST(35.120336 AS FLOAT64) AS cost_7d
```

Mas a query de conferência em `raw_campaign_data` logo depois mostrou:

```json
{
  "execution_id": "FALLBACK-20260510-d54b5259-c8aa-442f-8bac-28f72d64fb0e",
  "ingestion_step": "GADS_INSERT",
  "ingested_at_sp": "2026-05-10 21:47:45",
  "client_id": "CLI-4",
  "campaign_id": "GADS-21149189736",
  "cost_3d": 14.521818,
  "cost_7d": 35.120336,
  "date": "2026-05-09"
}
```

Conclusão técnica:

- O SQL correto do `Daily Entry` **não permaneceu como estado final** da linha.
- A mesma linha foi sobrescrita em seguida por um caminho com `ingestion_step = 'GADS_INSERT'`.

### 3.2 Localização do writer concorrente

Busca textual nos workflows mostrou o writer:

- Workflow: `PHI - Subworkflow Campanhas`
- ID: `b1pbn8qmzCNTufTp`
- Node: `Execute SQL  INSERT raw_campaign_data`

Trecho relevante:

```sql
WHEN MATCHED THEN
  UPDATE SET
    execution_id         = '{{ $json["execution_id"] }}',
    ...
    ingestion_step       = 'GADS_INSERT',
    ingested_at          = CURRENT_TIMESTAMP()
```

E o subworkflow recebe `execution_id` do workflow principal:

```json
"workflowInputs": {
  "value": {
    "execution_id": "={{ $json.execution_id }}",
    "client_id": "={{ $json.client_id }}"
  }
}
```

Conclusão técnica:

- O `PHI - Pipeline_v2` não só consome `raw_campaign_data`; ele também a reescreve via subworkflow.
- Enquanto esse subworkflow continuar usando `execution_id` do workflow principal como ID de ingestão, a A.6 não fecha só com patch no seletor e nos logs.

## 4. Execução de validação do PHI e regressão encontrada

### 4.1 Primeira execução com patch

Retry controlado:

- Workflow: `PHI - Pipeline_v2`
- Retry base: `4763`
- Execução: `5315`

Resultado:

- `Buscar ID de Sucesso Hoje` retornou:

```json
{
  "execution_id": "EXEC-PHI-20260510215119-e6477854",
  "source_execution_id": "FALLBACK-DE-20260510-e6b84e3d"
}
```

- O workflow falhou em `Log INGESTION RUNNING` por sintaxe inválida nas expressões n8n dos SQL nodes.

Causa:

- O patch inicial deixou expressões no formato inválido `{{ Buscar ID de Sucesso Hoje.first().json... }}`.

### 4.2 Hotfix de sintaxe

Foi aplicado hotfix **apenas** para corrigir as expressões desses nodes para:

```txt
{{ $("Buscar ID de Sucesso Hoje").first().json.execution_id }}
{{ $("Buscar ID de Sucesso Hoje").first().json.source_execution_id }}
```

### 4.3 Segunda execução com patch corrigido

Retry controlado:

- Execução: `5317`

Saída do seletor:

```json
{
  "execution_id": "EXEC-PHI-20260510215213-bfa4caad",
  "source_execution_id": "FALLBACK-DE-20260510-93bd0fc9"
}
```

Resultado do `workflow_execution_log`:

```json
{
  "execution_id": "EXEC-PHI-20260510215213-bfa4caad",
  "source_execution_id": "FALLBACK-DE-20260510-93bd0fc9",
  "phase": "INGESTION",
  "status": "FAILED",
  "records_processed": 0,
  "started_at_sp": "2026-05-10 21:52:14",
  "finished_at_sp": "2026-05-10 21:52:39"
}
```

Evidência mais grave em `raw_campaign_data` para a campanha-canária:

```json
{
  "execution_id": "EXEC-PHI-20260510215213-bfa4caad",
  "ingestion_step": "GADS_INSERT",
  "ingested_at_sp": "2026-05-10 21:52:35",
  "client_id": "CLI-4",
  "campaign_id": "GADS-21149189736",
  "cost_3d": null,
  "cost_7d": null,
  "conversions_3d": null,
  "conversions_7d": null,
  "primary_metric_goal": 5.2
}
```

Diagnóstico:

- O subworkflow reescreveu `raw_campaign_data` usando o **novo** `execution_id` do PHI.
- Como esse caminho `GADS_INSERT` não popula `cost_3d/cost_7d/conversions_3d/conversions_7d`, o snapshot ficou degradado.
- O critério de aceite da A.6 não pode ser cumprido assim: o próprio PHI destrói a rastreabilidade e a qualidade do snapshot que deveria consumir.

## 5. Rollback aplicado

Para não deixar produção degradada, o `PHI - Pipeline_v2` foi restaurado ao estado pré-A.6.

Workflow restaurado:

- ID: `ITWG3Ge0asXtUM8U`
- `updatedAt` pós-rollback: `2026-05-11T00:57:20.664Z`

Escopo do rollback:

- Reversão do workflow principal ao JSON pré-A.6.
- Nenhum DDL revertido.
- Nenhuma limpeza destrutiva foi feita nos registros já escritos durante a validação.

## 6. Causa raiz

A A.6, como reescopada, é insuficiente porque a arquitetura real ainda tem este acoplamento:

1. `Buscar ID de Sucesso Hoje` decide o `execution_id` do workflow principal.
2. `Code INSERT execution_id` injeta esse mesmo valor em cada cliente.
3. `Call Subworkflow Campanhas` passa esse `execution_id` ao subworkflow.
4. `PHI - Subworkflow Campanhas` grava esse valor em `phi_prod.raw_campaign_data`.

Enquanto isso existir, trocar `execution_id` de “ID do snapshot” para “ID da execução do PHI” quebra a semântica da fase de ingestão.

## 7. Recomendação de escopo do fix real

Abrir nova entrega para refatorar **conjuntamente**:

- `PHI - Pipeline_v2`
- `PHI - Subworkflow Campanhas`

Escopo mínimo recomendado:

1. O `PHI - Pipeline_v2` gera `execution_id = EXEC-PHI-*`.
2. O seletor resolve `source_execution_id = EXEC-DE-*` a partir do snapshot correto.
3. O subworkflow deixa de receber `execution_id` como “ID do snapshot”.
4. O subworkflow passa a:
   - ou receber `source_execution_id` explicitamente para leitura apenas;
   - ou gerar um terceiro ID próprio de ingestão, se essa reingestão precisar continuar existindo.
5. O `Log INGESTION SUCCESS` deixa de contar linhas por `execution_id` no modelo antigo sem antes alinhar a semântica do writer.

Sem esse ajuste conjunto, a A.6 sempre vai cair em um destes dois estados ruins:

- ou continua auto-referencial / fallback;
- ou troca para `EXEC-PHI-*` e quebra a ingestão via subworkflow.

## 8. Estado final desta execução

- Patch A.6 **não foi mantido** em produção.
- `PHI - Pipeline_v2` foi restaurado ao estado pré-A.6.
- O blocker está confirmado com evidência operacional.

## 9. Artefatos e evidências operacionais

- Workflow temporário de auditoria BQ: `m8unFD0ksEc1Zvbk`
- Execuções relevantes:
  - `5063` — confirmação do schema de `raw_campaign_data`
  - `5082` — checagem de prefixos / `EXEC-DE-*`
  - `5310` — retry controlado do `Daily Entry`
  - `5315` — primeira tentativa do `PHI` com erro de sintaxe
  - `5317` — segunda tentativa do `PHI`, com regressão estrutural confirmada

## 10. Próximo passo recomendado

Nova entrega candidata:

- **A.6b — refactor conjunto do `PHI - Pipeline_v2` + `PHI - Subworkflow Campanhas` para separar `execution_id` de `source_execution_id` sem sobrescrever `raw_campaign_data`**

Esse é o menor escopo que fecha a intenção do ADR-009 sem nova regressão.
