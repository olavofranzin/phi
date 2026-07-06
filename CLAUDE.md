# PHI™ — Contexto para Claude Code

> Leia este arquivo antes de qualquer implementação. É a fonte de contexto mínimo para agir corretamente neste repositório.
> Para documentação completa, consulte o Notion (links ao final).

---

## O que é o PHI

Sistema automatizado de monitoramento e gestão de campanhas de tráfego pago (Google Ads e Meta Ads). Calcula diariamente um score de saúde por campanha (0–100), classifica em EXCELLENT / GOOD / WARNING / CRITICAL e aciona tarefas operacionais com checklists no Notion.

**Princípio central:** O PHI detecta desvios e orienta o gestor — nunca executa otimizações automaticamente.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Data Warehouse | BigQuery — projeto `project-0e7c58d4-656f-49e8-807`, dataset `phi_prod` |
| Orquestração | n8n self-hosted v2.15.0 — `https://n8n-n8n-editor.1unqx7.easypanel.host` |
| Interface Operacional | Notion |
| Fonte de Dados | Google Ads API v23, Meta Ads API |
| Service Account | `phi-workflow-sa@phi-production-488720.iam.gserviceaccount.com` |

---

## Workflows n8n — IDs Ativos

| Workflow | ID | Status | Horário |
|----------|-----|--------|---------|
| **PHI - Pipeline_v2** | `ITWG3Ge0asXtUM8U` | ✅ Produção | 07:00 diário |
| **Daily Entry** | `zGgIqiLlo5iAn8ud` | ✅ Ativo | 06:00 diário |
| **PHI - Subworkflow Campanhas** | `b1pbn8qmzCNTufTp` | ✅ Ativo | — |
| **PHI - Fechar Otimização** | `83vfKD8XMYmjZjFQ` | ✅ Ativo | — |
| **Google Ads v2** | `aueMKOExsN28nREq` | ⏸️ Reestruturação | — |
| **Google Ads Insights Semanal** | `AG3g0LcpbxbCZoPZ` | 🆕 Criado (inativo) | Segunda 02:00 |

---

## Notion — IDs dos Databases

| Database | ID |
|----------|-----|
| Campanhas | `19fb65e5-c72b-8043-a82d-f47ede397928` |
| Tasks | `19fb65e5-c72b-812d-a734-de9a4d5b980f` |
| Checklist | `19fb65e5-c72b-81cd-b006-fe0ffa97a35d` |
| Log de Otimizações | `19fb65e5c72b81068e76f1e684197316` |
| Projetos | `19fb65e5-c72b-81ae-847c-e0b6b2888b6b` |
| Clientes | `19fb65e5-c72b-8147-8aa3-c63aa273d205` |
| Observações Diárias | `19fb65e5-c72b-8192-8f73-ff7f500a0972` |

---

## BigQuery — Tabelas Principais (`phi_prod`)

| Tabela | Papel |
|--------|-------|
| `raw_campaign_data` | Dados brutos diários por campanha (partição por `date`) |
| `phi_score_history` | Histórico de scores calculados (MERGE obrigatório) |
| `phi_score_current` | VIEW — score mais recente por campanha |
| `client_config` | Configuração por cliente |
| `model_config` | Pesos e limiares por modelo de negócio |
| `client_goal_history` | Histórico de metas por cliente |
| `workflow_execution_log` | Log de execuções por fase |

---

## Estado Atual do Desenvolvimento

### Funcionando em produção
- PHI - Pipeline_v2 calculando scores e criando tarefas no Notion
- Daily Entry ingerindo métricas diárias + blocos v23 no BigQuery
- Auto-Close, Escalada, Sync de scores — todos implementados

