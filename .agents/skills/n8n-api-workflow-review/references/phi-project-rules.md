# PHI Project Rules Reference

Use for any change that touches PHI workflows, `phi_prod` tables, or PHI Notion databases. These rules override generic guidance. Full context lives in `CLAUDE.md` at the repo root — read it when in doubt.

## Critical Implementation Rules

1. **BigQuery table refs:** always `dataset.table` without project ID inside backticks — e.g. `phi_prod.raw_campaign_data`. Never `project.dataset.table`.
2. **INSERT/MERGE nodes:** `Always Output Data = true` is mandatory, otherwise downstream nodes silently stop on empty results.
3. **`primary_metric_goal`** is FLOAT64 (e.g. `5.20`); **`primary_metric_type`** is STRING (e.g. `'CPA'`). Never mix them.
4. **`client_id`** (`CLI-4`) and **`client_slug`** (`KIL`) are different fields. Never use one for the other.
5. **splitInBatches v3 branches:** `CLAUDE.md` rule 5 states branch 0 = loop, branch 1 = done — but `docs/analises/google_ads/` and n8n's documented Loop Over Items v3 say the opposite (0 = done, 1 = loop). This conflict is unresolved in the repo: verify against the live node before wiring, and always add the loop-back connection from the last body node to the splitInBatches node.
6. **IF nodes:** branch 0 = TRUE, branch 1 = FALSE.
7. **Workflow JSON connections:** keys are node NAMES, not UUIDs.
8. **Dynamic queries:** build SQL in a Code node; never use `{{ }}` expressions inside a BigQuery query field.
9. **`phi_score` / `Score Diário` in Notion:** written only by PHI after Fase 2 — never by Daily Entry.
10. **PHI never executes optimizations** — it detects, classifies, and guides.
11. **Fase 3 order is immutable:** Fechamento → Escalada → Abertura.
12. **Google Ads API:** `developer-token` must be set in the request header — it is NOT injected by the `googleAdsOAuth2Api` credential.
13. **Google Ads API v23:** `metrics.cost_per_conversion` is incompatible with `segments.conversion_action_name` / `segments.conversion_action_category` in the same query.
14. **`phi_score_history`:** writes must use MERGE (idempotent re-runs), never plain INSERT.

## Production Workflow IDs

| Workflow | ID | Status |
| --- | --- | --- |
| PHI - Pipeline_v2 | `ITWG3Ge0asXtUM8U` | Produção (07:00) |
| Daily Entry | `zGgIqiLlo5iAn8ud` | Ativo (06:00) |
| PHI - Subworkflow Campanhas | `b1pbn8qmzCNTufTp` | Ativo |
| PHI - Fechar Otimização | `83vfKD8XMYmjZjFQ` | Ativo |
| Google Ads v2 | `aueMKOExsN28nREq` | Reestruturação |
| Google Ads Insights Semanal | `AG3g0LcpbxbCZoPZ` | Criado, inativo |

Treat active workflows above as production: never change credentials, schedules, or active state without explicit request.

## Test Client

Use client KIL for smoke tests: `client_id = CLI-4`, `client_slug = KIL`, campaigns `GADS-21149189736` (Barbearia) and `GADS-21116045403` (Salão). Never smoke-test against other clients' data.

## Key `phi_prod` Tables

| Table | Contract |
| --- | --- |
| `raw_campaign_data` | Partitioned by `date`; Daily Entry writes it |
| `phi_score_history` | MERGE only; PHI Pipeline writes it |
| `phi_score_current` | VIEW — never write to it |
| `client_config` / `model_config` / `client_goal_history` | Config reads; changes require explicit request |
| `workflow_execution_log` | Per-phase execution logging |
