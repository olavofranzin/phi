# Known PHI Defect Patterns

Recurring defects found in real PHI workflow reviews (source: `docs/analises/google_ads/`). Treat this as a targeted checklist — these classes of bug have already shipped once. Check for each when reviewing similar nodes.

## Loop / Topology (highest severity — silently breaks pipelines)

- **splitInBatches v3 loop-back missing.** Regardless of branch order, the last node of the loop body MUST connect back to the splitInBatches node, or only the first item is processed and the loop never advances. Verify the return connection exists, not just the branch wiring.
- **splitInBatches v3 branch semantics — VERIFY, don't assume.** The repo's own docs disagree: `CLAUDE.md` rule 5 says "branch 0 = loop, branch 1 = done", while `docs/analises/google_ads/` (matching n8n's documented Loop Over Items v3) says output[0] = done, output[1] = loop. These are opposite. Confirm the actual semantics against the live node / `get_node_types` before wiring — a wrong assumption sends the per-item data to the done branch and processes only item 1.
- **Code node with no output connection.** A Code node that transforms data but has no outgoing connection is a dead end — its output never reaches downstream nodes. Trace every processing node to a real consumer.
- **"Done" branch fed the data path.** If `output[0]` (done, fires once with no useful payload) is wired to a node expecting per-item data, that node runs on an empty/stale `$json`. Confirm data-carrying nodes hang off the loop branch, not the done branch.

## Security

- **Secrets hardcoded in HTTP headers.** `developer-token` (and any token) hardcoded in plaintext across HTTP Request nodes is a leak and a maintenance trap. Use an n8n credential or `{{ $env.GOOGLE_ADS_DEVELOPER_TOKEN }}`. Flag every hardcoded instance, not just the first.

## Robustness

- **No null/zero ID validation before API calls.** `parseInt(id || 0)` silences a missing `customer_id`/`campaign_id` and sends a broken request instead of failing visibly. Validate IDs are present and non-zero before the HTTP node.
- **`$('Node').first()` in mergers.** `.first()` reads only the first item; nodes that emit multiple items lose data. Use `.all()` when the upstream node can fan out.
- **Silent `try/catch` returning `[]`.** Swallowing API errors with an empty-array fallback hides real failures. Prefer surfacing the error or at least logging it to a durable store.
- **Schedule Trigger without explicit `timezone`.** Falls back to the n8n server timezone; "yesterday" math can land on the wrong day. Set `timezone: "America/Sao_Paulo"` explicitly.

## GAQL Query Correctness

- **`LIMIT` truncation vs actual row count.** Estimate max rows before trusting a `LIMIT`. Examples seen: `LIMIT 50` on search terms drops relevant terms; `LIMIT 500` on 30d schedule (24h × 30d = 720 possible rows) truncates. Size the limit to the grain or remove it with a restrictive `WHERE`.
- **Budget period assumption in pacing.** Pacing math that assumes a daily budget breaks when `campaign_budget.period = MONTHLY`. Read and branch on `campaign_budget.period` instead of assuming.
- **`resource_name` is not a human-readable name.** `campaign_audience_view.resource_name` returns a path (`customers/123/campaignAudienceViews/456~789`); extracting the ID with `.split('/').pop()` gives an ID, not the audience name. A readable name needs a join with `user_list`/`user_interest`.

## Output / Delivery

- **Generated artifact with no destination.** A node that produces a PDF/HTML/file but has no downstream send node (email, Drive, Notion, Slack) produces output that goes nowhere. Confirm the artifact reaches a sink.
