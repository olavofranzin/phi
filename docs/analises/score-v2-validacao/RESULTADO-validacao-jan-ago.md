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
| **Distribuição de banda (lógica final)** | CRITICAL **97%**, WARNING 3% | EXC 30% · GOOD 33% · WARNING 35% · CRITICAL 1% |
| **Veredito atual (25/ago)** | **CRITICAL** (C7=0, entrega 18%) | **GOOD** (CPA 3,62; desvio +3,6%; C7=64; piora +21%) |

- **Barbearia = CRITICAL crônico** — 114 conversões em ~8 meses, 78% dos dias zerados, nunca
  atinge volume confiável. O score velho dava **GOOD**. ✅ corrigido.
- **Salão = saudável oscilando** (EXC/GOOD/WARNING, ~0 CRITICAL). ✅ coerente.
- **Efeito da lógica de volume revisada (calibração 2026-08-27):** o Regime B falso do Salão caiu
  de **45 → 0 dias** (deixou de ser punido pelas folgas) e o EXCELLENT de 39% → 30% (guarda);
  a Barbearia **não** afrouxou (97% CRITICAL). Ver §3.

## 2. A corrupção quantificada (GAP 1)
As conversões **reais** somam **114** (Barbearia) e **2.471** (Salão) no período. Hoje a coluna
`raw_campaign_data.conversions` guarda `round(CPA)` — um valor **sem relação** com essas contagens.
O backfill corrige isso.

## 3. Calibração — 3 decisões (APROVADAS 2026-08-27)

1. **`conversions` → FLOAT64.** O Salão tem **51 dias com conversões fracionárias** (ex. 6,97);
   o `INT64 + round` atual as destrói. → migrar a coluna (ou nova coluna FLOAT64). ✅
2. **Guarda do EXCELLENT.** EXCELLENT só com `desvio ≤ −15%` **E** `C7 ≥ 50` **E** `piora ≤ 0`.
   Derrubou o EXCELLENT do Salão de 39% → 30% — vira "excelente" de verdade. ✅
3. **Buracos = dias-zero REAIS, não se excluem.** O CPA (razão de somas) já mede só os dias
   ativos; o C7 é a contagem verdadeira. O A/B passou a separar por **contagem de conversão**
   (C7≥10 → julga pelo CPA; C7<10 → entrega manda), **não** pelo calendário — isso eliminou o
   Regime B falso do Salão (45→0) e manteve a Barbearia CRITICAL. O sinal de problema vem da
   **subentrega** (entrega/cobertura), não das folgas. ✅
   - **Refinamento (dia zerado numa campanha ATIVA):** 0 impr / R$0 / 0 conv pode ser (a)
     **programado** (dayparting, ex. domingo) → neutro, ou (b) **falha de entrega** (deveria
     rodar e não rodou) → problema. Separar pelo **agendamento** da campanha (Google Ads API
     `ad_schedule`; PMax limitado — confirmar na v23; senão manual). É o **"sinal de entrega"**
     (≠ FIS de fatia de gasto, que continua fora). Detalhado no ADR-34.

## 4. Backfill pronto (Fase 3, quando o writer for corrigido)
`backfill_barbearia.csv` e `backfill_salao.csv` neste diretório — grão diário correto
(`client_id, campaign_id, date, cost, conversions, clicks, impressions`), prontos p/ MERGE em
`raw_campaign_data` por `(client_id, campaign_id, date)`. **phi_dev primeiro; prod só com OK.**

## 5. Próximos passos
1. Travar as 3 decisões de calibração (§3) → atualizar ADR-34.
2. **Fase 2** — corrigir o `daily_entry_v4` (extrair `metrics.conversions` real, FLOAT64) + smoke `phi_dev`.
3. **Fase 3** — carregar o backfill (dev → prod, com OK).
4. Implementar o Score v2 lendo a base diária.
