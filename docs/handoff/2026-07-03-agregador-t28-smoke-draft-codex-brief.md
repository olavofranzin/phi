# [BRIEF Codex] Smoke do draft do Agregador T28 — ctx-por-campanha + leitura defensiva

> **Executor:** Codex · **Depois:** verificação independente pelo Antigravity
> (`2026-07-03-agregador-t28-smoke-draft-antigravity-brief.md`) · consolidação
> final pelo Claude · decisão de publicar: **Olavo**.
> **Contexto completo:** `docs/handoff/2026-07-02-saude-digital-agregador-t28-analise-e-fix-draft.md`.

## 0. Objeto e estado esperado ANTES de começar

- Workflow: `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`).
- **Draft a smokar:** `versionId = cbd3568d-d5f5-473e-88a2-825ba7bf3eda`.
- **Ativo em produção (NÃO tocar):** `activeVersionId = a46d5a6a-e5bc-4dee-babe-a002872277bd`.
- Verifique os dois IDs via `get_workflow_details` ANTES de executar. Se o
  draft não for `cbd3568d` (alguém mexeu depois de 2026-07-02), **PARE** e
  reporte — não execute.

## 1. O que mudou no draft (o que o smoke valida)

1. `[T28] BQ Read raw_campaign_data`: query com dedup canônico
   (`ROW_NUMBER ... ORDER BY CASE WHEN ingestion_step='DAILY_ENTRY' THEN 0 ELSE 1 END`,
   `WHERE rn=1`) + novo parâmetro `@campaign_id` =
   `GADS-{{ $('Set dados').item.json.id_google_campanha }}` + coluna
   `source_ingestion_step` propagada. (Sem `SUM/ANY_VALUE`.)
2. `Adaptador Input T28`: `ids` lidos do item da **iteração atual** do Loop
   (antes: primeiro item global); `campProps`/`cliProps` resolvidos por chave
   de negócio (`notion_id_camp` / `id_client`) com fallback ao primeiro;
   `landing_page` prioriza campo `Landing Page` do item.

**Efeito esperado:** contexto de negócio (objetivo, métrica-mãe, meta,
landing) correto POR CAMPANHA nas linhas t28 — antes, o da campanha 1 vazava
para todas.

## 2. Procedimento

1. **Baseline (read-only, ANTES da execução):** rode no BQ e salve o output:
   ```sql
   -- B1: estado atual das linhas da janela (para comparar depois)
   SELECT campaign_id, business_date, janela, objetivo, metrica_mae,
          meta_metrica_mae, landing_page, source_execution_id, ingested_at
   FROM `phi_prod.t28_campaign`
   WHERE client_id='CLI-4'
   ORDER BY business_date DESC, campaign_id LIMIT 30;
   -- B2: contagem por chave (baseline de duplicação)
   SELECT client_id, campaign_id, business_date, janela, COUNT(*) c
   FROM `phi_prod.t28_campaign` GROUP BY 1,2,3,4 HAVING c>1;
   ```
   (B2 DEVE voltar vazio — se não voltar, reporte antes de continuar.)
2. **Execução 1:** `execute_workflow` com `executionMode: "manual"` (roda o
   DRAFT; o trigger default é o Semanal → janela D-7→D-1). Aguarde e capture
   `execution_id` n8n + status.
3. **Execução 2 (idempotência):** repita o passo 2.
4. **Evidências (read-only, DEPOIS):** re-rode B1 e B2 e adicionalmente:
   ```sql
   -- E1: linhas escritas/atualizadas pelas execuções do smoke
   SELECT campaign_id, business_date, janela, objetivo, metrica_mae,
          meta_metrica_mae, landing_page, source_ingestion_step,
          execution_id, ingested_at
   FROM `phi_prod.t28_campaign`
   WHERE client_id='CLI-4' AND execution_id LIKE 'EXEC-T28-%'
   ORDER BY ingested_at DESC, campaign_id LIMIT 30;
   -- E2: adsets e ga4 da janela (sanidade de counts)
   SELECT 't28_adset' t, COUNT(*) c FROM `phi_prod.t28_adset` WHERE ingested_at >= CURRENT_DATE()
   UNION ALL SELECT 't28_ga4_landing', COUNT(*) FROM `phi_prod.t28_ga4_landing` WHERE ingested_at >= CURRENT_DATE()
   UNION ALL SELECT 't28_gbp_daily', COUNT(*) FROM `phi_prod.t28_gbp_daily` WHERE ingested_at >= CURRENT_DATE()
   UNION ALL SELECT 't28_clarity_daily', COUNT(*) FROM `phi_prod.t28_clarity_daily` WHERE ingested_at >= CURRENT_DATE();
   ```

## 3. Critérios PASS/FAIL (avaliar TODOS; reportar um a um)

| # | Critério | PASS se |
|---|---|---|
| C1 | Execuções 1 e 2 terminam `success` | sem error output disparado por `Adaptador`/`BQ Read` (degradação GBP/Clarity via `source_status` é aceitável e esperada) |
| C2 | **Teste decisivo — ctx por campanha:** em E1, as linhas de `GADS-21149189736` (Barbearia) e `GADS-21116045403` (Salão) têm `meta_metrica_mae`/`landing_page`/`objetivo` **próprios e distintos** (não clones da mesma campanha) | valores diferem entre as 2 campanhas OU, se iguais no Notion, conferem com a origem campo a campo |
| C3 | `source_ingestion_step` populado em E1 | valor presente (esperado hoje: `GADS_INSERT` para CLI-4) |
| C4 | Idempotência | B2 pós-execuções continua vazio; execução 2 não cria linhas novas (mesmas chaves, `ingested_at` atualizado) |
| C5 | Sem regressão de counts | E2 na ordem de grandeza dos smokes anteriores (campanha ~12±, ga4 ~2, adset conforme GAQL); zero linhas não é PASS para t28_campaign |
| C6 | Draft/ativo intocados | pós-smoke, `activeVersionId` continua `a46d5a6a` e o draft continua `cbd3568d` |

## 4. Guardrails (inegociáveis)

- **NÃO publicar/ativar. NÃO editar nenhum nó.** Se algo falhar: capturar
  `execution_id`, nó e mensagem de erro, e **PARAR** — o report é o entregável,
  não o fix.
- Execução manual escreve em `phi_prod` via MERGE idempotente — precedente da
  casa (smoke L1.6). Não rodar mais de 2×.
- Queries de evidência: read-only, `useLegacySql:false`.

## 5. Report

Commitar em `docs/handoff/2026-07-03-agregador-t28-smoke-draft-codex-report.md`
na branch `claude/saude-digital-phi-midia-score-0ko12c`, contendo: versionIds
verificados (antes/depois), execution_ids n8n, outputs BRUTOS de B1/B2/E1/E2
(tabelas), veredito C1–C6 um a um, e qualquer estranheza mesmo que fora dos
critérios.
