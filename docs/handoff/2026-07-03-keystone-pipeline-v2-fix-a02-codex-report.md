# Keystone Pipeline_v2 fix a02 - Codex report

Data: 2026-07-04  
Branch/worktree: `C:\tmp\phi_repo`, HEAD destacado em `a45718b`  
Workflow alvo: `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`)  
Status: DML/DDL/validacao standalone PASS; patch draft n8n PARCIAL; publish NAO executado.

## Resumo executivo

- Fase 0.1 executada em BigQuery: `CLI-5` foi inativado em `phi_prod.client_config` e `phi_dev.client_config`.
- Fase 0.2 diagnosticada sem fix: o writer das linhas `DAILY_ENTRY` e o no `Execute SQL inserir daily entry` do workflow `sw metricas campanhas` (`W571K320aqIHsdtH`). O `client_id` se perde antes do writer porque o no `Code prepara contexto para observacao` nao carrega `client_id`, e `Code Montar SQL` cai em `prop('client_id') || d.client_id || ''`.
- Fase 1 executada: `MODEL-VAREJO-001` passou de `v1.1` vigente para `v1.2` vigente, herdando thresholds da `v1.1`.
- Fase 1.5 executada: `phi_value`, `mas`, `tss`, `fis`, `es`, `rs`, `os` agora aceitam `NULL` em `phi_prod.phi_score_history`; campos criticos continuam `NOT NULL`.
- Fase 2 aplicada parcialmente no draft do n8n: tres nos atualizaram com read-back correto; dois nos criticos nao refletiram a alteracao via MCP apesar de `appliedOperations=1`.
- Fase 3 standalone executada: MERGE rodou duas vezes com sucesso e caso forcado `INSUFFICIENT_DATA` persistiu com `phi_value` e componentes `NULL`.
- Fase 4 permanece GATED pelo fix a03 do `client_id=''` em `DAILY_ENTRY`.

## VersionIds e publish

Workflow `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`):

- Antes do lote: `versionId=4b723285-dacb-4c96-9728-dcdf6a804421`, `activeVersionId=4b723285-dacb-4c96-9728-dcdf6a804421`.
- Depois das tentativas draft: `versionId=8733a520-e63b-43c3-8885-d203692f2fe2`, `activeVersionId=4b723285-dacb-4c96-9728-dcdf6a804421`.
- Publicacao: NAO executada.

Workflow temporario BigQuery admin:

- Criado: `keystone a02 bq admin temp` (`AsNK3o63hfmoXwvl`).
- Arquivado ao final: sim.

## Fase 0.1 - CLI-5 inativo

SELECT antes (`execucao 14013`):

| tabela | client_id | is_active | updated_at |
| --- | --- | --- | --- |
| `phi_dev.client_config` | CLI-5 | true | 2026-03-05 18:52:04.220070+00 |
| `phi_prod.client_config` | CLI-5 | true | 2026-03-05 18:52:04.220070+00 |

DML executado (`execucao 14014`):

```sql
UPDATE `phi_prod.client_config`
SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP()
WHERE client_id = 'CLI-5';

UPDATE `phi_dev.client_config`
SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP()
WHERE client_id = 'CLI-5';
```

SELECT depois (`execucao 14015`):

| tabela | client_id | is_active | updated_at |
| --- | --- | --- | --- |
| `phi_dev.client_config` | CLI-5 | false | 2026-07-04 13:29:56.948533+00 |
| `phi_prod.client_config` | CLI-5 | false | 2026-07-04 13:29:55.606718+00 |

## Fase 0.2 - Diagnostico DAILY_ENTRY

Workflows verificados:

- `Daily Entry` (`zGgIqiLlo5iAn8ud`): `active=false`, `versionId=b8cffb00-d2aa-4721-86e8-b9484bdd495a`, `activeVersionId=null`.
- `sw metricas campanhas` (`W571K320aqIHsdtH`): `active=true`, `versionId=df82ba87-0827-4502-a7f6-e05bc7654cc8`.
- `operador unico metricas` (`cLcimNoefTOnVVbd`): `active=true`.

Execucoes relevantes:

- `sw metricas campanhas`: `13913` em 2026-07-04 07:00Z e `13571` em 2026-07-03 07:00Z, status success.
- `operador unico metricas`: `13912` e `13570`, status error.

