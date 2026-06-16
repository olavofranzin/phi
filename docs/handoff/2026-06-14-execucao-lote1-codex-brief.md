# Brief Codex — Execução de Demandas Lote 1 (Pacing/verba E2E classe Crítica)

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: implementar **Lote 1 da Área Execução de Demandas** — engine mínimo E2E pra 1 tipo recorrente Crítico (Pacing/verba).

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** o HEAD mais novo (faça `git fetch origin claude/agentic-agency-planning-KwJEw` antes)

A v0.3 da Execução está fechada (`BRUTO-v0.3-design.md`), 2 ADRs `Aceito` no Notion, DBs criados (`PHI - Demandas`, `PHI - SOPs`), SOP v1.0 `Vigente`, âncora `[HANDOFF] Execução de Demandas` criada. Esta é a primeira entrega de código.

## Pré-leitura OBRIGATÓRIA

1. `docs/strategic-planning/execucao-demandas/BRUTO-v0.1-design.md` (conteúdo é v0.2 — discrepância de nome, conteúdo canônico)
2. `docs/strategic-planning/execucao-demandas/BRUTO-v0.3-design.md` (delta v0.2→v0.3 + escopo travado do Lote 1)
3. `docs/strategic-planning/execucao-demandas/ADR-rascunho-tiering-agentes-ia.md` (Aceito no Notion 2026-06-14)
4. `docs/strategic-planning/execucao-demandas/ADR-rascunho-eventos-canonicos-sink-bq.md` (idem)
5. SOP v1.0 no Notion DB `PHI - SOPs` (entry `Vigente` de área `Execucao`)
6. `docs/handoff/2026-06-05-telemetria-lote1-codex-fix-brief.md` (padrões herdados)
7. Aprendizado Notion "Multi-fan-in para Code node em n8n" (`Aplicado` 2026-06-13)
8. ADR-012 (Git × Notion canônico) + ADR-010 (BQ × Supabase) — para coerência de storage

## IDs Notion canônicos

| Recurso | ID / data source |
|---|---|
| DB `PHI - Demandas` | data source `cd1ab757-e4d1-493f-b1e1-b64a95d33d1b` (page `a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b`) |
| DB `PHI - SOPs` | data source `bfeb1105-83a6-4e89-8d62-26607ebfcc8c` (page `7ebc98e0-ebdc-480c-8c6a-bc18f65e2ed5`) |
| Âncora `[HANDOFF] Execução de Demandas` | `37fb65e5-c72b-8108-8eb5-cfc529ec5137` |
| ADR Tiering (Aceito) | `37fb65e5-c72b-81f3-b8a6-de1a474d736c` |
| ADR Eventos (Aceito) | `37fb65e5-c72b-8195-b45f-eb33ef60ac08` |
| SOP v1.0 (entry no DB SOPs) | criar lookup via área=Execucao + estado=Vigente; gravar id no `versao_sop_aplicada` |
| DB Clientes (referência) | `04e34a62-624b-484c-bda5-46604564b88c` |
| DB Snapshots Telemetria | `32404398-6751-4bbd-be28-4ad591e22bf7` |

Você também cria nesta entrega:

- **DB `PHI - Eventos`** (per ADR Eventos § Storage Fase 1) — schema abaixo

## Escopo do Lote 1 — fluxo E2E

Demonstrar engine mínimo rodando 1 tipo recorrente Crítico (Pacing/verba) ponta a ponta.

```
[Trigger: alerta pacing]
  ↓
WF-EXEC-Intake-Pacing
  - Valida payload + secret (padrão Lote 1 Onboarding)
  - Lê SOP Vigente de area=Execucao (DB PHI - SOPs)
  - Cria registro em PHI - Demandas:
      titulo=Pacing critico cliente X
      tipo=Pacing/verba
      classe_sla=Critica
      estado=Aberta
      tenant_id=phi-agencia
      versao_sop_aplicada=<id SOP Vigente>
      sla_version=v0.3-2026-06-14
      prazo=hoje 23h59 America/Sao_Paulo
  - Emite evento demanda.criada em PHI - Eventos
  - Telegram alerta imediato (HTML, string única, parse_mode=HTML)
  ↓
WF-EXEC-Orquestrador (Schedule trigger 08:00 BR + on-demand)
  - Lê demandas Estado=Aberta da fila
  - Calcula prioridade (heurística no Lote 1: Critica=100, Recorrente diária=50, Semanal=30, Ad-hoc=20)
  - Marca prioridade_origem=agente
  - Estado → Priorizada
  - Emite evento demanda.priorizada
  - Tier: Pro (consultar ADR Tiering)
  ↓
[Humano: Olavo resolve no Google Ads/Meta]
  - Manualmente atualiza demanda: Estado=Em execucao (evento demanda.iniciada)
  - Depois Estado=Em revisao (evento demanda.em_revisao)
  ↓
WF-EXEC-QualityGate-Pacing (trigger: Estado mudou pra Em revisao)
  - Tier: Flash
  - Valida DoD do tipo Pacing (SOP §DoD):
      [ ] Diagnostico da anomalia
      [ ] Acao tomada OU justificativa
      [ ] Registro de impacto esperado
      [ ] Audit (execution_id + fonte)
  - Output: quality_gate=pass|fail
  - PASS: estado → Entregue, evento demanda.entregue
  - FAIL: estado → Em execucao, evento demanda.reaberta, Telegram com checklist
```

