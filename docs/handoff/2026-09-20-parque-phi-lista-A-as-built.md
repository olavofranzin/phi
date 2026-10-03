# [AS-BUILT] Parque PHI — respostas da Lista A (leitura)

| | |
|---|---|
| **Data da leitura** | 2026-09-20 |
| **Frente** | Saúde Digital / Parque PHI |
| **Origem** | `docs/handoff/2026-09-19-parque-phi-contrato-e-entrevista-subchat-brief.md` (Lista A, §4) |
| **Estado** | ✅ **Etapa 1 concluída** — 27 de 30 respondidas com leitura direta · 3 parciais (motivo em cada uma) |
| **Método** | `activeVersion.nodes` (R13) + histórico de execuções reais. **Nenhum workflow foi alterado, ativado, desativado, publicado ou executado.** |
| **Limite conhecido** | Sem acesso a BigQuery nesta sessão (sem `bq`/`gcloud`, sem MCP de BigQuery). Tudo que dependia de consultar tabela está marcado **"não consegui, porque…"** |
| **Próximo passo** | Etapa 2 — Lista B com o Olavo. O §4 do `CONTRATO-PHI.md` **ainda não foi preenchido**, por ordem do brief (§2: não começar a Etapa 3 antes da 2) |

> **Convenção de honestidade (brief §6):** o que está escrito sem ressalva **foi lido**.
> O que é inferência está marcado **“deduzo que”**. O que não deu para ver está marcado **“não consegui”**.

---

## 0. As três coisas que mudam decisão

1. 🔴 **Existe um segundo writer de `phi_prod.client_config`, e ninguém sabia.** É o
   `PHI - Subworkflow Campanhas` — justamente o workflow que o ADR-37 Fase 2 manda aposentar.
   Ele roda `UPDATE phi_prod.client_config SET primary_metric_type = …` todo dia às 07h. **É ele que
   mantém o `CPA` do KIL correto em produção.** Aposentá-lo sem substituir esse nó quebra o score.
   (A10)
2. 🔴 **`sw metricas conjuntos` não escreve em BigQuery e nunca escreveu.** Não tem um único nó de
   BigQuery. Ele atualiza o **Notion**, e atualizou 3 páginas em 19/09. Dos *"2 ativos que não
   produzem nada"*, **só 1 não produz** — o `sw metricas anuncios`. (A2)
3. 🔴 **O score vai 3× para o Notion, todo dia.** `phi_score_current` devolveu **6 linhas para 2
   campanhas** na rodada de 19/09 — três cópias byte a byte de cada. A checagem de unicidade
   **não pega isso por construção**. Causa ainda não confirmada: precisa de BigQuery. (achado lateral)

---

## 1. Ingestão (camada 1)

### A1 — O `sw metricas campanhas` roda mesmo 2×/dia? O que a 2ª faz com o que a 1ª escreveu?
**Sim, roda 2×/dia — confirmado no log, não na descrição.**

| Rodada | Horário observado | `mode` | Origem |
|---|---|---|---|
| 1ª | **03:00 UTC = 00h BRT** | `trigger` | gatilho próprio (`Schedule Trigger1`) |
| 2ª | **07:00 UTC = 04h BRT** | `integrated` | chamado pelo `operador unico metricas` |

**O que a 2ª faz com o que a 1ª escreveu:** o MERGE casa na chave
`(client_id, platform, campaign_id, date)` e cai em `WHEN MATCHED` → **atualiza as métricas e
`ingested_at`, e NÃO toca `execution_id` nem `ingestion_step`** (ADR-37 I2 respeitado). Ou seja, a 2ª
rodada sobrescreve os números da 1ª e mantém a linhagem da 1ª. Não duplica linha.

> **Onde li:** `search_workflow_executions` de `W571K320aqIHsdtH` (29 execuções, 06→19/09, pares
> 03:00Z/07:00Z todo dia) · `activeVersion` `a9bd0584`, nó **`Code Montar SQL`**, cláusula
> `WHEN MATCHED THEN UPDATE SET` (não lista `execution_id` nem `ingestion_step`).
> O gatilho próprio tem `rule.interval: [{}]` — intervalo padrão do n8n, que bate com o 00h BRT observado.

### A2 — `sw metricas anuncios` e `sw metricas conjuntos`: rodam? verdes? quantos itens chegam à escrita?
**Os dois rodam todo dia às 07:00 UTC (04h BRT), chamados pelo operador, e terminam verdes há 14 dias
seguidos. Mas produzem coisas diferentes — e o panorama errou sobre um deles.**

**`sw metricas anuncios` (`vVAdXAJh6MW2Z5Hp`) — execução 40772, 19/09, `success`:**

| Nó | Itens na saída |
|---|---|
| `Normalizar Trigger` | 1 |
| `Get database anuncios` (Notion) | **2** |
| `Dedup page_id` | 2 |
| `Loop Over Items` | 4 rodadas |
| **`IF Gate PMAX`** | **0 na saída TRUE, nas 3 rodadas** |
| `Execute SQL inserir daily entry` (→ `phi_prod.raw_ad_data`) | **nunca executou** |
| `BigQuery Persistir Sinais Criativo` (→ `phi_prod.raw_ad_data`) | **nunca executou** |

**Zero itens chegam ao nó de escrita. Os dois nós de BigQuery não aparecem no `runData`.**

**`sw metricas conjuntos` (`t0DH5N5maws4egnG`) — execução 40771, 19/09, `success`:**
🔴 **O panorama diz que ele escreve `raw_adset_data_rollup`. Ele não escreve. Os 14 nós dele não
incluem um único nó de BigQuery.** Ele lê a DB Notion *Conjuntos de Anúncios* e **escreve de volta no
Notion**:

| Nó | Resultado |
|---|---|
| `Get database Conjuntos` (Notion) | 9 conjuntos no loop |
| `If IDs Google` → TRUE | 3 |
| `HTTP Request Google Adset Metrics` | 3 chamadas |
| **`Update database page Conjuntos`** (Notion, 12 campos) | **3 páginas atualizadas** |
| `Code Missing ID Conjuntos` | **6** conjuntos sem ID obrigatório |

> **Onde li:** `get_workflow_execution` 40772 e 40771 com `includeData` · `activeVersion` `ff681a25`
> (43 nós) e `85eef220` (14 nós, lista completa de tipos conferida — zero `googleBigQuery`).

### A3 — Se chegam zero itens, onde exatamente o ramo morre?
**Morre no `IF Gate PMAX`, e a causa está escrita dentro do próprio item.**

O gate testa `{{ $json._bq_sql }}` `notEmpty`. No item de 19/09 o campo está vazio (`length 0`), e o
nó anterior explica por quê:

```
_bq_sql            = ""            (vazio)
_skip_reason       = "sem_ad_id (PMAX ou GAQL vazia)"
platform           = "meta"
entity_level       = "ad"
entity_id          = 120223097134310450
validation_status  = "no_results"
reason             = "O Meta Ads retornou 0 resultados para D-2"
has_data           = false
```

**A cadeia completa da falha, que é mais funda que "o workflow está quebrado":**
1. A entrada do workflow **não é a API do Google** — é a **DB Notion "Anúncios"**
   (`297b65e5-c72b-8061-89b3-f31bd41d7e7f`), filtrada por `Status do Anúncio = Iniciado`.
2. Essa DB tem **2 anúncios, os dois da Meta** (nenhum do Google).
3. A Meta devolve **0 resultados** para eles.
4. Sem resultado não há `ad_id`; sem `ad_id` o `Code Montar SQL` devolve SQL vazio com o motivo
   `sem_ad_id (PMAX ou GAQL vazia)` — um motivo **com forma de Google** aplicado a um item **da Meta**.
5. O gate corta, e a `raw_ad_data` não recebe nada.

> **Deduzo que** consertar o workflow não resolveria sozinho: enquanto a DB Notion "Anúncios" só tiver
> anúncios Meta sem retorno, não há grão de anúncio do Google para coletar, **mesmo com o código certo**.

> ⚠️ **Achado colado neste:** o item sai com `has_data: false` e **mesmo assim** com
> `cost=0, clicks=0, conversions=0, cpa=0, roas=0`. É a quebra do **M4** (zero nunca é ausência) dentro
> do item. Hoje não faz estrago porque o item não chega ao BigQuery — mas o mesmo padrão está no
> `sw metricas conjuntos`, e lá **chega ao Notion do gestor** (ver A2).

### A4 — `sw métricas e diagnósticos anúncios` (`uqEHxuJPWRiZS6ai`) é o antecessor? O que mudou?
**É um rascunho abandonado, não um antecessor aposentado. Nunca rodou.**

- `active: false`, 16 nós, **`activeVersionId: null`** — ou seja, **nunca foi publicado**.
- `search_workflow_executions`: **0 execuções**. Nunca produziu nada, nem uma vez.
- Última alteração **30/06/2026** — o mesmo dia em que a `raw_ad_data` foi criada, e 6 dias depois da
  criação do `sw metricas anuncios` (24/06).

**Deduzo que** o "diagnósticos" foi o desenho original, abandonado em 30/06 quando o
`sw metricas anuncios` (43 nós) assumiu. **Não consegui confirmar** a intenção: nenhum dos dois tem
descrição (R5 reprovada nos dois).

> **Onde li:** `get_workflow_details` de `uqEHxuJPWRiZS6ai` (`activeVersionId: null`) ·
> `search_workflow_executions` (count 0).

