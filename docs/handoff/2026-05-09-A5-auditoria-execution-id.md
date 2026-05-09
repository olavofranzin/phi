# A.5 - Sub-auditoria do `execution_id` em FALLBACK no `PHI - Pipeline_v2`

## Status
Concluida como sub-auditoria. Nenhum fix aplicado.

## Resumo executivo
O problema real e **H1 (bug pre-existente)**. O node `Buscar ID de Sucesso Hoje` do `PHI - Pipeline_v2` esta consultando a fonte errada para descobrir o snapshot diario.

Ele nao busca o `execution_id` produzido pelo `Daily Entry` em `phi_prod.raw_campaign_data`. Em vez disso, ele consulta `phi_prod.workflow_execution_log` filtrando `phase = 'INGESTION'`, mas essa tabela/log e alimentada pelo proprio `PHI` depois que o node ja escolheu um `execution_id`.

Resultado: o seletor e auto-referencial.

- na primeira execucao bem-sucedida do dia, ele nao encontra nada e gera `FALLBACK-*`
- nas execucoes seguintes do mesmo dia, ele reencontra o mesmo `FALLBACK-*` previamente gravado pelo proprio `PHI`
- ele nunca chega naturalmente em `EXEC-DE-*`

## Diagnostico por hipotese

### H1 - Bug pre-existente no seletor
**Verdadeira.**

Evidencias:

1. O SQL do node `Buscar ID de Sucesso Hoje` em producao e:

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

2. O proprio `PHI` grava esse `execution_id` escolhido em `workflow_execution_log` logo depois:

- `Log INGESTION RUNNING`
- `Log INGESTION SUCCESS`

3. O `Daily Entry` nao alimenta `workflow_execution_log`. Ele grava `execution_id` diretamente em `phi_prod.raw_campaign_data` como `EXEC-DE-*`.

4. Historico observado nas execucoes salvas do `PHI`:

- `11/11` execucoes bem-sucedidas inspecionadas usaram `FALLBACK-*`
- `0/11` usaram `EXEC-*`

Ou seja: o comportamento de fallback nao apareceu por causa da A.0. Ele ja era o comportamento estrutural do seletor.

### H2 - Regressao do patch A.0
**Falsa.**

Evidencias:

1. O patch A.0 tocou apenas o `Daily Entry`, especificamente a montagem de `cost_3d` / `cost_7d`.
2. O `PHI - Pipeline_v2` em producao continua com `updatedAt = 2026-05-04T01:02:24.018Z`, anterior a A.0.
3. Antes da A.0, as execucoes bem-sucedidas ja usavam `FALLBACK-*`:

- `4537` em `2026-05-04` -> `FALLBACK-20260504-*`
- `4470` em `2026-05-03` -> `FALLBACK-20260503-*`
- `4414` em `2026-05-02` -> `FALLBACK-20260502-*`
- `4358` em `2026-05-01` -> `FALLBACK-20260501-*`
- `4306` em `2026-04-30` -> `FALLBACK-20260430-*`
- `4277` em `2026-04-29` -> `FALLBACK-20260429-*`
- `4233` em `2026-04-28` -> `FALLBACK-20260428-*`

Conclusao: a A.0 nao criou o bug; ela apenas tornou o efeito observavel porque `cost_3d/cost_7d` passaram a carregar sinal real para Google.

### H3 - Timing / race entre `Daily Entry` e `PHI`
**Falsa como causa raiz.**

Ela pode existir como risco secundario em outro desenho, mas nao explica o problema atual.

Evidencias:

1. Em `2026-05-08`:

- `Daily Entry` execucao `4828` terminou `2026-05-08T19:54:03.105Z`
- `PHI` execucao `4829` comecou `2026-05-08T19:54:25.112Z`

Gap: ~22 segundos.

2. Em `2026-05-09`:

- `Daily Entry` execucao `4857` terminou `2026-05-09T07:01:09.970Z`
- `PHI` execucao `4863` comecou `2026-05-09T10:00:09.548Z`

Gap: ~2h59m.

3. Mesmo com quase 3 horas de diferenca em `2026-05-09`, o `PHI` ainda escolheu:

`FALLBACK-20260509-45596d7c-2fe7-484e-9dca-b507d1dcf056`

Portanto, nao e um problema de o `PHI` "nao ver a linha nova a tempo". O seletor simplesmente nao consulta a fonte onde o `Daily Entry` escreve o snapshot oficial.

## Causa raiz
### Causa raiz funcional
O node `Buscar ID de Sucesso Hoje` busca o `execution_id` na tabela errada.

