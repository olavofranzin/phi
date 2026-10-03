# [BRIEF sub-chat] Webview de métricas de campanha + dados de clientes (Lovable)

> **Como usar:** abra uma sessão nova (sub-chat dedicado) e cole este arquivo como 1ª mensagem.
> É auto-contido. **Frente:** Webview (nova). **Branch base:** `claude/consolidacao-2026-08`
> (confirme com o Olavo se cria branch própria). **Repo:** `olavofranzin/phi`.

## 0. Missão
Unificar **dois projetos Lovable** num **único webview** que exibe, por cliente e por campanha, as
**métricas de tráfego** (PHI·Mídia Score + KPIs) e os **dados do cliente** (metas, config), lendo das
fontes canônicas onde a métrica **realmente reside**: **BigQuery** (`phi_prod`) e **Notion**. A view
**exibe** — não recalcula score (ADR-003) nem reescreve dado.

## 1. Ponto de partida — os 2 projetos Lovable
- Projeto A: https://lovable.dev/projects/01153f8e-9d6a-409b-b3d5-746130017057
- Projeto B: https://lovable.dev/projects/ff1059aa-df66-44dc-b8b1-9c2c5b09f22e

**Lote 1 (obrigatório antes de codar):** inspecionar **os dois** (`get_project`, `list_files`, `read_file`,
`get_project_knowledge`, `get_diff`) e produzir um **comparativo**: o que cada um já tem (telas, design
system, backend/Supabase, auth, integrações), qual está mais maduro. **Escolher UM como base** e listar o
que migrar do outro. Nada de recriar do zero — consolidar. Registrar a decisão (ADR curto).

## 2. Fontes de dados a integrar (onde a métrica mora)

**BigQuery** — projeto `project-0e7c58d4-656f-49e8-807`, dataset `phi_prod`. SA `phi-workflow-sa@phi-production-488720.iam.gserviceaccount.com`.
| Tabela/VIEW | Papel |
|---|---|
| `phi_score_current` (VIEW) | **Score canônico** por campanha (ler, NUNCA recalcular — ADR-003) |
| `phi_score_history` | Histórico de score (tendência) |
| `raw_campaign_data` | Métricas brutas diárias (impressions/clicks/cost/conversions/revenue) |
| `t28_campaign` / `t28_meta_campaign` | Métricas por janela (D-7/D-30) do agregador |
| `client_config` / `model_config` / `client_goal_history` | Config e metas por cliente/modelo |

**Notion** — DBs canônicos:
| DB | ID |
|---|---|
| Campanhas (phi_score, Score Diário, Status Geral) | `19fb65e5-c72b-8043-a82d-f47ede397928` |
| Clientes | `19fb65e5-c72b-8147-8aa3-c63aa273d205` |
| Projetos | `19fb65e5-c72b-81ae-847c-e0b6b2888b6b` |
| Observações Diárias | `19fb65e5-c72b-8192-8f73-ff7f500a0972` |
| PHI - ANÁLISES (diagnóstico T28) | `38fb65e5-c72b-80db-a425-e5939fc35c7a` |

**Guardrails de dado (inegociáveis):** `conversions=0 ⇒ CPA/ROAS = N/D` (nunca "cpa 0 = ótimo") ·
`source_status error/missing ⇒ N/D` (não 0) · score é **fato** lido do canônico (não recalcular).

## 3. Arquitetura de integração
- Lovable = React + **Supabase**. Ler BigQuery/Notion **pelo backend** (Supabase **edge functions**),
  **nunca do client** — os segredos (SA do BigQuery, token do Notion) ficam no servidor.
- Camada fina de API por fonte (`/metrics/campaign`, `/client/:id`, …) + **cache** curto (métrica é diária).
- Autenticação da view (quem acessa) — definir com o Olavo (o portal é interno hoje, mas nasce multi-cliente:
  `tenant_id`/`client_id` na lógica).

## 4. Escopo da view (o que aparece)
- **Nível cliente:** lista de clientes (Notion Clientes + `client_config`), metas (`client_goal_history`).
- **Nível campanha:** PHI·Mídia Score + classificação (de `phi_score_current`), KPIs (CPA/ROAS/CTR/CVR de
  `raw_campaign_data`/`t28_*`), **tendência** (de `phi_score_history`), status (Notion Campanhas).
- **Estados N/D honestos** em toda métrica indefinida (guardrails §2). Sem inventar 0.

## 5. Merge dos 2 projetos (Lote 2)
Base escolhida no Lote 1 → portar telas/componentes que faltam do outro → unificar design system,
rotas e estado → deduplicar. Validar preview a cada rodada (`get_diff`). ⚠️ `send_message`/`create_project`
**gastam créditos** do workspace — pedir OK de budget ao Olavo antes de rodadas grandes.

## 6. Guardrails
- **Exibe, não escreve.** A view lê; não altera BigQuery/Notion nem recalcula score.
- Segredos **só no backend** (edge functions), nunca no bundle do client nem no git.
- Guardrails de dado §2 aplicados em TODA métrica.
- Créditos Lovable: sem rodada cara sem OK do Olavo.

## 7. Lotes sugeridos
- **W1** — Inspeção dos 2 projetos + escolha da base + plano de merge (ADR).
- **W2** — Merge estrutural num projeto único (design system + rotas unificados).
- **W3** — Backend: edge function BigQuery (`phi_score_current` + `raw_campaign_data`/`t28_*`).
- **W4** — Backend: edge function Notion (Clientes + Campanhas).
- **W5** — View de métricas por campanha (score, KPIs, tendência, N/D).
- **W6** — View de dados do cliente (metas, config) + navegação cliente→campanha.

## 8. Registro de andamento (OBRIGATÓRIO)
Manter o andamento **sempre atualizado** nos documentos canônicos:
1. **Ledger de execução (Notion, ADR-32):** registrar cada rodada em **"PHI — Registro de Execuções (Sub-chats)"**
   (`8d8eb685f66249c7ba4f298d744feec3`) — o que rodou, resultado, próximos passos.
2. **Execution-log (git):** ao fim de cada lote, `docs/handoff/<data>-webview-<lote>-execution-log.md`.
3. **Doc mestre (git):** atualizar snapshot em `docs/strategic-planning/ESTADO-DO-PROJETO.md` ao fechar cada lote.
4. **ADRs (git):** decisões de design → ADR em `docs/strategic-planning/.../adr-rascunhos/`.
5. Manter um **checklist vivo** de tarefas. Regra: nada de "terminei" sem registrar **onde parou e o que falta**.

## 9. Âncoras
- Fontes: CLAUDE.md (BigQuery `phi_prod`, IDs Notion) · `docs/strategic-planning/ESTADO-DO-PROJETO.md`.
- Guardrails de dado: BLOCO COMUM regras 8/9 + ADR-003 (autoridade do score).
- Projetos Lovable: os 2 links do §1.
