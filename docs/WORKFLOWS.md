# PHI™ — Documentação de Workflows

> Documento vivo. Atualizar sempre que um workflow for criado, alterado ou descontinuado.

---

## Índice

| Workflow | Arquivo | Horário | Status |
|---|---|---|---|
| [Daily Entry v4](#1-daily-entry-v4) | `daily_entry_v4.json` | 04h00 | ✅ Ativo |
| [PHI Pipeline v2](#2-phi-pipeline-v2) | `phi_pipeline_v2.json` | 07h00 | ✅ Ativo |
| [PHI Subworkflow Campanhas](#3-phi-subworkflow-campanhas) | `phi_subworkflow_campanhas_fixed.json` | — (chamado pelo Pipeline) | ✅ Ativo |

---

## 1. Daily Entry v4

### Função
Coleta diariamente os dados de performance de cada campanha ativa (Google Ads e Meta Ads), valida e enriquece com contexto do Notion, calcula métricas e KPIs, e persiste o registro consolidado no BigQuery (`phi_prod.raw_campaign_data`). Cria também uma Observação Diária no Notion para auditoria manual.

### Trigger
`Schedule Trigger` — todos os dias às **04h00**.

### Dependências Externas

| Sistema | Uso |
|---|---|
| **Notion** — DB `Campanhas` (`19fb65e5-c72b-8043-a82d-f47ede397928`) | Fonte dos cadastros de campanhas ativas com metas e IDs de plataforma |
| **Notion** — DB `Observações Diárias` (`19fb65e5-c72b-8192-8f73-ff7f500a0972`) | Destino da observação criada por execução |
| **Google Ads API** v22 | Busca métricas de D-1, D-3 e D-7 por campanha Google |
| **Meta Ads API (Graph)** v21.0 | Busca métricas de D-1 (com fallback D-2) por conta Meta |
| **BigQuery** — `phi_prod.raw_campaign_data` | Destino final do daily entry via MERGE SQL |

### Fluxo Principal

```
Schedule Trigger
  └─ Get many database Campanhas (Notion)
      └─ Loop Over Items (por campanha)
          └─ Code Clean Campanhas
              └─ Code prepara contexto para observação
                  └─ [If Plataforma]
                        ├─ [true] Google Ads ──────────────────────────────────┐
                        │    HTTP Request Google D1                            │
                        │    → HTTP Request Google D3                         │
                        │    → HTTP Request Google D7                         │
                        │    → Code Unificar Períodos (D1, 3D, 7D)            │
                        │    → Code Valida Dados                              │
                        │    → Edit Fields (meta_valor)                       │
                        │                                                     ▼
                        └─ [false] Meta Ads            Code Cálcula Métricas ─┘
                             HTTP Request Meta Ads D1   → Code Recupera Metas p Comparação
                             → Code Valida Dados Meta   → Code calculo desvio meta
                             → [If D-1 Exist Meta Ads]  → Code classificar status
                                  ├─ [true] Code Cálculo Dados Meta → Merge Meta Ads
                                  └─ [false] HTTP Request Meta Ads D-2
                                              → Code Valida Dados D-2 Meta
                                              → [If D-2 exist1] → Merge Meta Ads
                                                                    Code Preparar Payload
                                                                    → Code Debug
                                                                    → Create Observation (Notion)
                                                                    → Update DB page (Notion)
                                                                    → Code Montar SQL
                                                                    → Execute SQL (BigQuery MERGE)
                                                                    → Loop Over Items (próxima campanha)
```

### Nós Principais

| Nó | Tipo | Função |
|---|---|---|
| `Schedule Trigger` | Trigger | Dispara diariamente às 04h00 |
| `Get many database Campanhas` | Notion | Busca campanhas com Status=`Em execução`, Fonte preenchida, Métrica-Mãe preenchida |
| `Code Clean Campanhas` | Code | Extrai e normaliza ~35 campos do objeto Notion bruto para campos `clean_*` |
| `Code prepara contexto para observação` | Code | Calcula datas D-1/D-2, monta contexto unificado com `platform`, `meta_valor`, `raw_notion_data` |
| `If Plataforma` | If | Roteia por plataforma: `true` = Google Ads, `false` = Meta Ads |
| `HTTP Request Google Ontem (D1/D3/D7)` | HTTP | Consulta API Google Ads v22 via GAQL filtrando pelo `campaign.id` específico |
| `HTTP Request Meta Ads` | HTTP | Consulta Graph API v21.0 no nível de conta; filtragem por `campaign_id` feita em código |
| `Code Unificar Períodos (D1, 3D, 7D)` | Code | Agrega resultados dos 3 períodos Google em `v_d1`, `v_3d`, `v_7d` e métricas brutas |
| `Code Cálculo Dados Meta` | Code | Filtra campanha correta no array Meta, calcula CPA/CTR/CPC do período |
| `Code Valida Dados` / `Code Valida Dados Meta` | Code | Verifica se a API retornou dados reais; seta `has_data: true/false` |
| `Code Cálcula Métricas` | Code | Detecta path Google/Meta via `data.calculado`; calcula `valor_real` pela métrica-mãe |
| `Code Recupera Metas p Comparação` | Code | Monta `sop_config` com `metric_principal` e `meta_valor`; fallback por path |
| `Code calculo desvio meta` | Code | Calcula desvios D-1, D-3, D-7 e tendência 3D vs 7D |
| `Code classificar status` | Code | Classifica em OK/Atenção/Crítico com score 0–100 |
| `Code Montar SQL` | Code | Gera MERGE SQL para `phi_prod.raw_campaign_data`; detecta path Meta vs Google |
| `Execute SQL inserir daily entry` | BigQuery | Executa o MERGE no projeto `phi-production` |

### Relação com Outros Workflows

| Workflow | Relação |
|---|---|
| **PHI Pipeline v2** | Consome `phi_prod.raw_campaign_data` gerado por este workflow para calcular o PHI Score (roda 3h depois) |
| **PHI Subworkflow Campanhas** | Alternativa de ingestão; ambos escrevem na mesma tabela BQ com o mesmo schema |

### Campos Notion por Database

**Campanhas** (leitura):
`Status`, `Fonte` (plataforma), `Métrica-Mãe`, `Meta da Métrica-mãe`, `Orçamento Diário`, `id_campanha`, `notion_id_camp`, `id_google_camp`, `id_google_account`, `id_meta_account`, `id_meta_camp`, `client_slug`

**Observações Diárias** (escrita):
`Status Atual`, `Score Final`, `Análise de Performance`, `Meta Métrica-mãe`, `Desvio 7D`, `Tendência 3D vs 7D`, `Última Atualização`, `Fonte do Dado`

---

### Histórico de Correções

| Data | Correção | Nó Afetado |
|---|---|---|
| 2026-04-28 | Campo `clean_sigla_cliente` → `clean_client_slug`; `clean_meta_primaria` → `clean_metrica_mae`; `items[0]` → `$input.first()` | `Code prepara contexto para observação` |
| 2026-04-28 | Meta Ads capturava `data[0]` em vez de filtrar pelo `campaign_id` da campanha sendo processada — campanhas erradas sendo analisadas em contas com múltiplas campanhas | `Code Cálculo Dados Meta` |
| 2026-04-28 | Tentava ler nó Google D7 no path Meta (inexistente); ignorava campo `calculado` do Meta | `Code Cálcula Métricas` |
| 2026-04-28 | `$('Edit Fields')` lançava erro no path Meta (nó não executado); adicionado try/catch com fallback para contexto | `Code Recupera Metas p Comparação` |
| 2026-04-28 | `$('Code Unificar Períodos')` lançava erro no path Meta; detecta `isMetaCampaign` e usa `calculado` | `Code Montar SQL` |

---

## 2. PHI Pipeline v2

### Função
Pipeline principal de orquestração do PHI™. Roda após o Daily Entry e executa 3 fases sequenciais:
1. **INGESTION** — chama o Subworkflow Campanhas por cliente ativo para ingerir dados no BQ
2. **CALCULATION** — calcula e persiste o PHI Score em `phi_score_history` via MERGE BigQuery
3. **OPERATIONAL** — sincroniza scores no Notion, escala tarefas em alerta, cria checklists SOP e executa Auto-Close quando campanha se recupera

### Trigger
`Schedule Trigger` — todos os dias às **07h00**.

### Dependências Externas

| Sistema | Uso |
|---|---|
| **Notion** — DB `Campanhas` (`19fb65e5-c72b-8043-a82d-f47ede397928`) | Leitura para enriquecer campanhas (F3) e sincronizar scores |
| **Notion** — DB `Tasks` (`19fb65e5-c72b-812d-a734-de9a4d5b980f`) | Criação, atualização e fechamento de tarefas de otimização |
| **Notion** — DB `Checklist` (`19fb65e5-c72b-81cd-b006-fe0ffa97a35d`) | Criação de itens de checklist SOP por tarefa |
| **BigQuery** — `phi_prod.raw_campaign_data` | Fonte da ingestão (escrito pelo Daily Entry / Subworkflow) |
| **BigQuery** — `phi_prod.phi_score_history` | Destino do cálculo do PHI Score |
| **BigQuery** — `phi_prod.phi_score_current` | View/tabela com score mais recente por campanha |
| **BigQuery** — `phi_prod.workflow_execution_log` | Log de execução por fase (RUNNING / SUCCESS / FAILED) |
| **BigQuery** — `phi_prod.client_config` | Clientes ativos e modelo de score associado |
| **BigQuery** — `phi_prod.model_config` | Pesos dos componentes PHI e threshold por modelo |
| **PHI Subworkflow Campanhas** (`b1pbn8qmzCNTufTp`) | Chamado por cliente no Loop Clientes (Fase 1) |

### Fluxo Principal

```
Schedule Trigger
  └─ Buscar ID de Sucesso Hoje (BQ)       ← gera ou recupera execution_id do dia
      └─ Log INGESTION RUNNING (BQ)
          └─ Buscar Clientes Ativos (BQ)
              └─ Code INSERT execution_id
                  └─ Loop Clientes
                        ├─ [loop] Call Subworkflow Campanhas ─────────────────────────────┐
                        │                                                                  │ (por cliente)
                        └─ [fim loop] Code Receber 1 Item Ingestão                       ◄┘
                              └─ Log INGESTION SUCCESS (BQ)
                                  └─ [If Ingestão OK?]
                                        ├─ [fail] Log INGESTION FAILED
                                        └─ [ok] Log CALCULATION RUNNING (BQ)
                                              └─ Calcular e Persistir PHI Score (BQ MERGE)
                                                  └─ [If Cálculo OK?]
                                                        ├─ [fail] Log CALCULATION FAILED
                                                        └─ [ok] Log CALCULATION SUCCESS (BQ)
                                                              └─ Get many database Campanhas (Notion)
                                                                  └─ Code Clean Campanhas F3
                                                                      └─ Get All Current Scores (BQ)
                                                                          └─ Loop Sync & Close
                                                                                ├─ [loop] Enrich for Sync
                                                                                │    → [Existe no Notion?]
                                                                                │         ├─ [não] pula
                                                                                │         └─ [sim] Sync Scores to Notion
                                                                                │               → [Check Auto-Close]
                                                                                │                    ├─ [não] volta ao loop
                                                                                │                    └─ [sim] Get Task para Fechar
                                                                                │                          → Auto-Close Task
                                                                                │                          → Auto-Close: Desativar Otimização
                                                                                │                          → volta ao loop
                                                                                └─ [fim loop] Log OPERATIONAL RUNNING (BQ)
                                                                                      └─ Buscar Campanhas Alertas (BQ)
                                                                                          └─ [Tem Campanhas em Alerta?]
                                                                                                ├─ [não] Log OPERATIONAL SUCCESS
                                                                                                └─ [sim] Loop Campanhas
                                                                                                      ├─ [loop] Code Enriquecer Campanha
                                                                                                      │    → Execute SQL Verificar Escalada (BQ)
                                                                                                      │    → [If Deve Escalar?]
                                                                                                      │         ├─ [sim] Get tasks para Escalada
                                                                                                      │         │    → [Tarefa Escalada Existe?]
                                                                                                      │         │         ├─ [sim] Update Escalar Tarefa
                                                                                                      │         │         └─ [não] → If otimização ativa
                                                                                                      │         └─ [não] → If otimização ativa
                                                                                                      │                        ├─ [ativa=false] Tarefa Existe?
                                                                                                      │                        │    ├─ [sim] Update a database page
                                                                                                      │                        │    └─ [não] Code Criar Checklist
                                                                                                      │                        │              → Create a database page (Task)
                                                                                                      │                        │              → Update otimização ativa
                                                                                                      │                        │              → Loop Over Items (checklists)
                                                                                                      │                        │                   → Create a database page chklist
                                                                                                      │                        └─ [ativa=true] volta ao loop
                                                                                                      └─ [fim loop] Log OPERATIONAL SUCCESS
                                                                                                            └─ [If Operacional OK?]
                                                                                                                  └─ Log OPERATIONAL FAILED (se erro)
```

### Nós Principais

| Nó | Tipo | Função |
|---|---|---|
| `Buscar ID de Sucesso Hoje` | BigQuery | Reutiliza `execution_id` de um SUCCESS hoje ou gera FALLBACK-{data}-{uuid} |
| `Log INGESTION/CALCULATION/OPERATIONAL RUNNING/SUCCESS/FAILED` | BigQuery | Registro de ciclo de vida da execução em `workflow_execution_log` |
| `Buscar Clientes Ativos` | BigQuery | Lê `client_config` filtrando `is_active = TRUE` |
| `Loop Clientes` | SplitInBatches | Itera clientes; output 0 = fim do loop, output 1 = próximo cliente |
| `Call Subworkflow Campanhas` | ExecuteWorkflow | Chama o subworkflow passando `execution_id` e `client_id` |
| `Calcular e Persistir PHI Score` | BigQuery | MERGE em `phi_score_history` calculando MAS, TSS, FIS, ES, PHI Value e Priority Score via SQL puro |
| `Get many database Campanhas` (F3) | Notion | Releitura do Notion para enriquecer scores com metadados de campanha |
| `Code Clean Campanhas F3` | Code | Extrai campos `clean_*` do Notion para uso no Sync e Alertas |
| `Get All Current Scores (Sync)` | BigQuery | Lê `phi_score_current` filtrado pelo `execution_id` do dia |
| `Enrich for Sync` | Code | Cruza dados BQ com Notion via `campaign_id`; adiciona `notion_page_id`, `client_slug`, `otimizacao_ativa` |
| `Sync Scores to Notion` | Notion | Atualiza `phi_score`, `phi_classificacao`, `Status Geral da Campanha` na página da campanha |
| `Check Auto-Close` | If | Dispara Auto-Close se `phi_classification = GOOD` **e** `otimizacao_ativa = true` |
| `Buscar Campanhas Alertas` | BigQuery | Campanhas em WARNING/CRITICAL por 2+ dias consecutivos (confirma em `phi_score_history`) |
| `Code Enriquecer Campanha` | Code | Cruza alertas BQ com dados Notion do `Code Clean Campanhas F3` |
| `Execute SQL Verificar Escalada (BQ)` | BigQuery | Confirma se campanha atual qualifica para escalada (2 dias em alerta) |
| `Code Criar Checklist` | Code | Gera lista de itens SOP por `phi_classification`, plataforma e modelo de negócio (inclui aviso de aprendizado se conversões_7d < 50) |
| `If otimização ativa` | If | Evita criar tarefa duplicada se `otimizacao_ativa = true` |

### Relação com Outros Workflows

| Workflow | Relação |
|---|---|
| **Daily Entry v4** | Deve rodar **antes** (04h00); grava os dados que este pipeline consome no BQ |
| **PHI Subworkflow Campanhas** | Chamado dentro do Loop Clientes (Fase 1); ingere dados Google Ads por cliente |

### Campos Notion por Database

**Campanhas** (leitura F3 + escrita Sync):
`Status`, `Fonte`, `Métrica-Mãe`, `Meta da Métrica-mãe`, `Orçamento Diário`, `Otimização Ativa?`, `notion_id_camp`, `client_id`, `client_slug`, `Projeto` (relation), `phi_score`, `phi_classificacao`, `Score Diário (0-100)`, `Status Geral da Campanha`, `phi_ultima_execucao`

**Tasks** (leitura + escrita):
`campaign_id`, `Status`, `Criado por Automação`, `Gravidade Detectada`, `Prioridade`, `Data Programada`, `Prazo`, `Observação`, `execution_id`, `Métrica Afetada`, `Origem`, `Plataforma`, `Responsável`, `Hipótese Sugerida (IA)`, `priority_score`, `Projeto` (relation), `Campanha` (relation)

**Checklist** (escrita):
`Tarefa` (relation), `Categoria`, `Concluído?`, `Subcategoria`, `Criado por`, `Projeto` (relation)

### Tabelas BigQuery

| Tabela | Operação | Nó |
|---|---|---|
| `phi_prod.workflow_execution_log` | INSERT / MERGE | Todos os nós de Log |
| `phi_prod.client_config` | SELECT | `Buscar Clientes Ativos` |
| `phi_prod.raw_campaign_data` | SELECT (via subworkflow) | `Calcular e Persistir PHI Score` |
| `phi_prod.phi_score_history` | MERGE | `Calcular e Persistir PHI Score` |
| `phi_prod.phi_score_current` | SELECT | `Get All Current Scores (Sync)`, `Buscar Campanhas Alertas` |
| `phi_prod.model_config` | SELECT (JOIN) | `Calcular e Persistir PHI Score`, `Buscar Campanhas Alertas` |

### Histórico de Correções

| Data | Correção | Nó Afetado |
|---|---|---|
| 2026-04-28 | Auto-Close nunca disparava: `otimizacao_ativa` nunca populado no path de Sync | `Enrich for Sync` |
| 2026-04-28 | `Sync Scores to Notion` sem `simple: false` descartava campos PHI do `$json` downstream, quebrando `Check Auto-Close` | `Sync Scores to Notion` |
| 2026-04-28 | `.first()` na Observation da escalada sempre usava dados da 1ª campanha do loop | `Update Escalar Tarefa` |
| 2026-04-28 | Project ID literal `project-0e7c58d4-656f-49e8-807` em 2 nós vs. `phi_prod.*` nos demais 13 | `Log INGESTION SUCCESS`, `Log CALCULATION SUCCESS` |
| 2026-04-28 | Typo `clean_campaing_id` → `clean_campaign_id` em 2 ocorrências | `Code Clean Campanhas F3`, `Enrich for Sync` |

---

## 3. PHI Subworkflow Campanhas

### Função
Subworkflow chamado pelo PHI Pipeline v2 (Fase 1 — INGESTION). Para cada cliente, busca campanhas ativas no Notion, consulta o Google Ads API e insere/atualiza os dados brutos na tabela `phi_prod.raw_campaign_data`.

### Trigger
`Execute Workflow Trigger` — chamado pelo nó `Call Subworkflow Campanhas` do Pipeline v2, recebendo `execution_id` e `client_id` como parâmetros.

### Dependências Externas

| Sistema | Uso |
|---|---|
| **Notion** — DB `Campanhas` | Busca campanhas do cliente com fonte de tráfego configurada |
| **Google Ads API** | Busca métricas de conversão, custo, cliques e impressões |
| **BigQuery** — `phi_prod.raw_campaign_data` | Destino do INSERT de dados brutos |
| **BigQuery** — `phi_prod.client_config` | Verifica sincronização do cliente |

### Nós Principais

| Nó | Tipo | Função |
|---|---|---|
| `Start` | ExecuteWorkflowTrigger | Recebe `execution_id` e `client_id` do Pipeline pai |
| `Get database Campanhas` | Notion | Busca campanhas do `client_id` recebido |
| `If fonte trafego` | If | Roteia por plataforma: Google Ads (hoje) vs. Meta Ads (`noOp` — em breve) |
| `HTTP Request Google` | HTTP | Consulta Google Ads API com GAQL para o `client_id` |
| `Code transformar retorno Google Ads` | Code | Normaliza resposta da API para o schema de `raw_campaign_data` |
| `Execute SQL INSERT raw_campaign_data` | BigQuery | INSERT dos dados normalizados |
| `Execute SQL client_config sincronizado` | BigQuery | Marca cliente como sincronizado em `client_config` |
| `Meta Ads — em breve` | NoOp | Placeholder para integração futura com Meta Ads |

### Relação com Outros Workflows

| Workflow | Relação |
|---|---|
| **PHI Pipeline v2** | Chamado por ele via `Call Subworkflow Campanhas`; retorna ao loop do Pipeline após execução |
| **Daily Entry v4** | Escreve na mesma tabela BQ (`raw_campaign_data`); os dois são ingestores complementares — Daily Entry por campanha individual, Subworkflow por cliente inteiro |

---

## Convenções e Padrões

### Nomes de Campos Notion Normalizados
Campos extraídos do Notion têm prefixo `clean_` após passarem por um nó Code de limpeza (ex.: `clean_id_campanha`, `clean_metrica_mae`, `clean_cliente_slug`). **Não renomear** sem atualizar todos os nós que os consomem.

### execution_id
Chave central de rastreabilidade. Gerado uma vez por dia por `Buscar ID de Sucesso Hoje` e propagado para todos os logs BQ, registros de `raw_campaign_data` e `phi_score_history`. Formato: `EXEC-DE-{YYYYMMDDHHmmss}` ou `FALLBACK-{YYYYMMDD}-{uuid}`.

### Logs de Execução (`workflow_execution_log`)
Cada fase grava pelo menos 2 eventos: `RUNNING` (INSERT ao iniciar) e `SUCCESS`/`FAILED` (MERGE ao terminar). Nunca pular o log de falha — ele é a fonte de diagnóstico de falhas silenciosas.

### BigQuery — Referência de Tabelas
Usar sempre o formato curto `phi_prod.<tabela>` (sem project ID literal). O project ID `project-0e7c58d4-656f-49e8-807` é resolvido pela credencial configurada no n8n.

### Ordem de Execução Esperada
```
04h00  Daily Entry v4          → grava raw_campaign_data
07h00  PHI Pipeline v2
         └─ Fase 1 (Ingestion) → chama Subworkflow por cliente → complementa raw_campaign_data
         └─ Fase 2 (Calculation) → calcula PHI Score
         └─ Fase 3 (Operational) → sincroniza Notion, tarefas, Auto-Close
```
