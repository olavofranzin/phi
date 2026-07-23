# Briefing — Sessão de Correções PHI Workflows

> Documento para continuidade no Claude Code local.
> Gerado em 01/05/2026 — branch `claude/fix-daily-entry-workflow-dC96Q`

---

## Contexto do Projeto

Repositório: `olavofranzin/phi`
n8n: `https://n8n-n8n-editor.1unqx7.easypanel.host`
Stack: n8n (queue mode) → BigQuery (`phi_prod`) → Notion

---

## O que já foi corrigido (nesta sessão)

### 1. Daily Entry v4 (`daily_entry_v4.json`)

Corrigidos 5 bugs que impediam análise de campanhas Meta Ads — especificamente a campanha `2a1b65e5c72b80ceb5b9d384a62151da`.

| Nó | Problema | Correção |
|---|---|---|
| `Code prepara contexto para observação` | Usava `items[0].json` em vez de `$input.first().json`; campos com nomes errados; faltava `meta_ads_campaign_id` | Sintaxe corrigida para Code v2; campos renomeados para `clean_client_slug`, `clean_metrica_mae`; adicionado `meta_ads_campaign_id` |
| `Code Cálculo Dados Meta` | Tomava `allCampaigns[0]` (primeira campanha da conta) em vez de filtrar pela campanha correta | Substituído por `.find(c => String(c.campaign_id) === targetCampaignId)` usando `clean_id_meta_campaign` |
| `Code Cálcula Métricas` | Sem branch para o caminho Meta Ads — processava apenas Google D7 | Adicionado `if (data.calculado)` para tratar Meta separadamente |
| `Code Recupera Metas p Comparação` | `$('Edit Fields').first()` lançava erro quando o nó Edit Fields não havia executado no caminho Meta | Envolvido em try/catch com fallback para `data.meta_valor` |
| `Code Montar SQL` | Sem detecção de campanha Meta — extraía `costMicros` onde deveria ler do campo `calculado` | Adicionada detecção `isMetaCampaign` e extração correta de custo/cliques/impressões do campo `calculado` |

---

### 2. PHI Pipeline v2 (`phi_pipeline_v2.json`)

Corrigidos 5 bugs incluindo o Auto-Close completamente inoperante.

| Nó | Problema | Correção |
|---|---|---|
| `Enrich for Sync` | Não populava `otimizacao_ativa` no output; typo `clean_campaing_id` | Adicionado `otimizacao_ativa: match?.json.clean_periodo_otimizacao_aberto ?? false`; typo corrigido para `clean_campaign_id` |
| `Sync Scores to Notion` | Faltava `"simple": false` — perdia campos PHI customizados | Adicionado `"simple": false` nos parâmetros |
| `Update Escalar Tarefa` | Usava `.first()` em vez de `.item` nas 3 expressões do texto da Observação | Substituído `.first()` por `.item` nas 3 ocorrências |
| `Log INGESTION SUCCESS` | Project ID `project-0e7c58d4-656f-49e8-807.phi_prod.` incorreto na query BQ | Corrigido para `phi_prod.` |
| `Log CALCULATION SUCCESS` | Mesmo erro de project ID | Corrigido para `phi_prod.` |

---

## O que ainda precisa ser feito

### 3. Workflow HubSpot — "Atualizar status e disparar extracao" (Prospecção)

**Status:** Não analisado — workflow não está exportado no repositório.

**Como acessar:** Com o MCP do n8n funcionando localmente, execute:
```
Liste os workflows da pasta Prospecção no n8n
Busque o workflow "HubSpot - Atualizar status e disparar extracao"
Analise o nó que processa a execução ID#4256 e identifique bugs
```

**Contexto fornecido pelo usuário:**
- Pasta: Prospecção
- Nome exato: `HubSpot - Atualizar status e disparar extracao`
- Execução com problema: ID `#4256`

---

### 4. Página Notion — correções pendentes

**Status:** Não acessada — `api.notion.com` bloqueada no ambiente cloud.

**Como acessar:** Com o MCP do Notion funcionando localmente, execute:
```
Busque no Notion a página de gestão de workflows
Leia o conteúdo e identifique correções pendentes listadas
```

A integração Notion precisa ter acesso à página — verifique em cada página:
`...` → `Connections` → adicionar a integração.

---

## Infraestrutura configurada nesta sessão

### MCPs registrados (em `/root/.claude.json` para o projeto `phi`)

```json
"n8n-mcp": {
  "command": "npx",
  "args": ["n8n-mcp"],
  "env": {
    "MCP_MODE": "stdio",
    "N8N_API_URL": "https://n8n-n8n-editor.1unqx7.easypanel.host",
    "N8N_API_KEY": "<ver sessão anterior>"
  }
},
"notion-mcp": {
  "command": "npx",
  "args": ["-y", "@notionhq/notion-mcp-server"],
  "env": {
    "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer ntn_...\",\"Notion-Version\":\"2022-06-28\"}"
  }
}
```

Para registrar localmente, use os comandos `claude mcp add` conforme instruções da sessão.

### Repositório `olavofranzin/n8n-workflows`

Criado para armazenar workflows exportados do n8n. Workflow de importação automática via GitHub webhook está em `github-importer-workflow.json` (importar no n8n e ativar).

Webhook a configurar no GitHub:
- URL: `https://n8n-n8n-webhook.1unqx7.easypanel.host/webhook/github-import`
- Event: `push`
- Content-type: `application/json`

### Correção no EasyPanel (pendente ou já aplicada)

`N8N_HOST` deve ser `n8n-n8n-editor.1unqx7.easypanel.host` (sem `https://`) para que a API do n8n aceite requisições externas.

---

## Convenções do projeto

- Campos limpos usam prefixo `clean_*`
- Code nodes usam sintaxe v2: `$input.first()`, `$input.all()`, `$('NomeDoNo').item`
- BigQuery: referenciar tabelas como `phi_prod.nome_tabela` (sem project ID)
- Workflows no repositório devem ter o campo `"id"` preservado no JSON exportado

---

## Arquivos no repositório (branch `claude/fix-daily-entry-workflow-dC96Q`)

| Arquivo | Descrição |
|---|---|
| `daily_entry_v4.json` | Daily Entry com todas as correções aplicadas |
| `phi_pipeline_v2.json` | PHI Pipeline v2 com todas as correções aplicadas |
| `phi_subworkflow_campanhas_fixed.json` | Subworkflow de campanhas (já corrigido anteriormente) |
| `github-importer-workflow.json` | Importador automático via webhook GitHub |
| `WORKFLOWS.md` | Documentação completa dos 3 workflows |
| `BRIEFING_LOCAL.md` | Este arquivo |
