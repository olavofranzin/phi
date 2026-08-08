# Prefixo `=` em expressoes n8n - Execution Log

Data: 2026-08-08
Branch: claude/consolidacao-2026-08
Workflow alvo: sw metricas anuncios
WorkflowId: vVAdXAJh6MW2Z5Hp
Brief: docs/handoff/2026-08-08-prefixo-expressao-n8n-subchat-brief.md

> **Resultado em uma linha:** a correcao do brief (prepender `=` no `sqlQuery`) **nao foi
> aplicada** e o rascunho **nao foi publicado**, porque a verificacao exigida pelo §2.1
> derrubou a premissa: o prefixo `=` **nao e** o defeito, e o campo `bq_campaign_id` chega
> **vazio** (`''`) em producao. Parada obrigatoria do §3.5 acionada.

---

## Estado inicial observado

| Campo | Valor |
|---|---|
| name | sw metricas anuncios |
| workflowId | vVAdXAJh6MW2Z5Hp |
| versionId (rascunho) antes | `4370e727-5227-4c2e-8d23-0c1d88d9eb5c` |
| activeVersionId (producao) antes | `f618a9d6-c153-4b0f-8cac-e7d5e19f2495` |
| active | true |
| nodeCount | 43 |
| updatedAt | 2026-08-08T14:07:13.048Z |

Bate com o brief. Rollback continua sendo restaurar `f618a9d6`.

---

## Verificacao do campo `bq_campaign_id`

### 1. O que `Code Prep Tendencia` emite (codigo)

```js
const idG = Number(data.clean_id_google || data.id_google_camp || 0);
const idM = Number(data.clean_id_meta_campaign || data.id_meta_camp || 0);
let campaign_id = '';
if (idG > 0) campaign_id = 'GADS-' + idG;
else if (idM > 0) campaign_id = 'META-' + idM;
return { json: { ...data, bq_campaign_id: campaign_id } };
```

O **formato** pretendido (`GADS-<id>` / `META-<id>`) esta correto e bate com o canonico do
PHI e com quem escreve a tabela (o `Code Montar SQL` do Daily Entry monta
`campaignId = 'GADS-' + idGoogle` a partir da propriedade Notion `id_google_camp`).

### 2. O que ele emite de verdade (execucao real)

Execucao `26012` (2026-08-08 07:00, `success`), 4 runs do node:

| run | `bq_campaign_id` | `clean_id_google` | `id_google_camp` | `clean_id_meta_campaign` |
|---|---|---|---|---|
| 0 | `''` | ausente | ausente | ausente |
| 1 | `''` | ausente | ausente | ausente |
| 2 | `''` | ausente | ausente | ausente |
| 3 | `''` | ausente | ausente | ausente |

**Nenhum dos quatro campos de origem existe no item nesse ponto do fluxo.** A cadeia
`Code clean propriedades -> If Plataforma -> v23 Bloco 1/2/3 -> HTTP Google D1/D3/D7 ->
Code Unificar Periodos -> Code Valida Dados -> Edit Fields -> Code Calcula Metricas ->
Code Recupera Metas p Comparacao -> Code Prep Tendencia` **perde** os campos `clean_*` em
`Code Valida Dados`, que passa a espalhar (`...data`) a resposta da API do Google, nao mais
o objeto limpo do Notion.

Consequencia: a query vira `WHERE campaign_id = ''` -> **0 linhas, sempre**.
Confirmado no mesmo run: `BigQuery Serie Diaria` devolveu `n_dias: "0"` nas 4 execucoes, e
`Code Tendencia Real` devolveu `tendencia_real: null`, `tendencia_metodo: 'sem_historico'`.

### 3. Segundo defeito, latente: entidade errada

`Code clean propriedades` define:

```js
const googleAdsId = isPmax ? clean.clean_id_google_camp
                           : (clean.clean_id_google_ad || clean.clean_id_google_adset || clean.clean_id_google_camp);
const compatibilityAliases = { clean_id_google: googleAdsId, ... };
```

