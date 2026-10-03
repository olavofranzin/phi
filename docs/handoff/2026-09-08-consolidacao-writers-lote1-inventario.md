# Lote 1 — Inventário de Writers (COMPLETO)

- **Data:** 2026-09-08 · **Branch:** `claude/consolidacao-2026-08`
- **Brief:** `docs/handoff/2026-09-08-consolidacao-writers-subchat-brief-v2.md` (§5)
- **Método:** leitura nó a nó do JSON dos workflows **vivos** via n8n MCP + `search_workflow_executions`.
  **Read-only cumprido** — nenhuma alteração em workflow, BigQuery ou Notion.
- **Companheiro:** `2026-09-08-consolidacao-writers-lote1-execution-log.md` (responde a pergunta nº 1 do §4).

> ⚠️ **O repositório está defasado frente ao n8n.** Este inventário vale para o n8n vivo.
> Auditar pelo git leva a conclusões erradas — ver §6.

---

## 1. Matriz de propriedade — quem escreve o quê

| Workflow (id) | Ativo | Fonte | Destino (+ `ingestion_step`) | Grão | Frequência | Conflito |
|---|---|---|---|---|---|---|
| `sw metricas campanhas` `W571K320aqIHsdtH` | ✅ | Google Ads v22 · Meta · Notion | **BQ `raw_campaign_data`** (`DAILY_ENTRY`) + Notion Campanhas + Observações Diárias | campanha × dia | 04:00 BRT (via orquestrador) | 🔴 **`raw_campaign_data` com `PHI - Subworkflow Campanhas`** |
| `PHI - Subworkflow Campanhas` `b1pbn8qmzCNTufTp` | ✅ | Google Ads v23 · Notion (leitura) | **BQ `raw_campaign_data`** (`GADS_INSERT`) + **BQ `phi_prod.client_config`** | campanha × dia | 07:00 BRT (via Pipeline_v2) | 🔴 **idem, e ele vence** · 🟡 `client_config` |
| `PHI - Pipeline_v2` `ITWG3Ge0asXtUM8U` | ✅ | BQ · Notion | **BQ `phi_score_history`** + `workflow_execution_log` + Notion (`Score Diário (0-100)`, `Status Geral da Campanha`, Tasks, Checklist, Log de Otimizações, `Otimização Ativa?`) | campanha × dia | 07:00 BRT | 🔴 **`Otimização Ativa?` com `PHI - Fechar Otimização`** |
| `sw metricas conjuntos` `t0DH5N5maws4egnG` | ✅ | Google Ads v23 · Meta v21 | **Só Notion** — DB Conjuntos de Anúncios (12 campos) | conjunto × dia | via orquestrador | ✅ nenhum |
| `sw metricas anuncios` `vVAdXAJh6MW2Z5Hp` | ✅ | Google Ads · Meta | **BQ `raw_ad_data`** (`DAILY_ENTRY`, **2 nós**) + Notion Anúncios | anúncio × dia | via orquestrador | ✅ nenhum (colunas disjuntas) |
| `PHI — Agregador Multi-fonte` `4sdG2UKMCBuFq8xn` | ✅ | Google Ads · GA4 · GBP · Meta · Clarity | **BQ `t28_campaign`, `t28_adset`, `t28_ga4_landing`, `t28_gbp_daily`, `t28_clarity_daily`, `t28_meta_campaign`** | vários | semanal (seg 09h) + mensal | ✅ nenhum (lê `raw_campaign_data`) |
| `PHI - Fechar Otimização` `83vfKD8XMYmjZjFQ` | ✅ | Notion | **Só Notion** — `Otimização Ativa?` (checkbox) | tarefa | **de hora em hora** | 🔴 **com `Pipeline_v2`** |
| `client_config` `SI5NSzRb8lVUz74RwOhIT` | ✅ | Notion Clientes | **BQ `phi_dev.client_config`** ⚠️ | cliente | Notion Trigger (poll 1h) | 🔴 **dataset errado** (§4) |
| `WF-DOC-Telemetria-Diaria` `VubalOUaoBteCyC6` | ✅ | Notion (7 DBs) | **Só Notion** — Snapshots de Telemetria | métrica × dia | 08:30 BRT | ✅ nenhum (idempotente) |
| `PHI — Digest Diário` `rhobbBEeQaiWIuiF` | ✅ | Notion Registro de Execuções | Telegram (não persiste) | — | 08:30 BRT | ✅ nenhum |

### Cobertura por tabela