Hoje ele procura em:

```sql
phi_prod.workflow_execution_log
```

quando o snapshot real do `Daily Entry` esta em:

```sql
phi_prod.raw_campaign_data.execution_id
```

### Causa raiz de codigo / query especifica
Linha causal principal:

```sql
FROM `phi_prod.workflow_execution_log`
WHERE DATE(started_at) = CURRENT_DATE()
  AND status = 'SUCCESS'
  AND phase = 'INGESTION'
```

Problemas dessa escolha:

1. `workflow_execution_log` nao e a fonte de verdade do snapshot do `Daily Entry`.
2. O `phase = 'INGESTION'` ali representa a fase interna do proprio `PHI`, nao a execucao do `Daily Entry`.
3. O valor salvo nessa tabela e justamente o `execution_id` que o `PHI` escolheu antes, criando ciclo fechado.

### Mecanica observada
1. `Buscar ID de Sucesso Hoje` roda no inicio do `PHI`.
2. Nao encontra `SUCCESS/INGESTION` do dia em `workflow_execution_log`.
3. Gera `FALLBACK-*`.
4. O proprio `PHI` grava esse `FALLBACK-*` em `workflow_execution_log`.
5. Proximas execucoes do mesmo dia passam a reencontrar o mesmo `FALLBACK-*`.

## Impacto retrospectivo
Janela auditada: execucoes salvas disponiveis entre `2026-04-28` e `2026-05-09` (historico retornado pela API / MCP).

### Ultimos 7 dias
Considerando execucoes bem-sucedidas salvas de `2026-05-02` a `2026-05-09`:

- `7/7` execucoes bem-sucedidas usaram `FALLBACK-*`
- `0/7` usaram `EXEC-*`

Se considerar apenas triggers bem-sucedidos no periodo:

- `5/5` usaram `FALLBACK-*`

### Ultimos 30 dias / historico disponivel
No historico salvo disponivel do workflow:

- `11/11` execucoes bem-sucedidas usaram `FALLBACK-*`
- `0/11` usaram `EXEC-*`

Em outras palavras: dentro do historico auditado, o `PHI` nunca consumiu um `execution_id` real do `Daily Entry`.

## Evidencia pontual da A.0 / Aprendizado #14
Em `2026-05-08`, a A.0 provou que o `Daily Entry` passou a gerar snapshots reais de Google com `cost_3d` e `cost_7d`:

- `Daily Entry` `4828` gravou `EXEC-DE-20260508195400`
- `PHI` `4829` escolheu `FALLBACK-20260508-be2ac5b2-f275-4389-a919-3cfb5408fd28`

Consequencia observada no `PHI`:

- `fis = 83.23` apareceu calculado em uma campanha Google
- `mas = 0.0`
- `tss = 50.0`

Isso so ficou visivel agora porque, antes da A.0, `cost_3d = 0` e `cost_7d = 0` mascaravam o problema estrutural do seletor.

## Recomendacao de escopo de fix
Nova entrega dedicada. Nao corrigir dentro desta A.5.

Escopo recomendado do fix:

1. Redefinir a fonte de descoberta do snapshot diario.
2. Fazer `Buscar ID de Sucesso Hoje` buscar o snapshot oficial do `Daily Entry`, nao o log interno do `PHI`.
3. Revisar todos os nodes downstream que dependem de `{{ $('Buscar ID de Sucesso Hoje').first().json.execution_id }}`:
   - `Calcular e Persistir PHI Score`
   - `Get All Current Scores (Sync)`
   - `Buscar Campanhas Alertas`
   - logs de `INGESTION`, `CALCULATION` e `OPERATIONAL`
4. Decidir se:
   - o `execution_id` do `PHI` deve espelhar o snapshot do `Daily Entry`, ou
   - o `PHI` deve ter `run_id` proprio e referenciar separadamente o `source_execution_id`

### Recomendacao pragmatica
O fix mais provavel e pequeno em codigo, mas sensivel em semantica de auditoria. Vale tratar como entrega propria com validacao ponta a ponta em:

- `raw_campaign_data`
- `phi_score_history`
- `phi_score_current`
- `workflow_execution_log`

## Conclusao
Diagnostico final:

- `H1`: verdadeira
- `H2`: falsa
- `H3`: falsa como causa raiz

O `FALLBACK-*` no `PHI - Pipeline_v2` nao e efeito colateral da A.0. E um bug pre-existente no seletor de `execution_id`, que consulta um log auto-referencial do proprio `PHI` em vez do snapshot real produzido pelo `Daily Entry`.