No writer identificado:

- Workflow: `sw metricas campanhas` (`W571K320aqIHsdtH`).
- No writer: `Execute SQL inserir daily entry`.
- No anterior que monta SQL: `Code Montar SQL`.

Trecho relevante:

```js
const clientId = esc(prop('client_id') || d.client_id || '');
```

Onde o `client_id` se perde:

- O no `Code prepara contexto para observacao` retorna dados de campanha, mas nao propaga `client_id`.
- Assim, no `Code Montar SQL`, `prop('client_id')` e `d.client_id` ficam vazios e o fallback grava `client_id=''`.
- Nenhum fix foi aplicado neste lote, conforme brief; isso fica para a03.

## Fase 1 - model_config v1.2

Baseline (`execucao 14017`):

- `MODEL-VAREJO-001` tinha uma linha vigente: `model_version=v1.1`, `valid_until=NULL`.
- Pesos vigentes v1.1: `mas=0.2`, `tss=0.2`, `fis=0.2`, `es=0.15`, `rs=0.15`, `os=0.1`.
- Thresholds herdados: `threshold=0.75`, `phi_threshold_min=0.6`, `phi_threshold_max=0.8`.

DML executado (`execucao 14018`):

```sql
INSERT INTO `phi_prod.model_config`
  (model_id, business_model, model_version, mas, tss, fis, es, rs, os,
   threshold, phi_threshold_min, phi_threshold_max, valid_from, valid_until, created_by, created_at)
SELECT
  model_id, business_model, 'v1.2', 0.34, 0.33, 0.33, 0.0, 0.0, 0.0,
  threshold, phi_threshold_min, phi_threshold_max,
  CURRENT_DATE('America/Sao_Paulo'), CAST(NULL AS DATE), 'keystone-fix-a02', CURRENT_TIMESTAMP()
FROM `phi_prod.model_config`
WHERE model_id = 'MODEL-VAREJO-001' AND model_version = 'v1.1' AND valid_until IS NULL;

UPDATE `phi_prod.model_config`
SET valid_until = CURRENT_DATE('America/Sao_Paulo')
WHERE model_id = 'MODEL-VAREJO-001' AND model_version = 'v1.1' AND valid_until IS NULL;
```

Pos-condicao (`execucao 14019`):

| model_id | active_rows | current_version |
| --- | ---: | --- |
| MODEL-VAREJO-001 | 1 | v1.2 |

## Fase 1.5 - DDL NULL permissivo

Schema antes (`execucao 14012`):

| column_name | is_nullable | data_type |
| --- | --- | --- |
| business_model | NO | STRING |
| calculation_status | NO | STRING |
| es | NO | FLOAT64 |
| fis | NO | FLOAT64 |
| mas | NO | FLOAT64 |
| model_id | NO | STRING |
| model_version | NO | STRING |
| os | NO | FLOAT64 |
| phi_value | NO | FLOAT64 |
| rs | NO | FLOAT64 |
| threshold_used | NO | FLOAT64 |
| tss | NO | FLOAT64 |

Primeira tentativa (`execucao 14020`) aplicou parte do DDL e falhou por rate limit de update de tabela ao chegar em `rs/os`. Estado parcial (`execucao 14021`): `phi_value`, `mas`, `tss`, `fis`, `es` ja estavam `YES`; `rs/os` ainda `NO`.

DDL complementar executado (`execucao 14022`):

```sql
ALTER TABLE `phi_prod.phi_score_history` ALTER COLUMN rs DROP NOT NULL;
ALTER TABLE `phi_prod.phi_score_history` ALTER COLUMN os DROP NOT NULL;
```

Schema final (`execucao 14023`):

| column_name | is_nullable | data_type |
| --- | --- | --- |
| business_model | NO | STRING |
| calculation_status | NO | STRING |
| es | YES | FLOAT64 |
| fis | YES | FLOAT64 |
| mas | YES | FLOAT64 |
| model_id | NO | STRING |
| model_version | NO | STRING |
| os | YES | FLOAT64 |
| phi_value | YES | FLOAT64 |
| rs | YES | FLOAT64 |
| threshold_used | NO | FLOAT64 |
| tss | YES | FLOAT64 |

