# A.6b - Discovery do PHI - Subworkflow Campanhas

Status desta entrega: **discovery-only concluida, sem fix aplicado**.

## 1. Resumo executivo

O `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`) nao e um detalhe secundario da fase de ingestao. Ele e um writer real de `phi_prod.raw_campaign_data` via `MERGE`, usando `ingestion_step = 'GADS_INSERT'`, e hoje domina o estado persistido para `CLI-4`.

Os achados principais foram:

- O subworkflow e chamado sincronicamente pelo `PHI - Pipeline_v2`, recebendo `execution_id` e `client_id` do workflow principal.
- O node `Execute SQL  INSERT raw_campaign_data` faz `MERGE` por `(client_id, campaign_id, date)` e escreve um snapshot reduzido, sem `cost_3d`, `cost_7d`, `conversions_3d`, `conversions_7d`, `data_source`, `platform` e todos os campos v23 do `Daily Entry`.
- No historico atual da tabela, `GADS_INSERT` representa `42` linhas contra `14` de `DAILY_ENTRY`.
- Entre as chaves mais recentes da tabela, `42` estao em `GADS_INSERT` e `14` em `DAILY_ENTRY`.
- Para o business date atual (`2026-05-09`), `2/2` chaves de `CLI-4` existem apenas como `GADS_INSERT`; nao ha linha `DAILY_ENTRY` persistida para parear.
- O historico restante de `DAILY_ENTRY` ainda reflete o estado antigo pre-A.0, com `cost_3d = 0` e `cost_7d = 0`. Ou seja: a tabela atual nao preserva um snapshot canonico recente do `Daily Entry` para essas campanhas.

Conclusao preliminar: hoje existe conflito de papel entre o `Daily Entry` e o subworkflow, mas nao no formato simples "dois writers coexistindo na mesma linha". O quadro persistido e mais forte: para `CLI-4`, o caminho `GADS_INSERT` virou o writer efetivo da tabela em dias recentes.

## 2. Mapeamento do subworkflow

### 2.1 Identificacao

- Nome: `PHI - Subworkflow Campanhas`
- ID: `b1pbn8qmzCNTufTp`
- Status: `ativo`
- `createdAt`: `2026-03-09T01:04:26.581Z`
- `updatedAt`: `2026-03-30T23:57:32.620Z`
- `versionId`: `6fda09bd-8b3f-43ba-bd5b-c9b10cb2a6ce`
- Nodes: `14`

### 2.2 Como o Pipeline_v2 chama o subworkflow

Caller:

- Workflow: `PHI - Pipeline_v2`
- ID: `ITWG3Ge0asXtUM8U`
- Trigger esperado: diario as `07:00`

Node de chamada:

- Nome: `Call Subworkflow Campanhas`
- Tipo: `n8n-nodes-base.executeWorkflow`
- `workflowId`: `b1pbn8qmzCNTufTp`
- `waitForSubWorkflow`: `true`

Inputs enviados pelo caller:

```json
{
  "execution_id": "={{ $json.execution_id }}",
  "client_id": "={{ $json.client_id }}"
}
```

Leitura tecnica:

- O `Pipeline_v2` cria um `execution_id` no workflow principal.
- Esse mesmo valor e propagado para o subworkflow cliente a cliente.
- O subworkflow nao tem trigger autonomo de producao; depende da chamada do pipeline principal.

### 2.3 Fluxo real observado no subworkflow

Sequencia funcional do fluxo:

1. `Start`
   - Tipo: `executeWorkflowTrigger`
   - Recebe `execution_id` e `client_id` do workflow principal.

2. `Get database Campanhas`
   - Tipo: `notion`
   - Le o database `Campanhas`
   - Filtro: `Status = Em execucao`

3. `Code in JavaScript`
   - Tipo: `code`
   - Limpa as propriedades do Notion
   - Monta `campaign_id` (`GADS-*` ou `META-*`)
   - Extrai `customer_id_google`, `pixel_id_meta`, `primary_metric_type`, `primary_metric_goal`
   - Propaga o `execution_id` recebido do workflow principal