| Tabela | Writers | Situação |
|---|---|---|
| `raw_campaign_data` | **2** | 🔴 conflito — ver execution-log |
| `raw_ad_data` | 2 nós do mesmo workflow, **colunas disjuntas** | ✅ **é o padrão certo** |
| `t28_*` (6 tabelas) | 1 (Agregador) | ✅ dono único |
| `phi_score_history` | 1 (Pipeline_v2) | ✅ dono único |
| `phi_prod.client_config` | 1 (`PHI - Subworkflow Campanhas`) — **só `UPDATE`, nunca `INSERT`** | 🔴 ninguém cria linha |
| `phi_dev.client_config` | 1 (`client_config`) | 🔴 dataset errado |
| `workflow_execution_log` | 1 (Pipeline_v2) | ✅ dono único |

---

## 2. Sobreposições — a lista que vira o ADR-37

### S1 🔴 `raw_campaign_data` — dois writers, o rótulo mente
Detalhado no execution-log. Resumo: `DAILY_ENTRY` insere às 04h, `GADS_INSERT` atualiza às 07h
e **sobrescreve `ingestion_step` e `execution_id`**; o outro não. Colunas de janela (`cost_3d`,
`conversions_7d`…) ficam do primeiro; as de D-1 do segundo. **Linha com duas origens, sem marcação.**

### S2 🔴 `Otimização Ativa?` (Notion Campanhas) — dois donos, cadências diferentes
- `PHI - Pipeline_v2`: nós `Update otimização ativa` e `Auto-Close: Desativar Otimização` — **1×/dia**.
- `PHI - Fechar Otimização` `83vfKD8XMYmjZjFQ`: nó `Desmarcar Otimização Ativa` — **de hora em hora**.

Como o segundo roda 24× mais, **na prática ele é o dono efetivo** e pode desfazer o que o
Pipeline_v2 marcou minutos antes. Mesmo padrão do S1: quem roda por último vence, sem ninguém decidir.

> Correção ao §4 do brief: `PHI - Fechar Otimização` **não escreve o Log de Otimizações** —
> escreve só esse checkbox. Quem cria o Log de Otimizações é o `Pipeline_v2`.

### S3 🟡 `client_config` — dois writers, datasets diferentes
- `client_config` `SI5NSzRb8lVUz74RwOhIT` → **`phi_dev.client_config`** (client_id, client_name, model_id, primary_metric_type, is_active, created_at).
- `PHI - Subworkflow Campanhas` → **`phi_prod.client_config`** (só `primary_metric_type`).

Não colidem porque estão em **datasets diferentes** — e, pior, **discordam**: para o CLI-4 o `prod`
diz `CPA` (correto) e o `dev` diz `ROAS` (default hardcoded). Verificado no BigQuery — ver §4.

### S4 🟢 `raw_ad_data` — dois writers que funcionam (usar de modelo)
`Code Montar SQL` (métricas) e `Code Montar SQL Criativo` (sinais de criativo) fazem MERGE na
mesma chave, **no mesmo workflow, em sequência, com conjuntos de colunas disjuntos**. Nenhum
sobrescreve o outro. **É o padrão que o ADR-37 deve generalizar.**

---

## 3. A intenção que existia e se perdeu

Dois consumidores independentes escreveram **a mesma lógica de desempate**, preferindo `DAILY_ENTRY`:

```sql
ROW_NUMBER() OVER (
  PARTITION BY client_id, campaign_id, date
  ORDER BY CASE WHEN ingestion_step = 'DAILY_ENTRY' THEN 0 ELSE 1 END
) AS rn
```

- `PHI - Pipeline_v2` → nó `Calcular e Persistir PHI Score`
- `PHI — Agregador Multi-fonte` → nó `[T28] BQ Read raw_campaign_data`

**Nenhum dos dois surte efeito**, por dois motivos somados: existe só 1 linha por chave (o dedupe
não tem o que desempatar) **e** o rótulo dessa linha já foi sobrescrito para `GADS_INSERT`.

> Isto é evidência de design, não suposição: **alguém quis que o `DAILY_ENTRY` fosse o canônico.**
> A preferência foi escrita duas vezes e nunca se realizou — em silêncio, sem erro.

Agravante de nomenclatura: o Agregador expõe as colunas como `daily_entry_execution_id` e
`source_ingestion_step`. Quem consome o T28 acredita estar lendo linhagem do Daily Entry;
está lendo a do GADS_INSERT.

---

## 4. 🔴 `client_config` — VERIFICADO NO BIGQUERY (execução n8n 36946)

