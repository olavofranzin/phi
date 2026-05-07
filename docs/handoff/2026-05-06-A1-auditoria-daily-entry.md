# A.1 — Auditoria do Daily Entry e do PHI Score

> Executado por: **Codex (GPT-5)** • 2026-05-06 • Solicitado pelo Cérebro Estratégico via Painel #2 (`358b65e5-c72b-8117-ae16-f8713c2458ce`)

---

## 1. Resumo Executivo

O estado real hoje é este: Daily Entry (`zGgIqiLlo5iAn8ud`) está ativo, roda diariamente e não é só coleta/observação. Ele lê Campanhas no Notion, consulta Google Ads e Meta Ads, cria páginas em Observações Diárias com PHI Score, Classificação PHI, Optimization Score e Status da Métrica-Mãe, e ainda faz `MERGE` em `phi_prod.raw_campaign_data` no BigQuery. PHI - Pipeline_v2 (`ITWG3Ge0asXtUM8U`) está ativo, roda diariamente, executa ingestão/subworkflow, calcula o score oficial no BigQuery, sincroniza score/status no Notion e opera abertura/escalada/fechamento de tarefas. Google Ads v2 (`aueMKOExsN28nREq`) existe com esse nome exato, está inativo e, na configuração atual, é analítico puro: lê Campanhas, consulta Google Ads, monta HTML e termina em PDF, sem escrita confirmada em Notion ou BigQuery.

Os principais riscos hoje são: dupla semântica de score/status entre Daily Entry e PHI, hardcodes sensíveis em tokens/IDs/projetos, forte acoplamento por nome de node/expression, e inconsistência de governança do workflow analítico Google Ads: o alvo exato existe, mas a API retornou `parentFolderId: null`, então a pertença à pasta Relatórios não ficou confirmada pelo estado retornado do n8n.

As correções prioritárias são: retirar do Daily Entry qualquer escrita que pareça score/status oficial, consolidar no PHI toda semântica operacional oficial, decidir formalmente se o "log de otimizações" será Tasks+checklist ou um database próprio, e separar claramente o papel do Google Ads v2 como relatório complementar sem autoridade operacional.

## 2. Auditoria por Workflow

### Daily Entry

- **Nome:** Daily Entry
- **ID:** `zGgIqiLlo5iAn8ud`
- **Status:** ativo
- **Trigger/Frequência:** Schedule Trigger, diário às 04:00, timezone America/Sao_Paulo
- **Finalidade real observada:** coleta campanhas ativas no Notion, enriquece contexto, consulta Google Ads ou Meta Ads, calcula métricas/desvios/classificação para observação diária, cria página em Observações Diárias e faz ingestão em BigQuery
- **Principais nodes:** Get many database Campanhas, Code prepara contexto para observação, If Plataforma, HTTP Request Google Ontem (D1/D3/D7), HTTP Request Meta Ads, Code Unificar Períodos (D1, 3D, 7D), Code Cálcula Métricas, Code calculo desvio meta, Code classificar status, Create a database page Create Observation, Code Processar Blocos v23, Code Montar SQL, Execute SQL inserir daily entry
- **Inputs reais:** páginas da database Campanhas; IDs e metas vindos do Notion (`id_google_camp`, `id_google_account`, `id_meta_account`, `id_meta_ads`, Métrica-Mãe, meta da métrica); dados de Google Ads v23; dados de Meta Ads via Graph API
- **Outputs reais:** página criada em Observações Diárias; SQL `MERGE` para `phi_prod.raw_campaign_data`
- **Leituras no Notion:** database Campanhas `19fb65e5-c72b-8043-a82d-f47ede397928` filtrando Status = Em execução, Fonte não vazio, Métrica-Mãe não vazio
- **Escritas no Notion:** database Observações Diárias `19fb65e5-c72b-8192-8f73-ff7f500a0972` no node Create a database page Create Observation
- **Campos escritos confirmados em Observações Diárias:** Análise de Performance, Campanha, Observação Diária, Valor Métrica-Mãe 1D, Valor Métrica-Mãe 7D, Emoji Status, Fonte dos Dados, id_google_camp, id_google_account, id_meta_account, id_meta_ads, Métrica Principal, Optimization Score, Classificação PHI, Tendência 3Dvs7D, Data Execução, id_workflow, Tendência 1Dvs7D, Criado Por, PHI Score, Status da Métrica-Mãe, Valor Métrica-Mãe 3D
- **Leituras no BigQuery:** não confirmadas como leitura direta de tabelas; este workflow monta SQL localmente e executa write
- **Escritas no BigQuery:** Execute SQL inserir daily entry faz `MERGE` em `phi_prod.raw_campaign_data`
- **Tabelas/queries do BigQuery:** `MERGE phi_prod.raw_campaign_data AS target ...`
- **Integrações externas:** Notion, Google Ads API, Meta Ads Graph API, Google BigQuery
- **Papel esperado:** coleta, normalização e observação diária
- **Desalinhamentos:** hoje ele não fica só em observação; grava PHI Score e Classificação PHI no Notion, o que conflita semanticamente com a ideia de score/status oficial reservado ao PHI; também já executa ingestão estruturada em raw_campaign_data
- **Ajustes necessários:** manter coleta e observação; remover ou renomear campos de score/status para semântica explicitamente "observacional"; se precisar continuar mostrando score no log diário, usar nomenclatura derivada e não oficial; documentar que a escrita em raw_campaign_data é a etapa de ingestão suportada pelo PHI
- **Resposta objetiva ao item 7:** sim, Daily Entry escreve score/status no Notion hoje, confirmado no node Create a database page Create Observation; não é no cadastro de campanha, e sim na database Observações Diárias