Ou seja, `clean_id_google` e o id do **anuncio** em campanha nao-PMAX. Na execucao `26012`:

| anuncio | is_pmax | `clean_id_google_camp` | `clean_id_google_ad` | `clean_id_google` |
|---|---|---|---|---|
| AD01-PMAX_BARBEARIA | true | 21149189736 | 6495518481 | **21149189736** |
| AD01-PMAX_CORTE.CABELO | true | 21116045403 | 6494448229 | **21116045403** |
| AD01-VID_9x16 (Meta) | false | 0 | 0 | 0 |

Hoje "salva" porque os dois anuncios Google sao PMAX (`clean_id_google == clean_id_google_camp`).
No primeiro anuncio Google **nao-PMAX**, `bq_campaign_id` viraria `GADS-<ad_id>` e continuaria
sem casar com `raw_campaign_data.campaign_id`. O campo correto e `clean_id_google_camp`.

### 4. Formato real da coluna no BigQuery

Nao foi possivel rodar `SELECT DISTINCT campaign_id ... LIMIT 20`: **nao ha `bq`/`gcloud` CLI
neste ambiente** e nao ha credencial BigQuery fora do n8n. Rodar a query exigiria executar
workflow (custo). Verificado por prova indireta, suficiente:

- Quem escreve `phi_prod.raw_campaign_data` (`Code Montar SQL` do Daily Entry e
  `PHI - Subworkflow Campanhas`) gera `campaign_id = 'GADS-' + id_google_camp`.
- `PHI - Pipeline_v2` (`Calcular e Persistir PHI Score`) usa `STARTS_WITH(j.campaign_id, 'GADS...')`.
- Cliente de referencia: `GADS-21149189736`.

**Conclusao:** o formato pretendido bate; o **valor** e que nao chega.

### 5. Veredito: o prefixo `=` NAO e o defeito

A premissa do brief foi testada e **nao se sustenta**. Prova em tres frentes independentes,
todas em producao:

1. **`PHI - Pipeline_v2` (ativo, `ITWG3Ge0asXtUM8U`)** tem 14 nodes BigQuery com `sqlQuery`
   sem `=`. Na execucao `26053` (2026-08-08 10:00, `success`), o node de leitura
   `Buscar Campanhas Alertas` - cujo filtro e
   `WHERE s.execution_id = '{{ $('Buscar ID de Sucesso Hoje').first().json.execution_id }}'` -
   **retornou 2 linhas** com `execution_id: "EXEC-PHI-20260808100052-2b918a62"`.
   Se a expressao nao fosse avaliada, o filtro casaria com nada (0 linhas) e, pior, a aspa
   simples aninhada (`$('...')` dentro de string SQL `'...'`) daria **erro de sintaxe**.
   Ela avaliou.
2. **`Execute SQL inserir daily entry`** (`sqlQuery` = `{{ $json._bq_sql }}`, sem `=`) ja
   executou MERGEs reais - documentado no execution log de 2026-07-01 (tentativa 2) e visivel
   na execucao `26008` de `sw metricas campanhas`. String literal daria erro de sintaxe.
3. **`PHI - Agregador` (ativo)** tem 6 nodes `{{ $json._merge_sql }}` sem `=` e persiste as
   tabelas `t28_*` normalmente.

**Regra aprendida:** no node `n8n-nodes-base.googleBigQuery`, o parametro `sqlQuery` (campo
SQL editor) e avaliado como expressao **mesmo sem o prefixo `=`**. O aviso
`MISSING_EXPRESSION_PREFIX` do `validate_workflow` sobre `sqlQuery` e **falso positivo** - o
mesmo falso positivo ja registrado em `docs/handoff/2026-07-01-metricas-anuncios-execution-log.md`
("falso positivo conhecido de BigQuery `executeQuery` com `useLegacySql=false`").

