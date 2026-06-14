# Brief Antigravity — Execução de Demandas Lote 1 (revisão completa)

> **QUANDO USAR:** depois que o Codex empurrar o `a03` (reversão do `$env` pro padrão ADR-19) E a pré-revisão Claude confirmar que passou. Antes disso, o código tem a regressão `$env` conhecida — não vale revisar. Confirme com Claude que o `a03` está pré-revisado antes de colar isto no Antigravity.
>
> Copie o bloco entre `--- COPY ---` e cole na sessão Antigravity.

--- COPY ---

# AUDITORIA: Execução de Demandas Lote 1 (Pacing/verba E2E)

Você é o **revisor técnico Antigravity** do projeto PHI. Primeira revisão externa da Área Execução de Demandas. 3 workflows n8n novos. Veredito esperado por workflow + macro.

## Sync

```bash
git fetch origin claude/agentic-agency-planning-KwJEw
git checkout <SHA_do_a03>   # Claude confirma o SHA; provavelmente após e4251ba
git log --oneline -6
```

Arquivos a revisar:
- `onboarding/execucao/lote1/intake-pacing/workflow.json` (18 nodes)
- `onboarding/execucao/lote1/orquestrador/workflow.json` (11 nodes, Gemini Pro)
- `onboarding/execucao/lote1/qualitygate-pacing/workflow.json` (14 nodes, Gemini Flash)
- `onboarding/execucao/lote1/generate_export.js` (gerador canônico)
- `onboarding/execucao_lote1_tests.ps1` (suíte estrutural)

## Pré-leitura (design canônico)

- `docs/strategic-planning/execucao-demandas/BRUTO-v0.1-design.md` (conteúdo v0.2)
- `docs/strategic-planning/execucao-demandas/BRUTO-v0.3-design.md` (delta + escopo Lote 1)
- ADR Tiering de Agentes IA (Aceito 2026-06-14, Notion `37fb65e5-c72b-81f3-b8a6-de1a474d736c`)
- ADR Eventos canônicos + sink BQ (Aceito 2026-06-14, Notion `37fb65e5-c72b-8195-b45f-eb33ef60ac08`)
- **ADR-19 — config não-secreta via build-time injection (runtime n8n bloqueia `$env`)** (Aceito 2026-05-28, Notion `36eb65e5-c72b-8136-b400-da8a8daf99d3`) — CRÍTICO, ver §"Padrões"
- SOP Execução de Demandas v1.0 (Notion DB `PHI - SOPs`, area=Execucao, estado=Vigente)

## Recursos Notion (data sources)

| DB | Data source ID |
|---|---|
| PHI - Demandas | `cd1ab757-e4d1-493f-b1e1-b64a95d33d1b` |
| PHI - SOPs | `bfeb1105-83a6-4e89-8d62-26607ebfcc8c` |
| PHI - Eventos | `3423df0d-77df-4834-bdda-c08ddbae40ff` |

## O que cada workflow faz (fluxo E2E)

### 1. WF-EXEC-Intake-Pacing (webhook)
- Webhook POST `/pacing-alert`
- Valida secret via **build-time injection** (constante `EXEC_WEBHOOK_KEY` literal, sanitizada `<EXEC_WEBHOOK_KEY_redacted>` no repo) contra header `x-pacing-secret`. Branch false → 401.
- Valida payload
- Lê SOP `Vigente` de area=Execucao (DB SOPs)
- Idempotência: checa demanda Pacing do dia+cliente já existente (existingKeys)
- Cria Demanda em PHI - Demandas: `tipo=Pacing/verba`, `classe_sla=Critica`, `estado=Aberta`, `prazo=hoje 23h59 BRT`, `versao_sop_aplicada` (rich_text = id do SOP), `sla_version=v0.3-2026-06-14`
- Emite evento `demanda.criada` em PHI - Eventos
- Telegram alerta imediato (HTML, string única)