### PHI - Pipeline_v2

- **Nome:** PHI - Pipeline_v2
- **ID:** `ITWG3Ge0asXtUM8U`
- **Status:** ativo
- **Trigger/Frequência:** Schedule Trigger, diário às 07:00
- **Finalidade real observada:** orquestra três fases reais: ingestão, cálculo oficial PHI e operação; loga execução no BigQuery; aciona subworkflow por cliente; calcula e persiste score oficial; sincroniza score/status em Campanhas; abre/escalona/fecha tarefas no Notion
- **Principais nodes:** Buscar ID de Sucesso Hoje, Log INGESTION RUNNING/SUCCESS/FAILED, Buscar Clientes Ativos, Call Subworkflow Campanhas, Calcular e Persistir PHI Score, Get All Current Scores (Sync), Sync Scores to Notion, Buscar Campanhas Alertas, Execute SQL Verificar Escalada (BQ), Get Task para Fechar, Auto-Close Task (Notion), Auto-Close: Desativar Otimização, Create a database page, Update Escalar Tarefa, Code Criar Checklist, Create a database page chklist, Update Hipótese na Tarefa
- **Inputs reais:** `client_config`, `model_config`, `raw_campaign_data`, `phi_score_current`, `phi_score_history`, páginas Campanhas no Notion, tarefas existentes no Notion, outputs do subworkflow PHI - Subworkflow Campanhas
- **Outputs reais:** logs de execução no BigQuery; `MERGE` em `phi_score_history`; sync de score/status para Campanhas; fechamento automático de tarefas; criação/atualização de tarefas e checklist operacionais
- **Leituras no Notion:** database Campanhas `19fb65e5-c72b-8043-a82d-f47ede397928`; database Tasks `19fb65e5-c72b-812d-a734-de9a4d5b980f` em Get Task para Fechar; existem mais leituras de tasks para escalada, mas o payload completo desse node não veio inteiro
- **Escritas no Notion confirmadas:**
  - Sync Scores to Notion atualiza Campanhas com Score Diário (0-100), Status Geral da Campanha, phi_ultima_execucao
  - Auto-Close Task (Notion) atualiza Tasks com Status = Concluído
  - Auto-Close: Desativar Otimização atualiza checkbox Otimização Ativa? = false em página relacionada
  - Update Hipótese na Tarefa atualiza uma página com Hipótese Sugerida (IA) e Prioridade
  - Há criação de páginas em Create a database page e Create a database page chklist, mas os destinos/campos exatos não ficaram integralmente confirmados no payload retornado
