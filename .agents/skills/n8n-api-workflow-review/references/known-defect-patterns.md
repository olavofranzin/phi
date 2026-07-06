# Recurring n8n / Ads-API Defect Patterns

Defect classes seen repeatedly in real n8n workflow reviews. Project-agnostic — check for each when reviewing similar nodes in any workflow.

## Loop / Topology (highest severity — silently breaks pipelines)

- **splitInBatches v3 loop-back missing.** The last node of the loop body MUST connect back to the splitInBatches node (`nextBatch(node)` in the SDK), or only the first item is processed and the loop never advances. Verify the return connection exists, not just the branch wiring.
- **splitInBatches v3 branch order.** Output 0 = **done** (fires once, at the end, carrying no per-item payload); output 1 = **loop** (fires per batch). Confirmed in the n8n SDK: `.onDone` maps to output 0, `.onEachBatch` to output 1. Wiring the per-item data path off output 0 means it runs once on an empty/stale payload.
- **Code node with no output connection.** A Code node that transforms data but has no outgoing connection is a dead end — its output never reaches downstream nodes. Trace every processing node to a real consumer.

## Credentials / Secrets

- **Prefer credentials over inline secrets — but know the platform limits.** Use an n8n credential whenever the auth type supports the value. Some secrets can't be injected by a credential (e.g. a Google Ads `developer-token` header is not injected by `googleAdsOAuth2Api`) and must live in the node. On n8n instances without the Variables/env feature (common on self-hosted), such values are unavoidably stored in the node and therefore in exported workflow JSON. That is a platform limitation, not a fixable node defect — do not flag it as one. What you CAN control: keep the secret out of handoff docs, logs, sticky notes, and commit messages, and treat any exported JSON that contains it as sensitive.

## Robustness

- **No null/zero ID validation before API calls.** `parseInt(id || 0)` silences a missing identifier and sends a broken request instead of failing visibly. Validate required IDs are present and non-zero before the HTTP node.
- **`$('Node').first()` in mergers.** `.first()` reads only the first item; nodes that emit multiple items lose data. Use `.all()` when the upstream node can fan out.
- **Silent `try/catch` returning `[]`.** Swallowing API errors with an empty-array fallback hides real failures. Prefer surfacing the error or at least logging it to a durable store.
- **Schedule Trigger without explicit `timezone`.** Falls back to the server timezone; date math (e.g. "yesterday") can land on the wrong day. Set the timezone explicitly on the trigger.

## GAQL Query Correctness

- **`LIMIT` truncation vs actual row count.** Estimate max rows before trusting a `LIMIT`. E.g. a 30-day hourly query is 24 × 30 = 720 possible rows — `LIMIT 500` silently truncates. Size the limit to the grain or replace it with a restrictive `WHERE`.
- **Budget period assumption in pacing.** Pacing math that assumes a daily budget breaks when `campaign_budget.period = MONTHLY`. Read and branch on `campaign_budget.period` instead of assuming.
- **`resource_name` is not a human-readable name.** `campaign_audience_view.resource_name` returns a path (`customers/123/campaignAudienceViews/456~789`); `.split('/').pop()` yields an ID, not the audience name. A readable name needs a join with `user_list`/`user_interest`.

## Output / Delivery

- **Generated artifact with no destination.** A node that produces a PDF/HTML/file but has no downstream send node (email, Drive, Notion, Slack) produces output that goes nowhere. Confirm the artifact reaches a sink.
