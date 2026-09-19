# Brief Antigravity rodada 1 — Saúde Digital L2 (Error Handler global)

> **Tipo:** addendum independente, NÃO substitui o brief mãe.
> **Brief mãe (pré-leitura obrigatória):** `docs/handoff/2026-06-22-saude-digital-l2-codex-brief.md`
> **Addendum F4 (pré-leitura):** `docs/handoff/2026-06-22-saude-digital-l2-codex-addendum-f4.md`
> **Execution log do Codex:** `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md`
> **Branch:** `claude/agentic-agency-planning-KwJEw`
> **Commits do Codex:** `e859b14` (scaffold F1/F2/F3) + `1d77018` (F4 cirúrgico)
> **Pré-revisão Claude:** 10/12 critérios estruturais PASS (C11 e C12 dependem do smoke real, ainda não executado).
>
> **Objetivo da rodada 1:** validação independente antes do smoke real.
> Quer-se par independente que valide o que a pré-revisão Claude pode ter
> perdido por viés de quem escreveu o brief.

---

## 1. O que L2 entrega (recapitular para a revisão)

**4 frentes cirúrgicas + ADR-26 já Aceito no Notion (`388b65e5-c72b-8186-aed5-c5fafd65b5f8`):**

| Frente | Entrega | Status Codex |
|---|---|---|
| **F1** | DDL `t28_errors` em `phi_dev` + `phi_prod` (14 colunas, particionada por `occurred_at`, clustered por `workflow_id, severity`) | ✅ Versionado + Aplicado |
| **F2** | Sub-WF `WF-T28-Error-Handler` (id `rTS5pE34eElfuMPl`, versionId `81f56a35-022a-43a6-9026-f2bd5cc04728`, `active=false`) | ✅ |
| **F3** | `onError: continueErrorOutput` nos 15 nodes do Agregador T28 (`4sdG2UKMCBuFq8xn`) + 1 Roteador + 1 Call Handler | ✅ |
| **F4** | Refactor `safe()` no Adaptador Input T28: 9 fontes estruturais (`readOrThrow`) + 6 opcionais (`safeOptional`) | ✅ |

**Estado do Agregador T28:**
- `activeVersionId` (em prod): `66997885-de29-4761-8e46-c034475ad321` (versão L1.5 do dia 2026-06-22, **ainda intocada por L2**)
- Draft pós-F4 versionId: `ae0e79af-753f-452c-9b05-c7866dbd7197` (aguarda publish)
- nodeCount: 62 (era 61 → +1 Roteador, +1 Call Handler, -0)

---

## 2. Pré-revisão Claude — o que JÁ foi validado

Os 10 critérios estruturais abaixo passaram (não precisa revalidar):

1. ✅ DDLs `t28_errors` idênticos exceto pelo dataset (`diff` confirmou)
2. ✅ `workflow.json` sub-WF sanitizado (`<TELEGRAM_CHAT_ID_redacted>`, `fromEnvOrRedacted` per ADR-19)
3. ✅ Sub-WF tem 1 trigger único (`Execute Workflow Trigger`)
4. ✅ Sub-WF grava em `phi_prod` (`datasetId.value = "phi_prod"`)
5. ✅ Sub-WF aponta para `PHI - Demandas` real (`databaseId a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b`)
6. ✅ 15 nodes do Agregador com `onError: continueErrorOutput` (13 críticos + Adaptador + Normalizador, conforme listagem do brief mãe §5.1)
7. ✅ 1 só `[Err] Roteador Payload` + 1 só `[Err] Call Handler` (não 13 cópias)
8. ✅ Adaptador: helpers `readOrThrow` + `safeOptional` no topo; substituições conforme tabela §6.1 do brief mãe; `safe(` antigo eliminado
9. ✅ Telegram com `onError: continueRegularOutput` (equivalente operacional de continueOnFail)
10. ✅ versionId pós-F4 registrado no execution log (`ae0e79af-753f-452c-9b05-c7866dbd7197`)

