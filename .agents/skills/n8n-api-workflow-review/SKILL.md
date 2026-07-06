---
name: n8n-api-workflow-review
description: Use when creating, reviewing, or fixing n8n workflows, n8n node JSON, Execute Workflow contracts, HTTP Request nodes, Google Ads GAQL, Meta Ads Graph API, BigQuery SQL, GA4/GBP/Clarity/Notion/Telegram API calls, workflow versioning, publishing, or PHI automation handoffs.
---

# n8n API Workflow Review

## Overview

Use this skill to build or review n8n workflow changes with validation-first discipline across node configuration, API contracts, SQL/GAQL, versionIds, and production safety.

## First Move

1. Identify the surface: live n8n workflow, exported workflow JSON, node config, Code node JavaScript, GAQL, BigQuery SQL, or external API request.
2. Check whether a narrower installed skill applies before inventing guidance:
   - Run `npx skills list -g --json` or inspect available skill metadata.
   - Prefer installed skills such as `n8n-node-configuration`, `write-query`, `data-pipeline`, `webhook-integration`, and `find-skills` when relevant.
   - If no installed skill covers the domain, use `$find-skills` or run `npx skills find "<domain keywords>"`, then verify quality before relying on it.
3. Use primary schemas and live validation over memory:
   - For n8n, call `get_sdk_reference`, `get_suggested_nodes`, `search_nodes`, `get_node_types`, `validate_node_config`, and `validate_workflow` as applicable.
   - For current API behavior, use official docs or live schema/tool validation when available.

## Reference Routing

Read only the reference needed for the current surface:

- n8n nodes, workflow JSON, sub-workflows, versioning: `references/n8n.md`
- BigQuery SQL, DDL, data-pipeline review: `references/bigquery-sql.md`
- Google Ads GAQL and Google APIs in HTTP Request nodes: `references/google-apis.md`
- Meta Ads Graph API Insights and normalization: `references/meta-ads.md`
- Generic HTTP APIs and webhooks: `references/http-apis.md`
- PHI critical rules, production IDs, table contracts: `references/phi-project-rules.md`
- Recurring real-review defects (loop topology, secrets, GAQL limits): `references/known-defect-patterns.md`
- PHI-specific review and handoff checklist: `references/phi-checklist.md`

For any PHI workflow or `phi_prod` change, `references/phi-project-rules.md` is mandatory reading in addition to the surface-specific reference. Scan `references/known-defect-patterns.md` when reviewing loop structures, HTTP nodes, GAQL, or report-generation chains — these bugs have shipped before.

## Review Workflow

1. Establish the intended behavior and blast radius.
2. Capture current state before edits: workflow ID, versionId, activeVersionId, node count, target nodes, and relevant connections.
3. Write or run a narrow failing check when behavior changes. For workflow-only changes, use a structural assertion, node validation, or local reproduction script.
4. Validate node configs before applying them.
5. Apply the smallest operation set possible.
6. Re-fetch live workflow details after updates and verify versionIds and targeted changes.
7. When behavior was exercised (test run or scheduled run), inspect the actual execution via `search_executions` + `get_execution` — node-level output beats assumptions.
8. For production sub-workflows, publish only when requested or required; report the new activeVersionId.
9. Update handoff docs with exact IDs, warnings, and verification evidence.

## Non-Negotiables

- Do not guess n8n parameter names. Fetch node type definitions or use validated existing examples.
- Do not silently change credentials, active state, schedules, production trigger semantics, or unrelated nodes.
- Do not touch user-declared protected nodes or files.
- Do not hand-roll API syntax from memory when official docs or schemas are needed.
- Do not claim success without fresh verification output.
- Preserve UTF-8 text. Check for mojibake markers when editing Portuguese labels or code strings.

## Common Failure Checks

| Surface | Check |
| --- | --- |
| n8n Code node | JavaScript syntax, `$()` node references, null handling, item shape, mojibake |
| splitInBatches v3 | verify branch semantics against the live node (repo docs conflict); loop-body last node MUST connect back to the loop node or only item 1 runs |
| IF node | branch 0 = TRUE, branch 1 = FALSE — verify both outputs are wired as intended |
| Execute Workflow | input schema matches caller mapping, types match sub-workflow trigger |
| Error handling | `onError` value, error output connections, fallback behavior if handler fails |
| HTTP Request | method, auth mode, credential type, headers, query/body shape, pagination/retry |
| GAQL | selected fields are compatible, date literals valid, customer/login IDs correct |
| Meta Insights | `level` explicit, metrics cast from string, conversions extracted from `actions[]`, empty `data` handled |
| BigQuery | Standard SQL, dataset/table IDs, parameter names, date/time types, insert schema, `Always Output Data` on INSERT/MERGE, no `{{ }}` inside query text |
| Notion | body text limits, property names, rich text/block limits |
| Handoff | SHA, versionId, activeVersionId, warnings, unrun smokes |