4. `Loop Over Items1`
   - Tipo: `splitInBatches`
   - Processa as campanhas individualmente

5. `If primary_metric_goal`
   - Tipo: `if`
   - Se a meta principal estiver ausente, busca em `client_goal_history`

6. `Execute a SQL query`
   - Tipo: `googleBigQuery`
   - Query:

```sql
SELECT goal_value
FROM `project-0e7c58d4-656f-49e8-807.phi_prod.client_goal_history`
WHERE client_id = '{{ $json["client_id"] }}'
  AND valid_from <= CURRENT_DATE()
  AND (valid_until IS NULL OR valid_until >= CURRENT_DATE())
ORDER BY valid_from DESC
LIMIT 1;
```

7. `Edit Fields`
   - Tipo: `set`
   - Se necessario, substitui `primary_metric_goal` pelo `goal_value`

8. `If fonte trafego`
   - Tipo: `if`
   - Separa `Google Ads` de `Meta Ads`

9. `HTTP Request Google`
   - Tipo: `httpRequest`
   - Query Google Ads:

```json
{
  "query": "SELECT campaign.id, campaign.name, campaign.status, campaign.serving_status, campaign.bidding_strategy_system_status, campaign_budget.amount_micros, campaign.optimization_score, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.clicks, metrics.impressions FROM campaign WHERE campaign.id = '{{ $json.google_id_campaign }}' AND segments.date DURING YESTERDAY"
}
```

10. `Code transformar retorno Google Ads`
    - Tipo: `code`
    - Normaliza o retorno em:
      - `impressions`
      - `clicks`
      - `cost`
      - `conversions`
      - `revenue`
      - `primary_metric_goal`
      - `execution_id`

11. `Execute SQL  INSERT raw_campaign_data`
    - Tipo: `googleBigQuery`
    - Faz `MERGE` em `phi_prod.raw_campaign_data`
    - E o node central do problema da A.6

12. `Execute SQL client_config sincronizado`
    - Tipo: `googleBigQuery`
    - Atualiza `primary_metric_type` em `phi_prod.client_config`

13. `Meta Ads - em breve`
    - Tipo: `noOp`
    - Placeholder; sem implementacao funcional

14. `Fim subworkflow`
    - Tipo: `noOp`
    - Encerramento do loop

### 2.4 Dependencias observadas

Dependencias externas reais:

- Notion
- Google Ads API
- BigQuery

Dependencias internas relevantes:

- `phi_prod.raw_campaign_data`
- `phi_prod.client_goal_history`
- `phi_prod.client_config`

Veredito sobre criterio de parada:

- **Nao houve subworkflow aninhado**
- **Nao houve credencial obscura alem de Notion / Google Ads / BigQuery**
- **Nao houve integracao externa inesperada alem das ja conhecidas**

Nao foi necessario acionar stop por extensao de escopo.

## 3. Analise do MERGE `GADS_INSERT`

### 3.1 SQL completo do node `Execute SQL  INSERT raw_campaign_data`

```sql
MERGE `phi_prod.raw_campaign_data` AS target
USING (
  SELECT
    '{{ $json["client_id"] }}'   AS client_id,
    '{{ $json["campaign_id"] }}' AS campaign_id,
    DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY) AS date
) AS source
ON target.client_id    = source.client_id
AND target.campaign_id = source.campaign_id
AND target.date        = source.date
WHEN MATCHED THEN
  UPDATE SET
    execution_id         = '{{ $json["execution_id"] }}',
    impressions          = {{ $json["impressions"] }},
    clicks               = {{ $json["clicks"] }},
    cost                 = {{ $json["cost"] }},
    conversions          = {{ $json["conversions"] }},
    revenue              = {{ $json["revenue"] }},
    primary_metric_goal  = {{ $json["primary_metric_goal"] }},
    ingestion_status     = 'SUCCESS',
    ingestion_step       = 'GADS_INSERT',
    ingested_at          = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN
  INSERT (
    execution_id, client_id, campaign_id, date,
    impressions, clicks, cost, conversions, revenue,
    primary_metric_goal, ingestion_status, ingestion_step, ingested_at
  )
  VALUES (
    '{{ $json["execution_id"] }}',
    '{{ $json["client_id"] }}',
    '{{ $json["campaign_id"] }}',
    DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY),
    {{ $json["impressions"] }},
    {{ $json["clicks"] }},
    {{ $json["cost"] }},
    {{ $json["conversions"] }},
    {{ $json["revenue"] }},
    {{ $json["primary_metric_goal"] }},
    'SUCCESS',
    'GADS_INSERT',
    CURRENT_TIMESTAMP()
  );
```

