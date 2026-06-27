# Brief Codex a05 — Saúde Digital L2: truncar Notion + Call Handler best-effort + errMessage

> **STATUS:** A executar. Branch `claude/agentic-agency-planning-KwJEw`.
> **Origem:** smoke a04 real (execuções `11404` e `11426`) — Error Handler
> validado (Fix A `$prevNode` + Fix B funcionando), mas 2 efeitos de borda
> + 1 cosmético a corrigir.
> **Pré-leitura:** brief a04 `docs/handoff/2026-06-27-saude-digital-l2-codex-a04-brief.md`
> + execution log `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md`.

---

## 0. ⚠️ NÃO TOCAR no Adaptador Input T28

O mojibake nos 3 refs de node acentuados (`Code prepara datas para extração`,
`Google Ads Anúncios (GAQL)`, `HTTP Request GA4 Orgânico`) **já foi corrigido
manualmente pelo Olavo**. **Não editar o `Adaptador Input T28` neste a05.**
Qualquer reescrita do jsCode do Adaptador via `update_workflow` corre risco
de reintroduzir mojibake. Deixar como está.

---

## 1. Contexto — o que o smoke a04 mostrou

**Funcionou (não mexer):**
- **Fix A (`$prevNode`)**: `node_name` correto para todos os erros
  (`HTTP Request GBP`, `Google Ads Anúncios (GAQL)`, `Adaptador Input T28`).
  Fim do 'unknown'. NÃO precisa stamps por node.
- **Fix B (`error_details` string)**: sem mais "Invalid input for error_details";
  erros de Code node tratados como JSON string.
- 5 erros → 5 sub-execuções → 5 Telegrams com node correto.

**A corrigir (este a05):**

| Fix | Sintoma | Causa |
|---|---|---|
| **B1** | Exec `11426`: sub-WF Notion falhou `body...content.length should be ≤ 2000, instead was 3296` → Call Handler falhou → execução principal `error` | `error_details = JSON.stringify(j)` (item inteiro, grande) é inserido **sem truncar** no bloco de corpo da tarefa Notion. Notion limita rich_text a 2000 chars. |
| **R1** | Falha do sub-WF Error Handler **derruba a execução principal** | `[Err] Call Handler` não tem `onError`. O Error Handler é best-effort: se ele falhar, a agregação principal NÃO deveria parar. (Antigravity rodada 2 item 7.) |
| **P1** | Telegram do erro do Adaptador mostrou `Erro: unknown` | `errMessage(j)` espera `j.error.message`, mas erro de Code node entrega `j.error` como **string**. |

---

## 2. M1 (B1) — Truncar `error_details` no corpo da tarefa Notion

Sub-WF `WF-T28-Error-Handler` (`rTS5pE34eElfuMPl`).

