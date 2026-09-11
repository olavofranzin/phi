# Execution log — Consolidação dos Writers · Lote 1 (inventário, read-only)

- **Data:** 2026-09-08
- **Branch:** `claude/consolidacao-2026-08`
- **Brief:** `docs/handoff/2026-09-08-consolidacao-writers-subchat-brief-v2.md`
- **Método:** leitura nó a nó via n8n MCP (workflows vivos) + `search_workflow_executions`.
  Nenhuma alteração em workflow, BigQuery ou Notion. Read-only cumprido.

---

## 1. Resposta à pergunta nº 1 do §4 — quem carimba `step=GADS_INSERT`?

**Resposta: (b) — dois writers.** A tabela `phi_prod.raw_campaign_data` é escrita por
**duas cadeias independentes**, ambas ativas, todo dia.

| # | Cadeia | Workflow que escreve | Nó | `ingestion_step` | Horário real (UTC / BRT) |
|---|---|---|---|---|---|
| 1 | `operador unico metricas` `cLcimNoefTOnVVbd` → | `sw metricas campanhas` `W571K320aqIHsdtH` | `Code Montar SQL` → `Execute SQL inserir daily entry` | `'DAILY_ENTRY'` | 07:00 UTC / **04:00 BRT** |
| 2 | `PHI - Pipeline_v2` `ITWG3Ge0asXtUM8U` → | `PHI - Subworkflow Campanhas` `b1pbn8qmzCNTufTp` | `Execute SQL  INSERT raw_campaign_data` | `'GADS_INSERT'` | 10:00 UTC / **07:00 BRT** |

Trecho literal do nó `Execute SQL  INSERT raw_campaign_data` (`b1pbn8qmzCNTufTp`):

```sql
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
```

### Por que o BQ mostra 100% `GADS_INSERT` (execução 32695)

Não é porque só existe um writer. É porque **o segundo writer roda depois e sobrescreve o rótulo**:

1. 04:00 BRT — `sw metricas campanhas` faz `MERGE`, não acha a linha do dia, **INSERT** com
   `ingestion_step='DAILY_ENTRY'`.
2. 07:00 BRT — `PHI - Subworkflow Campanhas` faz `MERGE`, **acha** a linha e **UPDATE**, e o
   `UPDATE SET` dele **inclui** `ingestion_step = 'GADS_INSERT'`.

Assimetria decisiva: o `UPDATE SET` do `sw metricas campanhas` **não** inclui `ingestion_step`
nem `execution_id`; o do `PHI - Subworkflow Campanhas` **inclui os dois**. Resultado: quem
escreve por último, e cujo rótulo sobrevive, é sempre o **GADS_INSERT**.

**Consequência:** `ingestion_step` não é confiável como identificador de writer. Ele diz apenas
"quem escreveu por último", não "de onde veio o número".

### Execuções confirmadas (não é workflow morto)

Ambas as cadeias rodaram com `status: success` em 05, 06, 07 e 08/09/2026, sempre no mesmo
horário. `operador unico metricas` cron `0 4 * * *`; `PHI - Pipeline_v2` `triggerAtHour: 7`.

### A linha final é um Frankenstein de dois writers

O `GADS_INSERT` sobrescreve `cost`, `conversions`, `clicks`, `impressions`, `revenue`,
`primary_metric_goal` e `execution_id`. Ele **não toca** em `cost_3d`, `conversions_3d`,
`cost_7d`, `conversions_7d`, `data_source` nem `platform` — esses ficam com o valor que o
`DAILY_ENTRY` gravou 3 horas antes. Cada linha mistura duas origens sem marcação.

---

## 2. Fórmula de `conversions` no `sw metricas campanhas` (hipótese herdada do §4)

**A hipótese do brief está DESCARTADA para o writer vivo. O bug `round(CPA)` já foi corrigido.**

Estado atual do nó `Code Montar SQL` (`W571K320aqIHsdtH`, versão `updatedAt 2026-08-09`):

```js
const intNum = (value) => Math.round(num(value));
const conversions   = intNum(unified.raw_conversions_d1 ?? calculated.raw_conversions_d1 ?? mD1.conversions);
const conversions3d = intNum(unified.raw_conversions_3d ?? calculated.raw_conversions_3d ?? mD3.conversions);
const conversions7d = intNum(calculated.raw_conversions_7d ?? unified.raw_conversions_7d ?? mD7.conversions);
```

Resolução da cadeia de fallback (verificada nó a nó):

- `raw_conversions_d1` e `raw_conversions_3d` **não existem** em `Code Unificar Períodos` nem em
  `Code Cálcula Métricas` → resolvem para `mD1.conversions` / `mD3.conversions`, ou seja
  **`metrics.conversions` direto da API do Google Ads**.
- `raw_conversions_7d` **existe** em `Code Cálcula Métricas`
  (`conversions_7d: round(raw7.conversions, 6)`) → também é contagem real, com 6 casas.

**Semântica atual: contagem real de conversões, arredondada para inteiro** (`Math.round`) por
causa do `CAST(... AS INT64)`. Não é `round(CPA)`.