Portanto, prepender `=` seria: (a) inutil, (b) mascararia o bug real, e (c) publicaria os
itens 1-4 com a tendencia ainda quebrada - exatamente o que o §3.5 manda evitar.

---

## Mudancas aplicadas no n8n

**Nenhuma.** Zero operacoes de escrita no n8n nesta sessao.

| Item | Status | Motivo |
|---|---|---|
| 2.1 - corrigir `sqlQuery` de `BigQuery Serie Diaria` | **nao aplicado** | prefixo `=` nao e o defeito (§5 acima); a correcao real esta em `Code Prep Tendencia`, fora do escopo aprovado (§3.1) |
| 2.2 - publicar rascunho | **nao publicado** | parada obrigatoria do §3.5 |
| 2.3 - varredura | feito (so relato) | abaixo |

Estado final = estado inicial:

- versionId (rascunho) depois: `4370e727-5227-4c2e-8d23-0c1d88d9eb5c` (inalterado)
- activeVersionId (producao) depois: `f618a9d6-c153-4b0f-8cac-e7d5e19f2495` (inalterado)
- active: true (inalterado)

---

## Varredura de MISSING_EXPRESSION_PREFIX

Metodo: `get_workflow_details` por workflow; varredura programatica de **todos** os
parametros de **todos** os nodes procurando string que contenha `{{` e **nao** comece com `=`
(script em scratchpad, `scan.py`). Campos `jsCode`/`pythonCode` de Code nodes foram excluidos
(`{{` em JS nao e expressao n8n). Cada achado foi conferido lendo o parametro de verdade.

Cobertura: **17 workflows** dos 73 do instance - todo o nucleo PHI (pipeline de score,
subworkflows de metricas, T28, EXEC, telemetria) e os que tocam BigQuery. Nao varridos: os
~56 restantes, todos fora do PHI ou inativos (Comercial/HubSpot, Onboarding, GBP Scoring,
WPP/Evolution, TMP/SCRATCH e templates da galeria n8n). Ver "Pendencias".

### Resultado consolidado

**30 ocorrencias em 7 workflows. Todas as 30 sao no parametro `sqlQuery` de node
`n8n-nodes-base.googleBigQuery` - ou seja, todas sao falso positivo** pela regra do §5.
Nenhum node de outro tipo (Notion, HTTP Request, Telegram, Set, IF) apresentou o defeito:
todos usam `={{ ... }}` corretamente.

| workflow (id) | ativo | nodes com achado | tipo | efeito provavel |
|---|---|---|---|---|
| PHI - Pipeline_v2 (`ITWG3Ge0asXtUM8U`) | sim | 14 | 9 escrita / 5 leitura | **sem efeito** - comprovado resolvendo na exec `26053` |
| PHI - Agregador de Metricas Multi-fonte (`4sdG2UKMCBuFq8xn`) | sim | 6 | escrita (MERGE `t28_*`) | **sem efeito** |
| sw metricas anuncios (`vVAdXAJh6MW2Z5Hp`) | sim | 3 | 2 escrita / 1 leitura | **sem efeito** (o problema da leitura e outro - ver acima) |
| PHI - Subworkflow Campanhas (`b1pbn8qmzCNTufTp`) | sim (orfao?) | 3 | 2 escrita / 1 leitura | **sem efeito** |
| sw metricas campanhas (`W571K320aqIHsdtH`) | sim | 2 | 1 escrita / 1 leitura | **sem efeito** |
| client_config (`SI5NSzRb8lVUz74RwOhIT`) | sim | 1 | escrita (MERGE `phi_dev.client_config`) | **sem efeito** |
| Daily Entry (`zGgIqiLlo5iAn8ud`) | nao | 1 | escrita | **sem efeito** |

### Detalhe por workflow

#### PHI - Pipeline_v2 (`ITWG3Ge0asXtUM8U`) - ativo, versionId = activeVersionId `565a289c`

