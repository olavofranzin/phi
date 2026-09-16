# [REPORT] Saude Digital workflows - P0/P1/P2 (Codex)

Data da execucao: 2026-07-01
Branch/referencia lida: `origin/claude/agentic-agency-planning-KwJEw` em `fa51e93ce5b7b8730ebd3e72b11e18389e343732`
Handoff de origem: `docs/handoff/2026-07-01-saude-digital-workflows-priorizacao-revisao.md`

## Escopo executado

Segui o gate do handoff: Passo 0, P1 e P2. Nao avancei para P3+.

Nao publiquei, nao ativei e nao arquivei workflows.

## Passo 0 - pastas por objeto

Projeto n8n confirmado: `QAumYwlPGm37G3p1` (`Olavo Franzin <olavofranzin@franzcomunicacao.com>`, personal).

Pastas existentes confirmadas:

| Pasta | id |
|---|---|
| Execucao de Demandas | `jvfwLbfLPKKgYVVC` |
| Copias de Seguranca | `Frc3wzav5tZlIFtn` |
| Onboarding | `FUp9zF7jYfKtfdEi` |
| Metricas | `Pfzn3nPPhG5ynIVe` |
| Relatorios | `VfQtkqDABbQWZhvY` |
| Prospeccao | `7sA9HT5TB1YHClCw` |
| phi_production | `bJAxGvpLOx8TbMs6` |

Inventario MCP retornou 62 workflows. Os workflows Saude Digital verificados ainda estao com `parentFolderId:null` no detalhe MCP:

| Workflow | id | pasta atual MCP | pasta-alvo |
|---|---:|---|---|
| PHI - Agregador de Metricas Multi-fonte | `4sdG2UKMCBuFq8xn` | `null` | `phi_production` |
| PHI - Pipeline_v2 | `ITWG3Ge0asXtUM8U` | `null` | `phi_production` |
| WF-T28-Orquestrador-Analises | `8Q5ofmAZju0hTN08` | nao movido | `phi_production` |
| WF-T28-Analise-Campaign | `fhYmJH0o9BW1IO4i` | nao movido | `phi_production` |
| WF-T28-Error-Handler | `rTS5pE34eElfuMPl` | nao movido | `phi_production` |
| PHI - Loop Alerta Fase 1 | `JqPwFD9udCq2hRPw` | nao movido | `phi_production` |
| PHI - Fechar Otimizacao | `83vfKD8XMYmjZjFQ` | nao movido | `phi_production` |
| PHI - Alerta de Erro (Telegram) | `Oj1RbA0laZTzJZPx` | nao movido | `phi_production` |
| PHI - Subworkflow Campanhas | `b1pbn8qmzCNTufTp` | nao movido | `phi_production` |
| sw metricas campanhas | `W571K320aqIHsdtH` | `null` | `Metricas` |
| sw metricas campanhas copia seg | `ffEyTUED2p4Rq2Iw` | nao movido | `Metricas` ou `Copias de Seguranca` |

Bloqueio: a ferramenta MCP exposta possui `search_folders`, `search_workflows`, `get_workflow_details` e `update_workflow`, mas o schema de `update_workflow` nesta sessao nao expoe operacao de mover workflow nem `parentFolderId`. Como nao havia `N8N_API_KEY`/endpoint configurado no ambiente, nao executei moves via API publica.

## P1 - PHI - Agregador de Metricas Multi-fonte

Identidade:

| Campo | Valor |
|---|---|
| id | `4sdG2UKMCBuFq8xn` |
| active | `true` |
| versionId | `a46d5a6a-e5bc-4dee-babe-a002872277bd` |
| activeVersionId | `a46d5a6a-e5bc-4dee-babe-a002872277bd` |
| nodeCount | parcialmente retornado pelo MCP; grafo grande |
| parentFolderId | `null` |

Planejado vs real:

| Item | Real observado | Status |
|---|---|---|
| Schedules semanal/mensal | `Schedule Trigger Semanal` e `Schedule Trigger Mensal` ativos | OK |
| Escrita T28 via BigQuery MERGE | Nos `[T28] Build MERGE ...` e `[T28] BQ Merge ...` existem para `t28_campaign`, `t28_adset`, `t28_ga4_landing`, `t28_gbp_daily`, `t28_clarity_daily`, `t28_meta_campaign`; BQ usa `useLegacySql:false` | OK estrutural |
| Error handler | `[Err] Roteador Payload` -> `[Err] Call Handler` para `rTS5pE34eElfuMPl` | OK estrutural |
| Cadeia morta | `Merge1 -> Calculate KPIs & Campaign Insights(disabled) -> AI Agent(disabled) -> Prepare Report Data2(disabled) -> Switch(disabled)` confirmada | Defeito confirmado |
| Clarity dentro do loop | `HTTP Request Clarity` esta na saida de iteracao do `Loop` | Defeito confirmado |
| Search terms placeholders | `Removing Brand Terms...` contem placeholder `INSERT YOUR BRAND TERM HERE`; `Brand Info Node` contem `INSERT YOUR BRAND_INFO HERE` | Defeito confirmado |
| GBP | `HTTP Request GBP` envia erro para handler; no detalhe observado nao confirmei credencial | Precisa investigacao |

Fixes aplicados: nenhum. Os fixes P1 propostos no handoff (remover cadeia disabled, reconectar adaptador, mover Clarity fora do loop, popular `campaign_name`) exigem edicao de grafo/params grande. O retorno MCP do workflow veio truncado e nao forneceu com seguranca o conteudo completo de `Adaptador Input T28`/`Normalizador T28`; preferi nao aplicar patch parcial em workflow ativo sem conseguir validar o grafo inteiro.