### 3.2 O que o MERGE realmente faz

Chave de match:

- `client_id`
- `campaign_id`
- `date`

Campos alterados em `WHEN MATCHED`:

- `execution_id`
- `impressions`
- `clicks`
- `cost`
- `conversions`
- `revenue`
- `primary_metric_goal`
- `ingestion_status`
- `ingestion_step`
- `ingested_at`

Campos inseridos em `WHEN NOT MATCHED`:

- `execution_id`
- `client_id`
- `campaign_id`
- `date`
- `impressions`
- `clicks`
- `cost`
- `conversions`
- `revenue`
- `primary_metric_goal`
- `ingestion_status`
- `ingestion_step`
- `ingested_at`

Leitura tecnica:

- O node nao popula nenhuma janela `3d` ou `7d`
- O node nao popula `data_source` nem `platform`
- O node nao popula os campos v23 do `Daily Entry`
- O node reusa o `execution_id` recebido do workflow principal como se fosse ID de ingestao da tabela

## 4. Schema atual de `raw_campaign_data`

Confirmacao via `INFORMATION_SCHEMA.COLUMNS`:

- Evidencia: workflow temporario `TMP - A6 BigQuery Audit`
- Execucao: `5367`

Colunas atuais (`31`):

| # | Coluna | Tipo | Nullable |
|---|---|---|---|
| 1 | `execution_id` | `STRING` | `NO` |
| 2 | `client_id` | `STRING` | `NO` |
| 3 | `campaign_id` | `STRING` | `NO` |
| 4 | `date` | `DATE` | `NO` |
| 5 | `impressions` | `INT64` | `YES` |
| 6 | `clicks` | `INT64` | `YES` |
| 7 | `cost` | `FLOAT64` | `YES` |
| 8 | `conversions` | `INT64` | `YES` |
| 9 | `revenue` | `FLOAT64` | `YES` |
| 10 | `primary_metric_goal` | `FLOAT64` | `YES` |
| 11 | `ingestion_status` | `STRING` | `NO` |
| 12 | `ingestion_step` | `STRING` | `YES` |
| 13 | `ingested_at` | `TIMESTAMP` | `NO` |
| 14 | `cost_3d` | `FLOAT64` | `YES` |
| 15 | `conversions_3d` | `FLOAT64` | `YES` |
| 16 | `cost_7d` | `FLOAT64` | `YES` |
| 17 | `conversions_7d` | `FLOAT64` | `YES` |
| 18 | `data_source` | `STRING` | `YES` |
| 19 | `platform` | `STRING` | `YES` |
| 20 | `primary_metric_target` | `FLOAT64` | `YES` |
| 21 | `active_view_impressions` | `INT64` | `YES` |
| 22 | `average_cpm` | `FLOAT64` | `YES` |
| 23 | `average_cpc` | `FLOAT64` | `YES` |
| 24 | `phone_calls` | `INT64` | `YES` |
| 25 | `bidding_strategy_type` | `STRING` | `YES` |
| 26 | `target_cpa_micros` | `INT64` | `YES` |
| 27 | `target_roas` | `FLOAT64` | `YES` |
| 28 | `ad_network_search` | `FLOAT64` | `YES` |
| 29 | `ad_network_display` | `FLOAT64` | `YES` |
| 30 | `ad_network_partners` | `FLOAT64` | `YES` |
| 31 | `top_search_terms` | `STRING` | `YES` |