- **Leituras no BigQuery confirmadas:**
  - `phi_prod.workflow_execution_log`
  - `phi_prod.client_config`
  - `phi_prod.raw_campaign_data`
  - `phi_prod.model_config`
  - `phi_prod.phi_score_current`
  - `phi_prod.phi_score_history`
- **Escritas no BigQuery confirmadas:**
  - `phi_prod.workflow_execution_log`
  - `phi_prod.phi_score_history`
- **Tabelas/queries do BigQuery:**
  - Buscar ID de Sucesso Hoje: `SELECT` em `phi_prod.workflow_execution_log`
  - Buscar Clientes Ativos: `SELECT` em `phi_prod.client_config`
  - Log INGESTION SUCCESS: `COUNT` em `phi_prod.raw_campaign_data` e `MERGE` em `phi_prod.workflow_execution_log`
  - Calcular e Persistir PHI Score: `MERGE phi_prod.phi_score_history` lendo `raw_campaign_data`, `client_config`, `model_config`
  - Buscar Campanhas Alertas: `SELECT` em `phi_prod.phi_score_history`, `phi_prod.phi_score_current`, `client_config`, `model_config`
  - Get All Current Scores (Sync): `SELECT` em `phi_prod.phi_score_current`
  - Execute SQL Verificar Escalada (BQ): lê `phi_prod.phi_score_history` no trecho confirmado
- **Integrações externas:** Google BigQuery, Notion, Execute Workflow para subworkflow interno
- **Papel esperado:** fonte única de verdade operacional
- **Desalinhamentos:** o papel está majoritariamente alinhado; o principal desalinhamento é externo a ele: o Daily Entry também grava score/classificação em Notion e reduz a clareza de autoridade; internamente há risco de manutenção alto por queries longas e expressions frágeis
- **Ajustes necessários:** assumir formalmente a autoridade única de score/status oficial; receber ingestão de Daily Entry sem duplicar semântica; explicitar no modelo Notion qual database representa tarefas vs log; revisar criação de tarefa/checklist para garantir rastreabilidade e schema estável
- **Resposta objetiva ao item 8:** ele já cria/enriquece algo parcialmente equivalente ao Log de Otimizações, porque cria/atualiza tarefas, checklist, hipótese sugerida, prioridade e auto-close. Não foi confirmada uma database explicitamente chamada Log de Otimizações

### Google Ads v2

- **Nome:** Google Ads v2
- **ID:** `aueMKOExsN28nREq`
- **Status:** inativo, `activeVersionId = null`
- **Trigger/Frequência:** há um Schedule Trigger configurado para 05:00, mas o workflow está inativo e com `triggerCount = 0`; hoje não há execução produtiva automática confirmada
- **Finalidade real observada:** workflow analítico de campanha Google Ads que coleta métricas 7d/30d, grupos, termos, schedule, audiência, pacing e canais; consolida tudo; monta HTML; converte para PDF
- **Principais nodes:** Notion: Get Campanhas Ativas, Code Preparar Contexto, HTTP Core 7d, HTTP Core 30d, HTTP Grupo Recursos 7d/30d, HTTP Termos 7d, HTTP Schedule 7d/30d, HTTP Audiência, HTTP Pacing, HTTP Canais, Code Merger Unificado, Code Montar HTML, Convert HTML to PDF
- **Inputs reais:** database Campanhas; `id_google_account`; `id_google_camp`; dados de Google Ads v23
- **Outputs reais:** binário PDF gerado pelo node Convert HTML to PDF
- **Leituras no Notion:** database Campanhas `19fb65e5-c72b-8043-a82d-f47ede397928` com filtro Status = Em execução e Fonte não vazio
- **Escritas no Notion:** não confirmadas; não há node de write para Notion neste workflow
- **Leituras no BigQuery:** nenhuma
- **Escritas no BigQuery:** nenhuma
- **Integrações externas:** Notion, Google Ads API, HTML to PDF
- **Papel esperado:** camada analítica complementar
- **Desalinhamentos:** funcionalmente alinhado; o desalinhamento é operacional, porque está inativo e sem versão ativa; além disso, a pasta Relatórios não foi confirmada pela API do n8n, apesar de o nome bater exatamente com o alvo
- **Ajustes necessários:** se for o workflow alvo de relatórios, ativar/publicar ou aposentar; manter sem autoridade sobre score/status; se houver intenção de persistir histórico, isso precisa ser decisão explícita, não derivada deste PDF
- **Resposta objetiva ao item 9:**
  - Termina em PDF: sim, node Convert HTML to PDF
  - Grava dados estruturados: não
  - Publica algo no Notion: não
  - Escreve algo no BigQuery: não
  - Interfere em score/status operacional: não