### 2. WF-EXEC-Orquestrador (Schedule 08:00 BR + manual)
- Merge Triggers (mode append, numberInputs:2) consolida Schedule + Manual
- Lê SOP Vigente + demandas `Estado=Aberta`
- Gemini **Pro** (`gemini-2.5-pro`) confirma ordenação (Lote 1: papel mínimo)
- Calcula prioridade por `classe_sla` (Critica=100, Recorrente diaria=50, Recorrente semanal=30, Ad-hoc padrao=20)
- Marca `prioridade_origem=agente`, `estado=Priorizada`, grava `versao_sop_aplicada` (rich_text)
- Emite evento `demanda.priorizada`

### 3. WF-EXEC-QualityGate-Pacing (Schedule 5min)
- Lê demandas `Estado=Em revisao`
- Gemini **Flash** (`gemini-2.5-flash`) valida DoD do Pacing (checklist: diagnóstico, ação/justificativa, impacto, audit)
- PASS → `estado=Entregue`, `quality_gate=pass`, evento `demanda.entregue`
- FAIL → `estado=Em execucao`, `quality_gate=fail`, evento `demanda.reaberta`, Telegram com checklist

> Transições intermediárias (`Em execucao`, `Em revisao`) são feitas manualmente pelo Olavo no Lote 1 (humano resolve no Google Ads e move o estado). Lote 2 automatiza mais.

## Histórico de bugs resolvidos (contexto — não precisa re-achar)

- **B1 (a01→a02):** `versao_sop_aplicada` era enviado como `relation`, mas schema do DB Demandas é `rich_text` (decisão Lote 0; relation vem no Lote 2). Corrigido pra `rich_text`. **Valide que não há `versao_sop_aplicada: { relation: ...}` em nenhum update.**
- **B3 (a01→a02):** `priorityFor` confundia `tipo` com `classe_sla` e usava nomes inexistentes (`Semanal`, `Ad-hoc`). Corrigido pra `classe_sla` único parâmetro com nomes exatos do schema. **Valide os 4 nomes: `Critica`, `Recorrente diaria`, `Recorrente semanal`, `Ad-hoc padrao`.**
- **B2→B4 (a02→a03):** o `a02` usou `$env.WEBHOOK_SECRET_EXECUCAO` no Validar Secret — viola ADR-19 (runtime bloqueia `$env`). `a03` reverteu pra build-time injection. **Valide que NÃO HÁ `$env` em nenhum jsCode dos 3 workflows.**

## Checklist de revisão

### Geral (3 workflows)
- [ ] `active: false` em todos
- [ ] `settings.timezone = America/Sao_Paulo`
- [ ] Nomes de node com prefixo de área coerente (`[Exec Intake]`, `[Exec Orq]`, `[Exec QG]`)
- [ ] `sandbox_export.json` ≡ `workflow.json` byte-a-byte (sha256)
- [ ] Sem BOM, sem secrets (`AIza|api_key|token|secret`), sem chat_id real (`930549271`), sem mojibake (`NÃ|Ã£|Ã§`)
- [ ] **Sem `$env` em jsCode** (ADR-19) — este é o motivo do a03; confirme
- [ ] Credenciais redacted (`<credential_id_redacted>`, `<TELEGRAM_*_redacted>`, `<EXEC_WEBHOOK_KEY_redacted>`)

### Tiering de agentes (ADR Tiering)
- [ ] Orquestrador usa Gemini **Pro** (`gemini-2.5-pro`) — decisão de orquestração é cara/rara
- [ ] QualityGate usa Gemini **Flash** (`gemini-2.5-flash`) — validação mecânica de DoD
- [ ] Nenhuma inversão (Flash orquestrando ou Pro validando checklist)

### Eventos canônicos (ADR Eventos)
- [ ] Eventos seguem nomenclatura `demanda.<estado>` snake_case
- [ ] Payload comum presente: `tenant_id`, `client_id`, `execution_id`, `tier_agente`, `versao_sop_aplicada`, `timestamp`
- [ ] Eventos gravados em PHI - Eventos (ds `3423df0d-...`), não em campo solto
- [ ] `entidade_area = Execucao`

