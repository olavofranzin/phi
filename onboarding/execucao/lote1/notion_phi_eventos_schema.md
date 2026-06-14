# PHI - Eventos

Instrucoes para criar o DB Notion `PHI - Eventos` via MCP Notion.

Parent page: `9d6b65e5-c72b-82e7-856d-81bc34933316` (Gerenciamento de Documentos).

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

Depois de criado, substituir em `onboarding/execucao/lote1/generate_export.js` o placeholder
`<PHI_EVENTOS_DATA_SOURCE_ID_pending_creation>` pelo data source ID real e regenerar os exports.

Observacao: esta entrega nao cria o DB diretamente porque a sessao Codex atual nao expoe ferramenta MCP Notion de escrita. Os workflows ja estao estruturados para gravar eventos canonicos assim que o ID real for preenchido.
