# HTTP APIs and Webhooks Review Reference

Use for generic API request nodes, webhook handlers, third-party integrations, and signed callbacks.

## HTTP Request Review

- Method and URL are explicit and environment-appropriate.
- Authentication uses n8n credentials when possible.
- Secrets are not hardcoded in headers, query params, body, notes, or handoff logs.
- Query parameters and body parameters are represented in the structure expected by the node version.
- Content type matches body encoding.
- Error behavior is intentional: retry, timeout, `onError`, and response-code handling.
- Pagination, rate limits, and backoff are documented or implemented where relevant.

## Webhook Review

- Validate method, path, auth/signature, and idempotency.
- Verify payload schema and error responses.
- Confirm whether production or manual/test webhook URL is being used.
- Never log raw secrets, tokens, or full PII payloads.

## API Change Rule

When an API schema, endpoint, version, or auth rule may have changed, verify with official docs or live metadata before changing workflow behavior.