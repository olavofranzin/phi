# Relatório — ADR-33 / Agregador identidade, fechamento da Volta 3

**Data:** 2026-10-01  
**Branch:** `claude/consolidacao-2026-08`  
**Brief:** §0.6 de `2026-09-28-agregador-identidade-volta-3-construcao-brief.md`  
**Autorização destrutiva:** Olavo, 2026-09-29: **“pode”**, informado de que sem recoleta o apagamento seria perda.

## Apagamento

O SELECT `45203` encontrou exatamente seis linhas pela chave completa `client_id + execution_id + business_date`:

| Tabela | Execução | Data | Linhas |
|---|---|---:|---:|
| `t28_ga4_landing` | `EXEC-T28-39103` | 2026-09-13 | 2 |
| `t28_ga4_landing` | `EXEC-T28-41535` | 2026-09-20 | 2 |
| `t28_clarity_daily` | `EXEC-T28-39103` | 2026-09-13 | 1 |
| `t28_clarity_daily` | `EXEC-T28-41535` | 2026-09-20 | 1 |
| **Total** | | | **6** |

O DELETE transacional `45205` exigiu 6 no total, `@@row_count = 4` para GA4 e `@@row_count = 2` para Clarity. A releitura independente `45206` confirmou zero.

| Tabela | Alvo antes | Alvo depois | Total antes | Total depois |
|---|---:|---:|---:|---:|
| `phi_prod.t28_ga4_landing` | 4 | 0 | 38 | 34 |
| `phi_prod.t28_clarity_daily` | 2 | 0 | 17 | 15 |
| **Total** | **6** | **0** | **55** | **49** |

O workflow `TMP - A6 BigQuery Audit` foi restaurado integralmente e continua inativo.

## Buraco declarado

`t28_ga4_landing` fica sem as linhas corretas do `CLI-4` em 13/09 e 20/09. O GA4 ainda retém o dado, mas falta caminho de backfill; nunca reconstruir por estimativa. As linhas de Clarity não são recuperáveis após 72h e não têm consumidor.

## CA10

> Agrega semanal e mensalmente métricas de Google Ads, GA4, GBP e Meta no T28, preservando cliente, fonte e janela. Em 29/09/2026, adotou identidade por chave, fechou a Clarity sem ID/consumidor e removeu do guarda o fallback posicional entre clientes.

A versão ativa permaneceu `ecec7073-a8ef-4d98-9502-ba2fb8c08d67`. O draft `378f6b81-5575-4882-8da7-9fd6abf460d0` difere da produção em `Reclassifica IDs`; ele não foi publicado no CA10.

## Critérios

CA1–CA6 e CA9–CA13: ✅. CA7: recoleta retirada no §0.5, com buraco autorizado e declarado. CA8: ✅ nenhuma janela foi alterada.

Fora de escopo: 318 linhas com `client_id` nulo, writers `sw metricas *` e backfill.