### A5 — A `raw_ad_data` já teve linha alguma vez?
🔶 **Não consegui responder, porque** esta sessão não tem acesso ao BigQuery — não há `bq` nem
`gcloud` instalados e não há MCP de BigQuery. `phi_prod.__TABLES__` é a fonte certa e ficou fora do
alcance.

**O que consegui medir, e que restringe a resposta:**
- Nos **14 dias retidos** no histórico do n8n (06→19/09), os dois nós que escreveriam em `raw_ad_data`
  **não executaram nenhuma vez** (A3).
- O único outro candidato a writer, o `sw métricas e diagnósticos anúncios`, **nunca rodou** (A4).

> **Para fechar:** `SELECT row_count, creation_time FROM phi_prod.__TABLES__ WHERE table_id='raw_ad_data'`
> — uma consulta, e a célula fecha.

### A6 — O Agregador escreve em qual tabela? Traz grão de anúncio?
**Escreve em 6 tabelas `t28_*` de `phi_prod`. Traz grão de anúncio, sim — mas não o persiste.**

**Escreve** (6 nós `[T28] BQ Merge`, todos com `const DATASET = 'phi_prod'`):
`t28_campaign` · `t28_adset` · `t28_ga4_landing` · `t28_gbp_daily` · `t28_clarity_daily` ·
`t28_meta_campaign`. **Não existe `t28_ad`.**

**Lê:** `phi_prod.raw_campaign_data` (nó `[T28] BQ Read raw_campaign_data`), com o mesmo desempate
`ROW_NUMBER() … ORDER BY CASE WHEN ingestion_step='DAILY_ENTRY' THEN 0 ELSE 1 END` do Pipeline.

**Traz grão de anúncio?** Sim, de duas fontes:
- `Google Ads Anúncios (GAQL)` — `SELECT ad_group_ad.ad.id, … FROM ad_group_ad`
- `Fetch Meta Ads` — `level=ad`

**Mas o destino desse grão não é BigQuery.** Rastreando as conexões, os dois caem em:
`Merge1 → Calculate KPIs & Campaign Insights → AI Agent → Prepare Report Data2 → Switch`.
**O grão de anúncio alimenta um relatório de LLM e é descartado depois.**

**Portanto: os dois de cima NÃO são redundantes.** O Agregador é **semanal/mensal** e não guarda grão
de anúncio; a `raw_ad_data` seria **diária e persistida**. São coisas diferentes.

> ⚠️ **Achado não pedido:** o Agregador **falha silenciosamente toda rodada**. Na execução 39103
> (14/09) ele terminou `success` tendo roteado **2 erros** ao `WF-T28-Error-Handler`, os dois do nó
> `HTTP Request GBP`, com a mensagem *"The service is receiving too many requests from you"* (cota).
> Por isso `t28_gbp_daily` nunca é escrita. Também não rodaram os MERGE de `t28_adset` e
> `t28_meta_campaign` — os filtros anteriores zeraram. **Dos 6 destinos, 3 receberam escrita: `t28_campaign`,
> `t28_ga4_landing`, `t28_clarity_daily`.**

> **Onde li:** `activeVersion` `c54114b3` (66 nós) · execução 39103 com `includeData` (nós
> `[T28] BQ Merge *` e `[Err] Roteador Payload`).

### A7 — O Agregador tem 2 gatilhos — quais, e colidem com 04h/07h?
**Dois `scheduleTrigger`, e nenhum colide.**

| Gatilho | Regra lida | Quando |
|---|---|---|
| `Schedule Trigger Semanal` | `field: weeks, triggerAtDay: [1], triggerAtHour: 9` | **segunda-feira, 09h** |
| `Schedule Trigger Mensal` | `field: months, triggerAtHour: 9` | **dia 1º do mês, 09h** |

**Confirmado na prática:** as 2 execuções retidas são **07/09 e 14/09** (duas segundas), ambas às
**12:00 UTC = 09h BRT**. As janelas do PHI são 04h e 07h BRT. **Sem colisão** — há 2h de folga
depois do Pipeline.

> **Onde li:** `activeVersion` `c54114b3`, nós de gatilho · `search_workflow_executions` de
> `4sdG2UKMCBuFq8xn` (2 execuções, 12:00:37Z).

### A8 — O `PHI - Subworkflow Campanhas` ainda é chamado pelo Pipeline_v2? Em que ponto?
**Sim, todo dia, e é o segundo nó da Fase 1 do Pipeline.**

Ponto exato: `Buscar Clientes Ativos → Code INSERT execution_id → **Loop Clientes** → (saída 1)
**`Call Subworkflow Campanhas`** → `Code Receber 1 Item Ingestão` → `Log INGESTION SUCCESS`.

**Confirmado na prática:** 14 execuções retidas, `mode: integrated`, sempre ~10:00:56 UTC (07h BRT),
poucos segundos depois do Pipeline começar às 10:00:51. Execução 40814 em 19/09, `success`.

**O que quebra se o nó chamador for desabilitado** — e aqui está a parte que ninguém tinha medido:
1. **Perde-se a rodada `GADS_INSERT` das 07h** em `raw_campaign_data`. Como a linha do dia já existe
   (criada às 00h pelo `DAILY_ENTRY`), **não se perde a linha — perdem-se os números mais frescos.**
2. 🔴 **Perde-se o writer de `primary_metric_type` em `phi_prod.client_config`** (ver A10). Este é o
   estrago real, e é silencioso.
3. Perde-se a leitura de `phi_prod.client_goal_history` (nó `Execute a SQL query`), que é o
   *fallback* quando a campanha não tem `Meta da Métrica-mãe` no Notion.

> **Onde li:** `activeVersion` `e4f6d90a`, `connections` do Pipeline_v2 · execução 40814 de
> `b1pbn8qmzCNTufTp` · `activeVersion` `ac55503a` do subworkflow.

### A9 — `client_config`: o INSERT aponta para dev e o UPDATE para prod? Qual campo tem default fixo?
🔴 **A premissa do contrato está errada. Não há dois nós — há um só, e ele é inteiramente `phi_dev`.**

O workflow `client_config` (`SI5NSzRb8lVUz74RwOhIT`) tem **5 nós**, e **um único** nó de BigQuery
(`Execute a SQL query`). Ele roda um **MERGE**, e as duas cláusulas apontam para o mesmo lugar:

```sql
MERGE `project-0e7c58d4-656f-49e8-807.phi_dev.client_config` AS target
...
WHEN MATCHED THEN UPDATE SET is_active = source.is_active, updated_at = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN INSERT (client_id, client_name, model_id, primary_metric_type, is_active, created_at)
```

**INSERT e UPDATE, os dois, em `phi_dev`. Na mesma instrução.**

**O campo com default fixo é o `primary_metric_type`**, no nó `Code limpar Notion`:
```js
const metricDefaultMap = { 'Negócio Local': 'ROAS' };
const primary_metric_type = metricDefaultMap[segmento] || 'ROAS';
```
**Todo cliente vira `ROAS`** — não existe caminho que produza `CPA`. É o caso do KIL, que é `CPA`.

> 🔄 **E aqui uma hipótese minha que o dado desmentiu.** Eu esperava que repontar este MERGE para
> `phi_prod` sobrescreveria o `CPA` do KIL por `ROAS` (o medo S3b do contrato). **Não sobrescreveria:**
> o KIL já existe em `phi_prod.client_config`, então cairia em `WHEN MATCHED`, que só atualiza
> `is_active` e `updated_at` — **`primary_metric_type` não está na lista do UPDATE.** O risco real é
> outro e é menor: **cliente novo** entraria com `ROAS` fixo. E há um risco maior que o contrato não
> previa: **dois writers na mesma coluna** (ver A10).

**Dois achados colados:**
- O SQL usa **project ID + backticks** (`` `project-…-807.phi_dev.client_config` ``), contra a
  Regra Crítica nº 1 (`dataset.table`, sem project ID).
- O `Code limpar Notion` faz `if (!is_active) continue;` — **cliente que sai de ATIVO no Notion nunca
  é marcado `is_active = false` no BigQuery.** Ele simplesmente para de ser enviado, e a linha antiga
  fica ativa para sempre.

> **Onde li:** `activeVersion` `99abdada`, nós `Execute a SQL query` e `Code limpar Notion`.

### A10 — Algum outro workflow escreve `client_config`?
🔴 **Sim. E é o achado mais importante desta varredura.**

O **`PHI - Subworkflow Campanhas`** (`b1pbn8qmzCNTufTp`) tem o nó
**`Execute SQL client_config sincronizado`**, que roda, em **`phi_prod`**:

```sql
UPDATE `phi_prod.client_config`
SET primary_metric_type = '{{ … .primary_metric_type }}',
    updated_at          = CURRENT_TIMESTAMP()
