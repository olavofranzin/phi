# PHI - Eventos

Instrucoes para criar o DB Notion `PHI - Eventos` via MCP Notion.

Parent page: `9d6b65e5-c72b-82e7-856d-81bc34933316` (Gerenciamento de Documentos).
Page: `c64f600e-4f46-4b2b-ac22-c1e425c8966e`.
Data source ID: `3423df0d-77df-4834-bdda-c08ddbae40ff`.

Schema:

| Campo | Tipo | Configuracao |
|---|---|---|
| `tipo` | title | Exemplo: `demanda.criada` |
| `entidade_id` | rich_text | ID da demanda/etapa relacionada |
| `entidade_area` | select | `Execucao` purple, `Onboarding` blue, `Priorizacao` orange, `Comercial` yellow, `Curador` red, `Documentacao e Ferramentas` gray |
| `payload_json` | rich_text | JSON serializado do payload comum + especifico |
| `timestamp` | date | ISO-8601 UTC |
| `execution_id` | rich_text | ID da execucao n8n |
| `tenant_id` | rich_text | Default `phi-agencia` |
| `tier_agente` | select | `pro` red, `flash` blue, `n/a` gray |
| `versao_sop_aplicada` | rich_text | ID da entrada Vigente do DB `PHI - SOPs` |

Observacao: o DB foi criado via MCP Notion durante a pre-revisao do a01. Os workflows usam o data source ID acima para gravar eventos canonicos.

Pre-requisito para smoke: configurar no n8n a env var `WEBHOOK_SECRET_EXECUCAO`. O Intake valida esse valor contra o header `x-pacing-secret` antes de processar o payload.