## 5. Tabela comparativa: `DAILY_ENTRY` vs `GADS_INSERT`

Fonte `DAILY_ENTRY` usada para comparacao:

- workflow de producao `Daily Entry`
- node `Code Montar SQL`

### 5.1 Diferenca estrutural

| Coluna | DAILY_ENTRY insere | GADS_INSERT insere | GADS_INSERT atualiza |
|---|---:|---:|---:|
| `execution_id` | sim | sim | sim |
| `client_id` | sim | sim | nao |
| `campaign_id` | sim | sim | nao |
| `date` | sim | sim | nao |
| `impressions` | sim | sim | sim |
| `clicks` | sim | sim | sim |
| `cost` | sim | sim | sim |
| `conversions` | sim | sim | sim |
| `revenue` | nao | sim | sim |
| `primary_metric_goal` | sim | sim | sim |
| `ingestion_status` | sim | sim | sim |
| `ingestion_step` | sim | sim | sim |
| `ingested_at` | sim | sim | sim |
| `cost_3d` | sim | nao | nao |
| `conversions_3d` | sim | nao | nao |
| `cost_7d` | sim | nao | nao |
| `conversions_7d` | sim | nao | nao |
| `data_source` | sim | nao | nao |
| `platform` | sim | nao | nao |
| `primary_metric_target` | nao | nao | nao |
| `active_view_impressions` | sim | nao | nao |
| `average_cpm` | sim | nao | nao |
| `average_cpc` | sim | nao | nao |
| `phone_calls` | sim | nao | nao |
| `bidding_strategy_type` | sim | nao | nao |
| `target_cpa_micros` | sim | nao | nao |
| `target_roas` | sim | nao | nao |
| `ad_network_search` | sim | nao | nao |
| `ad_network_display` | sim | nao | nao |
| `ad_network_partners` | sim | nao | nao |
| `top_search_terms` | sim | nao | nao |

### 5.2 Leitura tecnica da matriz

O `GADS_INSERT` e um snapshot drasticamente mais pobre:

- preserva so o miolo D1:
  - `impressions`
  - `clicks`
  - `cost`
  - `conversions`
  - `revenue`
- nao conhece janelas 3d/7d
- nao traz contexto de plataforma/fonte
- nao traz campos v23 que alimentam leitura financeira/visibilidade/distribuicao

O `Daily Entry`, em contraste, foi desenhado para uma ingestao analitica mais rica e alinhada ao PHI.

## 6. Historico do `GADS_INSERT`

### 6.1 O que foi recuperavel no GitHub

Repositorio clonado:

- `olavofranzin/phi`
- branch: `claude/agentic-agency-planning-KwJEw`

Arquivos relevantes encontrados:

- `phi_subworkflow_campanhas_fixed.json`
- `phi_pipeline_v2.json`
- `daily_entry_v4.json`

Commit encontrado para o arquivo versionado do subworkflow:

- Commit: `7e63b065b566a39bac60784f8c9f32c5fc1b6780`
- Data: `2026-03-30 23:08:08 +0000`
- Mensagem: `fix: PHI - Subworkflow Campanhas - corrige nomes de propriedades do Notion`

Esse commit explica apenas:

- correcao de nomes de propriedades do Notion no `Code in JavaScript`
- restauracao de `campaign_id` valido

O commit **nao documenta a razao arquitetural** de existir um writer `GADS_INSERT` para `raw_campaign_data`.

### 6.2 Contexto adicional recuperavel

Commit do redesign do pipeline:

- Commit: `53779c39d3d8df02048f7d193061a136e698d055`
- Data: `2026-03-29 13:37:16 +0000`
- Mensagem: `feat(pipeline-v2): redesenho estrutural — fases sequenciais + MERGE único BQ`