Critérios 11 e 12 (smoke real verde + sem regressão CLI-4) dependem do smoke, que **só dispara após esta rodada Antigravity verde**.

---

## 3. Escopo desta rodada — 10 itens para revisão independente

Itens 1-8 vinham do §11 do brief mãe (pensados na escrita).
Itens 9-10 são novos, levantados pela pré-revisão Claude.

### 3.1. Itens originais (§11 do brief mãe)

#### Item 1 — Coerência semântica do schema `t28_errors`

Arquivos: `docs/strategic-planning/agregador-t28/ddl/phi_dev_t28_errors.sql` e `phi_prod_t28_errors.sql`.

Validar:
- Nomes das colunas vs uso real no `[ErrHdl] BQ Insert t28_errors` do sub-WF (cross-check com `parameters.fieldsUi.values`).
- `error_id` como STRING NOT NULL faz sentido vs UUID hexadecimal? Há índice/unique constraint útil?
- Granularidade `error_id` UUID vs fallback `EXEC-ERRHDL-{exec}-{i}` — ambíguo se a mesma execução gerar múltiplos erros? Reutilização possível?
- `severity` como STRING NOT NULL sem ENUM/CHECK — risco de drift de valores ('Error' vs 'error', 'critical' vs 'CRITICAL')?
- `resolved` BOOL NULLABLE — sentinel `null = aberto` vs `false = não resolvido` é claro?

#### Item 2 — Risco de race no `[Err] Roteador Payload` multi-fan-in

Padrão inegociável do projeto: "multi-fan-in para Code node EXIGE Merge antes" (consolidado em Telemetria Mínima Lote 1, v0.1.19).

Roteador hoje recebe **15 conexões de error output** (13 críticos + Adaptador + Normalizador) direto, sem Merge.

Validar:
- Code node com 15 inputs paralelos vai executar `$input.all()` corretamente?
- Há risco do jsCode rodar 15× por erro (cada upstream triggando uma execução do Code), como aconteceu no smoke do Telemetria `a03` (gerou 7×19 linhas em vez de 19)?
- OU mode `runOnceForAllItems` (default do v2) garante 1 execução por error output?
- Se houver risco, precisa Merge `numberInputs: 15` antes do Roteador?

Inspecionar via `get_node_types n8n-nodes-base.code` qual é o comportamento exato com N inputs.

#### Item 3 — Payload do Execute Workflow

`[Err] Roteador Payload` lê:
- `$('Set dados').first().json?.id_client`
- `$('Code prepara datas para extração').first().json?.date_end`

Validar:
- Se o erro for em um node ANTES de `Set dados` (ex: Schedule Trigger falha, Get database clientes falha), `$('Set dados').first()` retorna `null` ou throw?
- `?.` chain protege adequadamente?
- Há scenario onde `$('Code prepara datas...').first()` falhe (ex: error no próprio Code)?

#### Item 4 — Refactor `readOrThrow` no piloto CLI-4

Algum estrutural classificado como `readOrThrow` pode falhar no cliente piloto CLI-4 mesmo no caminho feliz?

Cross-check com o smoke L1.5 (12/0/2/1/1/0): CLI-4 traz `t28_ga4_landing=2` (organic+paid OK), `t28_gbp_daily=1` (GBP OK), `t28_clarity_daily=1` (Clarity OK), `t28_meta_campaign=0` (Meta disabled).

- GA4 Pago vai sempre retornar dado real? E se cliente histórico não tiver tráfego pago em algum dia?
- O `readOrThrow` retorna null se a função retornar undefined — então mesmo HTTP 200 com `data=[]` pode triggar throw?
- Compensação pelo `onError: continueErrorOutput` do Adaptador é suficiente, ou pode mascarar bug ao mandar tudo pro Roteador?

#### Item 5 — Smoke triste com mutação intencional do BQ Read

