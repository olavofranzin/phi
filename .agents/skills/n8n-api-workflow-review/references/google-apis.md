# Google APIs and GAQL Review Reference

Use for Google Ads API, GAQL, GA4 Data API, GBP/Business Profile APIs, and Google OAuth HTTP Request nodes.

## GAQL Checklist

- Confirm API version in endpoint and docs.
- Confirm selected fields are valid for the queried resource.
- Confirm metrics and segments are compatible.
- Confirm `WHERE` uses valid date syntax and quoted literals.
- Confirm `LIMIT` is present for exploratory/high-volume queries.
- Confirm customer ID and login customer ID mapping.
- Confirm developer token is passed in headers when using raw HTTP Request.

## Google Ads HTTP Request Node

- Endpoint format: `https://googleads.googleapis.com/vXX/customers/{customer_id}/googleAds:search` or `searchStream`.
- Headers usually include `developer-token` and optionally `login-customer-id`.
- Auth should use the configured Google Ads OAuth credential, not hardcoded bearer tokens.
- Body must contain a `query` string.
- Retry/backoff matters for quota and transient API errors.

## GA4 / GBP Checks

- Verify property/location/account IDs come from trusted upstream fields.
- Verify date ranges use ISO `YYYY-MM-DD`.
- Verify dimensions/metrics are compatible for the endpoint.
- Handle partial or empty API responses without breaking normalization.

## Source Discipline

If the query uses fields or endpoints not already proven in the repo, consult official Google documentation or a live schema/API response before editing production workflow nodes.