# PHI n8n Handoff Checklist

Use for PHI workflows, Saude Digital, Agregador T28, onboarding telemetry, and handoff docs.

## Protected-Change Discipline

- Respect user-declared protected nodes/files.
- Preserve Portuguese UTF-8 labels. Check for mojibake markers after edits.
- Avoid unrelated graph rewrites and metadata churn.
- Keep credentials, schedules, and active production state unchanged unless explicitly requested.

## Required Final Evidence

- Git SHA when a repo commit is made.
- Workflow IDs.
- New draft `versionId` for edited workflows.
- New `activeVersionId` when publishing occurs.
- List of changed nodes.
- Explicit note for any smoke/test not run.
- Preexisting warnings separated from new warnings.

## Handoff Log Pattern

Record:

- Context and reason for change.
- Exact n8n workflow IDs.
- VersionIds before/after when relevant.
- Node-level changes.
- Validation commands/tools and PASS/FAIL result.
- Publish status.
- Remaining risks.

## Common PHI Checks

- Error handler caller/callee schema alignment.
- `error_details` type and truncation strategy.
- Notion block length.
- BigQuery insert field mapping.
- `onError` for critical nodes and handler best-effort behavior.
- Error-output connections from all intended source nodes.
- No duplicated stale error-handler chains.