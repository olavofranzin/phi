# n8n Review Reference

Use for live n8n workflow edits, exported workflow JSON, node configuration, sub-workflows, and versioning.

## Tool Order

1. `get_sdk_reference` before writing SDK workflow code.
2. `get_suggested_nodes` before choosing node families.
3. `search_nodes` to find exact node IDs and discriminators.
4. `get_node_types` before writing node parameters.
5. `validate_node_config` immediately after drafting each node config.
6. `validate_workflow` before `create_workflow_from_code`.
7. `get_workflow_details` before and after live edits.
8. `prepare_test_pin_data` then `test_workflow` when safe and useful.

## Live Edit Discipline

- Capture before state: `workflowId`, `versionId`, `activeVersionId`, node count, target node parameters, relevant connections.
- Prefer `setNodeParameter`, `setNodeSettings`, and narrow `updateNodeParameters` over replacing broad workflow JSON.
- Treat `update_workflow` as atomic but still verify post-state.
- If a workflow is active, distinguish draft `versionId` from `activeVersionId`.
- Publishing changes `activeVersionId`; updating draft usually does not.

## Node Review

- Check node `type`, `typeVersion`, `resource`, `operation`, and display-option dependent fields.
- For HTTP Request nodes, verify `authentication`, `nodeCredentialType`, `sendHeaders`, `sendQuery`, `sendBody`, and nested parameter arrays.
- For Code nodes, test JavaScript locally when possible with representative item shapes.
- For Execute Workflow nodes, verify caller mapping and callee trigger schema together.
- For error outputs, check both connection topology and node `onError`.

## Common n8n Hazards

- `$prevNode` can be unreliable in fan-in error paths; prefer explicit payload fields when possible.
- `$('Node').first().json` can throw if the node did not execute. Use safe wrappers when optional.
- `error_details` must have a consistent type across caller and sub-workflow.
- Notion rich text/body fields can fail on large payloads; truncate intentionally and keep full details in durable storage.
- MCP output can truncate large workflows; use focused details or targeted operations when possible.