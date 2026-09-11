# Brief Codex a03 — Saúde Digital L2: fix do smoke triste

> **STATUS:** A executar. Branch `claude/agentic-agency-planning-KwJEw`.
> **Base:** smoke triste da execução `11372` (Agregador `4sdG2UKMCBuFq8xn`)
> + sub-WF `11373` (`rTS5pE34eElfuMPl`). Decisões Olavo 2026-06-27.
> **Pré-leitura:** brief mãe `docs/handoff/2026-06-22-saude-digital-l2-codex-brief.md`,
> execution log `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md`.

## Contexto — o que o smoke triste revelou

Gatilho real: rate-limit 429 do GBP (`businessprofileperformance.googleapis.com`),
não a mutação de credencial. Suficiente — exercitou o caminho de erro autêntico.

**O Error Handler FUNCIONOU end-to-end** (sub-WF `11373` = success):
- ✅ BQ Insert em `t28_errors` (row gravada)
- ✅ Notion tarefa criada (page `38cb65e5-c72b-81cb-a822-ff1c2d54e571`)
- ✅ Telegram enviado (message 113)

**Mas 2 defeitos + 1 observação:**

| Defeito | Sintoma | Causa-raiz |
|---|---|---|
| **A** | `node_name='unknown'`, `source='other'` na tarefa/BQ/Telegram | n8n entrega o erro em `$json.error` (NodeApiError com `{context:{}, description, message, name:"NodeApiError", timestamp}`). O nome do node que falhou existe só no metadata `source[].previousNode`, **não** em `$json`. As 4 chaves testadas pelo Roteador todas falham → `'unknown'`. |
| **B** | Execução principal `11372` termina em `status: error`: `Invalid input for 'error_details' [item 0]: expects an object but we got 'Referenced node doesn't exist' [line 81]` | 2º caminho de erro (Adaptador `readOrThrow` disparando porque GBP não teve output — F4 correto). Quando o erro nasce de **Code node** (vs API), o `error_details: j` que o Roteador monta é rejeitado pela validação de tipo `object` do trigger do sub-WF. |
| **C** (obs) | 429 transitório aborta agregação inteira + cria tarefa | `readOrThrow` é fail-loud (intencional ADR-26), mas 429 transitório deveria ter retry antes de virar fatal. |

## Decisões Olavo (2026-06-27)

- **Fix A:** testar `$prevNode.name` (n8n-nativo) para recuperar node_name, com fallbacks robustos (parse de source pela description do erro). Se o smoke a03 mostrar que `$prevNode` não funciona com fan-in de error output, revertemos para stamps por node (decisão futura).
- **Fix B:** incluído (inequívoco).
- **Fix C:** incluído — retry nos HTTP estruturais.

---

## Mudança 1 (Fix A + Fix B) — jsCode do `[Err] Roteador Payload`

Workflow `4sdG2UKMCBuFq8xn`, node `[Err] Roteador Payload`. Substituir o
`parameters.jsCode` INTEIRO por:

```javascript
const sourceFromName = (nodeName) => {
  const n = String(nodeName || '').toLowerCase();
  if (n.includes('bq')) return 'bq';
  if (n.includes('google ads')) return 'google_ads';
  if (n.includes('ga4')) return 'ga4';
  if (n.includes('gbp')) return 'gbp';
  if (n.includes('clarity')) return 'clarity';
  if (n.includes('notion')) return 'notion';
  if (n.includes('telegram')) return 'telegram';
  return null;
};
const sourceFromError = (j) => {
  const blob = JSON.stringify(j || {}).toLowerCase();
  if (blob.includes('businessprofileperformance') || blob.includes('mybusiness')) return 'gbp';
  if (blob.includes('analyticsdata') || blob.includes('analyticsreporting') || blob.includes('analytics')) return 'ga4';
  if (blob.includes('googleads')) return 'google_ads';
  if (blob.includes('bigquery')) return 'bq';
  if (blob.includes('clarity')) return 'clarity';
  if (blob.includes('api.telegram')) return 'telegram';
  if (blob.includes('notion')) return 'notion';
  return 'other';
};
const errMessage = (json) => json?.error?.message || json?.message || json?.errorMessage || json?.description || 'unknown';
const safeGetNodeJson = (name) => {
  try { return $(name).first().json; } catch (e) { return null; }
};

// Fix A: $prevNode (n8n-nativo) reflete o no de origem do item.
// Em fan-in de error output, normalmente aponta o no que disparou o erro.
let prevNodeName = null;
try { prevNodeName = $prevNode?.name || null; } catch (e) { prevNodeName = null; }

return $input.all().map((item) => {
  const j = item.json || {};
  const nodeName = j?.error?.node?.name || j?.node?.name || j?.nodeName || j?.node_name || prevNodeName || 'unknown';
  // source: tenta pelo nome; se 'unknown' ou nao mapeado, deriva da description do erro.
  const source = sourceFromName(nodeName) || sourceFromError(j);
  return { json: {
    workflow_id: $workflow.id,
    workflow_name: $workflow.name,
    node_name: nodeName,
    source,
    severity: 'error',
    error_message: String(errMessage(j)).slice(0, 1000),
    error_details: JSON.stringify(j),   // Fix B: sempre string (evita rejeicao do trigger tipado)
    client_id: safeGetNodeJson('Set dados')?.id_client ?? null,
    business_date: safeGetNodeJson('Code prepara datas para extração')?.date_end ?? null,
    execution_id: 'EXEC-T28-' + $execution.id
  } };
});
```

Mudanças vs a02:
- `prevNodeName = $prevNode?.name` adicionado como 5ª opção do `nodeName` (antes do `'unknown'`).
- `source` agora deriva de `sourceFromName(nodeName) || sourceFromError(j)` (parse da description quando o nome não resolve).
- `error_details: JSON.stringify(j)` (era `error_details: j`). **Crítico para Fix B.**

## Mudança 2 (Fix B) — trigger do sub-WF `WF-T28-Error-Handler`

Workflow `rTS5pE34eElfuMPl`, node `[ErrHdl] Execute Workflow Trigger`.
No `parameters.workflowInputs.values`, trocar o tipo do campo `error_details`
de `object` para `string`:

```
{ "name": "error_details", "type": "string" }
```

(Os outros 9 campos permanecem inalterados.)

## Mudança 3 (Fix B) — `[ErrHdl] Set Contexto` do sub-WF

Workflow `rTS5pE34eElfuMPl`, node `[ErrHdl] Set Contexto`. Hoje o jsCode faz:
```javascript
const details = input.error_details ?? input.error ?? input;
// ...
error_details: JSON.stringify(details),
```

Como agora `error_details` chega **já como string JSON** (vindo do Roteador
com `JSON.stringify(j)`), evitar double-stringify. Substituir a derivação
de `details` por:

```javascript
const detailsStr = typeof input.error_details === 'string'
  ? input.error_details
  : JSON.stringify(input.error_details ?? input.error ?? input);
```

E usar `detailsStr` (string) onde antes usava `JSON.stringify(details)`:
- campo `error_details` do payload → `error_details: detailsStr`
- dentro de `demanda_observacoes`, o trecho `'details=' + JSON.stringify(details).slice(0,1200)` → `'details=' + detailsStr.slice(0, 1200)`

Garantir que o BQ Insert `error_details` (coluna JSON) continua recebendo
uma string JSON válida (BQ parseia). No smoke 11373 isso já funcionou com
string — manter.

## Mudança 4 (Fix C) — retryOnFail nos 6 HTTP estruturais

Workflow `4sdG2UKMCBuFq8xn`. Aplicar `setNodeSettings` em cada um dos 6 nodes:

| Node | Settings |
|---|---|
| `HTTP Request GA4 Orgânico` | `retryOnFail: true, maxTries: 3, waitBetweenTries: 2000` |
| `HTTP Request GA4 Pago (LPs)` | idem |
| `HTTP Request GBP` | idem |
| `HTTP Request Clarity` | idem |
| `Google Ads Conjuntos (GAQL)` | idem |
| `Google Ads Anúncios (GAQL)` | idem |