WHERE client_id = '{{ … .client_id }}';
```

O valor vem da **`Métrica-Mãe` da DB Campanhas do Notion**, via `Code in JavaScript`.

**Confirmado rodando em produção:** na execução 40814 (19/09) esse nó executou **2 vezes**
(`executionIndex` 16 e 25), as duas `success`, escrevendo `primary_metric_type = 'CPA'` para `CLI-4`.

**O que isso reorganiza:**

| Tabela | Quem escreve de verdade | O quê |
|---|---|---|
| `phi_dev.client_config` | workflow `client_config` (MERGE) | a linha inteira, com `ROAS` fixo |
| **`phi_prod.client_config`** | **`PHI - Subworkflow Campanhas` (UPDATE)** | **só a coluna `primary_metric_type`** |

1. **É este nó que mantém o `CPA` do KIL correto em produção** — não uma correção manual, como o
   contrato supõe.
2. **A Fase 2 do ADR-37 (aposentar o Subworkflow Campanhas) mata esse writer.** Se for executada como
   está, `primary_metric_type` congela no último valor gravado, e nada avisa.
3. **Repontar o workflow `client_config` para `phi_prod` cria um conflito M1 real** — dois workflows
   escrevendo a mesma coluna, um com `ROAS` fixo e outro com a Métrica-Mãe do Notion. O medo S3b do
   contrato estava certo pelo motivo errado.
4. Note que é `UPDATE … WHERE`, **sem INSERT**: cliente que não existe em `phi_prod.client_config`
   **nunca é criado** por este nó. Por isso cliente novo continua sumindo (ver A15).

> **Onde li:** `activeVersion` `ac55503a` do `b1pbn8qmzCNTufTp`, nó `Execute SQL client_config
> sincronizado` · execução 40814 com `includeData`, `runData` do mesmo nó (2 runs, `success`).

### A11 — Quem escreve `model_config` e `client_goal_history` — workflow ou carga manual?
**Em tudo que abri, ninguém escreve nenhuma das duas. Há um leitor de cada.**

| Tabela | Writer encontrado | Leitor encontrado |
|---|---|---|
| `model_config` | **nenhum** | `PHI - Pipeline_v2` — `INNER JOIN phi_prod.model_config mc ON cc.model_id = mc.model_id AND mc.valid_until IS NULL` |
| `client_goal_history` | **nenhum** | `PHI - Subworkflow Campanhas` — nó `Execute a SQL query`, `SELECT goal_value … WHERE client_id = … AND valid_from <= CURRENT_DATE() …`, usado como *fallback* quando `primary_metric_goal` vem nulo do Notion |

**Deduzo que** as duas são **carga manual**. É a leitura que sobra, e é coerente com `model_config`
ter versionamento por `valid_until` e `client_goal_history` por `valid_from/valid_until` — desenho de
tabela curada à mão.

🔶 **Cobertura desta resposta, para não vender mais do que medi:** varri os `activeVersion` de
`Pipeline_v2`, `Subworkflow Campanhas`, `sw metricas campanhas`, `sw metricas anuncios`,
`sw metricas conjuntos`, `client_config`, `Agregador`, `Vigia`, `Fechar Otimização`,
`WF-DOC-Telemetria`, `WF-EXEC-Orquestrador`, `WF-EXEC-QualityGate`, `WF-T28-Orquestrador` e
`L1 - Abertura`. **Não abri os 7 `Onb - *`** — de propósito: eles são o objeto da pergunta **B14**, e
o brief (§2) manda não fazer as-built de workflow que o Olavo pode mandar aposentar. Se a B14 disser
que Onboarding é parque PHI, eu fecho essa cobertura.

### A12 — Quem escreve `workflow_execution_log` — e quem lê?
**Escreve: só o Pipeline_v2, com 10 nós. Lê: ninguém.**

**Writers** (todos em `ITWG3Ge0asXtUM8U`): `Log INGESTION RUNNING` · `Log INGESTION SUCCESS` ·
`Log INGESTION FAILED` · `Log CALCULATION RUNNING` · `Log CALCULATION SUCCESS` ·
`Log CALCULATION FAILED` · `Log OPERATIONAL RUNNING` · `Log OPERATIONAL SUCCESS` ·
`Log OPERATIONAL FAILED` · `Log Notion Mapping Missing`. Os `RUNNING` são `INSERT INTO`, os demais
`MERGE`.

**Leitores: nenhum, em nada que abri.** E há uma pegadinha de nome que vale registrar: o nó chamado
**`Buscar ID de Sucesso Hoje`** parece ler o log, mas **não lê**. Ele faz:
```sql
SELECT CONCAT('EXEC-PHI-', FORMAT_TIMESTAMP(…), '-', SUBSTR(GENERATE_UUID(),1,8)) AS execution_id,
       (SELECT COUNT(*) FROM `phi_prod.raw_campaign_data` WHERE date = … ) AS raw_d1_rows
```
— **gera** um execution_id novo e conta linhas de `raw_campaign_data`. A tabela
`workflow_execution_log` não aparece na query.

🔴 **`workflow_execution_log` é escrita 10× por dia e lida zero vezes. É a violação mais limpa do M11
no parque** (dado escrito sem consumidor declarado).

> **Onde li:** `activeVersion` `e4f6d90a`, busca por `workflow_execution_log` em todos os
> `parameters.sqlQuery` (10 ocorrências, todas de escrita) + o SQL do `Buscar ID de Sucesso Hoje`.

---

## 2. Cálculo e entrega (camadas 2 e 3)

### A13 — Com qual cláusula o Pipeline desempata `DAILY_ENTRY` × `GADS_INSERT`? Surte efeito hoje?
**A cláusula existe e está correta. E não surte efeito hoje — porque não há empate para desfazer.**

A cláusula, no nó `Calcular e Persistir PHI Score`:
```sql
WITH raw_dedup AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, platform, campaign_id, date
    ORDER BY CASE WHEN ingestion_step = 'DAILY_ENTRY' THEN 0 ELSE 1 END
  ) AS rn
  FROM `phi_prod.raw_campaign_data`
  WHERE ingestion_status = 'SUCCESS' AND date BETWEEN … )
…
FROM raw_dedup WHERE rn = 1
```
**DAILY_ENTRY ganha.**

**Por que não surte efeito:** comparei os dois MERGE lado a lado. **Os dois usam exatamente a mesma
chave e a mesma data:**

| | `sw metricas campanhas` | `PHI - Subworkflow Campanhas` |
|---|---|---|
| chave `ON` | `client_id` + `platform` + `campaign_id` + `date` | **idêntica** |
| `date` | `DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY)` | `DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)` |
| `platform` gravado | `'google_ads'` | `'google_ads'` |
| `ingestion_step` no `WHEN MATCHED` | **não atualiza** | **não atualiza** |

Como a chave é a mesma, o segundo writer cai em `WHEN MATCHED` e **atualiza a linha existente em vez
de criar outra**. Resultado: **uma linha por chave, não duas.** O `PARTITION BY` sempre devolve
`rn = 1` num grupo de um. A cláusula é uma salvaguarda que nunca é acionada.

**O que isso revela, e é pior que a duplicata:** a linha do dia fica com
`ingestion_step = 'DAILY_ENTRY'` (posto pelo INSERT das 00h) **carregando os números que o
`GADS_INSERT` gravou às 07h**. Os dois writers não brigam por linha — **um sobrescreve os números do
outro em silêncio**, e o rótulo aponta para quem chegou primeiro.

> 🔄 **Correção ao M7 do contrato.** O M7 diz que `ingestion_step` *"diz quem tocou por último"*.
> Neste caso ele diz **quem tocou primeiro** — porque nenhum dos dois writers atualiza o campo no
> `WHEN MATCHED`, por respeito ao ADR-37 I2. O invariante está escrito ao contrário do artefato.

> **Onde li:** `activeVersion` `e4f6d90a`, nó `Calcular e Persistir PHI Score` (linhas 1–26 do SQL) ·
> `activeVersion` `a9bd0584`, nó `Code Montar SQL` (cláusula `WHEN MATCHED`) · `activeVersion`
> `ac55503a`, nó `Execute SQL  INSERT raw_campaign_data`.

### A14 — Sobrou algum `'GADS-' +` no SQL do Pipeline depois do ADR-38?
🔴 **Sobrou um. Não está num `WHERE`, mas é da mesma família — e tem consequência.**

Há **exatamente 1** ocorrência da string `GADS-` em todo o `activeVersion` do Pipeline_v2, no nó
**`Buscar Campanhas Alertas`**:

```sql
CASE
  WHEN STARTS_WITH(sa.campaign_id, 'GADS-') THEN 'GOOGLE ADS'
  WHEN STARTS_WITH(sa.campaign_id, 'META-') THEN 'META ADS'
  ELSE 'GOOGLE ADS'
