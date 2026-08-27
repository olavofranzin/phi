# [Fase 2 — RASCUNHO] Corrigir o writer `daily_entry_v4` — gravar conversões reais

> **⚠️ ALVO ERRADO — NÃO APLICAR (correção 2026-08-27).** A verificação ao vivo (execução n8n
> 32695) mostrou que `raw_campaign_data` é populado hoje pelo **`GADS_INSERT`** ("Subworkflow
> Campanhas"), **não** pelo `daily_entry_v4` deste rascunho. O `daily_entry_v4` tem o bug
> `round(CPA)`, mas não é o writer vivo. A correção real precisa mirar o writer certo — e a
> decisão do Olavo foi **pausar e simplificar a escrita** (writers demais). Este rascunho fica
> como referência do padrão de fix; a mira certa é tarefa do sub-chat de simplificação:
> `docs/handoff/2026-08-27-simplificacao-escrita-dados-subchat-brief.md`.

> **Objetivo:** parar de gravar `round(CPA)` na coluna `conversions` de `raw_campaign_data` e
> passar a gravar a **contagem real** de conversões (`metrics.conversions` da API), em FLOAT64.
> Pré-requisito do Score v2 (ADR-34) e do backfill (Fase 3). **Nada aplicado — draft p/ smoke
> em `phi_dev` + OK do Olavo.** Workflow vive na branch `consolidacao-2026-08` (`daily_entry_v4.json`).

## 0. Verificar ao vivo antes (read-only, precisa de OK de budget)
1 SELECT em `phi_prod.raw_campaign_data` (Barbearia + Salão, 30–60 dias):
- **Tipo** da coluna `conversions`/`conversions_3d`/`conversions_7d` (INT64 ou FLOAT64?) → define se há migração.
- Confirma que hoje guardam `round(CPA)` (não contagem).
- `cost` diário bate com o CSV (Barbearia 60d = R$86,85; Salão = R$1.740)?

## 1. Fix A — nó `Code Unificar Períodos (D1, 3D, 7D)`
O `extractRaw` puxa custo/cliques/impressões mas **ignora `metrics.conversions`**. Adicionar:

```diff
 const extractRaw = (data) => {
   const m = data.results?.[0]?.metrics || {};
   return {
     cost:        Number(m.costMicros  || 0) / 1_000_000,
     clicks:      Number(m.clicks      || 0),
     impressions: Number(m.impressions || 0),
+    conversions: Number(m.conversions || 0),   // contagem REAL (fracionária)
   };
 };
```
E expor no retorno do nó (junto de `raw_cost_d1/3d/7d`):
```diff
     raw_cost_3d:        parseFloat(raw_d3.cost.toFixed(6)),
     raw_cost_7d:        parseFloat(raw_d7.cost.toFixed(6)),
+    raw_conversions_d1: parseFloat(raw_d1.conversions.toFixed(4)),
+    raw_conversions_3d: parseFloat(raw_d3.conversions.toFixed(4)),
+    raw_conversions_7d: parseFloat(raw_d7.conversions.toFixed(4)),
```
> `d1/d3/d7` são requisições separadas por janela → `m.conversions` de cada uma já é a soma da janela.

## 2. Fix B — nó `Code Montar SQL` (Daily Entry → raw_campaign_data)
Trocar a origem (o valor do CPA) pela contagem real, **sem `round`**:
```diff
-const conversions   = Math.round(getNum(prop('Métrica-Mãe 1D') ?? prop('Valor Métrica-Mãe 1D')));
-const conversions3d = Math.round(getNum(prop('Métrica-Mãe 3D') ?? prop('Valor Métrica-Mãe 3D')));
-const conversions7d = Math.round(getNum(prop('Métrica-Mãe 7D') ?? prop('Valor Métrica-Mãe 7D')));
+const conversions   = getNum(unifiedData.raw_conversions_d1);
+const conversions3d = getNum(unifiedData.raw_conversions_3d);
+const conversions7d = getNum(unifiedData.raw_conversions_7d);
```
E no MERGE, **FLOAT64** em vez de INT64:
```diff
-    CAST(${conversions} AS INT64)     AS conversions,
+    CAST(${conversions} AS FLOAT64)   AS conversions,
...
-    CAST(${conversions3d} AS INT64)   AS conversions_3d,
+    CAST(${conversions3d} AS FLOAT64) AS conversions_3d,
...
-    CAST(${conversions7d} AS INT64)   AS conversions_7d,
+    CAST(${conversions7d} AS FLOAT64) AS conversions_7d,
```
> `clicks`/`impressions` seguem INT64 (são inteiros de verdade). `impressions` **fica** — é
> insumo do "sinal de entrega" (dia ativo com 0 impressão = problema).

## 3. Fix C — migração de schema (se a coluna for INT64)
Se o §0 confirmar INT64:
```sql
ALTER TABLE `phi_prod.raw_campaign_data` ALTER COLUMN conversions    SET DATA TYPE FLOAT64;
ALTER TABLE `phi_prod.raw_campaign_data` ALTER COLUMN conversions_3d SET DATA TYPE FLOAT64;
ALTER TABLE `phi_prod.raw_campaign_data` ALTER COLUMN conversions_7d SET DATA TYPE FLOAT64;
```
(BigQuery aceita INT64→FLOAT64 como relaxamento; confirmar sem erro em `phi_dev` primeiro.)

## 4. Smoke em `phi_dev`
Rodar o Daily Entry apontando p/ `phi_dev` com CLI-4 → conferir que `conversions` de D-1 bate com
o export do dia (contagem, não CPA) e aceita fracionário. Só então promover a `phi_prod`.

## 5. Ordem
§0 (verificar) → §1+§2 (fix, draft) → §3 (migração se preciso) → §4 (smoke dev) → **Fase 3 (backfill)** →
implementar o Score v2. **Nada em produção sem OK + smoke.**

## Âncoras
Writer: `daily_entry_v4.json` (nós `Code Unificar Períodos (D1, 3D, 7D)` e `Code Montar SQL`) ·
ADR-010 (writer canônico) · ADR-29 Camada 0 · ADR-34 (consome) · decisão de fonte:
`adr-rascunhos/phi-midia-score-v2-fonte-serie-diaria-DECISAO.md`.