### Multi-fan-in (Aprendizado pós-Telemetria a05)
- [ ] Code/Function nodes com ≥2 conexões PARALELAS chegando têm Merge consolidador antes (com `numberInputs` exato). O Orquestrador tem Merge Triggers (Schedule+Manual) com `numberInputs:2` — confirme.
- [ ] Multi-fan-in CONVERGENTE (IF/Switch mutually-exclusive) é OK sem Merge

### SOP lookup + versionamento
- [ ] Cada workflow lê SOP `area=Execucao && estado=Vigente` antes de operar
- [ ] Falha explícita se SOP Vigente não existe (não fallback silencioso — Aprendizado #15)
- [ ] `versao_sop_aplicada` gravado na Demanda (rich_text com id do SOP)

### Segurança Intake
- [ ] Secret validado ANTES do payload (ordem dos nodes)
- [ ] Build-time injection: constante literal, não `$env`, não hardcode de valor real no repo
- [ ] Check defensivo impede autorizar com placeholder não-injetado
- [ ] Branch false retorna 401

### Idempotência
- [ ] Intake não cria demanda Pacing duplicada pro mesmo dia+cliente (existingKeys)

## Padrões inegociáveis (do projeto)

- **ADR-19:** runtime n8n bloqueia `$env` em Code nodes. Config não-secreta = build-time injection (literal sanitizado `<redacted>`). Secret real = credencial n8n nomeada OU build-time injection. **NUNCA `$env` em jsCode.**
- Webhook secret validado antes do payload
- jsCode ASCII-safe (escape `\u00XX`)
- Telegram `text` = string única, `parse_mode: HTML` no node
- Idempotência por chave
- Notion = interface, nunca cálculo (cálculo em n8n)
- `tenant_id`/`client_id`/`execution_id`/`versao_sop_aplicada` em toda demanda e evento
- Multi-fan-in paralelo pra Code node EXIGE Merge com `numberInputs` exato
- Sem fallback silencioso (falha explícita)
- active:false até smoke verde

## Formato de retorno

Por workflow: `APROVADO` / `OBSERVAÇÃO (não bloqueia)` / `REJEITADO (com correção)`. Mais veredito macro. Liste qualquer uso de `$env` que escapou, qualquer fallback silencioso, qualquer divergência de schema (campo enviado num tipo que o DB não tem).

## Após aprovação — smoke E2E (Olavo executa)

Pré-requisito: rodar build com `EXEC_WEBHOOK_KEY` real injetado (workflow ativo no n8n tem o valor; repo tem placeholder — ADR-19). Configurar credenciais Notion + Telegram reais. Compartilhar os 3 DBs (Demandas, SOPs, Eventos) com a integração Notion (Aprendizado: integração exige share por DB).

1. Importar os 3 workflows no n8n (active:false)
2. POST em `/pacing-alert` com header `x-pacing-secret` correto + payload Pacing → confere: Demanda criada (Critica, Aberta, prazo hoje), evento `demanda.criada`, Telegram chegou
3. POST sem secret (ou errado) → confere 401, nenhuma demanda criada
4. Executar Orquestrador manual → Demanda vira Priorizada (prioridade 100), evento `demanda.priorizada`
5. Mover Demanda manualmente pra `Em execucao` → `Em revisao` (preenchendo observacoes com diagnóstico/ação/impacto/audit)
6. Executar QualityGate → PASS → Demanda Entregue, evento `demanda.entregue`
7. Repetir com observacoes incompletas → FAIL → reaberta + checklist no Telegram
8. POST Pacing duplicado mesmo dia+cliente → idempotência: não cria 2ª demanda
9. Conferir PHI - Eventos: eventos canônicos com payload completo

Sem smoke verde, não publica (active:true).

--- END COPY ---