END AS plataforma
```

**Não é a doença do P-27** (não está num `WHERE`, não descarta linha). Mas depois do ADR-38 o
`campaign_id` não tem prefixo, então **os dois `STARTS_WITH` são sempre falsos e tudo cai no
`ELSE 'GOOGLE ADS'`**.

**Consequência real:** o campo `plataforma` alimenta a tarefa do Notion (`Plataforma|multi_select`).
**Uma campanha da Meta seria rotulada "GOOGLE ADS" na tarefa do gestor.** Hoje não aparece porque
nenhuma campanha Meta chega a ser pontuada — o `PHI - Subworkflow Campanhas` manda Meta para o noOp
`Meta Ads — em breve`. **É um defeito armado, esperando a primeira campanha Meta.**

A coluna `platform` existe em `phi_score_history` e é a fonte certa. O `CASE` deveria ler dela.

> **Onde li:** `activeVersion` `e4f6d90a`, nó `Buscar Campanhas Alertas` · busca exaustiva pela
> string `GADS-` no JSON da versão publicada (1 ocorrência).

### A15 — O `INNER JOIN` com `client_config` continua lá? Quantas campanhas descarta hoje?
**Continua. E hoje descarta 1 das 3 campanhas do Notion — um terço, de um cliente inteiro.**

O JOIN, no nó `Calcular e Persistir PHI Score`:
```sql
FROM janelas j
INNER JOIN `phi_prod.client_config` cc ON j.client_id = cc.client_id AND cc.is_active = TRUE
INNER JOIN `phi_prod.model_config`  mc ON cc.model_id = mc.model_id AND mc.valid_until IS NULL
WHERE j.tem_d1 = 1
```

**A medição, na rodada de 19/09 (execução 40813):**

| Medida | Valor | Nó |
|---|---|---|
| Clientes ativos em `phi_prod.client_config` | **1** — `CLI-4`, `MODEL-VAREJO-001`, `CPA` | `Buscar Clientes Ativos` |
| Campanhas na DB Notion Campanhas | **3** | `Code Clean Campanhas F3` |
| Campanhas que o subworkflow processou | **3** | `Call Subworkflow Campanhas` |
| Campanhas pontuadas | **2** (`21149189736`, `21116045403`, as duas do KIL) | `Get All Current Scores (Sync)` |

**A campanha descartada, com nome e sobrenome** (armadilha nº 4 — cito o registro, não só o total):

```
clean_client_id   : CLI-13
clean_client_slug : CHA
clean_nome_campanha: "IG_MENS__PROD.TESTE__"
clean_plataforma  : "Meta Ads"
clean_campaing_id : ""          ← vazio
clean_metrica_mae : "CPL"
```

**CLI-13 (CHA) não está em `phi_prod.client_config`** — só `CLI-4` voltou de `Buscar Clientes Ativos`.
O `INNER JOIN` o elimina, sem erro e sem alarme. **É exatamente o caso que o contrato previu: cliente
que existe no Notion e nunca entra no score.**

**E dá para ver por que o CHA nunca chega lá.** São três portas fechadas, não uma:
1. O workflow `client_config` escreve em **`phi_dev`**, não em `phi_prod` (A9).
2. Mesmo em `phi_dev`, o `Code limpar Notion` faz `if (!client_id || !model_id) continue;`, e o
   `modelMap` só conhece `'Negócio Local'`. **Se o Segmento do CHA não for esse, ele é descartado
   antes de virar linha.**
3. O único writer de `phi_prod.client_config` é um `UPDATE … WHERE client_id` (A10) — **sem INSERT**,
   então não cria cliente novo.

**Deduzo que** o CHA só entraria hoje se alguém inserisse a linha à mão em `phi_prod.client_config`.

> **Onde li:** `activeVersion` `e4f6d90a` (SQL do score, linhas 43–44) · execução 40813 com
> `includeData` sem truncar, nós `Buscar Clientes Ativos`, `Code Clean Campanhas F3`,
> `Call Subworkflow Campanhas`, `Get All Current Scores (Sync)`.

### A16 — A checagem de unicidade: como está depois do conserto? E no dia em que não há duplicata?
✅ **Está correta. No dia em que não pega nada — que é todo dia — o ramo continua.** Foi conferido
contra o defeito que matou a Fase 3 por 8 dias.

São dois nós em sequência:

**1. `Checar unicidade do score`** (BigQuery), com **`alwaysOutputData: true`**:
```sql
SELECT 'chave_duplicada' AS tipo, CONCAT(…) AS detalhe, CAST(COUNT(*) AS STRING) AS n
FROM phi_prod.phi_score_history
WHERE calculated_date >= DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 7 DAY)
GROUP BY 1,2 HAVING COUNT(*) > 1
UNION ALL
SELECT 'platform_nula', CONCAT(…), '1' FROM phi_prod.phi_score_history
WHERE calculated_date >= … AND platform IS NULL
```

**2. `Falhar se chave duplicada`** (Code):
```js
const problemas = $input.all().filter(function (i) { return i.json && i.json.tipo; });
if (problemas.length > 0) { … throw new Error(…); }
return [{ json: { unicidade: 'ok' } }];
```

**O comportamento no dia saudável, passo a passo:** a query devolve **0 linhas** → o
`alwaysOutputData: true` faz o nó emitir **1 item vazio `{}`** em vez de 0 → o Code filtra por
`i.json.tipo`, que o item vazio não tem → `problemas.length === 0` → **retorna `[{unicidade:'ok'}]`**
→ o ramo segue para `If Cálculo OK?`. **O ramo nunca morre.**

**Confirmado na prática:** na execução 40813 os dois nós rodaram com 1 item de saída cada, e o
Pipeline seguiu até o fim (`lastNodeExecuted: If Operacional OK?`).

> ⚠️ **Mas a checagem tem um ponto cego, e ele está ativo hoje.** O `GROUP BY` inclui `platform`. Se a
> mesma campanha aparecer com **valores diferentes de `platform`**, cada valor vira um grupo com
> `COUNT = 1` e **nada é reportado**. E o ramo `platform_nula` só pega `NULL`, não variação de grafia.
> Ver o achado lateral §4.1 — há 3 linhas por campanha chegando ao Notion, e esta checagem passa verde.

> **Onde li:** `activeVersion` `e4f6d90a`, nós `Checar unicidade do score` (com
> `alwaysOutputData: true`) e `Falhar se chave duplicada` · execução 40813.

### A17 — A Fase 3 mantém Fechamento → Escalada → Abertura no `activeVersion`?
✅ **Mantém. Li a ordem nas conexões da versão publicada, não no desenho.**

```
Log CALCULATION SUCCESS
  → Get many database Campanhas → Code Clean Campanhas F3 → Get All Current Scores (Sync)
  → Loop Sync & Close  ─────────────────────────────── (1) FECHAMENTO
        saída1 → Enrich for Sync → Existe no Notion? → Sync Scores to Notion
                 → Check Auto-Close → Get Task para Fechar → Tarefa para Fechar Existe?
                 → Auto-Close Task (Notion) → Auto-Close: Desativar Otimização → volta ao Loop
        saída0 (done) ↓
  → Log OPERATIONAL RUNNING → Buscar Campanhas Alertas → Tem Campanhas em Alerta?
  → Loop Campanhas
        saída1 → Code Enriquecer Campanha
                 → Execute SQL Verificar Escalada (BQ) → If Deve Escalar?
                     → Get tasks para Escalada → Tarefa Escalada Existe?
                       → Update Escalar Tarefa ──────── (2) ESCALADA
                 → If otimização ativa → Tarefa Existe?
                     → Update a database page / Create a database page
                       → Criar Log Otimizacoes ──────── (3) ABERTURA