Status final P1: `Degradado mas operacional`. MERGEs T28 e handler existem; dividas conhecidas permanecem.

## P2 - PHI - Pipeline_v2

Identidade antes:

| Campo | Valor |
|---|---|
| id | `ITWG3Ge0asXtUM8U` |
| active | `true` |
| versionId antes | `4938be54-74a6-44da-9c05-781813d9119d` |
| activeVersionId | `15b91f10-0036-4f14-bd37-3b2ff936c7cb` |
| parentFolderId | `null` |

Identidade apos tentativas MCP:

| Campo | Valor |
|---|---|
| versionId draft atual | `a09f6e35-c769-4479-9a38-a25a647aecf2` |
| activeVersionId | `15b91f10-0036-4f14-bd37-3b2ff936c7cb` |
| publish/activate | nao executado |

Achados principais:

| Item | Real observado | Impacto |
|---|---|---|
| Writer raw atual | `sw metricas campanhas` (`W571K320aqIHsdtH`) e chamado por `operador unico metricas` (`cLcimNoefTOnVVbd`) via `Call SW Metricas Campanhas`; operador ativo com cron `0 4 * * *` | Red flag do writer desligado fica rebaixado; ha agendamento pai |
| Pipeline_v2 tambem chama legado | `Call Subworkflow Campanhas` chama `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`) | Dependencia legacy ativa dentro do score |
| Source execution | Draft live do Pipeline_v2 busca `execution_id` em `workflow_execution_log` ou gera `FALLBACK-*`; nao separa `execution_id` do score de `source_execution_id` do raw no no observado | Forte explicacao para fallback/score cego |
| Calculo | `Calcular e Persistir PHI Score` contem defaults: `tss/fis/es/rs/os` podem virar `50.0`; `es/rs/os` sao sempre `50.0` | Componentes todos 50 podem ser fallback/default de calculo, nao sinal real |
| MERGE | O no usa MERGE em `phi_prod.phi_score_history` | OK estrutural |
| `source_execution_id` | O draft live observado nao persiste `source_execution_id` no MERGE do score, apesar de exports locais conterem desenho com essa coluna | Divergencia A.7b/draft live |

Tentativa de fix em draft:

1. Apliquei via MCP um patch pequeno para separar `execution_id` e `source_execution_id`.
2. O MCP aceitou updates em `Buscar ID de Sucesso Hoje`, `Code INSERT execution_id`, `Call Subworkflow Campanhas`, `Log INGESTION RUNNING` e `Log INGESTION SUCCESS`.
3. O MCP retornou `appliedOperations` para `Calcular e Persistir PHI Score`, mas `get_workflow_details` confirmou que o SQL grande desse no nao mudou.
4. Para nao deixar um draft incoerente, reverti os cinco nos dependentes para o desenho anterior.

Resultado: nenhum fix funcional P2 foi deixado aplicado. O draft versionId mudou por causa das tentativas/reversao, mas o `activeVersionId` permaneceu intacto.

Warnings MCP relevantes:

- O validador MCP de BigQuery acusa `parameters.sqlQuery` como invalido para varios nos existentes, inclusive nos que ja estavam no workflow. Isso parece incompatibilidade do schema MCP com o formato live do n8n, porque os nos BigQuery existentes usam esse formato.
- Ha warnings reais de expressao em varios SQLs com `{{ }}` sem prefixo `=`, incluindo logs e queries operacionais. Este ponto deve ser corrigido em lote controlado, porque o handoff ja alerta que SQL/expressoes n8n devem usar template `=...{{ }}`.
- Ha mojibake em varios labels/textos do P2, incluindo nomes de fases e comentarios SQL, preexistente no workflow.

Status final P2: `Degradado / precisa fix A.6-A.7b no draft`. O score-50 continua suspeito de fallback/default. A correcao recomendada e:

1. Gerar `execution_id` proprio do Pipeline_v2 (`EXEC-PHI-*`).
2. Resolver `source_execution_id` pelo ultimo `raw_campaign_data` fresco de D-1 escrito pelo operador de metricas.
3. Fazer o MERGE ler `raw_campaign_data` por `source_execution_id`.
4. Persistir `source_execution_id` em `phi_score_history`.
5. Corrigir SQL template prefix `=` nos nos BigQuery com `{{ }}`.
6. So depois rodar smoke manual e comparar componentes da CLI-4.

## Gate

Parei aqui, conforme handoff. Nao executei P3/P4/P5/P6.

## Evidencia de verificacao

- `search_projects` confirmou projeto `QAumYwlPGm37G3p1`.
- `search_folders` confirmou 7 pastas.
- `search_workflows` retornou 62 workflows.
- `get_workflow_details` usado para:
  - `4sdG2UKMCBuFq8xn`
  - `ITWG3Ge0asXtUM8U`
  - `W571K320aqIHsdtH`
  - `cLcimNoefTOnVVbd`
- `update_workflow` usado somente em draft do `ITWG3Ge0asXtUM8U`; nenhuma publicacao.
- Re-fetch final do `ITWG3Ge0asXtUM8U`: `versionId=a09f6e35-c769-4479-9a38-a25a647aecf2`, `activeVersionId=15b91f10-0036-4f14-bd37-3b2ff936c7cb`.


