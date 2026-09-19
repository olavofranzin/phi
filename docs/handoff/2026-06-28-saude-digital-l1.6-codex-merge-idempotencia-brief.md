# Brief Codex — L1.6: idempotência BQ (MERGE) nos t28_* inserts

> **STATUS:** A executar. Branch `claude/agentic-agency-planning-KwJEw`.
> **Origem:** L2 fechado (smoke `11755` PASS). Pendência aberta em
> `ESTADO §5` (2026-06-28): inserts append-only duplicam a cada run; Schedule
> Triggers ativos → produção acumula duplicatas silenciosamente.
> **Workflow alvo:** PHI — Agregador `4sdG2UKMCBuFq8xn` (active `412d874b`).
> **Pré-leitura:** DDL `docs/strategic-planning/agregador-t28/ddl/phi_prod_t28_tables.sql`
> (fonte da verdade dos schemas) + o node `Execute SQL inserir daily entry` do
> workflow `sw metricas anuncios copy` (`vVAdXAJh6MW2Z5Hp`) como **template do
> padrão MERGE** já em uso no projeto.

---

## 0. Problema e decisão de abordagem

**Problema:** os 6 `[T28] BQ Insert t28_*` usam `operation: insert` (streaming).
Streaming é append-only (re-run duplica) e prende o streaming buffer ~90min
(DELETE/MERGE bloqueados nas linhas recém-inseridas).

**Decisão: trocar streaming `insert` por `MERGE` via `operation: executeQuery`
(DML).** DML não passa por streaming buffer (linhas imediatamente consistentes e
mutáveis), e o MERGE por chave de negócio torna o re-run idempotente. É o mesmo
padrão que o Daily Entry (`sw metricas`) já usa com sucesso em
`raw_campaign_data` (`MERGE ... USING (SELECT <literais>) ON ...`).

**Não usar** DELETE+INSERT (esbarra no streaming buffer em smokes back-to-back)
nem staging+TRUNCATE (TRUNCATE também bloqueado pelo buffer). MERGE all-DML é o
caminho limpo.

## 1. Chaves de negócio por tabela (MERGE ON)

| Tabela | Chave |
|---|---|
| `t28_campaign` | `client_id, campaign_id, business_date, janela` |
| `t28_adset` | `client_id, campaign_id, adset_id, business_date, janela` |
| `t28_ga4_landing` | `client_id, business_date, janela, canal, landing_page` |
| `t28_gbp_daily` | `client_id, business_date, janela` |
| `t28_clarity_daily` | `client_id, business_date, janela` |
| `t28_meta_campaign` | `client_id, campaign_id_meta, business_date, janela` |

(Conferem com o `PARTITION BY business_date CLUSTER BY client_id, janela` + as
colunas `NOT NULL` de cada tabela no DDL. `source` em ga4 é dependente de `canal`
— não entra na chave.)

## 2. Mudança de topologia (por tabela × 6)

DE:
```
[T28] Filter t28_X → [T28] Strip target_table t28_X → [T28] BQ Insert t28_X (insert/streaming)
```
PARA:
```
[T28] Filter t28_X → [T28] Build MERGE t28_X (Code) → [T28] BQ Merge t28_X (executeQuery)
```

- Manter os 6 `[T28] Filter t28_*` (inalterados).
- Substituir cada `Strip` + `BQ Insert` por `Build MERGE` (Code) + `BQ Merge`
  (BigQuery `executeQuery`). O `Build MERGE` já remove `target_table` (faz o que o
  Strip fazia) e monta o SQL.

## 3. O Code `[T28] Build MERGE t28_X` — design (a parte crítica: TIPOS)

Entrada: os itens filtrados daquela tabela (N linhas; pode ser **0** — ex.:
`t28_gbp_daily` quando GBP caiu). Saída: **1 item** `{ _merge_sql: "<MERGE...>" }`,
ou **`[]` (zero itens)** se não houver linhas — assim o `executeQuery` a jusante
não roda MERGE vazio.

**Construir o type-map a partir do DDL (fonte da verdade).** Ler
`phi_prod_t28_tables.sql` e montar, por tabela, `{ coluna: tipo_bq }`. Cada valor
literal no SQL deve ser **CAST para o tipo da coluna em TODAS as linhas** (evita
ambiguidade de tipo do BQ, principalmente em NULLs). Regras de serialização por
tipo:

| Tipo BQ | Literal |
|---|---|
| `STRING` | `'valor'` com escape `'` → `''`; null → `CAST(NULL AS STRING)` |
| `DATE` | `DATE('YYYY-MM-DD')`; null → `CAST(NULL AS DATE)` |
| `TIMESTAMP` | `TIMESTAMP('<iso>')` (usar o `ingested_at` da linha); null → `CURRENT_TIMESTAMP()` |
| `INT64` | inteiro literal; null → `CAST(NULL AS INT64)` |
| `FLOAT64` | número literal (aceita inteiro); null → `CAST(NULL AS FLOAT64)` |
| `BOOL` | `TRUE`/`FALSE`; null → `CAST(NULL AS BOOL)` |
| `JSON` | `PARSE_JSON('<json escapado>')` — `source_status`/`criativos_json`/`actions_json` já chegam como **string JSON** (o Normalizador faz `JSON.stringify`); escapar `'`. Null → `CAST(NULL AS JSON)` (mas `source_status` é NOT NULL). |

> ⚠️ Sem o CAST por tipo, DATE/TIMESTAMP/JSON quebram o MERGE (comparar DATE com
> STRING na cláusula ON, ou inserir string em coluna JSON, falha). É o ponto mais
> sensível — derivar do DDL, não inferir do tipo JS.

**Forma do MERGE (multi-linha via UNION ALL, igual ao Daily Entry):**
```sql
MERGE `<DATASET>.t28_X` AS T
USING (
  SELECT <col1_literal> AS col1, <col2_literal> AS col2, ...   -- linha 1 (define nomes)
  UNION ALL SELECT <...>                                        -- linha 2
  ...
) AS S
ON  T.<key1> = S.<key1> AND T.<key2> = S.<key2> AND ...
WHEN MATCHED THEN UPDATE SET <col> = S.<col>, ...   -- TODAS as colunas não-chave
WHEN NOT MATCHED THEN INSERT (<todas as colunas>) VALUES (<S.todas as colunas>)
```
- `UPDATE SET` cobre **todas as colunas não-chave** (incl. `execution_id`,
  `ingested_at`, `source_status`, KPIs) — re-run sobrescreve com o valor novo.
- `INSERT` cobre **todas** as colunas.
- `<DATASET>` é uma constante no topo do Code (ver §5: phi_dev primeiro).

## 4. O node `[T28] BQ Merge t28_X` (BigQuery executeQuery)

- `operation: executeQuery`, `projectId` = o mesmo projeto dos inserts atuais
  (`project-0e7c58d4-656f-49e8-807` / phi-production), `sqlQuery: {{ $json._merge_sql }}`.
- **Confirmar os nomes de parâmetro via `get_node_types`** no
  `n8n-nodes-base.googleBigQuery` (typeVersion 2.1) antes de aplicar — espelhar o
  node `Execute SQL inserir daily entry` do `vVAdXAJh6MW2Z5Hp` (que já usa
  `executeQuery` + `sqlQuery`). NÃO usar legacy SQL (MERGE exige Standard SQL).
- Sem `datasetId`/`tableId` (são para insert; no executeQuery o alvo está no SQL).

## 5. phi_dev primeiro, depois phi_prod (espelha L1→L1.5)

1. `<DATASET>` = `phi_dev` nos 6 builders. Smoke em phi_dev. **Rodar 2×** e provar
   idempotência (contagem estável — ver §7).
2. Trocar `<DATASET>` para `phi_prod` nos 6 builders. Smoke em phi_prod.
3. Só então o draft vira a versão ativa (Olavo decide o publish).

> Atenção: o workflow está **ativo** (`412d874b`). Trabalhar em **draft** (não via
> PUT da API pública, que auto-ativa). Usar MCP `update_workflow` (mantém draft) —
> e por isso, **guarda de mojibake**: os builders não têm acentos, mas ao tocar o
> workflow confirmar zero `Ã` nos nodes editados.

## 6. Limpeza one-time das duplicatas já acumuladas em phi_prod

Os smokes anteriores (append-only) deixaram duplicatas em `phi_prod.t28_*`.
Após o MERGE no ar, rodar **uma vez** (Olavo, via BQ Console) o dedup por tabela,
mantendo a linha mais recente por chave:

```sql
CREATE OR REPLACE TABLE `phi_prod.t28_campaign` AS
SELECT * EXCEPT(_rn) FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, campaign_id, business_date, janela
    ORDER BY ingested_at DESC) AS _rn
  FROM `phi_prod.t28_campaign`
) WHERE _rn = 1;
```
Gerar o arquivo `docs/strategic-planning/agregador-t28/ddl/phi_prod_t28_dedup_oneshot.sql`
com as 6 versões (ajustando a chave `PARTITION BY` por tabela conforme §1).
`CREATE OR REPLACE TABLE AS SELECT` lê inclusive linhas no buffer (read OK), então
não esbarra no streaming. Rodar **depois** do smoke phi_prod verde.

## 7. Smoke L1.6 (Olavo, após Codex)

1. **phi_dev, rodar 2×** o Execute Workflow manual.
   - Após 1ª run: `SELECT COUNT(*) ... GROUP BY` por tabela → registrar contagem.
   - Após 2ª run: contagem **idêntica** (MERGE atualizou, não duplicou). Chave
     `(client_id, campaign_id, business_date, janela)` sem duplicata:
     ```sql
     SELECT client_id, campaign_id, business_date, janela, COUNT(*) c
     FROM `phi_dev.t28_campaign` GROUP BY 1,2,3,4 HAVING c > 1;  -- deve vir VAZIO
     ```
   - Conferir que `ingested_at`/`execution_id` da 2ª run sobrescreveram (UPDATE).
2. **phi_prod** (após flip do dataset): 1 run, mesmas checagens de unicidade.
3. Rodar o dedup one-shot (§6) e confirmar `HAVING c > 1` vazio em phi_prod.

Critério: **zero duplicatas por chave** após N runs; counts batem com a run única
(12/0/2/x/x/0 conforme fontes disponíveis).

## 8. Critérios de aceite

- [ ] 6 `[T28] BQ Insert t28_*` (streaming) substituídos por `Build MERGE` (Code) + `BQ Merge` (executeQuery).
- [ ] `Build MERGE` deriva o type-map do DDL e CASTa cada literal por tipo (DATE/TIMESTAMP/JSON/BOOL/INT64/FLOAT64/STRING).
- [ ] MERGE com a chave correta por tabela (§1); `UPDATE SET` cobre todas as não-chave; `INSERT` cobre todas.
- [ ] 0 linhas filtradas → builder retorna `[]` (não roda MERGE vazio).
- [ ] `executeQuery` Standard SQL (não legacy); params confirmados via `get_node_types`.
- [ ] Dataset parametrizado: phi_dev no smoke, phi_prod no deploy.
- [ ] `phi_prod_t28_dedup_oneshot.sql` versionado (6 tabelas).
- [ ] Workflow em **draft** (sem PUT auto-ativante); zero mojibake nos nodes tocados.
- [ ] `validate_workflow` sem erros novos; execution log + commit + push.

## 9. Commit (sugestão)

```
feat(saude-digital-l1.6): MERGE idempotente nos t28_* (substitui streaming insert)

Troca os 6 [T28] BQ Insert (operation insert/streaming, append-only ->
duplicava a cada run e prendia o streaming buffer ~90min) por Build MERGE
(Code) + BQ Merge (executeQuery/DML), padrao ja usado pelo Daily Entry em
raw_campaign_data. MERGE por chave de negocio por tabela torna o re-run
idempotente; DML nao passa por streaming buffer. Type-map derivado do DDL
(CAST por coluna p/ DATE/TIMESTAMP/JSON/BOOL/INT64/FLOAT64). phi_dev no
smoke, phi_prod no deploy. + phi_prod_t28_dedup_oneshot.sql (limpeza
one-time das duplicatas historicas).
```

## 10. Fora de escopo

- Não mexer no Adaptador/Normalizador/Error Handler (L2 fechado).
- Não tratar GBP/Clarity caindo (§5 stand-by).
- Não tocar `raw_campaign_data` (Daily Entry / ADR-010).
- multi-campanha (Task 3), volume_suficiente (SOP), credenciais — lotes próprios.

---

**Fim do brief.** Após Codex: pré-revisão Claude (type-map vs DDL, chaves, zero
mojibake, draft preservado) → smoke L1.6 (Olavo) → dedup one-shot → fecha L1.6.