```

**O fechamento está inteiro dentro do `Loop Sync & Close`, que termina antes do
`Log OPERATIONAL RUNNING` abrir a etapa seguinte.** A ordem do M6 está preservada em produção.

Dois detalhes lidos de passagem:
- O nó `Chamar Loop Alerta Fase 1` está **`disabled: true`** — coerente com o
  `[APOSENTADO 2026-07-21] PHI - Loop Alerta Fase 1`. Aposentadoria bem feita, ponta solta amarrada.
- Os `splitInBatches` v3 estão usados certo: saída 0 = done, saída 1 = loop.

> **Onde li:** `activeVersion` `e4f6d90a`, objeto `connections` inteiro (não o layout de tela).

### A18 — O `PHI - Fechar Otimização` só fecha, ou também abre / limpa órfãs?
✅ **Só fecha. A descrição dele está fiel — é o único do parque que passou nesse teste sem ressalva.**

8 nós. O caminho inteiro:
`A cada 1 hora → Buscar Tarefas Concluídas (Tasks: Status=Concluído AND Criado por Automação=true
AND Subtipo=Otimização de Campanha) → Tem Campanha Vinculada? → Loop Tarefas → Buscar Campanha
(Campanhas: Status=Em execução AND Otimização Ativa?=true AND campaign_id=…) → Campanha Ativa Existe?
→ **Desmarcar Otimização Ativa** → volta ao Loop`.

**Escreve exatamente um campo do Notion:** `Otimização Ativa?|checkbox`, e sem valor no
`propertyValues` — ou seja, **desmarca**. Não cria página, não apaga, não abre otimização, não mexe em
órfã. **O padrão S4 do ADR-37 está confirmado no artefato:** os dois workflows tocam o mesmo campo em
papéis disjuntos — o Pipeline abre 1×/dia, este fecha 1×/hora.

Roda de hora em hora sem falhar (336 execuções retidas, a última em 20/09 00:00 UTC).

> ⚠️ Ponta solta pequena: o `Tem Campanha Vinculada?` só tem a **saída TRUE** conectada. Tarefa
> concluída sem campanha vinculada **some sem registro**. Não é o que a pergunta pedia, mas é R11.

> **Onde li:** `activeVersion` `4b27e244` (8 nós, `connections` completas) ·
> `search_workflow_executions` de `83vfKD8XMYmjZjFQ`.

### A19 — Quais campos do Notion o Pipeline_v2 escreve, exatamente?
**12 nós Notion. Estes são os campos, um por um:**

| Nó | DB | Op | Campos escritos |
|---|---|---|---|
| `Sync Scores to Notion` | Campanhas | update | `Score Diário (0-100)`, `Status Geral da Campanha`, `phi_ultima_execucao` |
| `Update otimização ativa` | Campanhas | update | `Otimização Ativa?` |
| `Auto-Close: Desativar Otimização` | Campanhas | update | `Otimização Ativa?` |
| `Create a database page` | Tasks | create | `campaign_id`, `Criado por Automação`, `Data Programada`, `execution_id`, `Métrica Afetada`, `Origem`, `Plataforma`, `Prioridade`, `Responsável`, `Status`, `Subtipo de Tarefa`, `Tipo de Tarefa`, `Gravidade Detectada`, `Projeto`, `Campanha`, `Tarefa SOP (n8n)`, `Dias em Alerta`, `Data de Detecção`, `Workflow`, `Última Execução` |
| `Update a database page` | Tasks | update | `Status`, `Gravidade Detectada`, `Prioridade`, `execution_id`, `Data Programada`, `Observação`, `Dias em Alerta`, `Workflow`, `Última Execução` |
| `Update Hipótese na Tarefa` | Tasks | update | `Hipótese Sugerida (IA)`, `Prioridade` |
| `Update Escalar Tarefa` | Tasks | update | `Prazo` |
| `Auto-Close Task (Notion)` | Tasks | update | `Status` |
| `Create a database page chklist` | Checklist | create | `Tarefa`, `Categoria`, `Concluído?`, `Subcategoria`, `Criado por`, `Projeto` |
| `Criar Log Otimizacoes` | Log de Otimizações | create | `Tarefa PHI`, `Origem da Ação`, `Executada via PHI?`, `ID da Execução PHI`, `Classificação PHI`, `Componente PHI`, `Métrica Afetada`, `Campanhas`, `Projeto`, `Data da Ação`, `Resultado`, `Status do Registro` |
| `Get many database Campanhas` · `Get tasks para Escalada` · `Get Task para Fechar` | — | read | não escrevem |

> ⚠️ **O `Criar Log Otimizacoes` é o único nó do Pipeline com `onError: continueRegularOutput`** — e é
> exatamente o padrão da R11 regra 2: se a criação do log falhar, o Pipeline segue verde e **a ação
> fica sem registro no Log de Otimizações**, sem destino visível para o erro. Ver A22.

> ✅ **Regra Crítica nº 9 conferida:** `Score Diário` é escrito **só** pelo `Sync Scores to Notion`,
> depois da Fase 2. Nenhum outro nó do parque toca esse campo.

> **Onde li:** `activeVersion` `e4f6d90a`, todos os nós `type == n8n-nodes-base.notion`, campo
> `parameters.propertiesUi.propertyValues`.

---

## 3. Vigilância (camada 4)

### A20 — O Vigia olha quais tabelas? E no dia em que não falta nada?
**Olha duas tabelas, e no dia limpo silencia de propósito — não por acidente.**

**Tabelas que ele olha** (nó `Buscar lacunas de ontem`):
- `phi_prod.raw_campaign_data` — ramo **`SEM INGESTAO`**
- `phi_prod.phi_score_history` — ramo **`SEM SCORE`**
- `phi_prod.client_config` — entra como `INNER JOIN … AND cc.is_active = TRUE`, só no ramo `SEM SCORE`

**Não olha:** `raw_ad_data`, `raw_adset_data_rollup`, as `t28_*`, nem o Notion.

> ⚠️ **E esse `INNER JOIN` com `client_config` é o mesmo do score.** O Vigia **não consegue ver a
> lacuna do CHA**, porque o CHA é eliminado pelo mesmo JOIN que o descarta no Pipeline. **O vigia é
> cego exatamente onde o defeito mora.** Não estava na pergunta, mas decorre dela.

**Comportamento no dia em que não falta nada — medido na execução 40826 (19/09, `success`):**

| Nó | Saída |
|---|---|
| `Todo dia 08h BRT` | 1 |
| `Buscar lacunas de ontem` (`alwaysOutputData: true`) | **1 item vazio `{}`** (a query devolveu 0 linhas) |
| `Montar alerta (ou silenciar)` | **0 itens** |
| `Avisar no Telegram` | **não executou** |

`lastNodeExecuted: Montar alerta (ou silenciar)`. **O silêncio é escolhido no Code, não herdado do
vazio** — o `alwaysOutputData` garante que o item chegue ao Code, e é o Code que decide não emitir.
É o oposto do defeito que matou a Fase 3.

> **Onde li:** execução 40826 com `includeData` (4 nós, contagens acima) · o SQL completo do nó veio
> do payload de erro da execução 40136 (17/09), que carrega os `parameters` do nó que falhou.

### A21 — O `errorWorkflow` está apontado em quais? Quais dos ~26 ativos NÃO têm?
**Têm 5. Não têm 21.** Li em `settings`, que pela R13 item 4 **vale mesmo sem publicar**.

**TÊM `errorWorkflow: UZ7sIE5cWrrO8xea`** (5):
`operador unico metricas` · `PHI - Pipeline_v2` · `PHI - Subworkflow Campanhas` ·
`sw metricas campanhas` · `PHI - Vigia de Frescor dos Dados`

**NÃO TÊM** (21 dos 26 legíveis):

| Grupo | Workflows |
|---|---|
| Ingestão | `client_config` · **`sw metricas anuncios`** · **`sw metricas conjuntos`** · `PHI — Agregador de Métricas Multi-fonte` |
| Entrega | **`PHI - Fechar Otimização`** |
| Vigilância | `PHI — Digest Diário de Progresso` · `PHI - Alerta de Falha` (é o próprio handler) |
| Consumo | `WF-T28-Error-Handler` · `WF-DOC-Telemetria-Diaria` · `WF-EXEC-Orquestrador` · `WF-EXEC-Intake-Pacing` · `WF-EXEC-QualityGate-Pacing` |
| Fronteira | `L1 - Abertura de Projeto Tecnico Setup` · 7× `Onb - *` |

🔴 **O buraco que mais importa:** a cobertura para exatamente na fronteira da camada 1. Os **três
workflows que o `operador unico` chama às 04h** — `sw metricas campanhas` está coberto, mas
**`sw metricas anuncios` e `sw metricas conjuntos` não estão**. Se um deles falhar duro, o alarme só
chega **se** o `operador unico` também falhar. E o `Fechar Otimização`, que roda 24×/dia e mexe no
Notion do gestor, também está descoberto.

> **Onde li:** `get_workflow_details(detailLevel: "execution")` dos 26 ativos legíveis, campo
> `workflow.settings.errorWorkflow`.

### A22 — Quais workflows têm `onError: continueRegularOutput` sem destino visível?
**Encontrei 4 nós, em 2 workflows, dentro do escopo que abri.**

| Workflow | Nó | Avaliação |
|---|---|---|
| `PHI - Pipeline_v2` | **`Criar Log Otimizacoes`** | 🔴 **Sem destino.** Falhou → o Pipeline segue verde e a ação fica **sem registro no Log de Otimizações**. É o único nó do Pipeline com `onError`. |
| `PHI — Agregador` | **`Fetch Meta Ads`** | 🔴 **Sem destino.** Falha da Meta vira item normal e segue para o `Merge1`. |
| `PHI — Agregador` | **`Search Terms Checker`** | 🔴 **Sem destino.** |
| `PHI — Agregador` | **`Extracting Search Terms (janela)`** | 🔴 **Sem destino.** |

**E o contraste que vale registrar:** no mesmo Agregador, **15 outros nós** usam
`onError: continueErrorOutput` e a saída de erro está ligada num roteador
(`[Err] Roteador Payload → [Err] Call Handler → WF-T28-Error-Handler`). **Esse é o padrão certo, e ele
existe e funciona nesta casa** — foi ele que capturou os 2 erros de GBP em 14/09. Os 4 nós acima são
os que ficaram de fora do padrão.

🔶 **Cobertura:** os 7 `Onb - *` não foram abertos (mesmo motivo da A11 — são o objeto da B14).

> **Onde li:** `activeVersion` `c54114b3` e `e4f6d90a`, campo `onError` de todos os nós + o objeto
> `connections` para ver se a saída de erro tem destino.

### A23 — Descubra os até 4 workflows falhando que ninguém identificou
🔄 **A premissa não se sustenta. Não há workflow desconhecido falhando. São 4 workflows com nome, um
único incidente, uma única causa, um único dia.**

Li o payload dos **5** disparos do `PHI - Alerta de Falha`. Cada um carrega
`workflow.id` e `workflow.name` de quem falhou:

| # | Exec do alerta | Horário (UTC) | Workflow que falhou | Exec pai | Nó que parou |
|---|---|---|---|---|---|
| 1 | 40027 | 17/09 **03:00:25** | `sw metricas campanhas` | 40024 | `BigQuery Série Diária` |
| 2 | 40080 | 17/09 **07:00:14** | `sw metricas campanhas` | 40079 | `BigQuery Série Diária` |
| 3 | 40081 | 17/09 **07:00:15** | `operador unico metricas` | 40078 | `Interromper Apos Alerta` |
| 4 | 40124 | 17/09 **10:00:54** | `PHI - Pipeline_v2` | 40123 | `Buscar Clientes Ativos` |
| 5 | 40137 | 17/09 **11:00:00** | `PHI - Vigia de Frescor dos Dados` | 40136 | `Buscar lacunas de ontem` |

**A mensagem é idêntica nos cinco:**
> `The credential "Google BigQuery account" needs to be reconnected.`
> (credencial `UhLRAanVarQeOpQy`, OAuth2 expirado)

**A leitura correta do incidente de 17/09:**
- **Não foram 5 workflows** — foram **4**, e o `sw metricas campanhas` aparece 2× porque **roda 2×/dia**
  (é a A1 explicando a A23).
- O nº 3 é **cascata**, não falha própria: o `operador unico` falhou *porque* o subworkflow falhou.
- **Não sobrou nenhum workflow sem nome.** A afirmação *"até 4 workflows que ninguém identificou"*
  está **refutada**: todos os disparos têm autor identificado no próprio payload.
- **A parte que estava certa:** o Vigia falhou **1×**. E a credencial está provada — 18 e 19/09
  verdes às 11:00 UTC.
- **Os 5 disparos são consistentes com a A21:** o alerta só cobre os 5 workflows que declaram
  `errorWorkflow`, e 4 dos 5 dispararam. **Não há alarme faltando; há workflow fora da cobertura.**

**A conclusão que eu levaria ao chat-mãe:** o problema não é *"quem está falhando em silêncio"* — é
que **uma credencial OAuth expirada derruba a cadeia inteira de uma vez**, e só o Olavo pode
reconectar. Em 17/09 o PHI ficou sem ingestão, sem score e sem vigia no mesmo dia.

> **Onde li:** `get_workflow_execution` das 5 execuções de `UZ7sIE5cWrrO8xea` com `includeData`, nó
> `Quando um workflow falha`, campos `json.workflow.id`/`json.workflow.name` e
> `metadata.parentExecution`.

---

## 4. Consumo e higiene (camada 5)

### A24 — `WF-T28-Error-Handler` está ativo com `triggerCount: 0` — quem o aciona? Já disparou?
**Quem aciona: o Agregador, por chamada explícita. E sim — já disparou 4 vezes.**

**Por que `triggerCount: 0`:** o gatilho dele é um `executeWorkflowTrigger`
(`[ErrHdl] Execute Workflow Trigger`), que **não é gatilho agendado** — o `triggerCount` só conta
gatilhos ativos do tipo schedule/webhook. **Zero aqui não significa "ninguém chama".** É a armadilha
do `triggerCount` da R13, na forma inversa.

**Quem chama:** o nó **`[Err] Call Handler`** (`n8n-nodes-base.executeWorkflow`,
`workflowId: rTS5pE34eElfuMPl`) dentro do `PHI — Agregador de Métricas Multi-fonte`, alimentado pelo
`[Err] Roteador Payload`, que por sua vez recebe a saída de erro de 15 nós.

**Já disparou, 4 vezes:**

| Exec | Quando | Modo |
|---|---|---|
| 36518 | 07/09 12:00:55Z | integrated |
| 36520 | 07/09 12:01:16Z | integrated |
| 39106 | 14/09 12:01:01Z | integrated |
| 39107 | 14/09 12:01:21Z | integrated |

**Duas por rodada do Agregador, nas duas rodadas retidas.** Os dois erros de cada rodada são o mesmo:
`HTTP Request GBP` → *"The service is receiving too many requests from you"*.

**Ou seja: ele está ativo, é chamado, funciona — e o que ele registra é um erro real que se repete
toda semana e ninguém tratou.** Ele grava `t28_errors` + cria tarefa de Demanda + manda Telegram.

> **Onde li:** `get_workflow_details` de `rTS5pE34eElfuMPl` (`triggerInfo` = `executeWorkflowTrigger`)
> · `search_workflow_executions` (4 execuções) · `activeVersion` `c54114b3` do Agregador, nó
> `[Err] Call Handler` · execução 39103, nó `[Err] Roteador Payload` (2 runs, payload do erro).

### A25 — Os 3 `WF-EXEC-*` e o `WF-DOC-Telemetria-Diaria` leem alguma coisa do PHI?
🔴 **Nenhum dos quatro lê nada do PHI. Zero nós de BigQuery nos quatro. Vivem inteiramente no Notion.**

| Workflow | Gatilho real | Lê | Escreve | Toca o PHI? |
|---|---|---|---|---|
| `WF-EXEC-Orquestrador` | Schedule **11:00 UTC (08h BRT)** diário | Notion: `PHI - SOPs`, `PHI - Demandas` | Notion: `PHI - Demandas` (prioridade, estado), `PHI - Eventos` | **Não** |
| `WF-EXEC-QualityGate-Pacing` | Schedule **a cada 5 minutos** | Notion: `PHI - SOPs`, `PHI - Demandas` | Notion: `PHI - Demandas`, `PHI - Eventos`, Telegram no FAIL | **Não** |
| `WF-EXEC-Intake-Pacing` | Webhook `POST /webhook/pacing-alert` | — | — | **Não — e nunca foi chamado** (0 execuções) |
| `WF-DOC-Telemetria-Diaria` | Schedule **11:30 UTC (08:30 BRT)** diário | Notion: Clientes, Etapas de Onboarding, Mudanças de Escopo, Catálogo de Artefatos, Decisões ADR, Aprendizados, Snapshots | Notion: `PHI - Snapshots de Telemetria`, Telegram | **Não** |

**Nenhuma tabela `phi_prod.*`, nenhum `phi_value`, nenhum score.** A tag `phi` nos quatro é de
nomenclatura, não de dado. Eles formam um subsistema próprio — fila de Demandas com SOP, eventos e
telemetria de Onboarding — que **não consome nada do parque PHI de mídia**.

**Três coisas que saltaram, e não estavam na pergunta:**
1. 🔴 **O `WF-EXEC-QualityGate-Pacing` roda a cada 5 minutos — 288×/dia, 4.036 execuções retidas.**
   Cada rodada faz **2 `getAll` no Notion** (`PHI - SOPs` e `PHI - Demandas`, os dois `returnAll`).
   São ~576 varreduras de DB Notion por dia para uma fila que, pelo que se vê, quase nunca tem item.
   **É o maior consumo de cota do parque, e é de polling.** (Entra direto na B19.)
2. 🔴 **`WF-EXEC-Intake-Pacing` tem 0 execuções e é o único ativo com alteração parada no rascunho**
   (A30). O webhook `POST /webhook/pacing-alert` está no ar e nunca recebeu chamada.
3. 🔴 **Dois digests no mesmo minuto.** O `WF-DOC-Telemetria-Diaria` manda Telegram às **08:30 BRT**,
   para o **mesmo `chatId` 930549271** do `PHI — Digest Diário de Progresso`, que também é 08:30.
   O Olavo recebe **duas mensagens longas no mesmo minuto**, todo dia. (Entra na B8.)

> **Onde li:** `activeVersion` `98d442d1`, `997a884f`, `6621ea01` (listas de nós completas — zero
> `googleBigQuery`) · `get_workflow_details` de `9vyTlIJdvc5nf8Yk` · `search_workflow_executions` dos
> quatro.

### A26 — O `WF-T28-Orquestrador` lê `phi_dev` — essa tabela existe e tem dado?
**Lê `phi_dev.t28_campaign`, e é o espelho exato do bug do `client_config` — writer em prod, leitor em dev.**

O nó `Set config` fixa `BQ_DATASET = 'phi_dev'` e `SCORE_DATASET = 'phi_prod'`. O nó
`BQ Read T28 Score` faz:
```sql
FROM `{{ BQ_DATASET }}.t28_campaign` t
LEFT JOIN `{{ SCORE_DATASET }}.phi_score_current` s
  ON t.client_id = s.client_id AND t.campaign_id = s.campaign_id