| no | param | trecho (~120 chars) | tipo | efeito | risco de corrigir |
|---|---|---|---|---|---|
| Log INGESTION RUNNING | sqlQuery | ``INSERT INTO `phi_prod.workflow_execution_log` (execution_id, ...) VALUES ('{{ $("Buscar ID...").first().json.execution_id }}'`` | escrita | sem efeito | mexer sem necessidade em node de escrita em prod |
| Log INGESTION SUCCESS / FAILED | sqlQuery | ``MERGE `phi_prod.workflow_execution_log` ...`` | escrita | sem efeito | idem |
| Log CALCULATION RUNNING / SUCCESS / FAILED | sqlQuery | idem | escrita | sem efeito | idem |
| Log OPERATIONAL RUNNING / SUCCESS / FAILED | sqlQuery | idem | escrita | sem efeito | idem |
| Log Notion Mapping Missing | sqlQuery | ``INSERT INTO `phi_prod.workflow_execution_log` ... '{{ $json.campaign_id }}'`` | escrita | sem efeito | idem |
| Buscar Campanhas Alertas | sqlQuery | ``... FROM phi_prod.phi_score_current s ... WHERE s.execution_id = '{{ ... }}'`` | leitura | sem efeito (2 linhas na exec `26053`) | - |
| Execute SQL Verificar Escalada (BQ) | sqlQuery | ``... WHERE d.campaign_id = '{{ $json.campaign_id }}' AND d.client_id = '{{ $json.client_id }}'`` | leitura | sem efeito | - |
| Get All Current Scores (Sync) | sqlQuery | ``... FROM `phi_prod.phi_score_current` s ... WHERE s.execution_id = '{{ ... }}'`` | leitura | sem efeito (2 linhas) | - |
| Calcular e Persistir PHI Score | sqlQuery | ``MERGE `phi_prod.phi_score_history` ... SELECT '{{ ... }}' AS execution_id`` | **escrita (score canonico)** | sem efeito | **alto** - nao tocar |

#### PHI - Agregador de Metricas Multi-fonte (`4sdG2UKMCBuFq8xn`) - ativo

6 nodes `[T28] BQ Merge t28_campaign / t28_adset / t28_ga4_landing / t28_gbp_daily /
t28_clarity_daily / t28_meta_campaign`, todos com `sqlQuery = "{{ $json._merge_sql }}"`.
Escrita. Sem efeito (padrao identico ao `Execute SQL inserir daily entry`, que comprovadamente
resolve). **Nao tocar.**

#### sw metricas anuncios (`vVAdXAJh6MW2Z5Hp`) - ativo

| no | param | tipo | efeito | risco de corrigir |
|---|---|---|---|---|
| `Execute SQL inserir daily entry` | sqlQuery = `{{ $json._bq_sql }}` | **escrita** (`phi_dev.raw_ad_data`) | sem efeito - resolve; hoje e barrado pelo `IF Gate PMAX`, nao pelo prefixo | **nao tocar** (§3.2) |
| `BigQuery Serie Diaria` | sqlQuery | leitura | resolve, mas `bq_campaign_id = ''` -> 0 linhas | prepender `=` nao muda nada |
| `BigQuery Persistir Sinais Criativo` | sqlQuery = `{{ $json._bq_sql_criativo }}` | **escrita** | sem efeito - resolve | **nao tocar** (§3.2) |

**Resposta a pergunta aberta do brief (§3.2)** - por que os dois nodes de escrita "nao falham"
hoje: **nao e o prefixo, e gate.** `Execute SQL inserir daily entry` fica atras do
`IF Gate PMAX`, que na execucao `26012` mandou os 2 anuncios PMAX pelo ramo false
(`_bq_sql = ''`, `_skip_ingestion = true`). O node resolve normalmente quando chamado - ja
executou MERGEs reais em `phi_dev.raw_ad_data` (registrado em 2026-07-01, tentativa 2).
Ou seja: **corrigir o prefixo nao ligaria escrita nenhuma que ja nao esteja ligada.** O risco
levantado no brief nao se materializa - mas tambem nao ha o que corrigir.

#### sw metricas campanhas (`W571K320aqIHsdtH`) - ativo

Mesmos dois nodes (`Execute SQL inserir daily entry`, `BigQuery Serie Diaria`), mesmo padrao.
**Achado extra importante:** este workflow tem o **mesmo bug de `bq_campaign_id` vazio**.
Execucao `26008` (2026-08-08 07:00, `success`), 3 runs de `Code Prep Tendencia`, os tres com
`bq_campaign_id: ""` e `n_dias: "0"`. A tendencia real do BigQuery esta morta tambem no nivel
de campanha, nao so no de anuncio.

#### Daily Entry (`zGgIqiLlo5iAn8ud`) - inativo

`Execute SQL inserir daily entry`, `sqlQuery = {{ $json._bq_sql }}`. Escrita. Sem efeito.
Workflow inativo.

### Workflows varridos SEM nenhuma ocorrencia

| workflow | id | ativo |
|---|---|---|
| sw metricas conjuntos | `t0DH5N5maws4egnG` | sim |
| operador unico metricas | `cLcimNoefTOnVVbd` | sim |
| PHI - Fechar Otimizacao | `83vfKD8XMYmjZjFQ` | sim |
| WF-T28-Error-Handler | `rTS5pE34eElfuMPl` | sim |
| WF-EXEC-Orquestrador | `2rbC7F9FneUmwUH6` | sim |
| WF-DOC-Telemetria-Diaria | `VubalOUaoBteCyC6` | sim |
| WF-T28-Analise-Campaign | `fhYmJH0o9BW1IO4i` | nao |
| WF-T28-Orquestrador-Analises | `8Q5ofmAZju0hTN08` | nao |
| Google Ads Insights Semanal | `AG3g0LcpbxbCZoPZ` | nao |
| sw metricas e diagnosticos anuncios | `uqEHxuJPWRiZS6ai` | nao |

#### PHI - Subworkflow Campanhas (`b1pbn8qmzCNTufTp`) e client_config (`SI5NSzRb8lVUz74RwOhIT`) - ambos ativos

Mesma classe de falso positivo:

- `PHI - Subworkflow Campanhas`: `Execute a SQL query` (leitura de `client_goal_history`),
  `Execute SQL  INSERT raw_campaign_data` (MERGE, escrita), `Execute SQL client_config
  sincronizado` (UPDATE, escrita).
- `client_config`: `Execute a SQL query` (MERGE em `phi_dev.client_config`, escrita).

`PHI - Subworkflow Campanhas` parece **orfao** - escreve em `phi_prod.raw_campaign_data` com o
padrao antigo e foi substituido por `sw metricas campanhas`, mas continua `active: true` (sem
trigger de producao). Vale confirmar se ainda e chamado por alguem. Nao mexi em nenhum dos dois.

---

## Pendencias para o Olavo

### 1. Decisao principal - como consertar a tendencia real (fora do escopo aprovado)

O defeito real esta em `Code Prep Tendencia`, que **nao** era corrigivel dentro do escopo do
brief (§3.1 autoriza apenas `BigQuery Serie Diaria`). Duas opcoes:

**Opcao A (minima, 3 linhas):** fazer `Code Prep Tendencia` ler direto do node de origem, e
usar o id de **campanha**:

```js
const clean = $('Code clean propriedades').item.json;
const idG = Number(clean.clean_id_google_camp || 0);
const idM = Number(clean.clean_id_meta_campaign || 0);
```

**Opcao B (padrao da casa, recomendada):** obedecer a **regra 8 do CLAUDE.md** - montar o SQL
inteiro num Code node (como ja faz `Code Montar SQL`) e o node BigQuery receber so
`{{ $json._bq_sql_serie }}`. Tira o `{{ }}` de dentro da query, elimina a classe inteira de
duvida e resolve o id de origem no mesmo lugar.

Vale para **`sw metricas anuncios` e `sw metricas campanhas`** - os dois tem o mesmo bug.

### 2. Publicacao do rascunho `4370e727` continua pendente

Os itens 1-4 (escada de evidencia, `ad_tendencia` solta do gate, ROAS/Receita null com
placeholder) **estao no rascunho e nao foram publicados**, conforme §3.5. Producao segue em
`f618a9d6`. Decisao do Olavo: publicar ja (aceitando que a tendencia real segue morta) ou
esperar a correcao do item 1 e publicar tudo junto.

### 3. Nao corrigir o prefixo `=` em lugar nenhum

As 26 ocorrencias sao falso positivo. Prepender `=` em 26 `sqlQuery` de producao (incluindo o
MERGE do `phi_score_history`) seria risco puro sem ganho.

### 4. Higiene sugerida (nao urgente)

- `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`) esta `active: true` mas parece orfao -
  confirmar e arquivar.