### ⚠️ O repositório está defasado — minha primeira leitura foi de um arquivo morto

`workflows/subworkflows/phi_subworkflow_campaign_metrics.json` (último commit `c6053c0`,
16/06/2026) **ainda contém o bug**:

```js
const conversions = Math.round(getNum(prop('Métrica-Mãe 1D') ?? prop('Valor Métrica-Mãe 1D')));
```

O n8n vivo foi atualizado em 09/08/2026 e o repo nunca acompanhou. Os `id` também divergem
(repo: UUID `a8bc8de7-...`; vivo: `W571K320aqIHsdtH`). **O mesmo vale para
`workflows/main/phi_subworkflow_campanhas.json`**: a cópia do repo não tem o nó
`Execute SQL  INSERT raw_campaign_data` — ou seja, o writer do `GADS_INSERT` é invisível para
quem só olhar o git. Qualquer auditoria feita pelo repo chega à conclusão errada.

---

## 3. Onde o `round(CPA)` ainda existe

Fora do writer vivo, mas presente no n8n:

- `Daily Entry` `zGgIqiLlo5iAn8ud` — **inativo**, mantém a fórmula antiga. Não escreve mais.
- `sw metricas anuncios` `vVAdXAJh6MW2Z5Hp` — **ativo**, carimba `'DAILY_ENTRY'`. Escreve outro
  grão (anúncio), a confirmar no restante do Lote 1.

---

## 4. Retificação ao §4 do brief (reconciliação de nomes)

O brief v2 supôs que `PHI - Subworkflow Campanhas` `b1pbn8qmzCNTufTp` fosse o
`phi_subworkflow_campaign_metrics`, isto é, o writer do Notion (`Score Diário`/`phi_score`).

**Verificado nó a nó: não é.** Os 14 nós de `b1pbn8qmzCNTufTp` são:
lê Notion (Campanhas, só leitura) → lê `client_goal_history` → chama Google Ads API v23 →
`MERGE raw_campaign_data` com `GADS_INSERT` → `UPDATE client_config`. **Não escreve nenhum campo
do Notion.**

Ou seja: **a v1 do brief estava certa** ("forte candidato a ser o GADS_INSERT") e a retificação
da v2 introduziu o erro. O writer do Notion é outro workflow, ainda a identificar no Lote 1.

Também vale corrigir: o arquivo `workflows/subworkflows/phi_subworkflow_campaign_metrics.json`
tem, internamente, `"name": "sw metricas campanhas"`. O nome do arquivo não corresponde ao
workflow que o brief chama de `phi_subworkflow_campaign_metrics`.

---

## 5. Pistas para o Lote 2 (ADR-37)

- **`ingestion_step` não serve como linhagem.** Sobrescrito pelo último writer. O ADR-37 precisa
  de uma coluna de linhagem que o `UPDATE` não possa apagar, ou de um writer único.
- **`parseInt` trunca.** O writer vencedor (`GADS_INSERT`) usa
  `conversions: parseInt(metrics.conversions || 0)` no nó `Code transformar retorno Google Ads`.
  `parseInt` **trunca**, não arredonda: 4,7 conversões viram 4. Já o `DAILY_ENTRY` usa
  `Math.round` (4,7 → 5). Dois arredondamentos diferentes na mesma coluna, e o que trunca é o que
  vence. **Candidato a explicar parte do subcount 321 vs 481** do Salão citado no §3 do brief —
  é hipótese, ainda não medida.
- **`primary_metric_goal` tem dois donos** e vem de fontes diferentes: `client_goal_history` (BQ)
  no `GADS_INSERT`, `Meta da Métrica-mãe` (Notion) no `DAILY_ENTRY`. O do BQ vence.
- **`revenue`** só é escrito pelo `GADS_INSERT`.
- **`execution_id`** é sobrescrito pelo `GADS_INSERT`, apagando o `source_execution_id` que o
  `operador unico metricas` propaga (`EXEC-yyyyLLdd-HHmmss`).
- **ADR-010:** não está "só desatualizado no nome". Existem de fato dois writers ativos na mesma
  tabela. O princípio *um destino, um dono* está violado hoje.

---

## 6. Estado e próximo passo

- **Feito:** pergunta nº 1 do §4 respondida; hipótese herdada de `conversions` verificada e
  descartada para o writer vivo; 2 workflows inventariados nó a nó (`W571K320aqIHsdtH`,
  `b1pbn8qmzCNTufTp`) + 1 orquestrador (`cLcimNoefTOnVVbd`) + 1 chamador (`ITWG3Ge0asXtUM8U`).
- **Pendente do Lote 1:** demais workflows do §4 (`sw metricas conjuntos`, `sw metricas anuncios`,
  Agregador T28, Fechar Otimização, telemetria), tabelas `raw_ad_data`, `t28_*`,
  `phi_score_history`; identificar o writer do Notion (`Score Diário`/`phi_score`); confirmar os
  INATIVOS; descrições fiéis (§5.1).
- **Não feito ainda (aguardando OK):** registro no Notion (§9.1), atualização do painel (§9.3).

