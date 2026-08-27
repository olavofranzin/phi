# [BRIEF sub-chat] Simplificar a ESCRITA de dados do PHI (um writer canônico por destino)

> **Como usar:** abra uma sessão nova (sub-chat dedicado) e cole este arquivo como 1ª mensagem.
> É auto-contido. **Frente:** Ingestão/Dados. **Branch base:** `claude/agentic-agency-planning-KwJEw`
> (confirme com o Olavo). **Repo:** `olavofranzin/phi`.

## 0. Missão
Hoje **vários workflows escrevem o mesmo dado, da mesma fonte (Google Ads API), com semânticas
diferentes** — em `raw_campaign_data` (BigQuery) e nos campos de campanha do Notion. Resultado:
ninguém sabe de onde veio cada número, e isso gera bugs e horas perdidas rastreando origem.
**Objetivo:** mapear TODOS os writers, achar as sobreposições/conflitos e **desenhar + implementar
um único writer canônico por destino** (uma fonte da verdade, linhagem clara). É a **Camada 0 do
ADR-29** ("writer canônico") e destrava o Score v2 (ADR-34), que precisa de uma **série diária limpa**.

## 1. O problema, com evidência (o que motivou este sub-chat)
Investigando por que a campanha Barbearia aparecia **Score 60/GOOD** com **Em Crise=SIM**, caímos
numa teia de writers. Fatos confirmados hoje (2026-08-27):