> **Correção da minha própria hipótese.** Eu havia escrito que `phi_prod.client_config` podia estar
> "parado em março". **Está errado** — ele foi escrito hoje às 07:01 BRT. Mas a **consequência** que
> eu temia continua de pé, por um mecanismo diferente. Segue o dado bruto.

### O que o BigQuery devolveu

`phi_prod.client_config` (2 linhas):

| client_id | client_name | primary_metric_type | is_active | created_at | updated_at |
|---|---|---|---|---|---|
| CLI-4 | KILDARE & BRUNA BECKER | **CPA** | true | 2025-02-19 | **2026-09-08 07:01:08** |
| CLI-5 | IMPACTO WEB CURSOS | ROAS | false | 2025-02-19 | 2026-07-04 10:29:55 |

`phi_dev.client_config` (2 linhas, mesmas colunas):

| client_id | client_name | primary_metric_type | is_active | created_at | updated_at |
|---|---|---|---|---|---|
| CLI-4 | KILDARE & BRUNA BECKER | **ROAS** | true | 2025-02-19 | **1969-12-31 (epoch/nulo)** |
| CLI-5 | IMPACTO WEB CURSOS | ROAS | false | 2025-02-19 | 2026-07-04 10:29:56 |

### 4.1 ✅ Descartado — o prod não está parado

`phi_prod.client_config` recebeu escrita **hoje às 07:01:08 BRT**, exatamente na janela do
`PHI - Pipeline_v2` → `PHI - Subworkflow Campanhas` (nó `Execute SQL client_config sincronizado`).
Os dois clientes existem nas duas tabelas. **Ninguém está sendo barrado do score hoje.**

### 4.2 🔴 Confirmado — ninguém INSERE em `phi_prod.client_config`

O único writer de `phi_prod.client_config` no n8n é o `PHI - Subworkflow Campanhas`, e o SQL dele é
**`UPDATE` puro**:

```sql
UPDATE `phi_prod.client_config`
SET primary_metric_type = '...', updated_at = CURRENT_TIMESTAMP()
WHERE client_id = '...';
```

`UPDATE` **não cria linha**. Então, para um cliente novo cadastrado no Notion:

1. o workflow `client_config` o insere em **`phi_dev`**;
2. **nada** o insere em `phi_prod`;
3. o `UPDATE` acima não faz nada, porque a linha não existe;
4. o `INNER JOIN phi_prod.client_config` do cálculo do score **o elimina** — sem erro, sem alerta.

As duas linhas que existem em `phi_prod` têm `created_at` de **2025-02-19** — anteriores a todos os
workflows inventariados. **Foram criadas por fora do n8n.**

- **Fato verificável:** o SQL de todos os writers (inventário completo), o `UPDATE` sem `INSERT`, e
  as 4 linhas acima.
- **Limite honesto:** afirmo que **nenhum workflow do n8n** insere em `phi_prod.client_config` —
  inventariei todos. **Não posso afirmar** que não exista um caminho fora do n8n (script manual,
  carga pontual). O `created_at` de fev/2025 sugere justamente uma carga manual inicial.
- **Como fechar:** cadastrar um cliente-teste no Notion e ver se ele aparece em `phi_prod`. Ou
  perguntar ao Olavo como CLI-4 e CLI-5 entraram lá.

### 4.3 🔴 Achado novo — o `primary_metric_type` do KIL diverge entre os datasets

**`prod` diz CPA, `dev` diz ROAS, para o mesmo cliente CLI-4.**

O `prod` está **certo**: o KIL é o cliente de referência com métrica-mãe CPA (meta 5,20 na Barbearia,
3,50 no Salão, conforme o `CLAUDE.md`).

O `dev` está **errado por construção**. O nó `Code limpar Notion` do workflow `client_config` deriva
a métrica de um mapa fixo:

```js
const metricDefaultMap = { 'Negócio Local': 'ROAS' };
const primary_metric_type = metricDefaultMap[segmento] || 'ROAS';
```

Ou seja: **sempre `ROAS`**, ignorando a Métrica-Mãe real do Notion. Já o `PHI - Subworkflow Campanhas`
lê a Métrica-Mãe de verdade (`props['Métrica-Mãe'].multi_select[0].name`) e escreve no `prod`.