## Fase 2 - Draft n8n

Read-back PASS:

- `Buscar ID de Sucesso Hoje`: agora gera `execution_id` novo e conta D-1 em `phi_prod.raw_campaign_data`.
- `Log INGESTION SUCCESS`: agora usa `phi_prod.raw_campaign_data` e conta D-1 por `ingestion_status='SUCCESS'`.
- `Log CALCULATION SUCCESS`: agora usa `phi_prod.phi_score_history` e conta `calculation_status='SUCCESS'` para o `execution_id` atual.

Read-back FAIL / bloqueado:

- `Calcular e Persistir PHI Score`: permaneceu com SQL antigo no read-back, incluindo filtro por `source_execution_id`, uso de campos `cost_7d` da raw e defaults `50.0`; nao refletiu o MERGE resiliente com `raw_dedup`, janela 7d, `INSUFFICIENT_DATA` e componentes `NULL`.
- `Log Notion Mapping Missing`: permaneceu com SQL antigo no read-back e ainda omite `is_reprocessing`. A tentativa via `setNodeParameter` com path JSON Pointer criou warning de campo aninhado `parameters.sqlQuery`; o campo real `sqlQuery` continuou antigo.

Observacao operacional:

- O MCP retornou `appliedOperations=1`/`5` nas tentativas, mas o read-back contradisse a aplicacao nesses dois nos. Por isso o draft nao deve ser publicado ate patch direto via API/UI e novo read-back byte a byte.
- `activeVersionId` permaneceu inalterado, entao producao publicada nao recebeu o draft parcial.

## Fase 3 - Validacao standalone

MERGE standalone:

- Execucao 1: `14024`, sucesso.
- Execucao 2: `14025`, sucesso idempotente.
- `execution_id` literal usado: `EXEC-PHI-SMOKE-A02-20260704`.
- Consulta de evidencia corrigida: `14027`.

Resultado D-1 CLI-4 apos MERGE standalone:

| campaign_id | calculated_date | model_version | phi_value | mas | tss | fis | es | rs | os | classification | status |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| GADS-21116045403 | 2026-07-03 | v1.2 | 57.93 | 79.32 | 93.57 | 0.25 | NULL | NULL | NULL | WARNING | SUCCESS |
| GADS-21149189736 | 2026-07-03 | v1.2 | 49.42 | 0.00 | NULL | 99.75 | NULL | NULL | NULL | WARNING | SUCCESS |

Caso forcado `INSUFFICIENT_DATA`:

- Insert/merge sintetico: `14028`, sucesso.
- Verificacao: `14029`, sucesso.
- Chave: `client_id=CLI-4`, `campaign_id=TEST-INSUFFICIENT-A02`, `calculated_date=2000-01-01`, `execution_id=EXEC-PHI-SMOKE-A02-INSUFF-20260704`.
- Resultado persistido: `phi_value=NULL`, `mas/tss/fis/es/rs/os=NULL`, `priority_score=NULL`, `phi_classification='INSUFFICIENT_DATA'`, `calculation_status='INSUFFICIENT_DATA'`, `calculation_last_step='NO_GOAL'`, `rs_data_insufficient=true`, `os_data_unavailable=true`.

Nota: a validacao standalone gravou/atualizou linhas reais em `phi_prod.phi_score_history`, conforme solicitado no brief para prova operacional.

## Guardrails

- Publish: NAO executado.
- Draft-only: mantido; apenas `versionId` draft avancou.
- Read-back: executado e registrou PASS/FAIL por no.
- Workflow temporario: arquivado.
- Fase 4: continua GATED pelo a03 do `client_id=''` no writer `DAILY_ENTRY`.

## Pendencias

1. Corrigir o draft do `PHI - Pipeline_v2` por API/UI para substituir de fato:
   - `Calcular e Persistir PHI Score`
   - `Log Notion Mapping Missing`
2. Fazer read-back byte a byte desses dois nos.
3. Rodar validacao draft/manual apos patch real.
4. Submeter pre-revisao Claude.
5. Publicar somente com OK explicito do Olavo.
6. Executar a03 cirurgico no writer `DAILY_ENTRY` para propagar `client_id`.