## 3. Tabela Comparativa

| Workflow | Papel real hoje | Papel esperado | Sobreposição com outros | Risco atual | Ajuste prioritário |
|---|---|---|---|---|---|
| Daily Entry | Coleta + cálculo observacional + criação de observação + ingestão em BQ | Coleta, normalização e observação | Sobrepõe score/classificação ao PHI | Alto | Remover semântica oficial de score/status do Notion |
| PHI - Pipeline_v2 | Orquestra ingestão, cálculo oficial, sync de score/status, tarefas e auto-close | Fonte única de verdade operacional | Sobreposição só porque Daily Entry também publica score/classificação | Médio | Formalizar autoridade única e estabilizar schema de tarefas/log |
| Google Ads v2 | Relatório analítico em PDF por campanha | Camada analítica complementar | Não compete hoje | Baixo | Decidir ativar como relatório ou aposentar |

## 4. Log de Otimizações

- **Algum workflow já cria/enriquece isso hoje:** parcialmente sim, o PHI - Pipeline_v2 já cria/atualiza artefatos operacionais equivalentes em Tasks e checklist; uma database explicitamente chamada Log de Otimizações não foi confirmada
- **Workflow mais apto a fazer isso:** PHI - Pipeline_v2
- **Dados já existentes no fluxo para preencher o log:** `execution_id`, `client_id`, `campaign_id`, `phi_value`, `phi_classification`, `priority_score`, `miv`, `mas`, `tss`, `fis`, `es`, `rs`, `os`, `threshold_used`, `mas_janela`, `primary_metric_type`, `business_model`, `plataforma`, `nome_campanha`, `meta_metrica_mae`, `orcamento_diario`, estado de `otimizacao_ativa`
- **Campos que dependerão de input humano:** decisão final da ação, racional qualitativo, responsável, prazo realista, resultado observado pós-ação, fechamento/comentário final

## 5. Candidatos a ADR

### ADR 1
- **Contexto:** Daily Entry hoje grava PHI Score e Classificação PHI em Observações Diárias, enquanto PHI-Pipeline_v2 sincroniza score/status oficial em Campanhas
- **Decisão proposta:** declarar PHI - Pipeline_v2 como única autoridade operacional para score/status oficial; Daily Entry passa a produzir somente observação/telemetria derivada
- **Alternativas consideradas:** manter ambos escrevendo score; mover toda observação para o PHI
- **Consequências:** elimina ambiguidade semântica; reduz conflito de interpretação; exige ajuste de nomenclatura/campos no Notion
- **Reavaliar quando:** após estabilização de 2 a 4 semanas sem divergência entre observação diária e score oficial