Esse commit documenta o redesign do `PHI - Pipeline_v2`, mas nao justifica explicitamente o `GADS_INSERT`.

Commit do `Daily Entry` no repo:

- Commit: `093045a655710ded3a889aa637ee12f257ab662c`
- Data: `2026-03-29 01:50:37 +0000`
- Mensagem: `fix(daily-entry): implementar coleta de cost/clicks/impressions reais (item #7)`

Leitura tecnica:

- O repo mostra que `Daily Entry` e `Subworkflow Campanhas` coexistiam como writers da mesma tabela ja em marco.
- Nao foi encontrado no Git um rational documentado do tipo "por que duplicar ingestao em raw_campaign_data".

### 6.3 O que foi recuperavel no Notion

Pagina dedicada do workflow:

- `PHI - Subworkflow Campanhas — b1pbn8qmzCNTufTp`
- URL: `https://www.notion.so/354b65e5c72b81a7882cf71306b1683d`

Resumo documentado nela:

- busca campanhas ativas no Notion
- consulta dados de campanha em plataformas
- grava dados brutos em BigQuery
- sincroniza configuracao de metrica principal do cliente

Documento de sessao de 26/03/2026:

- `PHI — Sessao de Desenvolvimento 26/03/2026 — Handoff para proximo chat`
- URL: `https://www.notion.so/330b65e5c72b8158a66df9c39f2f73da`

Contexto relevante:

- o subworkflow foi mantido separado quando o pipeline principal foi consolidado
- o documento fala em "fase de ingestao"
- nao explica por que essa fase regrava a mesma tabela do `Daily Entry`

### 6.4 Conclusao sobre historico

Historico minimo recuperavel existe, mas e incompleto:

- sabemos **quando** o subworkflow estava ativo e versionado
- sabemos **o que** foi corrigido no arquivo versionado
- **nao encontramos** rationale explicito para o `GADS_INSERT` como writer concorrente de `raw_campaign_data`

Isso precisa ser tratado como **nao recuperavel com evidencia forte**. Qualquer intencao original alem do que esta nos JSONs e nas paginas de catalogo continua hipotese.

## 7. Impacto operacional em BigQuery

Evidencias executadas via workflow temporario:

- `5369` - historico agregado
- `5370` - detalhe por chave e proxy de degradacao
- `5373` - ultimas linhas `DAILY_ENTRY`
- `5375` - cobertura por cliente/campanha do `GADS_INSERT`

### 7.1 Totais historicos

- `DAILY_ENTRY`: `14` linhas
- `GADS_INSERT`: `42` linhas

### 7.2 Dominancia como estado mais recente

Entre as chaves mais recentes da tabela `(client_id, campaign_id, date)`:

- `latest_overall_by_step = DAILY_ENTRY`: `14`
- `latest_overall_by_step = GADS_INSERT`: `42`

Leitura:

- `75%` das chaves atuais da tabela estao hoje com `GADS_INSERT` como versao mais recente.

### 7.3 Distribuicao temporal recente

Nos ultimos 15 dias observados:

- `2026-04-27`: `DAILY_ENTRY = 2`
- `2026-04-28` a `2026-05-04`: `GADS_INSERT = 2` por dia
- `2026-05-08`: `GADS_INSERT = 2`
- `2026-05-09`: `GADS_INSERT = 2`
- `2026-05-10`: `GADS_INSERT = 4`

Leitura:

- O `DAILY_ENTRY` recente praticamente nao aparece no estado persistido.
- O `GADS_INSERT` aparece como writer recorrente e dominante.

### 7.4 Snapshot canonico do business date atual

Para `date = 2026-05-09`:

- `latest_current_business_date = GADS_INSERT`: `2`
- `latest_current_business_date = DAILY_ENTRY`: `0`

Detalhe por chave:

1. `CLI-4 / GADS-21116045403 / 2026-05-09`
   - `daily_rows = 0`
   - `gads_rows = 1`
   - latest: `GADS_INSERT / FALLBACK-20260510-d54b5259-c8aa-442f-8bac-28f72d64fb0e`