Manter o `onError: continueErrorOutput` já existente (retry primeiro; se
esgotar as 3 tentativas, então cai no error output → Roteador). NÃO aplicar
retry nos BQ Inserts nem no BQ Read nesta rodada (foco em rate-limit de API
externa; BQ é interno e idempotência de insert pede cuidado).

---

## Aplicação (via MCP)

1. `update_workflow` no `rTS5pE34eElfuMPl`: 2 ops
   - `updateNodeParameters` no `[ErrHdl] Execute Workflow Trigger` (error_details type string)
   - `updateNodeParameters` no `[ErrHdl] Set Contexto` (novo jsCode)
2. `update_workflow` no `4sdG2UKMCBuFq8xn`: 7 ops
   - `updateNodeParameters` no `[Err] Roteador Payload` (novo jsCode)
   - 6× `setNodeSettings` nos HTTP estruturais (retry)
3. `validate_node_config` nos 3 nodes de código alterados (Roteador, Set Contexto, trigger).
4. NÃO publicar (manter sub-WF `active=true` já publicado; o Agregador continua com draft — Olavo decide publish após smoke a03).

## Atualizar execution log

Em `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md`, adicionar seção
"## a03 — fix smoke triste" com:
- Novos versionId pós-edit do `rTS5pE34eElfuMPl` e `4sdG2UKMCBuFq8xn`.
- Confirmação `validate_node_config` PASS.
- Nota: `$prevNode` é experimental — smoke a03 confirma se resolve node_name.

## Commit + push

```
fix(saude-digital-l2): a03 - node_name via $prevNode + source-parse + error_details string + retry 429

Fix A: Roteador usa $prevNode.name (5a opcao do fallback) + deriva source
da description do erro quando nome nao resolve. Fix B: error_details
trafega como string JSON ponta-a-ponta (Roteador JSON.stringify + trigger
type object->string + Set Contexto sem double-stringify) — resolve
"Invalid input for error_details" em erros de Code node. Fix C: retryOnFail
3x/2s nos 6 HTTP estruturais (GA4 Org/Pago, GBP, Clarity, GAQL x2) para
absorver 429 transitorio antes do error output.
```

## Critérios de aceite

- [ ] Roteador: `$prevNode?.name` presente como fallback de node_name.
- [ ] Roteador: `error_details: JSON.stringify(j)`.
- [ ] Roteador: `source` deriva de nome OU description.
- [ ] Sub-WF trigger: `error_details` type = `string`.
- [ ] Set Contexto: sem double-stringify (usa detalhe já-string).
- [ ] 6 HTTP estruturais com retryOnFail 3x/2s + onError preservado.
- [ ] `validate_node_config` PASS nos 3 nodes de código.
- [ ] Execution log atualizado com novos versionId.
- [ ] Nenhuma mudança topológica (só parâmetros/settings).

---

## Smoke a03 (Olavo executa após Codex)

1. **Smoke triste de novo** — provocar erro estrutural. Opção limpa: trocar
   o Project ID do `[T28] BQ Read raw_campaign_data` para um inexistente
   (`project-fake-000`), Execute Workflow, depois reverter. OU aguardar/forçar
   novo 429 do GBP.
2. **Validar `t28_errors`** — a nova row deve ter `node_name` ≠ 'unknown'
   (ex: `HTTP Request GBP` ou `[T28] BQ Read raw_campaign_data`) e `source`
   correto (`gbp`/`bq`).
3. **Validar execução** — `status: success` (sem mais "Invalid input for
   error_details"). Telegram com Node correto.
4. **Smoke feliz** — confirmar 12/0/2/1/1/0 sem regressão + `t28_errors` sem
   row nova.

Se `$prevNode` ainda der 'unknown' no smoke a03 → reportar; decidimos
stamps por node (a04).