```

🔴 **E o Agregador escreve `t28_campaign` em `phi_prod`** — li o `const DATASET = 'phi_prod'` no
`[T28] Build MERGE t28_campaign` (A6). **Quem escreve e quem lê estão em ambientes diferentes.**

**Consequência, se ele fosse ativado hoje:** leria uma tabela que o Agregador nunca alimenta, o
`Loop Campaigns` receberia 0 itens, e o fan-out para análise não aconteceria — **verde, sem análise
nenhuma, sem alarme.** Exatamente o modo de falha da casa.

🔶 **Se `phi_dev.t28_campaign` existe e tem dado: não consegui confirmar**, pelo mesmo motivo da A5
(sem acesso a BigQuery). O que sei é que **nenhum workflow que abri escreve nessa tabela em `phi_dev`**.

> ⚠️ **Achado colado (R12):** o `Set config` tem `business_date` **fixado em `'2026-06-21'`** — uma data
> de teste que ficou. O `Calc Window Dates` só usa o fallback `hoje-1` se o campo vier vazio, e ele
> não vem. **Se ativado, ele analisaria 21/06 para sempre.**
> E: `active: false` com **`activeVersionId: null`** — nunca foi publicado. É rascunho puro.

> **Onde li:** `get_workflow_version` `673cbf41` de `8Q5ofmAZju0hTN08`, nós `Set config` e
> `BQ Read T28 Score` · `activeVersion` `c54114b3` do Agregador, nó `[T28] Build MERGE t28_campaign`.

### A27 — `t28_campaign` com 3 identidades — qual o estado hoje?
**O estado hoje: uma identidade, sem prefixo — e `platform` não existe na tabela.**

Li o `SCHEMA` e o `KEY_COLUMNS` no nó `[T28] Build MERGE t28_campaign`:
```js
const KEY_COLUMNS = ['client_id', 'campaign_id', 'business_date', 'janela'];
```
O `SCHEMA` tem 38 colunas. **Nenhuma delas é `platform`.**

- O `campaign_id` vem do `[T28] BQ Read raw_campaign_data`, que seleciona `campaign_id` cru — **sem
  prefixo**, já no padrão do ADR-38. A leitura até traz `platform` como coluna, mas **ela é descartada**
  na hora de montar a linha do `t28_campaign`.
- 🔴 **Portanto `t28_campaign` viola o M2 por omissão:** a chave não tem onde guardar a plataforma.
  Uma campanha Google e uma Meta com o mesmo id nativo **colidiriam na mesma linha**, e o MERGE
  sobrescreveria uma com a outra.

🔶 **As "3 identidades" do P-28: não consegui confirmar nem refutar.** Isso é uma afirmação sobre o
**conteúdo** da tabela, não sobre o código, e depende de BigQuery. O que li diz que **o código de hoje
produz uma identidade só**. Se há 3 na tabela, são resíduo histórico de antes do ADR-38, não do
comportamento atual.

> **Para fechar:** `SELECT DISTINCT campaign_id FROM phi_prod.t28_campaign ORDER BY 1` — resolve.

> **Onde li:** `activeVersion` `c54114b3`, nó `[T28] Build MERGE t28_campaign`, constantes `SCHEMA` e
> `KEY_COLUMNS`.

### A28 — `L1 - Abertura de Projeto` lê a DB Clientes. Conflita com o `client_config`?
**Não conflita na escrita. Conflita na cobertura — e é a mesma porta por onde o CHA some.**

**O que o L1 faz:** 16 nós, **zero de BigQuery**. Diário às 12:00 UTC (09h BRT).
`Query Active Clients` (DB **Clientes**, `Status = ATIVO`) → para cada um, checa se já existe Projeto
de `Configuração/Setup` → se não, cria Projeto + 6 itens de Checklist + Telegram listando o que falta.

**Escreve:** Notion `Projetos`, `Checklist`, e blocos de log na página do projeto. **Nada em comum com
`client_config`, que escreve BigQuery.** **Não há violação do M1.**

**Onde eles divergem — e isso importa:** os dois leem a **mesma** DB Clientes com o **mesmo** filtro
`Status = ATIVO`. Mas o `client_config` aplica **um filtro a mais, calado**:
```js
const modelMap = { 'Negócio Local': 'MODEL-VAREJO-001' };
const model_id = modelMap[segmento] || null;
if (!client_id || !model_id) { continue; }   // ← descarta
```
**Cliente ATIVO cujo `Segmento` não seja exatamente `'Negócio Local'` ganha projeto de setup pelo L1 e
é descartado pelo `client_config`.** O gestor vê um cliente sendo onboardado no Notion enquanto o score
nunca o enxerga. **É a explicação operacional do CHA (A15) vista do outro lado.**

> ⚠️ **Achado pequeno e latente:** o `Prepare Checklist Items` monta um payload com
> `parent.database_id = '19fb65e5-c72b-8171-b535-000b978f7811'`, mas o nó que realmente grava
> (`Create Checklist Item`) usa `19fb65e5-c72b-81cd-b006-fe0ffa97a35d` — a Checklist canônica do
> `CLAUDE.md`. **São dois IDs diferentes para "Checklist" no mesmo workflow.** O payload é código morto
> hoje (o nó Notion ignora o `parent`), mas quem migrar esse nó para HTTP cru grava na DB errada.

> **Onde li:** `activeVersion` `c30fee16` (16 nós) · `activeVersion` `99abdada`, nó `Code limpar Notion`.

### A29 — `TMP - Evolution Header Echo` está ATIVO desde 26/05. O que faz? É seguro desligar?
🔶 **Não consegui abrir, porque o workflow está com o acesso MCP desligado.**

```
get_workflow_details(NXOH6XWbsYe0vK8X)
→ "Workflow is not available in MCP. Enable MCP access from the workflow card…"
search_workflow_executions(NXOH6XWbsYe0vK8X)
→ mesmo erro
```

**É o único ativo do parque nessa situação** — `availableInMCP: false`. Os outros 26 abriram.

**O que consegui saber, só pela listagem:**

| Campo | Valor |
|---|---|
| `active` | **true** |
| `triggerCount` | **1** |
| `createdAt` / `updatedAt` | **2026-05-26T23:09:25Z** — iguais |
| `description` | **null** |
| `availableInMCP` | **false** |

**O que isso já permite afirmar:** `createdAt == updatedAt` ao segundo significa que **ele nunca foi
editado depois de criado**. Ativo, com 1 gatilho, há quase 4 meses, sem uma linha de descrição e sem
nenhuma alteração — tem toda a cara de teste de header da Evolution API (WhatsApp) que foi ligado numa
tarde e esquecido. **Mas isso é `deduzo que`, e eu não vou afirmar sobre um workflow que não li.**

**Se é seguro desligar: não respondo sem ler.** Ele tem 1 gatilho ativo — provavelmente um webhook — e
desligar um webhook que alguma coisa externa chama é irreversível na prática (a ponta de fora só
descobre quando quebra. E de todo modo, pelo brief §3, **quem desliga é o Olavo**).

> **O que destrava, e é um clique:** abrir o card do workflow no n8n e ligar o **MCP access**. Feito
> isso eu leio os nós e as execuções, e fecho a A29 e a linha correspondente do contrato.

### A30 — Quantos dos ativos têm `versionId != activeVersionId`?
🔴 **Um. E é o que ninguém olharia: o `WF-EXEC-Intake-Pacing`.**

Varri os **26 ativos legíveis** do parque com
`get_workflow_details(detailLevel: "execution")`, comparando os dois campos:

| Workflow | `versionId` | `activeVersionId` | |
|---|---|---|---|
| **`WF-EXEC-Intake-Pacing`** (`9vyTlIJdvc5nf8Yk`) | `f481f60a-18fe-4de2-b4e7-8b9da2ce65db` | `87b911f2-c294-458e-94a1-9037b1ccf817` | 🔴 **DIFEREM** |
| os outros 25 | — | — | ✅ iguais |

**Ou seja: o que roda hoje em 25 dos 26 é o que está na tela. Em um, não.**

**O agravante, e é o que torna esse caso interessante:** o `WF-EXEC-Intake-Pacing` tem **0 execuções**.
Alguém editou, a publicação não subiu, e **não há execução nenhuma para denunciar a diferença**. O
defeito do PROSP-04 pelo menos rodava errado; este não roda. **Só a comparação dos dois campos pega.**

**Não sei o que a alteração parada muda** — comparar `f481f60a` com `87b911f2` nó a nó é leitura, não
entrevista, e eu posso fazer se o chat-mãe quiser. Não fiz agora porque o workflow é objeto da **B16**
(os `WF-EXEC-*` entram no contrato?) e pode ser trabalho jogado fora.

🔶 **Duas ressalvas de cobertura, ditas de frente:**
1. **`TMP - Evolution Header Echo` não entrou na conta** — não é legível por MCP (A29). **A resposta
   correta é "1 em 26 lidos, com 1 não lido", não "1 em 27".**
2. **Os 7 ativos da Prospecção não entraram**, por ordem do brief (§3: não tocar na Prospecção).
   O parque tem **34 ativos no total**; 27 são do escopo desta frente.

> **Sua aposta estava certa: não era zero.**

> **Onde li:** `get_workflow_details(detailLevel: "execution")` dos 26, campos `workflow.versionId` e
> `workflow.activeVersionId`.

---

## 5. Placar da Lista A

| | |
|---|---|
| Respondidas com leitura direta | **27** de 30 |
| Parciais, com motivo declarado | **3** — A5, A26 (metade), A27 (metade), A29 |
| Bloqueadas por falta de BigQuery | A5 · A26 (existência da tabela) · A27 (conteúdo) |
| Bloqueadas por acesso MCP | A29 |
| Premissas do brief/contrato **refutadas pelo dado** | **4** (§6 abaixo) |
| Achados laterais que ninguém pediu | **11** (§4 abaixo) |

---

## 6. 🔴 Achados laterais — o que apareceu sem ninguém pedir

> O brief (§8 item 5) diz que este é o produto mais valioso da varredura. Em ordem de dano.

### L1 — O score vai **3× para o Notion**, todo dia, e a checagem de unicidade não vê
**O fato medido**, execução 40813 (19/09), nó `Get All Current Scores (Sync)`, **sem truncar**:
**6 linhas para 2 campanhas.** Três cópias **byte a byte** de cada:

```
phi_value 49.68  WARNING  campaign_id 21116045403  CLI-4  EXEC-PHI-20260919100052-21d39f0e   ×3
phi_value 76.25  GOOD     campaign_id 21149189736  CLI-4  EXEC-PHI-20260919100052-21d39f0e   ×3
```

Iguais em **todas** as colunas selecionadas — `phi_value`, `priority_score`, `miv`, `mas`, `tss`,
`fis`, `threshold_used`, `good_streak`. A consequência a jusante foi medida também: `Enrich for Sync`,
`Existe no Notion?` e **`Sync Scores to Notion` rodaram 6 vezes**. **O mesmo score é escrito 3× na
mesma página do Notion, todo dia.**

**Por que nada acusa:** o `Checar unicidade do score` agrupa por
`(client_id, platform, campaign_id, calculated_date)`. **Se as linhas diferirem só no `platform`,
cada uma vira um grupo com `COUNT = 1`** e o `HAVING COUNT(*) > 1` não dispara. O ramo `platform_nula`
também não pega, porque só testa `IS NULL`, não variação de grafia. **A salvaguarda é cega para esta
falha por construção.**

**Deduzo que** a causa seja uma de duas — e não vou escolher sem dado:
- **(a)** `phi_score_history` tem 3 linhas por campanha/dia diferindo **só** no `platform`
  (ex.: `google_ads`, `GOOGLE_ADS`, `undefined`), resíduo de antes do conserto de 10/09; a view
  `phi_score_current` não seleciona `platform`, então elas saem idênticas; ou
- **(b)** a própria view `phi_score_current` multiplica linhas num JOIN.

O `LEFT JOIN dias_bons` da query está descartado como causa: ele agrupa por
`(client_id, campaign_id)`, então é 1:1.

> **Como fechar, em duas queries:**
> ```sql
> SELECT client_id, platform, campaign_id, calculated_date, COUNT(*)
> FROM phi_prod.phi_score_history
> WHERE calculated_date >= DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 7 DAY)
> GROUP BY 1,2,3,4 ORDER BY 5 DESC;
>
> SELECT DISTINCT platform FROM phi_prod.phi_score_history
> WHERE calculated_date >= DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 7 DAY);
> ```
> Se (a) for verdade, o conserto do `Checar unicidade` é trocar o `GROUP BY` por um que **normalize**
> `platform` — e aí ele passa a ver.

**É o achado nº 1 da varredura.** É a única coisa que encontrei que pode estar afetando o número que o
gestor lê.

### L2 — `phi_prod.client_config` tem um segundo writer, escondido no workflow que iam aposentar
Detalhado na **A10**. Repito aqui porque é o que muda plano: **a Fase 2 do ADR-37 mata o writer de
`primary_metric_type` em produção**, e nada avisa.

### L3 — O panorama atribui ao `sw metricas conjuntos` uma escrita que ele não faz
Detalhado na **A2**. `raw_adset_data_rollup` não tem writer nenhum. O contrato (§4.1) e o panorama
(§2) precisam dos dois corrigidos.

### L4 — O Agregador falha toda semana, no mesmo nó, e termina verde
`HTTP Request GBP` → *"The service is receiving too many requests from you"*, **2× por rodada**, nas
duas rodadas retidas (07/09 e 14/09). O erro é roteado corretamente ao `WF-T28-Error-Handler` (o
padrão bom da casa), vira `t28_errors` + tarefa + Telegram — **e ninguém tratou**. `t28_gbp_daily`
nunca recebe dado por causa disso.

### L5 — `workflow_execution_log`: 10 escritas por dia, zero leitores
Detalhado na **A12**. Violação mais limpa do M11 no parque. E o nó com nome de leitor
(`Buscar ID de Sucesso Hoje`) **não lê a tabela**.

### L6 — O Vigia é cego exatamente onde o defeito mora
O ramo `SEM SCORE` do Vigia tem `INNER JOIN phi_prod.client_config cc … AND cc.is_active = TRUE` — **o
mesmo JOIN que descarta o CHA no Pipeline**. Cliente que não está em `client_config` não gera lacuna,
porque não existe para o Vigia. **O vigia herdou a cegueira do vigiado.**

### L7 — Dois digests no Telegram no mesmo minuto, todo dia
`PHI — Digest Diário de Progresso` (08:30 BRT) e `WF-DOC-Telemetria-Diaria` (11:30 UTC = 08:30 BRT),
**mesmo `chatId` 930549271**. Duas mensagens longas, mesmo minuto. Entra direto na **B8**.

### L8 — `WF-EXEC-QualityGate-Pacing` roda 288×/dia para uma fila vazia
A cada 5 minutos, **2 `getAll` `returnAll` no Notion** por rodada. ~576 varreduras/dia. **4.036
execuções retidas** — mais que todo o resto do parque somado. Entra na **B19**.

### L9 — O `'GADS-'` que sobrou vai rotular a primeira campanha Meta como "GOOGLE ADS"
Detalhado na **A14**. Defeito armado, sem sintoma hoje.

### L10 — `t28_campaign` não tem coluna `platform`
Detalhado na **A27**. Violação do M2 por omissão de coluna, não por prefixo.

### L11 — Miudezas que valem uma linha cada
- **M4 quebrado em produção, no Notion do gestor:** o `sw metricas conjuntos` calcula
  `cpa: conversions > 0 ? … : 0` e `roas: cost > 0 ? … : 0` e **grava o `0` direto nas páginas de
  Conjuntos**. Zero virando ausência, na tela onde se decide.
- **`developer-token` do Google Ads hardcoded** em header, em pelo menos 3 nós HTTP
  (`sw metricas conjuntos`, `PHI - Subworkflow Campanhas`, `sw metricas anuncios`). É consequência
  conhecida da Regra Crítica nº 14, mas o mesmo segredo repetido em N lugares é N lugares para
  esquecer quando ele girar.
- **`WF-T28-Orquestrador` com `business_date` fixo em `'2026-06-21'`** (R12 — config de teste que não
  voltou). Se ativado, analisa 21/06 para sempre.
- **`L1` monta payload de Checklist com um `database_id` diferente do que o nó grava** (A28).
- **`Tem Campanha Vinculada?` do `Fechar Otimização` só tem a saída TRUE ligada** — tarefa concluída
  sem campanha some sem registro.
- **`client_config` nunca marca `is_active = false`** — cliente que sai de ATIVO no Notion fica ativo
  para sempre no BigQuery (A9).
- **12 ativos sem descrição** confirmados na listagem: `sw metricas anuncios`, `sw metricas conjuntos`,
  `WF-DOC-Telemetria-Diaria`, `WF-EXEC-Orquestrador`, `WF-EXEC-Intake-Pacing`,
  `WF-EXEC-QualityGate-Pacing`, `TMP - Evolution Header Echo`, e 5 dos 7 `Onb - *`.

---

## 7. 🔄 Hipóteses que o dado desmentiu (R6, corolário)

> Registradas para que a próxima auditoria não levante o mesmo alarme.

| # | O que se acreditava | O que o artefato mostra | Onde |
|---|---|---|---|
| 1 | *"Há até 4 workflows falhando que ninguém identificou"* | **Nenhum.** São 4 workflows **com nome**, um incidente, uma causa (credencial BigQuery), um dia (17/09). O payload do alerta sempre carregou o nome de quem falhou. | A23 |
| 2 | *"2 ativos não produzem nada"* | **1.** O `sw metricas conjuntos` produz: atualizou 3 páginas no Notion em 19/09. Ele **nunca** escreveu em BigQuery — não tem nó para isso. | A2 |
| 3 | *"O `client_config` insere em `phi_dev` e atualiza em `phi_prod`"* | **Um nó só, um MERGE só, `phi_dev` nas duas cláusulas.** O writer de `phi_prod` é outro workflow inteiro — o `PHI - Subworkflow Campanhas`. | A9, A10 |
| 4 | *"Repontar o `client_config` para `phi_prod` quebraria o KIL (S3b)"* — **minha própria expectativa ao começar** | **Não pelo motivo suposto.** O KIL cairia em `WHEN MATCHED`, que **não atualiza `primary_metric_type`**. O risco real é **cliente novo entrando com `ROAS` fixo** — e, maior, **dois writers na mesma coluna**. | A9, A10 |
| 5 | *"`ingestion_step` diz quem tocou por último"* (**M7 do contrato**) | Aqui ele diz **quem tocou primeiro**. Nenhum dos dois writers atualiza o campo no `WHEN MATCHED` (ADR-37 I2). A linha fica `DAILY_ENTRY` carregando números do `GADS_INSERT`. | A13 |
| 6 | *"A cláusula de desempate `DAILY_ENTRY` × `GADS_INSERT` resolve o problema dos 2 writers"* | **Ela nunca é acionada.** Os dois MERGE usam a **mesma chave** → uma linha, não duas. O problema dos 2 writers não é duplicata: é **sobrescrita silenciosa**. | A13 |
| 7 | *"`sw métricas e diagnósticos anúncios` é o antecessor aposentado dos dois"* | É **rascunho nunca publicado** (`activeVersionId: null`) com **0 execuções**. Nunca produziu nada. | A4 |
| 8 | *"`WF-T28-Error-Handler` está ativo sem o T28 rodar, logo nunca dispara"* | **Disparou 4×.** É chamado pelo **Agregador**, que está ativo. `triggerCount: 0` porque o gatilho é `executeWorkflowTrigger`. | A24 |

---

## 8. O que falta, e o que destrava

| Item | Falta o quê | Quem destrava | Custo |
|---|---|---|---|
| **A5** · `raw_ad_data` já teve linha? | acesso ao BigQuery | Olavo (ou um sub-chat com credencial) | 1 query em `__TABLES__` |
| **A26** · `phi_dev.t28_campaign` existe? | acesso ao BigQuery | idem | 1 query |
| **A27** · `t28_campaign` tem 3 identidades? | acesso ao BigQuery | idem | 1 `SELECT DISTINCT` |
| **L1** · o score 3× no Notion | acesso ao BigQuery | idem | 2 queries (estão escritas no §6) |
| **A29** · `TMP - Evolution Header Echo` | **MCP access desligado** no workflow | Olavo, no card do n8n | 1 clique |
| **A11/A22** · cobertura nos 7 `Onb - *` | resposta da **B14** | Olavo | pergunta da Lista B |
| **A30** · o que a alteração parada muda | diff `f481f60a` × `87b911f2` | eu, se o chat-mãe quiser | leitura, ~10 min |

---

## 9. O que NÃO foi feito (e é de propósito)

- **Nenhum workflow foi alterado, ativado, desativado, publicado ou executado.** Nem os que não
  produzem nada. Toda leitura foi `get_workflow_details`, `get_workflow_version`,
  `search_workflow_executions` e `get_workflow_execution`.
- **A Prospecção não foi tocada.** Os 7 ativos `PROSP-*` / `Comercial - *` ficaram fora de toda
  varredura, inclusive da contagem da A30.
- **O §4 do `CONTRATO-PHI.md` não foi preenchido.** Por ordem do brief (§2): a Etapa 3 vem depois da
  Etapa 2, para não escrever o as-built de um workflow que o Olavo pode mandar aposentar.
- **Os 7 `Onb - *` não foram abertos**, pelo mesmo motivo — são o objeto da B14.