Brief mãe §7.2 propõe smoke triste editando temporariamente o `sqlQuery` do `[T28] BQ Read raw_campaign_data` para coluna inexistente (`business_date_fake`).

Validar:
- Há check no execution log para garantir reverter o sqlQuery?
- Risco do operador esquecer reverter e quebrar smoke real subsequente?
- Existe approach alternativo (ex: mutar credencial temporariamente, mais fácil de reverter)?

#### Item 6 — Telegram credencial e chat_id

`workflows/wf-t28-error-handler/workflow.json` sanitizado (`<TELEGRAM_CHAT_ID_redacted>`).

No servidor n8n (`rTS5pE34eElfuMPl`), o `[ErrHdl] Telegram Notificar` aparece com `chatId: "930549271"` literal.

Validar:
- `fromEnvOrRedacted('TELEGRAM_CHAT_ID', '...')` no `generate_export.js` exporta corretamente?
- Re-export do workflow regravaria o redacted no git? Há risco de drift live vs git?
- Credential ID Telegram também segue padrão fromEnvOrRedacted?

#### Item 7 — Notion Demandas schema runtime

`[ErrHdl] Notion Criar Tarefa Demanda` hardcoda properties: `titulo`, `tipo`, `classe_sla`, `estado`, `prioridade`, `prioridade_origem`, `quality_gate`, `sla_version`, `observacoes`, `tenant_id`, `client_id`.

Olavo confirmou que `tipo='Investigar anomalia'`, `classe_sla='Critica/Ad-hoc padrao/Recorrente diaria'`, `estado='Aberta'` existem no DB.

Validar:
- Schema completo do DB Demandas via `notion-fetch` confirma TODOS os 11 keys que Codex usou existem?
- Há keys obrigatórios que o sub-WF não setou (que viriam como `null` no Notion)?
- Se schema do DB Demandas evoluir (nova property required), sub-WF quebra silenciosamente?

#### Item 8 — Sub-WF `active=false` no commit

Verificar:
- `workflow.json` git: `active=false` ✅ (Codex confirmou)
- Servidor n8n (`rTS5pE34eElfuMPl`): `active=false` ✅
- Não há gatilho automático para `publish_workflow` antes da revisão Antigravity verde?

### 3.2. Itens novos descobertos pela pré-revisão Claude

#### Item 9 — Detecção de `source` por substring

`[Err] Roteador Payload.parameters.jsCode`:

```js
const sourceFor = (nodeName) => {
  const n = String(nodeName || '').toLowerCase();
  if (n.includes('google ads')) return 'google_ads';
  if (n.includes('ga4')) return 'ga4';
  if (n.includes('gbp')) return 'gbp';
  if (n.includes('clarity')) return 'clarity';
  if (n.includes('bq')) return 'bq';
  if (n.includes('notion')) return 'notion';
  if (n.includes('telegram')) return 'telegram';
  return 'other';
};
```

Validar:
- Mapping cobre os 13 nodes críticos sem colisão (ex: node renomeado contendo "BQ" e "Google Ads" daria match em qual primeiro)?
- Ordem de teste cobre todos? `google ads` vem antes de `bq`/`notion`/`telegram` — OK.
- Se Olavo renomear node no futuro (ex: trocar "GAQL" por "Google Ads API"), substring continua matchando?
- Default `'other'` para qualquer não-match — vai poluir analítico?

#### Item 10 — `node_name='unknown'` fallback

```js
const nodeName = j?.error?.node?.name || j?.node?.name || j?.nodeName || j?.node_name || 'unknown';
```

Validar:
- Em runtime n8n, qual das 4 chaves o n8n popula no error output? (`get_node_types` ou docs n8n)
- Se nenhuma estiver presente, o `'unknown'` polui o `t28_errors` + cria tarefa Notion sem rastreabilidade — sintoma silencioso de Roteador quebrado.
- Tem como o sub-WF rejeitar input com `node_name='unknown'` para evitar criar tarefa fantasma?
- Smoke triste vai expor isso?

---

