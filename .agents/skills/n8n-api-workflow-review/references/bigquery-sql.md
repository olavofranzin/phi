# BigQuery SQL Review Reference

Use for BigQuery nodes, DDL, DML, parameterized queries, inserts, and pipeline table contracts.

## Checklist

- Confirm Standard SQL syntax.
- Confirm project, dataset, and table IDs.
- Confirm parameter names in SQL match n8n `queryParameters`.
- Confirm date boundaries use explicit timezone/business-date rules.
- Confirm insert fields match destination schema and nullable/required constraints.
- Confirm numeric casts are deliberate: `SAFE_CAST` for untrusted data, raw numeric types for typed node output.
- Confirm aggregation grain: every selected non-aggregated field appears in `GROUP BY` or uses a deliberate aggregate.
- Confirm idempotency strategy for repeated workflow runs.

## n8n BigQuery Node Checks

- For reads: inspect `sqlQuery`, `options.queryParameters`, timeout, and return numeric behavior.
- For inserts: inspect `projectId`, `datasetId`, `tableId`, `dataMode`, `fieldsUi`, batch size, and unknown/invalid row handling.
- Watch for validation warnings where `displayOptions` hide or invalidate parameters.

## Query Review Pattern

1. State the expected grain in one sentence.
2. List input tables and output columns.
3. Validate filters and date windows.
4. Validate joins and aggregation.
5. Check cost/performance only after correctness.
6. Produce a minimal test query or dry-run strategy when possible.