## Schema do DB `PHI - Eventos` (você cria)

```
CREATE TABLE (
  "tipo" TITLE COMMENT 'ex demanda.criada',
  "entidade_id" RICH_TEXT COMMENT 'ID da demanda/etapa relacionada',
  "entidade_area" SELECT('Execucao':purple, 'Onboarding':blue, 'Priorizacao':orange, 'Comercial':yellow, 'Curador':red, 'Documentacao e Ferramentas':gray),
  "payload_json" RICH_TEXT COMMENT 'JSON serializado do payload comum + específico',
  "timestamp" DATE COMMENT 'ISO-8601 UTC',
  "execution_id" RICH_TEXT,
  "tenant_id" RICH_TEXT,
  "tier_agente" SELECT('pro':red, 'flash':blue, 'n/a':gray),
  "versao_sop_aplicada" RICH_TEXT
)
```

Parent: page `9d6b65e5-c72b-82e7-856d-81bc34933316` (Gerenciamento de Documentos).

## Workflows a entregar

| # | Codename | Tipo | Trigger | Tier IA |
|---|---|---|---|---|
| 1 | `WF-EXEC-Intake-Pacing` | webhook | Webhook (POST `/pacing-alert`) | — (lógica fixa) |
| 2 | `WF-EXEC-Orquestrador` | Schedule + manual | Cron diário 08:00 BR + executions on-demand | **Pro** (Gemini) |
| 3 | `WF-EXEC-QualityGate-Pacing` | Notion trigger ou Schedule | Schedule 5 min OU Notion DB filter Estado=Em revisao | **Flash** (Gemini) |

Cada workflow exportado em `onboarding/execucao/<id>/workflow.json` + sandbox sanitizado (ou nova pasta `execucao/lote1/` — escolha estrutura coerente; sugiro `onboarding/execucao/lote1/`).

## Padrões inegociáveis (do `BRUTO-v0.3-design.md` §8)

- `tenant_id`, `client_id`, `execution_id`, `versao_sop_aplicada` em toda demanda + evento
- jsCode ASCII-safe (escape `\u00XX`)
- Telegram `text` = string única, `parse_mode: HTML` no node
- Idempotência por chave: demanda Pacing do dia X cliente Y é única (`existingKeys` lookup)
- Re-export sanitizada: `<TELEGRAM_CHAT_ID_redacted>`, `<credential_id_redacted>`, `<TELEGRAM_CREDENTIAL_ID_redacted>`
- **Multi-fan-in PARALELO pra Code node EXIGE Merge consolidador** com `numberInputs` exato (Aprendizado aplicado — Telemetria a05)
- Multi-fan-in CONVERGENTE (IF/Switch mutually-exclusive): Merge opcional
- `active: false` em todos os workflows até smoke real verde
- Webhook secret validado antes do payload
- UTF-8 sem BOM
- Sem secrets em arquivo (`AIza|secret|api_key|token`)
- Sem mojibake (`NÃ|Ã£|Ã§|Ã©|Ã³`)

## Critérios de aceite

- [ ] 3 workflows criados em git + sandbox sanitizados + scripts ps1 estruturais cobrindo cada um
- [ ] DB `PHI - Eventos` criado no Notion via MCP n8n (ou instruções pra eu criar via MCP Notion)
- [ ] Cada workflow lê SOP Vigente de area=Execucao antes de operar e grava `versao_sop_aplicada` na demanda
- [ ] Cada transição de estado emite evento canônico (modelo do ADR Eventos)
- [ ] Pacing crítico nasce com `classe_sla=Critica`, `prazo=hoje 23h59 BRT`, prioridade 100
- [ ] Telegram alerta imediato no Intake (Crítica)
- [ ] Quality-gate Flash valida DoD do Pacing per SOP §DoD
- [ ] FAIL → reabre + checklist no Telegram
- [ ] PASS → demanda.entregue
- [ ] active:false em todos
- [ ] Suíte ps1 verde
- [ ] sandbox==workflow byte-a-byte (sha256 igual)
- [ ] Re-export sanitizada (nada de secrets)

## NÃO fazer

- ❌ Não tocar nenhum workflow do Onboarding, Priorização ou Comercial
- ❌ Não tocar `onboarding/telemetria/*` ou `onboarding/<n8n_id>/workflow.json` legados
- ❌ Não chutar IDs de credenciais — usar placeholders redacted
- ❌ Não usar tier Pro pra coisas mecânicas (quality-gate é Flash per ADR Tiering)
- ❌ Não embutir secrets de jeito nenhum
- ❌ Não publicar (active:true) — Olavo decide depois de smoke

## Commit + push + verificação

```bash
git add onboarding/execucao/ onboarding/execucao_lote1_tests.ps1
git commit -m "exec-lote1 a01: WF-EXEC Intake-Pacing + Orquestrador + QualityGate"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Depois eu (Claude) faço pré-revisão (suíte ps1 reproduzida em Node + checks específicos: SOP lookup, eventos emitidos, idempotência Pacing, tier dos agentes); se passar, Antigravity rodada 1; depois **smoke real** (decisivo).

--- END COPY ---