> **A sobreposição S3 é pior do que eu havia descrito.** Não são "dois writers em datasets
> diferentes": são **dois writers com semânticas diferentes para o mesmo campo** — um lê o dado
> real, o outro chuta um default. Hoje isso não faz mal porque estão em datasets separados e o
> `prod` (o certo) é quem o score lê. **Mas é uma bomba armada:** basta alguém "corrigir" o
> `client_config` para apontar ao `phi_prod` — a correção óbvia, que eu mesmo recomendei antes de
> ver os dados — para o KIL virar ROAS e o score quebrar em silêncio.
>
> **O ADR-37 não pode simplesmente trocar `phi_dev` por `phi_prod` nesse workflow.** Tem que
> corrigir a derivação da métrica primeiro.

### 4.4 Nota lateral
O nó viola a **Regra Crítica nº 1** do `CLAUDE.md` (usar `dataset.table` sem project ID entre
backticks) — é justamente o tipo de descuido que deixa um `phi_dev` passar despercebido.

### 4.5 Rastro da verificação
Workflow temporário `TMP-Lote1 Leitura client_config` (`52W4DEFqTBcpciCb`), dois `SELECT *` sem
nenhuma escrita, execução **36946** (sucesso, 2026-09-08 18:28 UTC). **Arquivado logo após a
leitura**, no padrão da execução 32695.

## 5. Inativos — confirmados mortos

Todos verificados com `active: false` no n8n em 2026-09-08:

`Daily Entry` `zGgIqiLlo5iAn8ud` · `Daily Entry` `demo` · `PHI - Pipeline` `nFJpI3zYsk0Wst5O` ·
`PHI - Fase 2 Cálculo Score` `X1eI3_aZ32EE3owgeDi_r` · `PHI - Fase 3 Operacional` `LIaXSq-WoaF1yj3gF30Rj` ·
`sw phi pipeline_v2` `MOGG0bI51pNHevEJ` · `sw métricas e diagnósticos anúncios` `uqEHxuJPWRiZS6ai` ·
`sw metricas campanhas copia seg` `ffEyTUED2p4Rq2Iw` · `sw métricas conjuntos copia seg` `nPBVPzw2qK7epQtU` ·
`sw métricas e diagnósticos anúncios copia seg` `sZYkRjHcFwEatKOJ` · `WF-T28-Analise-Campaign` `fhYmJH0o9BW1IO4i` ·
`WF-T28-Orquestrador-Analises` `8Q5ofmAZju0hTN08` · `PHI - Alerta de Erro (Telegram)` `Oj1RbA0laZTzJZPx` ·
`phi-production` `NXWQ9WBk5-G08X-46VPKO`

**⚠️ Não arquivar o `Daily Entry`** enquanto o `sw metricas campanhas` não for confirmado como
cobertura de 100% do que ele fazia (guardrail do brief).

### Precedente valioso — já resolvemos um caso destes
`[APOSENTADO 2026-07-21] PHI - Loop Alerta Fase 1 — NÃO REUTILIZAR` `JqPwFD9udCq2hRPw` era um
**segundo criador de tasks em paralelo (double-write)**. A solução foi: consolidar a lógica inline
no `Pipeline_v2`, **desabilitar o nó chamador** (confirmei: `Chamar Loop Alerta Fase 1` está
`disabled: true`), desativar o workflow, **renomear com o carimbo `[APOSENTADO <data>]`** e pôr um
sticky explicando o porquê e proibindo reuso.

> **O ADR-37 deve repetir esse procedimento** — é o padrão da casa e funcionou. E é o único
> workflow do inventário que passa no teste da regra **R5**: a intenção está escrita nele.

---

## 6. Estado das descrições (regra R5)

**11 dos 14 workflows ativos não têm descrição nenhuma** (`description: null`).

| Workflow | Descrição |
|---|---|
| `PHI — Agregador Multi-fonte` | ✅ boa |
| `PHI — Digest Diário` | ✅ boa |
| `[APOSENTADO] Loop Alerta Fase 1` | ✅ exemplar |
| `sw metricas campanhas` · `sw metricas conjuntos` · `sw metricas anuncios` · `operador unico metricas` · `PHI - Pipeline_v2` · `PHI - Subworkflow Campanhas` · `PHI - Fechar Otimização` · `client_config` · e os inativos | ❌ `null` |

Textos propostos em §7. **Não aplicados** — escrever no n8n sai do read-only do Lote 1 (§8 do brief).

---

## 7. Descrições propostas (aguardando OK para aplicar)

**`operador unico metricas` `cLcimNoefTOnVVbd`**
> Orquestrador diário (04:00 BRT) das métricas do PHI: gera o `execution_id` da rodada e chama em
> sequência os sub-workflows de campanhas, conjuntos e anúncios, alertando no Telegram se algum
> falhar. Existe para dar um único ponto de entrada e uma única linhagem às três granularidades.