## 4. O que NÃO está nesta rodada

- ❌ Smoke real (feliz/triste) — autorizado após Antigravity verde, executado por Olavo
- ❌ Saneamento dívida arquitetural (cadeia morta Merge1 → Calculate KPIs disabled) — Lote 2.5
- ❌ Anti-spam de Telegram — Lote 2.5+
- ❌ Decisão sobre Fetch Meta Ads — quando cliente piloto Meta entrar

---

## 5. Critérios de aprovação macro

**APROVAR** se:
- Os 10 itens acima validados sem bloqueador macro
- Issues menores admissíveis (regista no relatório, vira sub-pendência para L2.5 ou tarefa futura)
- Pré-revisão Claude (10/12 estrutural) confirmada e sem buracos

**REJEITAR** se:
- Algum item revela bug que impede smoke real virar verde com confiança
- Padrão inegociável violado (notadamente item #2 — multi-fan-in para Code)
- Quebra de garantias do ADR-26 Aceito (ex: erro silencioso em vez de propagado)

Se REJEITAR, gerar brief Codex de fix `a02` no mesmo padrão do Telemetria Mínima.

Se APROVAR, libera **smoke real** (Olavo executa, Claude monitora).

---

## 6. Artefatos a inspecionar

### Git (branch `claude/agentic-agency-planning-KwJEw`)

| Path | O que conter |
|---|---|
| `docs/strategic-planning/agregador-t28/ddl/phi_dev_t28_errors.sql` | DDL phi_dev (31 linhas) |
| `docs/strategic-planning/agregador-t28/ddl/phi_prod_t28_errors.sql` | DDL phi_prod (31 linhas) |
| `workflows/wf-t28-error-handler/generate_export.js` | Generator SDK (~225 linhas) |
| `workflows/wf-t28-error-handler/workflow.json` | Sub-WF sanitizado (~357 linhas) |
| `workflows/wf-t28-error-handler/sandbox_export.json` | Idêntico ao workflow.json |
| `onboarding/saude_digital_l2_tests.ps1` | Testes estruturais (119 linhas) |
| `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md` | Log do Codex (101 linhas) |

### MCP n8n

| Workflow | ID | versionId |
|---|---|---|
| Sub-WF Error Handler | `rTS5pE34eElfuMPl` | `81f56a35-022a-43a6-9026-f2bd5cc04728` |
| Agregador T28 (draft) | `4sdG2UKMCBuFq8xn` | `ae0e79af-753f-452c-9b05-c7866dbd7197` |
| Agregador T28 (active prod) | `4sdG2UKMCBuFq8xn` | `66997885-de29-4761-8e46-c034475ad321` (L1.5, sem L2) |

### BigQuery

| Tabela | Status |
|---|---|
| `phi_dev.t28_errors` | Aplicada 2026-06-23, 0 rows |
| `phi_prod.t28_errors` | Aplicada 2026-06-23, 0 rows |

### Notion

| DB | ID | Uso |
|---|---|---|
| `PHI™ — Decisões (ADR)` | `237a5e12-7f51-42ee-b9c0-4ddfb16b6400` | ADR-26 publicado `Aceito` page `388b65e5...b5f8` |
| `PHI - Demandas` | `a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b` | Sub-WF Error Handler cria tarefas aqui |

---

## 7. Entrega esperada do Antigravity

Em `docs/handoff/2026-06-23-saude-digital-l2-antigravity-rodada1-report.md`:

- Veredito macro: APROVADO | REJEITADO
- 10 itens com PASS | FALHA | OBSERVAÇÃO
- Para cada FALHA: justificativa + correção mínima sugerida
- Para cada OBSERVAÇÃO: registrar como sub-pendência (L2.5+)
- Indicar próximo passo (smoke real | brief `a02` fix)

Push para mesma branch `claude/agentic-agency-planning-KwJEw`.

---

**Fim do brief.** Aguardo o report Antigravity para liberar smoke ou gerar brief `a02`.
