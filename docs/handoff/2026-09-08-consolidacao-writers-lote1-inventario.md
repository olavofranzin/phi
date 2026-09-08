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
| `phi_prod.client_config` | 1 (`PHI - Subworkflow Campanhas`, só `primary_metric_type`) | 🟡 parcial |
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

Não colidem porque estão em **datasets diferentes** — o que é justamente o problema (§4).

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

## 4. 🔴 Achado fora do escopo do brief — `client_config` escreve em `phi_dev`

O workflow `client_config` `SI5NSzRb8lVUz74RwOhIT` está **ativo desde 2026-03-04** (Notion Trigger,
poll de hora em hora) e seu único nó de escrita faz:

```sql
MERGE `project-0e7c58d4-656f-49e8-807.phi_dev.client_config` AS target
```

**`phi_dev`, não `phi_prod`.** Enquanto isso o `PHI - Pipeline_v2` lê `phi_prod.client_config`
(nó `Buscar Clientes Ativos`) e faz `INNER JOIN phi_prod.client_config ... WHERE is_active = TRUE`
no cálculo do score.

**Se essa leitura estiver certa, um cliente novo cadastrado no Notion nunca chega ao `phi_prod`
por esse caminho — e, sem linha em `client_config`, o `INNER JOIN` o elimina do score.**

- **Fato verificável:** o SQL do nó, o dataset, e o workflow ativo. Li os dois lados.
- **Não confirmado:** se `phi_prod.client_config` é populado por outra via (à mão, por exemplo).
  **Não rodei query no BigQuery.**
- **Como confirmar:** `SELECT client_id, is_active, created_at, updated_at FROM phi_prod.client_config ORDER BY created_at DESC`
  e comparar com a DB Clientes do Notion. Se o prod estiver parado em março, está confirmado.

Nota: esse nó também viola a **Regra Crítica nº 1** do `CLAUDE.md` (usar `dataset.table` sem project ID).

---

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
5. **Corrigir o `client_config`** para `phi_prod` — depois de confirmar §4 no BigQuery.
6. **Atualizar o ADR-010** com a cadeia real e as descrições do §7.
7. **Sincronizar o repositório com o n8n**, ou parar de versionar JSON de workflow. Hoje o git
   descreve um sistema que não existe (§6) — é exatamente o custo que a regra R2 do `CLAUDE.md`
   descreve: doc desatualizada faz decidir errado.