**`sw metricas campanhas` `W571K320aqIHsdtH`**
> Ingestão diária no grão campanha × dia: busca Google Ads (D-1/D-3/D-7) e Meta, escreve
> `phi_prod.raw_campaign_data` com `ingestion_step='DAILY_ENTRY'` e atualiza a DB Campanhas e as
> Observações Diárias no Notion. **É cópia do workflow `Daily Entry` (`zGgIqiLlo5iAn8ud`) e entrou
> no lugar dele — por isso o original está inativo.** Chamado pelo `operador unico metricas`.

**`Daily Entry` `zGgIqiLlo5iAn8ud`**
> **INATIVO POR SUCESSÃO — não arquivar sem ADR.** Foi o writer original de
> `phi_prod.raw_campaign_data` no grão campanha × dia. Sucedido em 2026-06 pelo `sw metricas
> campanhas` (`W571K320aqIHsdtH`), que é uma cópia dele. Mantido como referência até se confirmar
> que o sucessor cobre 100% do comportamento.

**`PHI - Subworkflow Campanhas` `b1pbn8qmzCNTufTp`**
> Ingestão diária no grão campanha × dia via Google Ads API v23, chamada pelo `PHI - Pipeline_v2`
> (07:00 BRT). Escreve `phi_prod.raw_campaign_data` com `ingestion_step='GADS_INSERT'` e sincroniza
> `primary_metric_type` em `phi_prod.client_config`. **⚠️ Escreve a MESMA tabela que o
> `sw metricas campanhas` e roda depois dele, sobrescrevendo `ingestion_step` e `execution_id`.
> Sobreposição S1, a resolver no ADR-37.**

**`PHI - Fechar Otimização` `83vfKD8XMYmjZjFQ`**
> De hora em hora, encontra tarefas de Otimização de Campanha concluídas no Notion e desmarca
> `Otimização Ativa?` na campanha vinculada. **⚠️ O `PHI - Pipeline_v2` também escreve esse campo
> (1×/dia); como este roda 24× mais, é o dono efetivo. Sobreposição S2, a resolver no ADR-37.**

**`client_config` `SI5NSzRb8lVUz74RwOhIT`**
> Sincroniza a DB Clientes do Notion para a tabela `client_config` do BigQuery a cada mudança
> (Notion Trigger, poll de 1h). **⚠️ Escreve em `phi_dev.client_config`, mas o `PHI - Pipeline_v2`
> lê `phi_prod.client_config` — ver §4 do inventário do Lote 1.**

---

## 8. Recomendações para o ADR-37 (Lote 2)

1. **Writer canônico de `raw_campaign_data`.** Aposentar o `GADS_INSERT` pelo procedimento do
   `[APOSENTADO]` (§5) e ficar com o `sw metricas campanhas`. Razões: já é o preferido pelos dois
   consumidores (§3), usa `Math.round` em vez de `parseInt` truncante, e escreve as janelas 3d/7d
   que o outro não escreve.
2. **`conversions` → FLOAT64.** O grão anúncio (`raw_ad_data`) já faz certo. Alinhar o grão campanha.
3. **Linhagem que sobreviva ao UPDATE.** `ingestion_step` é sobrescrito. Com writer único o problema
   some; enquanto houver dois, nenhum `UPDATE SET` pode tocar `ingestion_step`/`execution_id` de
   linha alheia.
4. **Um dono por campo do Notion.** `Otimização Ativa?` → só o `PHI - Fechar Otimização`
   (é quem tem a cadência certa). `Score Diário`/`Status Geral` → só o `Pipeline_v2`.
5. **`client_config` — nesta ordem, e só nesta ordem:** (a) corrigir a derivação de
   `primary_metric_type`, que hoje é um default fixo `ROAS` ignorando a Métrica-Mãe do Notion;
   (b) trocar o `MERGE` para `phi_prod`; (c) garantir que exista um writer que **INSIRA** em
   `phi_prod.client_config`, porque hoje nenhum insere (§4.2). Inverter (a) e (b) quebra o score
   do KIL em silêncio.
6. **Atualizar o ADR-010** com a cadeia real e as descrições do §7.
7. **Sincronizar o repositório com o n8n**, ou parar de versionar JSON de workflow. Hoje o git
   descreve um sistema que não existe (§6) — é exatamente o custo que a regra R2 do `CLAUDE.md`
   descreve: doc desatualizada faz decidir errado.
