# Validação do Score v2 (ADR-34) na história jan→ago 2026 — 2 campanhas KIL

> **Fase 1** do plano de conserto (Olavo 2026-08-26): relatórios jan→hoje + validação, **sem
> tocar em produção**. Fonte: exports diários Google Ads (`Performance da campanha *jan_ago.csv`,
> branch `consolidacao-2026-08`). Reprodução: `scripts/validate_score_v2.py`.

## 1. Resultado — o Score v2 acerta os dois casos

| | **Barbearia** (meta 5,20) | **Salão** (meta 3,50) |
|---|---|---|
| Período | 234 dias (01/jan–25/ago) | 203 dias |
| **Conversões reais (total)** | **114** | **2.471** |
| Custo total | R$ 910,45 | R$ 6.326,94 |
| Dias zerados | **183 / 234** | 2 / 203 |
| CPA diário | mediana 3,92 · IQR [2,59–6,33] | mediana 2,91 · IQR [2,05–4,41] |
| **Distribuição de banda (v2, dia a dia)** | CRITICAL **97%**, WARNING 3%, GOOD/EXC 0% | EXCELLENT 39%, GOOD 21%, WARNING 40%, CRITICAL 0% |
| **Veredito atual (25/ago)** | **CRITICAL** (C7=0, entrega 18%) | **GOOD** (CPA 3,62; desvio +3,6%; C7=64; piora +21%) |

- **Barbearia = CRITICAL crônico** — 114 conversões em ~8 meses, 78% dos dias zerados, nunca
  atinge volume confiável (Regime B em 100% dos dias). O score velho dava **GOOD**. ✅ corrigido.
- **Salão = saudável oscilando** (GOOD/EXCELLENT/WARNING, zero CRITICAL). ✅ coerente.

## 2. A corrupção quantificada (GAP 1)
As conversões **reais** somam **114** (Barbearia) e **2.471** (Salão) no período. Hoje a coluna
`raw_campaign_data.conversions` guarda `round(CPA)` — um valor **sem relação** com essas contagens.
O backfill corrige isso.

## 3. Calibração — 3 decisões que a história revelou

1. **`conversions` precisa ser FLOAT64.** O Salão tem **51 dias com conversões fracionárias**
   (ex. 6,97). O `INT64 + round` atual as destrói. → migrar a coluna (ou nova coluna FLOAT64).
2. **EXCELLENT em 39% do tempo (Salão)** é honesto (ele bate a meta mesmo), mas "EXCELLENT"
   vira banal. **Recomendo:** EXCELLENT só quando `desvio ≤ −15%` **E** `C7 ≥ 50` (volume) **E**
   não piorando (`piora ≤ 0`) — assim "excelente" = bate a meta, com volume, e sem deteriorar.
3. **Buracos no calendário viram Regime B falso.** O export não traz dias sem entrega (ex.:
   falta 04/jan). A janela de 7 dias-calendário soma menos conversões e cai em Regime B por
   subcontagem (Salão teve 45 dias em Regime B, provável artefato). **Recomendo:** contar C7
   sobre **dias-com-dado** na janela e exigir cobertura mínima (ex. ≥5 de 7 dias) — senão flag
   "dados incompletos", não "volume baixo".

## 4. Backfill pronto (Fase 3, quando o writer for corrigido)
`backfill_barbearia.csv` e `backfill_salao.csv` neste diretório — grão diário correto
(`client_id, campaign_id, date, cost, conversions, clicks, impressions`), prontos p/ MERGE em
`raw_campaign_data` por `(client_id, campaign_id, date)`. **phi_dev primeiro; prod só com OK.**

## 5. Próximos passos
1. Travar as 3 decisões de calibração (§3) → atualizar ADR-34.
2. **Fase 2** — corrigir o `daily_entry_v4` (extrair `metrics.conversions` real, FLOAT64) + smoke `phi_dev`.
3. **Fase 3** — carregar o backfill (dev → prod, com OK).
4. Implementar o Score v2 lendo a base diária.
