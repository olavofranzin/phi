# Google APIs and GAQL Review Reference

Use for Google Ads API, GAQL, GA4 Data API, GBP/Business Profile APIs, and Google OAuth HTTP Request nodes.

## GAQL Checklist

- Confirm API version in endpoint and docs.
- Confirm selected fields are valid for the queried resource.
- Confirm metrics and segments are compatible. Known v23 trap: `metrics.cost_per_conversion` cannot be combined with `segments.conversion_action_name` or `segments.conversion_action_category`.
- Confirm `WHERE` uses valid date syntax and quoted literals.
- Confirm `LIMIT` is present for exploratory/high-volume queries.
- Confirm customer ID and login customer ID mapping.
- Confirm developer token is passed in headers when using raw HTTP Request.

## Google Ads HTTP Request Node

- Endpoint format: `https://googleads.googleapis.com/vXX/customers/{customer_id}/googleAds:search` or `searchStream`.
- Headers must include `developer-token` — the `googleAdsOAuth2Api` credential does NOT inject it — and optionally `login-customer-id`.
- Auth should use the configured Google Ads OAuth credential, not hardcoded bearer tokens.
- Body must contain a `query` string.
- Retry/backoff matters for quota and transient API errors.

## GA4 (Analytics Data API v1beta) Checks

- Property ID must use the `properties/{property_id}` format — a bare numeric ID fails.
- `runReport` body: `dimensions`, `metrics`, and `dateRanges` (`startDate`/`endDate`, ISO `YYYY-MM-DD` or the literal `today`).
- Dimension/metric compatibility is enforced: incompatible pairings return `INVALID_ARGUMENT`. When unsure, validate the pairing against the schema (or a `checkCompatibility` call) before wiring the query into production.
- Dimensional date output is `YYYYMMDD` (no separators) — account for this when joining GA4 rows to BigQuery `DATE` columns.
- Auth scope: read-only reporting needs `analytics.readonly`. Configuration writes (Admin API) need `analytics.edit` — never request edit scope for a read-only pipeline.
- Handle partial or empty API responses without breaking normalization.

## GBP Checks

- Verify location/account IDs come from trusted upstream fields.
- Verify date ranges use ISO `YYYY-MM-DD`.
- Handle partial or empty API responses without breaking normalization.

## Source Discipline

If the query uses fields or endpoints not already proven in the repo, consult official Google documentation or a live schema/API response before editing production workflow nodes.