2. `CLI-4 / GADS-21149189736 / 2026-05-09`
   - `daily_rows = 0`
   - `gads_rows = 1`
   - latest: `GADS_INSERT / FALLBACK-20260510-d54b5259-c8aa-442f-8bac-28f72d64fb0e`

Leitura:

- O snapshot canonico atual de `CLI-4` e **100% GADS_INSERT-only**.
- Nao existe linha `DAILY_ENTRY` persistida para o mesmo business date nessas campanhas.

### 7.5 Cobertura real do `GADS_INSERT`

Chaves cobertas:

1. `CLI-4 / GADS-21149189736`
   - `row_count = 21`
   - `min_business_date = 2026-03-29`
   - `max_business_date = 2026-05-10`

2. `CLI-4 / GADS-21116045403`
   - `row_count = 21`
   - `min_business_date = 2026-03-29`
   - `max_business_date = 2026-05-10`

Leitura:

- O `GADS_INSERT` nao esta espalhado pelo portfolio inteiro.
- Ele esta concentrado em duas campanhas Google de `CLI-4`, mas com recorrencia longa e continua.

### 7.6 Quanto da degradacao e atribuivel ao `GADS_INSERT`

Resultado direto da query de pareamento historico:

- `paired_keys_latest_gads = 0`
- `keys_with_any_window_loss = 0`

Interpretacao correta:

- No estado persistido **atual**, nao existem chaves `(client_id, campaign_id, date)` com `DAILY_ENTRY` e `GADS_INSERT` coexistindo lado a lado para comparacao historica direta.
- Portanto, a degradacao da A.5/A.6 **nao aparece como overwrite estavel observavel na tabela**.
- O que a tabela mostra hoje e algo mais radical: para o snapshot recente de `CLI-4`, o caminho dominante ja e somente `GADS_INSERT`.

Conclusao operacional:

- Para o business date atual, `2/2` campanhas canarias dependem do `GADS_INSERT`.
- Logo, qualquer fallback atual de `mas`/`tss` nessas chaves e atribuivel ao fato de o snapshot consumido vir desse caminho reduzido, e nao de um `DAILY_ENTRY` rico preservado na tabela.

## 8. Opcoes de refactor para A.6c

### Opcao A - Subworkflow so le, nao escreve `raw_campaign_data`

Descricao:

- O `Pipeline_v2` resolve `source_execution_id`
- O subworkflow recebe `source_execution_id` explicitamente
- O subworkflow deixa de fazer `MERGE` em `raw_campaign_data`
- O que for util nele vira enriquecimento operacional ou leitura auxiliar

O que muda:

- `Pipeline_v2`: passa `source_execution_id`
- `Subworkflow`: remove writer `GADS_INSERT`
- Schema: nenhum DDL obrigatorio

Pros:

- Remove o conflito de autoridade na tabela
- Preserva o `Daily Entry` como writer canonico
- Menor risco semantico para ADR-009

Contras:

- Pode exigir relocar alguma logica hoje embutida no subworkflow
- Se alguma rotina depende implicitamente de `revenue` ou `client_config` sync dali, precisa ser reposicionada

Risco de regressao:

- Medio

Esforco estimado:

- Medio

### Opcao B - Manter writer, mas com terceira identidade de ingestao

Descricao:

- O subworkflow continua gravando em BQ
- Porem deixa de usar `execution_id` do PHI como ID da linha
- Gera algo como `EXEC-GADS-*` ou `ingestion_execution_id`
- Idealmente preserva `source_execution_id`

O que muda:

- `Pipeline_v2`: passa `source_execution_id` e recebe outro ID para a reingestao
- `Subworkflow`: muda semantica do MERGE
- Schema: possivel coluna nova (`ingestion_execution_id` ou equivalente)

Pros:

- Preserva rastreabilidade do caminho `GADS_INSERT`
- Mantem historico do subworkflow se isso for considerado valioso

Contras:

- Aumenta complexidade de schema e governanca
- Mantem dois writers para a mesma tabela
- Risco de continuar confundindo consumo canonico

Risco de regressao:

- Alto

Esforco estimado:

- Medio/alto

### Opcao C - Eliminar completamente o caminho `GADS_INSERT`

Descricao:

- O writer do subworkflow some
- Qualquer dado util do Google Ads desse caminho e movido para:
  - o `Daily Entry`
  - ou outra tabela especifica, separada de `raw_campaign_data`

O que muda:

- `Pipeline_v2`: deixa de depender do subworkflow para ingestao bruta
- `Subworkflow`: pode ser aposentado ou reduzido drasticamente
- Schema: possivelmente nenhum, se o `Daily Entry` assumir tudo

Pros:

- Arquitetura mais limpa
- Remove writer concorrente por completo
- Facilita estabelecer autoridade unica do snapshot

Contras:

- Pode ser refactor maior do que parece
- Se o sync de `client_config` continuar necessario, ele precisa de novo lugar

Risco de regressao:

- Medio/alto

Esforco estimado:

- Alto

### Opcao D - Mover `GADS_INSERT` para tabela separada de staging

Descricao:

- O subworkflow continua consultando Google Ads e gravando
- Mas grava em tabela propria, por exemplo `raw_campaign_data_gads_refresh`
- `raw_campaign_data` deixa de receber esse writer

O que muda:

- `Subworkflow`: troca destino da escrita
- `Pipeline_v2`: decide se consulta essa staging ou ignora
- Schema: nova tabela ou view

Pros:

- Preserva observabilidade do subworkflow
- Elimina conflito direto sobre a tabela canonica

Contras:

- Introduz custo de manutencao extra
- Risco de criar tabela "limbo" sem consumidor claro

Risco de regressao:

- Medio

Esforco estimado:

- Medio

## 9. Recomendacao preliminar

A opcao mais defensavel tecnicamente, com base no estado real observado hoje, e a **Opcao A**.

Motivos:

1. `raw_campaign_data` ja deveria ser a base canonica do PHI.
   - Hoje ela esta sendo usada como tabela de snapshot operacional.
   - Ter um segundo writer reduzido dentro do proprio pipeline quebra essa funcao.

2. O `GADS_INSERT` nao parece agregar valor estrutural suficiente para justificar dupla autoria.
   - Ele escreve menos colunas
   - Nao preserva janelas 3d/7d
   - Nao preserva contexto v23
   - Nao ha racional historico forte encontrado para sua existencia como writer da mesma tabela

3. A evidencia atual nao aponta para coexistencia saudavel entre os dois caminhos.
   - O que existe hoje e dominancia pratica do `GADS_INSERT` para `CLI-4`
   - Isso enfraquece o argumento de "complemento inocuo"

4. O problema da A.6 nao foi um bug superficial de seletor.
   - Foi um problema de autoridade semantica sobre a tabela
   - A Opcao A endereca exatamente isso

Ressalva:

- A decisao final deve virar ADR-010.
- Antes da implementacao, e preciso decidir explicitamente o destino do `Execute SQL client_config sincronizado`, porque esse side effect hoje mora no mesmo subworkflow.

## 10. Conclusao

O `PHI - Subworkflow Campanhas` hoje opera como uma mini-ingestao concorrente, focada em Google Ads, escrevendo um snapshot reduzido em `raw_campaign_data` sob `ingestion_step = 'GADS_INSERT'`.

No estado persistido atual:

- ele domina as chaves recentes de `CLI-4`
- o `Daily Entry` recente nao aparece como estado canonico dessas campanhas
- a tabela nao preserva, para essas chaves, o snapshot rico que o PHI teoricamente deveria consumir

Em termos arquiteturais, a descoberta mais importante desta A.6b e esta:

**o problema nao e apenas separar `execution_id` de `source_execution_id`; e redefinir quem tem autoridade para escrever o snapshot canonico em `raw_campaign_data`.**