- Registrar em ADR/skill que `sqlQuery` de BigQuery avalia expressao sem `=`, para que o aviso
  `MISSING_EXPRESSION_PREFIX` do `validate_workflow` nao gere retrabalho de novo (ja apareceu
  no log de 2026-07-01 e voltou agora).

### 5. Nao varridos

~56 workflows fora do PHI ou inativos (Comercial/HubSpot, Onboarding, GBP Scoring,
WPP/Evolution, TMP/SCRATCH, templates da galeria n8n). Nenhum toca BigQuery/PHI. Se quiser
cobertura 100%, e so pedir - o script de varredura esta pronto.

---

## Ferramentas

| Ferramenta | Status |
|---|---|
| **context7** | **NAO disponivel neste ambiente.** Nenhum servidor MCP correspondente foi encontrado (procurado via `ToolSearch`). Nao foi usado e nao foi simulado. |
| MCP n8n (`mcp__3043b2bf-...`) | usado: `search_workflows`, `get_workflow_details`, `search_executions`, `get_execution` |
| `validate_workflow` (MCP) | **nao usado como fonte de verdade** - e ele que produz o `MISSING_EXPRESSION_PREFIX`, que esta sessao demonstrou ser falso positivo em `sqlQuery` de BigQuery. Varredura feita por inspecao programatica do JSON dos workflows. |
| Skills locais n8n | consultadas na listagem; a decisao foi resolvida por evidencia de execucao em producao, mais forte que documentacao. |
| BigQuery CLI (`bq`/`gcloud`) | **indisponivel** no ambiente. `SELECT DISTINCT campaign_id` nao pode ser rodado; formato verificado por prova indireta (§4 acima). |

### Como qualquer um verifica este log

1. `get_execution` de `vVAdXAJh6MW2Z5Hp` / `26012`, node `Code Prep Tendencia` -> `bq_campaign_id: ""` nos 4 runs.
2. `get_execution` de `W571K320aqIHsdtH` / `26008`, node `Code Prep Tendencia` -> `bq_campaign_id: ""` nos 3 runs.
3. `get_execution` de `ITWG3Ge0asXtUM8U` / `26053`, node `Buscar Campanhas Alertas` -> 2 linhas com `execution_id` real, apesar do `sqlQuery` sem `=`. Prova de que o prefixo nao e necessario.
4. `get_workflow_details` de `vVAdXAJh6MW2Z5Hp` -> `versionId` segue `4370e727-...`, `activeVersionId` segue `f618a9d6-...`.

---

## Fora de escopo respeitado

- Nenhuma alteracao em `Execute SQL inserir daily entry`.
- Nenhuma alteracao em `BigQuery Persistir Sinais Criativo`.
- Nenhuma alteracao em qualquer outro workflow.
- Nenhum workflow executado (zero gasto de LLM/API).
- Sem force-push, sem deletar branch, sem abrir PR.