### ADR 2
- **Contexto:** o equivalente ao Log de Otimizações hoje parece disperso entre Tasks, checklist e campos enriquecidos
- **Decisão proposta:** decidir entre usar Tasks como log operacional oficial ou criar uma database dedicada de Log de Otimizações
- **Alternativas consideradas:** manter estado atual implícito; criar log separado só para auditoria
- **Consequências:** afeta processo humano, queries futuras, fechamento, analytics e rastreabilidade
- **Reavaliar quando:** quando houver 10+ otimizações/mês ou necessidade de medir throughput/resultado por otimização

### ADR 3
- **Contexto:** existe um workflow Google Ads v2 que só gera PDF e outro Google Ads Insights Semanal que grava BQ+Notion; o alvo de relatórios está ambíguo
- **Decisão proposta:** definir oficialmente se a camada analítica Google Ads será "PDF-only", "persistência estruturada", ou as duas, com papéis separados
- **Alternativas consideradas:** manter workflows paralelos não-governados; incorporar analytics ao PHI
- **Consequências:** afeta custo, manutenção, governança de dados e quem consulta qual fonte
- **Reavaliar quando:** antes de ativar novamente qualquer workflow analítico Google Ads em produção

### ADR 4
- **Contexto:** PHI reutiliza `execution_id` do último sucesso diário em Buscar ID de Sucesso Hoje, inclusive com fallback
- **Decisão proposta:** definir estratégia formal para reprocessamento e unicidade de `execution_id` por run/fase
- **Alternativas consideradas:** manter um `execution_id` por dia; usar `run_id` único por execução com vínculo a `business_date`
- **Consequências:** impacta auditoria, troubleshooting, idempotência e custo de reversão de dados
- **Reavaliar quando:** no primeiro incidente de reprocessamento ou divergência entre fases

## 6. Anexo Técnico

- **Nodes críticos Daily Entry:** Create a database page Create Observation, Code Montar SQL, Execute SQL inserir daily entry, If Plataforma, HTTP Request Google Ontem (D1/D3/D7), HTTP Request Meta Ads
- **Nodes críticos PHI:** Calcular e Persistir PHI Score, Sync Scores to Notion, Buscar Campanhas Alertas, Execute SQL Verificar Escalada (BQ), Create a database page, Create a database page chklist, Auto-Close Task (Notion)
- **Nodes críticos Google Ads v2:** Notion: Get Campanhas Ativas, Code Merger Unificado, Code Montar HTML, Convert HTML to PDF
- **Expressões frágeis encontradas:** uso intensivo de `$('Node Name').first()/item/all()` em Daily Entry e Google Ads v2; dependência forte em nomes literais de nodes; fallback procurando node por nome em Code calculo desvio meta
- **Hardcodes importantes:** `developer-token = o0hGRr2vcX3jGF6aI3a_0w`; `login-customer-id = 7595536100`; IDs fixos de databases Notion; projeto BigQuery `project-0e7c58d4-656f-49e8-807` / `phi-prod`
- **Dependências implícitas:** Daily Entry presume schema do Notion Campanhas; PHI depende de `raw_campaign_data` já populada; PHI depende do subworkflow PHI - Subworkflow Campanhas; Google Ads v2 depende de campos `id_google_account` e `id_google_camp` corretos
- **Erros/riscos estruturais:**
  - Daily Entry tem comentários no código afirmando que a classificação é "apenas informativa", mas persiste PHI Score e Classificação PHI em Notion
  - Google Ads v2 está inativo, então hoje não entrega nada automaticamente
  - Auto-Close: Desativar Otimização usa uma key de propriedade que veio serializada de forma estranha no payload (`={"key":"Otimização Ativa?|checkbox","checkboxValue":false}`), o que merece revisão
  - A pertença do Google Ads v2 à pasta Relatórios não foi confirmada pelo retorno da API do n8n; o workflow com nome exato existe, mas veio com `parentFolderId: null`

---

**Conclusão operacional:** a autoridade real hoje já está mais próxima do PHI - Pipeline_v2, mas o Daily Entry ainda invade esse território ao publicar score/classificação no Notion. O ajuste mais importante é semântico e arquitetural, não só de documentação.
