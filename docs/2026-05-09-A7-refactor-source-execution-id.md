# A.7 - Refactor going-forward das tabelas PHI para `source_execution_id`

## Status
Bloqueado antes do DDL.

## Motivo do bloqueio
O criterio de parada foi acionado logo na primeira verificacao de `INFORMATION_SCHEMA.TABLES`.

Resultado observado:

```text
phi_score_current       VIEW        is_insertable_into = NO
phi_score_history       BASE TABLE  is_insertable_into = YES
workflow_execution_log  BASE TABLE  is_insertable_into = YES
```

Ou seja:

- `phi_score_history` pode receber `ALTER TABLE ADD COLUMN`
- `workflow_execution_log` pode receber `ALTER TABLE ADD COLUMN`
- `phi_score_current` **nao e tabela**, e sim `VIEW`

Isso impede executar o escopo como definido:

```sql
ALTER TABLE `phi_prod.phi_score_current`
  ADD COLUMN source_execution_id STRING;
```

## Evidencia objetiva
Query executada via BigQuery em workflow temporario isolado:

```sql
SELECT table_name, table_type, is_insertable_into
FROM `phi_prod.INFORMATION_SCHEMA.TABLES`
WHERE table_name IN ('phi_score_history','phi_score_current','workflow_execution_log')
ORDER BY table_name;
```

Resultado:

```json
[
  {
    "table_name": "phi_score_current",
    "table_type": "VIEW",
    "is_insertable_into": "NO"
  },
  {
    "table_name": "phi_score_history",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES"
  },
  {
    "table_name": "workflow_execution_log",
    "table_type": "BASE TABLE",
    "is_insertable_into": "YES"
  }
]
```

Execucao de auditoria:

- workflow temporario isolado: `TMP - A7 BigQuery JSON`
- execution id: `4887`
- status: `success`

## Escopo que NAO foi executado
Por obediencia ao criterio de parada, eu **nao** prossegui com:

1. `ALTER TABLE` em nenhuma das tres estruturas
2. auditoria completa de consumidores
3. smoke do `PHI - Pipeline_v2` pos-DDL

## Implicacao tecnica
O ADR/briefing assume que `phi_score_current` e tabela alteravel, mas no estado real do ambiente ela e uma `VIEW`.

Isso muda a natureza da entrega:

- adicionar coluna em `phi_score_history` e `workflow_execution_log` continua sendo DDL simples
- `phi_score_current` exige outra estrategia

Possibilidades de reescopo, a decidir fora desta entrega:

1. descobrir a definicao da `VIEW` `phi_score_current` e ajusta-la para projetar `source_execution_id`
2. substituir a `VIEW` por tabela materializada/rotina de refresh, se esse for o desenho desejado
3. remover `phi_score_current` do escopo da A.7 e tratar isso em entrega separada

## Recomendacao de proxima entrega
Nova entrega curta de descoberta/DDL focada apenas em `phi_score_current`, com um destes objetivos:

1. identificar a query/objeto que define a `VIEW`
2. decidir se `source_execution_id` deve ser:
   - propagado da origem na definicao da `VIEW`, ou
   - derivado por join em leitura, ou
   - persistido em outra estrutura going-forward

So depois disso faz sentido retomar a A.7 completa.

## Consumidores
Auditoria completa de consumidores nao foi iniciada por causa do bloqueio estrutural anterior ao DDL.

Observacao pontual:

- a documentacao local em `docs/handoff/2026-05-09-A5-auditoria-execution-id.md` referencia `phi_score_history`, `phi_score_current` e `workflow_execution_log`, mas isso nao e um consumidor critico de schema

## Workflows temporarios criados e limpos
Para executar a verificacao em BigQuery sem tocar em workflows de producao existentes, foram criados workflows temporarios isolados no n8n e arquivados ao final:

- `HdiyjAwCAouZoYhS` - `TMP - A7 BigQuery Audit`
- `UPOtlqfD3vbS7tvZ` - `TMP - A7 BigQuery Schedule`
- `9IsoCrTN5tAQEdfm` - `TMP - A7 BigQuery JSON`

Todos foram arquivados apos a auditoria.

## Conclusao
A.7 nao pode prosseguir no formato atual porque `phi_score_current` nao e `BASE TABLE`.

Diagnostico final:

- bloqueio real: estrutura alvo divergente do briefing
- acao correta nesta entrega: parar antes do DDL
- proximo passo: reescopo especifico para `VIEW phi_score_current`