### Pendente / Em andamento
- [ ] Google Ads v2: corrigir credentials (importar google_ads_v2.json manualmente via n8n UI)
- [ ] Google Ads Insights Semanal (`AG3g0LcpbxbCZoPZ`): configurar credentials + criar tabela BQ + criar DB Notion Insights + ativar
- [ ] Arquitetura de IA: implementar (spec em `342b65e5-c72b-81f8-a05e-dfe05e564105`)
- [ ] Auto-Close para EXCELLENT (atual só cobre GOOD)
- [ ] Tabelas de auditoria: `task_control_log`, `task_notion_sync_log`, `threshold_override_log`

---

## Regras Críticas de Implementação

1. **BigQuery:** SEMPRE usar `dataset.table` sem project ID entre backticks — ex: `phi_prod.raw_campaign_data`
2. **Nodes INSERT/MERGE:** `Always Output Data = true` obrigatório
3. **`primary_metric_goal`** = FLOAT64 (valor numérico ex: `5.20`). **`primary_metric_type`** = STRING (ex: `'CPA'`)
4. **`client_id`** = `CLI-4` (identificador). **`client_slug`** = `KIL` (sigla 3 letras). São campos diferentes
5. **splitInBatches v3:** branch 0 = done (dispara uma vez, ao fim), branch 1 = loop (dispara a cada item). O último node do corpo do loop DEVE reconectar ao splitInBatches, senão só o 1º item é processado. (Confirmado no SDK n8n: `.onDone` = saída 0, `.onEachBatch` = saída 1.)
6. **IF nodes:** branch 0 = TRUE, branch 1 = FALSE
7. **Conexões no JSON n8n:** usar NOMES dos nodes como chaves, não UUIDs
8. **Queries dinâmicas:** montar SQL no Code node, nunca usar `{{ }}` dentro da query BigQuery
9. **`phi_score` e `Score Diário`** no Notion: escritos pelo PHI após Fase 2 — nunca pelo Daily Entry
10. **PHI não executa otimizações** — detecta, classifica e orienta
11. **Ordem da Fase 3 é imutável:** Fechamento → Escalada → Abertura
12. **Google Ads API:** `developer-token` deve estar no header — NÃO é injetado automaticamente pelo `googleAdsOAuth2Api`
13. **Google Ads API v23:** `metrics.cost_per_conversion` é incompatível com `segments.conversion_action_name/category`

---

## Cliente de Referência para Testes

| Campo | Valor |
|-------|-------|
| Cliente | KIL |
| `client_id` | `CLI-4` |
| `client_slug` | `KIL` |
| Campanha Barbearia | `GADS-21149189736` |
| Campanha Salão | `GADS-21116045403` |

---

## Repositório GitHub

- **Repo:** `olavofranzin/phi`
- **Branch de desenvolvimento:** `claude/create-phi-folder-n2RXF`
- **Branch principal:** `main`
- **Pasta de análises:** `relatorios_api/google_ads/`

---

## Documentação Completa no Notion

| Documento | ID Notion |
|-----------|-----------|
| Documentação Técnica v1.4 | `328b65e5-c72b-8103-9ad0-d2fb81dd8055` |
| Arquitetura de IA & Análise de Dados | `342b65e5-c72b-81f8-a05e-dfe05e564105` |
| Google Ads Insights Semanal — Spec Técnica | `342b65e5-c72b-8177-9982-c5f012c8f006` |
| Sessão Handoff 08/04/2026 | `33db65e5-c72b-81e0-87c2-f63523db3906` |
| Sessão Handoff 06/04/2026 | `33ab65e5-c72b-8117-b67e-d29f4ca88fb6` |
| SQL de Validação v1.4 | `335b65e5-c72b-814f-95e2-d57a18d96458` |
| SOP, Glossário e Definições | `328b65e5-c72b-81d8-a25b-c83921610282` |

---

## Arquivos SDK no Repositório

| Arquivo | Workflow |
|---------|---------|
| `google_ads_v2.json` | Google Ads v2 (`aueMKOExsN28nREq`) — importar manualmente via n8n UI |
| `google_ads_insights_semanal.js` | Google Ads Insights Semanal (`AG3g0LcpbxbCZoPZ`) |

---

*PHI™ v1.4.3 — Atualizado em 14/04/2026*