**(a)** No `[ErrHdl] Set Contexto` (Code node), adicionar 1 campo ao `payload`
(logo após `error_details: detailsStr,`):
```javascript
    error_details_block: detailsStr.slice(0, 1800),
```
(1800 deixa folga para as cercas ```` ```json ```` que o bloco adiciona, ficando < 2000.)

**(b)** No `[ErrHdl] Notion Criar Tarefa Demanda`, no `blockUi.blockValues[0].textContent`,
trocar a referência de `error_details` por `error_details_block`:
- DE:  `={{ "```json\n" + $json.error_details + "\n```" }}`
- PARA: `={{ "```json\n" + $json.error_details_block + "\n```" }}`

A property `observacoes` (já trunca em 1200) e o BQ Insert (coluna JSON, sem
limite) permanecem usando `error_details`/`detailsStr` cheios — **não mexer
nesses**. Só o bloco de corpo precisa do truncado.

## 3. M2 (R1) — Call Handler best-effort

Agregador `4sdG2UKMCBuFq8xn`, node `[Err] Call Handler`:
```
setNodeSettings: { onError: "continueRegularOutput" }
```
Assim, se o sub-WF Error Handler falhar (ex: Notion fora do ar), o
`[Err] Call Handler` não marca a execução principal como `error` — a
agregação segue. O erro do handler em si fica visível no log da execução.

## 4. M3 (P1) — `errMessage` trata `j.error` string

Agregador `4sdG2UKMCBuFq8xn`, node `[Err] Roteador Payload`. Substituir o
`jsCode` INTEIRO pelo bloco abaixo (idêntico ao atual, só muda a função
`errMessage`). **Colar verbatim — preservar o acento em
`Code prepara datas para extração` (UTF-8).**

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
const errMessage = (json) => {
  if (typeof json?.error === 'string') return json.error;
  return json?.error?.message || json?.message || json?.errorMessage || json?.description || 'unknown';
};
const safeGetNodeJson = (name) => {
  try { return $(name).first().json; } catch (e) { return null; }
};

// Fix A: $prevNode should reflect the source node for the incoming error item.
let prevNodeName = null;
try { prevNodeName = $prevNode?.name || null; } catch (e) { prevNodeName = null; }

return $input.all().map((item) => {
  const j = item.json || {};
  const nodeName = j?.error?.node?.name || j?.node?.name || j?.nodeName || j?.node_name || prevNodeName || 'unknown';
  const source = sourceFromName(nodeName) || sourceFromError(j);
  return { json: {
    workflow_id: $workflow.id,
    workflow_name: $workflow.name,
    node_name: nodeName,
    source,
    severity: 'error',
    error_message: String(errMessage(j)).slice(0, 1000),
    error_details: JSON.stringify(j),
    client_id: safeGetNodeJson('Set dados')?.id_client ?? null,
    business_date: safeGetNodeJson('Code prepara datas para extração')?.date_end ?? null,
    execution_id: 'EXEC-T28-' + $execution.id
  } };
});
```

---

## 5. Aplicação (MCP)

1. `update_workflow` no `rTS5pE34eElfuMPl`: 2 ops
   - `updateNodeParameters` no `[ErrHdl] Set Contexto` (jsCode + campo `error_details_block`)
   - `updateNodeParameters` (ou `setNodeParameter`) no `[ErrHdl] Notion Criar Tarefa Demanda` (block textContent → `error_details_block`)
2. `update_workflow` no `4sdG2UKMCBuFq8xn`: 2 ops
   - `setNodeSettings` no `[Err] Call Handler` (`onError: continueRegularOutput`)
   - `updateNodeParameters` no `[Err] Roteador Payload` (jsCode acima)
3. `publish_workflow` no `rTS5pE34eElfuMPl` (publicar o novo draft do sub-WF — o Execute Workflow chama a versão ativa).
4. Agregador permanece **draft** (não publicar) até o smoke a05 verde.

## 6. Validação (Codex, pré-smoke)

- `get_workflow_details` no `rTS5pE34eElfuMPl`:
  - Set Contexto tem `error_details_block` com `.slice(0, 1800)`.
  - Notion block textContent usa `$json.error_details_block`.
  - `activeVersionId` == novo draft (pós-publish).
- `get_workflow_details` no `4sdG2UKMCBuFq8xn`:
  - `[Err] Call Handler` com `onError: continueRegularOutput`.
  - `[Err] Roteador Payload` com `errMessage` tratando `typeof json.error === 'string'`.
  - **grep anti-mojibake**: o jsCode do `[Err] Roteador Payload` NÃO contém `Ã` (zero ocorrências). Confirmar.
  - `Adaptador Input T28` **intocado** (não aparece nas ops aplicadas).
- `validate_node_config` nos 2 Code nodes alterados (Set Contexto, Roteador): PASS.

## 7. Execution log + commit

Em `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md`, seção
"## a05 - truncar Notion + Call Handler best-effort + errMessage":
- Novos versionId (draft Agregador + activeVersionId sub-WF pós-publish).
- Confirmar: Adaptador NÃO tocado; zero mojibake no Roteador.

Commit + push:
```
fix(saude-digital-l2): a05 - trunca corpo Notion (2000) + Call Handler best-effort + errMessage string

B1: Set Contexto cria error_details_block (slice 1800) e o bloco de corpo
da tarefa Notion passa a usa-lo (evita estouro do limite 2000 chars do
Notion, que derrubava o sub-WF em itens grandes). R1: [Err] Call Handler
onError=continueRegularOutput (falha do Error Handler nao derruba mais a
agregacao principal). P1: errMessage trata j.error string (erro de Code
node deixa de virar 'unknown'). Mojibake do Adaptador ja corrigido
manualmente (nao tocado aqui).
```

## 8. Critérios de aceite

- [ ] Set Contexto: `error_details_block` = `detailsStr.slice(0, 1800)`.
- [ ] Notion body block usa `$json.error_details_block`.
- [ ] `observacoes` e BQ `error_details` continuam com o valor cheio (inalterados).
- [ ] `[Err] Call Handler` com `onError: continueRegularOutput`.
- [ ] `[Err] Roteador Payload` errMessage trata `j.error` string.
- [ ] Zero mojibake (`Ã`) no jsCode do Roteador.
- [ ] `Adaptador Input T28` intocado.
- [ ] Sub-WF publicado; Agregador segue draft.
- [ ] Execution log + commit + push.

---

## 9. Smoke a05 (Olavo, após Codex)

1. **Smoke real** (Execute Workflow no draft). Como há 429/erros reais
   intermitentes (GBP/GAQL), provavelmente já dispara o caminho de erro
   naturalmente.
2. **Validar execução** — termina `status: success` mesmo com erros de
   fonte (graças ao Call Handler best-effort). Adaptador conclui (mojibake
   corrigido) → t28_* escreve.
3. **Validar `t28_errors`** (última hora): `node_name` correto, `source`
   correto, `error_details` preenchido. Para erro de Code node, `error_message`
   ≠ 'unknown'.
4. **Validar Notion** — tarefas `[ERR] ...` criadas sem erro de 2000 chars
   (corpo truncado).
5. **Smoke feliz** — `t28_campaign`=12, demais conforme (2/1/1/0/0), sem
   regressão.

Se verde → publish do Agregador draft → **L2 fecha**. Aí atualizo
ESTADO/§3.8 + execution log + fecho a frente.

## 10. Fora de escopo (anotado, não a05)

- **GAQL Anúncios "Bad request - Request contains an invalid argument"**:
  erro real do node `Google Ads Anúncios (GAQL)` (query/param). `safeOptional`
  já captura (não quebra pipeline); o Error Handler agora o registra. Investigar
  em tarefa separada (não bloqueia L2).
- **Saneamento dívida arquitetural** (cadeia morta Merge1→Calculate KPIs
  disabled): segue para L2.5.
