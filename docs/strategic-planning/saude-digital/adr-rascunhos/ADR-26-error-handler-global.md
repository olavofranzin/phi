# ADR-26 — Error Handler global (onError + sub-WF + t28_errors)

> **STATUS:** ✅ **PUBLICADO como `Aceito` no Notion 2026-06-22** (page
> `388b65e5-c72b-8186-aed5-c5fafd65b5f8`,
> [link](https://app.notion.com/p/388b65e5c72b8186aed5c5fafd65b5f8)).
> Este rascunho permanece em git como histórico de design (ADR-012).
> Aprovado por Olavo 2026-06-22 (D11/D14/D18).

## Contexto

Olavo pediu alertas de erro. Hoje, falhas em chamadas externas (Google
Ads, GA4, GBP, Clarity, Meta, BQ Insert, Notion write) ou são engolidas
silenciosamente (padrão `safe(() => ...)` no Adaptador T28 — que já
mascarou um bug de schema no smoke) ou derrubam a execução sem
notificação. Falta padrão de observabilidade.

D14: Error Handler é o **próximo lote** depois de L1.5, **antes** do
Orquestrador — porque alertas protegem toda evolução posterior.

## Decisão

**Padrão global de erro: nodes críticos com `onError: continueErrorOutput`
-> sub-WF `[Global] Error Handler` dedicado -> loga em `t28_errors` ->
cria tarefa em DB Demandas -> Telegram.**

- Toda chamada externa crítica (API, BQ Insert, Notion write) configura
  `onError: continueErrorOutput`.
- Error output -> sub-WF `[Global] Error Handler` (Execute Workflow Trigger).
- Error Handler:
  1. grava linha em `phi_*.t28_errors` (nova tabela, DDL no L2);
  2. cria tarefa no DB Demandas (urgência por severidade);
  3. envia Telegram com contexto (workflow, node, execution_id, mensagem).

## Anti-pattern a corrigir (descoberto no smoke T28)

O `safe(() => ...)` no Adaptador Input T28 engoliu um erro de schema
(coluna `business_date` inexistente -> fallback silencioso -> 2 rows
fantasmas com métricas zeradas). **O Error Handler deve substituir
`safe()` silencioso por log+propagação** nos pontos críticos. `safe()`
fica só onde a ausência da fonte é legítima (ex: cliente sem Meta).

## Esquema `t28_errors` (esboço — fechar no L2)

```
t28_errors (
  error_id, execution_id, workflow_id, workflow_name,
  node_name, source, severity ENUM('warn','error','critical'),
  error_message, error_details JSON,
  client_id, business_date, occurred_at, resolved BOOL
)
PARTITION BY DATE(occurred_at) CLUSTER BY workflow_id, severity
```

## Alternativas consideradas

1. **`continueOnFail` silencioso por node** (status quo parcial).
   Rejeitado: falha invisível; descobre-se pela ausência de dados.
2. **Error Workflow nativo do n8n** (Settings -> Error Workflow).
   Considerado complementar: captura falhas não tratadas globalmente. Pode
   apontar para o mesmo `[Global] Error Handler`.
3. **onError -> sub-WF dedicado (escolhida)** + Error Workflow nativo como
   rede de segurança para o que escapar.

## Consequências

- (+) Toda falha vira tarefa rastreável + alerta — fim da falha silenciosa.
- (+) `t28_errors` dá histórico para SLA/observabilidade.
- (+) 1 lugar para evoluir política de alerta.
- (-) Mais nodes de configuração por workflow (onError em cada crítico).
- (-) Risco de ruído (alerta demais) — mitigar com severidade + dedup.

## Reavaliar quando

- Volume de erros gerar ruído no Telegram (introduzir dedup/agrupamento).
- Surgir necessidade de dashboard de erros (web lê `t28_errors`).

## Conexões com ADRs vigentes

- **ADR-009** (execution_id): chave de correlação no log de erro.
- **ADR-22** (loop alerta -> tarefa -> otimização): Error Handler cria a tarefa.
- **ADR Eventos canônicos**: erro pode virar evento `erro.detectado` no sink BQ.
- **ADR-010** (BQ analítico): `t28_errors` mora em BQ.
