# Brief Codex a04 — Saúde Digital L2: deduplicar cadeia de erro + fix Call Handler

> **STATUS:** A executar. Branch `claude/agentic-agency-planning-KwJEw`.
> **Origem:** Antigravity rodada 2 (`docs/handoff/2026-06-27-saude-digital-l2-antigravity-rodada2-report.md`,
> commit `6dc5f10`) — APROVADO **com 2 correções pré-smoke bloqueantes**.
> **Pré-leitura:** brief a03 `docs/handoff/2026-06-27-saude-digital-l2-codex-a03-brief.md`
> + execution log `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md`.

---

## 1. Diagnóstico (o que a rodada 2 + pré-revisão Claude acharam)

Existem **2 cadeias paralelas de error handling** no Agregador
`4sdG2UKMCBuFq8xn` — uma com os fixes a03, outra duplicada com código a02:

```
CADEIA 1 (canônica, jsCode a03 ✅):
  HTTP GBP, GA4 Org, GA4 Pago, Clarity, GAQL Conj/Anún, [T28] BQ Read
    --[error out, idx 1]--> [Err] Roteador Payload --> [Err] Call Handler

CADEIA 2 (DUPLICATA, jsCode a02 ❌):
  Adaptador Input T28, Normalizador T28,
  [T28] BQ Insert t28_campaign/adset/ga4_landing/gbp_daily/clarity_daily/meta_campaign
    --[error out, idx 1]--> [Err] Roteador Payload1 --> [Err] Call Handler1
```

A cadeia 2 (8 nodes críticos) ficou com o Roteador a02 — sem `$prevNode`,
sem `JSON.stringify(j)`, sem `sourceFromError`. Foi ela que falhou no smoke
triste (erro do Adaptador → "Invalid input for error_details").

**Bug adicional nos DOIS Call Handlers** (`[Err] Call Handler` e `[Err] Call Handler1`):
o input mapping tem
```
error_details: "={{ $json.error_details.error }}"
```
Como o Roteador a03 agora emite `error_details` como **string** (`JSON.stringify(j)`),
`$json.error_details.error` acessa `.error` de uma string → `undefined`. Além
disso o schema do campo `error_details` está `type: object` (a02-era). Isso
**anula o Fix B** mesmo na cadeia 1.

---

## 2. Escopo a04 (cirúrgico)

| # | Ação | Workflow |
|---|---|---|
| **M1** | Rewire: os 8 nodes da cadeia 2 passam a apontar error output → `[Err] Roteador Payload` (canônico) | `4sdG2UKMCBuFq8xn` |
| **M2** | Deletar `[Err] Roteador Payload1` e `[Err] Call Handler1` | `4sdG2UKMCBuFq8xn` |
| **M3** | Corrigir `[Err] Call Handler`: `error_details` mapping → `={{ $json.error_details }}` (sem `.error`) + schema `error_details` type `object`→`string` | `4sdG2UKMCBuFq8xn` |
| **M4** | `publish_workflow` do sub-WF (draft `31307f4d`, trigger já com `error_details` type `string`) | `rTS5pE34eElfuMPl` |

NÃO mexer em mais nada. Sem mudança de jsCode (o Roteador canônico já tem a03).

---

## 3. M1 — Rewire dos 8 nodes (via `update_workflow`)

Os 8 nodes abaixo hoje têm `main[1]` (error output) → `[Err] Roteador Payload1`.
Reconectar para `[Err] Roteador Payload`. Como o M2 deleta o `Roteador Payload1`
(o que já remove as conexões inbound dele), basta **adicionar** as 8 novas
conexões — o `removeNode` limpa as antigas.

Para cada um dos 8 nodes, `addConnection`:
- `source: "<node>"`, `sourceIndex: 1`, `target: "[Err] Roteador Payload"`, `targetIndex: 0`, `connectionType: "main"`

Lista dos 8:
1. `Adaptador Input T28`
2. `Normalizador T28`
3. `[T28] BQ Insert t28_campaign`
4. `[T28] BQ Insert t28_adset`
5. `[T28] BQ Insert t28_ga4_landing`
6. `[T28] BQ Insert t28_gbp_daily`
7. `[T28] BQ Insert t28_clarity_daily`
8. `[T28] BQ Insert t28_meta_campaign`

Resultado: o `[Err] Roteador Payload` passa a receber 15 error outputs
(7 da cadeia 1 + 8 rewired). Fan-in num único input 0 — OK (erros são
mutuamente exclusivos por execução; Antigravity rodada 1 item 2 confirmou).

## 4. M2 — Deletar duplicados

- `removeNode: "[Err] Roteador Payload1"` (auto-remove suas conexões inbound/outbound)
- `removeNode: "[Err] Call Handler1"`

## 5. M3 — Corrigir `[Err] Call Handler`

`updateNodeParameters` no `[Err] Call Handler`, ajustando o `workflowInputs`:

**(a)** `value.error_details`:
```
"={{ $json.error_details }}"
```
(era `"={{ $json.error_details.error }}"` — remover o `.error`)

**(b)** no array `schema`, o item com `id: "error_details"` muda
`"type": "object"` → `"type": "string"`.

Os demais 9 campos do mapping/schema permanecem inalterados.

> Atenção: `schema` é array — `setNodeParameter` por JSON pointer não
> suporta índice de array. Usar `updateNodeParameters` com o objeto
> `workflowInputs` completo corrigido (ler o atual via `get_workflow_details`,
> alterar os 2 pontos, escrever de volta).

## 6. M4 — Publicar o sub-WF

`publish_workflow` no `rTS5pE34eElfuMPl` (publica o draft `31307f4d`, que já
tem o trigger com `error_details` type `string` + Set Contexto com `detailsStr`).
Sem isso, o Execute Workflow continua chamando a versão ativa a02-era
(`81f56a35`, `error_details` type `object`) e o Fix B falha.

---

## 7. Validação (Codex, pré-smoke)

- `get_workflow_details` no `4sdG2UKMCBuFq8xn`:
  - Apenas **1** `[Err] Roteador Payload` e **1** `[Err] Call Handler` (sem `...1`).
  - `[Err] Roteador Payload` recebe 15 conexões de error output (listar e conferir os 15 nodes).
  - `[Err] Call Handler` mapping `error_details = ={{ $json.error_details }}` + schema type `string`.
  - nodeCount = anterior − 2.
- `get_workflow_details` no `rTS5pE34eElfuMPl`:
  - `activeVersionId` == versão com `error_details` type `string` (não mais `81f56a35`).
- `validate_workflow` no agregador: sem erros estruturais novos (warnings pré-existentes OK).

## 8. Atualizar execution log + commit

Em `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md`, seção
"## a04 - deduplicacao cadeia de erro":
- Novo draft versionId do `4sdG2UKMCBuFq8xn`.
- Novo `activeVersionId` do `rTS5pE34eElfuMPl` (pós-publish).
- Confirmar: 1 Roteador + 1 Call Handler; 15 error outputs; mapping/schema corrigidos.

Commit + push:
```
fix(saude-digital-l2): a04 - deduplica cadeia de erro + corrige Call Handler mapping

Antigravity rodada 2 achou 2 cadeias paralelas: a canonica (Roteador
Payload + Call Handler, jsCode a03) e uma DUPLICATA (Roteador Payload1 +
Call Handler1, jsCode a02) wired a 8 nodes criticos (Adaptador,
Normalizador, 6 BQ Inserts). a04: rewire dos 8 para o Roteador canonico,
deleta os duplicados, corrige Call Handler (error_details: $json.error_details
sem .error + schema type string), publica sub-WF (trigger error_details
string). Resolve "Invalid input for error_details" e ativa o Fix B de fato.
```

---

## 9. Critérios de aceite

- [ ] Só 1 `[Err] Roteador Payload` e 1 `[Err] Call Handler` no agregador.
- [ ] Os 8 nodes da cadeia 2 agora → `[Err] Roteador Payload`.
- [ ] `[Err] Roteador Payload` recebe os 15 error outputs.
- [ ] `[Err] Call Handler` mapping `error_details = ={{ $json.error_details }}` (sem `.error`).
- [ ] `[Err] Call Handler` schema `error_details` type = `string`.
- [ ] Sub-WF `rTS5pE34eElfuMPl` publicado (active = versão error_details string).
- [ ] `validate_workflow` sem erros novos.
- [ ] Execution log + commit + push.

---

## 10. Smoke a04 (Olavo, após Codex)

1. **Smoke triste** — provocar erro estrutural reversível. Recomendado:
   trocar Project ID do `[T28] BQ Read raw_campaign_data` para `project-fake-000`,
   Execute Workflow (draft), depois reverter. (Ou forçar 429 do GBP.)
2. **Validar `phi_prod.t28_errors`** (última hora):
   ```sql
   SELECT occurred_at, node_name, source, severity,
          SUBSTR(error_message,1,120) msg, client_id, error_id
   FROM `phi_prod.t28_errors`
   WHERE occurred_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
   ORDER BY occurred_at DESC;
   ```
   Esperado: `node_name` ≠ 'unknown' (valida `$prevNode`), `source` correto,
   `error_details` preenchido.
3. **Validar execução** — `status: success` (sem "Invalid input for error_details").
   Telegram com Node correto.
4. **Smoke feliz** — 12/0/2/1/1/0, `t28_errors` sem row nova.

Se `node_name` ainda vier 'unknown' → `$prevNode` não resolve fan-in;
a05 implementa stamps por node (contingência já prevista).

Se tudo verde → publish do Agregador draft → L2 fecha → ESTADO/ADR atualizados.
