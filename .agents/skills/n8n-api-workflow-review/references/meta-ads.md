# Meta Ads (Graph API) Review Reference

Use for Meta/Facebook Graph API HTTP Request nodes, Insights queries, and Meta campaign metric normalization. Patterns below reflect the proven setup in `workflows/integrations/daily_entry.json`.

## Endpoint and Auth

- Endpoint format: `https://graph.facebook.com/vXX.0/{ad_account_id}/insights` (repo currently uses `v21.0`).
- Account ID comes from upstream Notion data (`clean_id_meta_account`), never hardcoded.
- Auth: `authentication = predefinedCredentialType` with `nodeCredentialType = facebookGraphApi`. Never hardcode `access_token` in query params.
- Confirm the Graph API version still exists — Meta retires versions roughly every 2 years. Version bumps must be checked against changelog before editing.

## Insights Query Checklist

- `fields`: comma-separated string (e.g. `campaign_id,campaign_name,spend,impressions,clicks,actions,action_values,objective`).
- `time_range`: JSON string `{"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}` — same day for daily pulls.
- `level`: explicit (`campaign`, `adset`, `ad`). Missing level changes the response grain silently.
- Response payload lives in `data[]`; empty `data` is a valid response, not an error — validate `has_data` before downstream math.

## Normalization Hazards

- All numeric metrics (`spend`, `impressions`, `clicks`) arrive as STRINGS — wrap in `Number()` before math.
- Conversions are NOT a flat field: extract from the `actions[]` array by `action_type` (e.g. `offsite_conversion.fb_pixel_purchase`, `purchase`, `conversions`). Confirm which action_type the client's pixel actually fires.
- When filtering by campaign, compare as strings: `String(c.campaign_id) === String(target)`.
- Attribution lag: D-1 data may be empty or incomplete early morning. The PHI pattern is D-1 first, fallback to D-2 (`fallback_active` flag) — preserve this fallback wiring when editing.

## Rate Limits and Errors

- Insights endpoints are rate-limited per ad account; batch/backoff on HTTP 429 or error codes 17/80004.
- `(#100)` errors usually mean invalid field/level combination or wrong ID type — verify against the Graph API reference for the pinned version before changing production nodes.