- **`raw_campaign_data` (grão campanha × dia) é populado pelo `GADS_INSERT`** (o "Subworkflow
  Campanhas"), **não** pelo `daily_entry_v4` (DAILY_ENTRY) — apesar do **ADR-010** dizer que só o
  Daily Entry deveria escrever essa tabela. Verificação read-only (execução n8n **32695**,
  workflow temporário já arquivado): últimos 60 dias das 2 campanhas KIL = **100% `step=GADS_INSERT`**,
  1 linha/dia, contínuo (ndays 49/49).
- **Cada writer trata `conversions` diferente:**
  - `daily_entry_v4` grava `conversions = round(Métrica-Mãe 1D)` = **round(CPA)** (bug — a
    contagem real `metrics.conversions` da API é ignorada). **Mas esse writer não é o que vence** p/ KIL.
  - `GADS_INSERT` grava uma **contagem real** (não é round(CPA)), porém **INT64** (perde fracionárias)
    e **subcontando** vs. o export oficial do Google Ads: Salão BQ `sum_conv=321` vs export ~481 no
    mesmo período (~49 dias). Provável **atraso de atribuição** (o valor gravado em D-1 cresce depois)
    + arredondamento INT64 + possível escopo de ações diferente. Investigar.
- **Tipos inconsistentes** em `raw_campaign_data`: `conversions` **INT64**; `conversions_3d/7d`
  **FLOAT64** (mas **NULL** nas linhas GADS_INSERT); `cost`/`cost_7d`/`primary_metric_goal` FLOAT64;
  `impressions` INT64.
- **Notion também tem escrita dupla:** o `phi_subworkflow_campaign_metrics` escreve `Score Diário`/
  `phi_score` (de um `final_score` próprio), e o `Pipeline_v2` escreve `Score Diário`/`Status Geral`
  (do `phi_value` do BigQuery). Dois donos do mesmo campo → quem roda por último vence.
- **Positivo:** dias sem entrega **existem** no BQ como linhas-zero explícitas (cost=0/impr=0/conv=0) —
  bom p/ o "sinal de entrega" do Score v2 (não há buraco de calendário em produção, ao contrário do export).

## 2. Lote 1 (OBRIGATÓRIO, read-only) — Inventário de escrita
Mapear, **sem alterar nada**, todo o fluxo de escrita. Produzir uma **tabela/mapa**:

| Coluna | O que preencher |
|---|---|
| Workflow (id + nome) | enumerar via n8n MCP `search_workflows` |
| Fonte | Google Ads API / Meta / Notion / BQ |
| Destino | tabela BQ (+ `ingestion_step`) e/ou campo Notion |
| Grão | campanha/adset/anúncio × dia/janela |
| Semântica de `conversions` | contagem real? round(CPA)? qual escopo de ações? |
| Frequência | cron / on-demand |
| Conflito | escreve algo que outro também escreve? |

Cobrir no mínimo: `Pipeline_v2` (`ITWG3Ge0asXtUM8U`), Agregador T28 (`4sdG2UKMCBuFq8xn`),
`daily_entry_v4`, "Subworkflow Campanhas" (GADS_INSERT — **identificar o id**), `sw_metricas_anuncios`,
`phi_subworkflow_campaign_metrics`, WF-T28 (`fhYmJH0o9BW1IO4i`). Tabelas: `raw_campaign_data`,
`raw_ad_data`, `t28_*`, `phi_score_history`. **Entregável:** o mapa + lista de **sobreposições**.

## 3. Lote 2 — Desenho da simplificação (vira ADR)
Regra-alvo: **um destino, um writer.** Propor:
- **Um** writer canônico de `raw_campaign_data` (grão campanha × dia), com `conversions` **real e FLOAT64**,
  `metrics.conversions` da API, janelas calculadas por quem consome (não pré-somadas frágeis). Aposentar
  o GADS_INSERT-esqueleto **ou** o daily_entry — não os dois.
- **Um** dono de cada campo Notion (ex.: só o Pipeline_v2 escreve `Score Diário`/`Status Geral`).
- Tratar **atraso de atribuição**: dias recentes são provisórios (re-puxar N dias, ou marcar provisório).
- Linhagem por linha (`execution_id`/`source_execution_id`) — quem escreveu, de qual fonte, quando.

## 4. Lote 3 — Implementar (com cuidado)
`phi_dev` primeiro + smoke (Barbearia + Salão) → migração de tipo (`conversions`→FLOAT64) → desligar os
writers redundantes → prod só com **OK do Olavo**. Não quebrar o pipeline diário que roda 07:00 BRT.

## 5. Guardrails
- **Lote 1 é read-only.** Nada de escrever/alterar workflow em produção sem OK + smoke em `phi_dev`.
- **Disciplina de token** (CLAUDE.md): validar queries/SQL no chat antes de gastar no n8n; workflow
  temporário de leitura → **arquivar depois** (padrão da execução 32695).
- Guardrails de dado: `conversions=0 ⇒ CPA/ROAS N/D`; `source_status error ⇒ N/D` (não zero).
- Não recalcular score (ADR-003) — este sub-chat cuida da **escrita/ingestão**, não do cálculo.

## 6. Registro de andamento (OBRIGATÓRIO)
1. **Ledger (Notion, ADR-32):** "PHI — Registro de Execuções (Sub-chats)" (`8d8eb685f66249c7ba4f298d744feec3`).
2. **Execution-log (git):** `docs/handoff/<data>-simplificacao-escrita-<lote>-execution-log.md` ao fim de cada lote.
3. **Doc mestre:** atualizar `docs/strategic-planning/ESTADO-DO-PROJETO.md`.
4. **ADR:** o desenho do Lote 2 vira ADR em `docs/strategic-planning/saude-digital/adr-rascunhos/`.
5. Checklist vivo. Nada de "terminei" sem registrar **onde parou e o que falta**.

## 7. Âncoras
- **Consumidor que motiva:** ADR-34 (`adr-rascunhos/ADR-34-...metrica-mae-governa.md`) + decisão de fonte
  (`adr-rascunhos/phi-midia-score-v2-fonte-serie-diaria-DECISAO.md`) + validação (`docs/analises/score-v2-validacao/`).
- **Fase 2 (re-mirar):** `docs/handoff/2026-08-27-fase2-fix-writer-conversions-DRAFT.md` **mirava o
  daily_entry_v4 — alvo ERRADO** (o writer vivo é o GADS_INSERT). Corrigir a mira faz parte deste sub-chat.
- ADR-010 (Daily Entry = writer canônico de raw_campaign_data — hoje **violado**) · ADR-29 Camada 0 ·
  ADR-25 (sub-WFs reutilizáveis).
- BigQuery: projeto `project-0e7c58d4-656f-49e8-807`, dataset `phi_prod`, credencial n8n `UhLRAanVarQeOpQy`.
- Notion IDs: CLAUDE.md. Campanhas de teste: Barbearia `GADS-21149189736` (meta CPA 5,20) · Salão
  `GADS-21116045403` (meta 3,50).
