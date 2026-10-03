# Brief Antigravity rodada 2 — Saúde Digital L2 (a03)

> **Tipo:** addendum focado no delta a02→a03. NÃO re-revisar o que passou
> na rodada 1.
> **Pré-leitura:** `docs/handoff/2026-06-27-saude-digital-l2-codex-a03-brief.md`
> (o que o a03 deveria fazer) + `docs/handoff/2026-06-23-saude-digital-l2-antigravity-rodada1-report.md`
> (rodada 1, REJEITADO → a02) + execution log `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md` (seção a03).
> **Branch:** `claude/agentic-agency-planning-KwJEw`
> **Commit a03:** `c34e99c`
>
> **Por que rodada 2:** o smoke triste real (exec `11372`/`11373`) provou
> o handler funcional E2E (BQ+Notion+Telegram dispararam), mas expôs 2
> defeitos + 1 observação. O a03 endereça os 3. Esta rodada valida o delta
> antes do smoke a03.

---

## 1. O que o a03 mudou (delta a02→a03)

| Fix | Mudança | Onde |
|---|---|---|
| **A** | `node_name` agora usa `$prevNode?.name` como 5ª opção; `source` deriva de `sourceFromName(nodeName) \|\| sourceFromError(j)` (parse da description do erro) | `[Err] Roteador Payload` (Agregador `4sdG2UKMCBuFq8xn`) |
| **B** | `error_details` trafega como **string JSON** ponta-a-ponta: Roteador `JSON.stringify(j)` + trigger do sub-WF `error_details` type `object`→`string` + Set Contexto `detailsStr` sem double-stringify | Roteador (Agregador) + `[ErrHdl] Execute Workflow Trigger` + `[ErrHdl] Set Contexto` (sub-WF `rTS5pE34eElfuMPl`) |
| **C** | `retryOnFail: true, maxTries: 3, waitBetweenTries: 2000` nos 6 HTTP estruturais (GA4 Org/Pago, GBP, Clarity, GAQL Conjuntos/Anúncios); `onError: continueErrorOutput` preservado | Agregador |

**Pré-revisão Claude (estrutural) já confirmou via `get_workflow_details`:**
- Roteador draft: `$prevNode?.name` presente (linha 30/34), `sourceFromName \|\| sourceFromError` (35), `error_details: JSON.stringify(j)` (43). ✅
- Sub-WF draft trigger: `error_details` type = `string`. ✅
- Sub-WF draft Set Contexto: `detailsStr` com guarda `typeof === 'string'`, sem double-stringify. ✅
- 6 HTTP: `retry=true maxTries=3 wait=2000 onError=continueErrorOutput`. ✅

---

## 2. ⚠️ GOTCHA CRÍTICO descoberto na pré-revisão — verificar primeiro

**As mudanças do a03 estão em DRAFT, não publicadas.**

| Workflow | Draft (a03) | Active (em produção) |
|---|---|---|
| Sub-WF `rTS5pE34eElfuMPl` | `31307f4d-843d-4f96-ab75-f9d552bc2e40` (error_details=**string**) | `81f56a35-022a-43a6-9026-f2bd5cc04728` (error_details=**object**, a02-era) |
| Agregador `4sdG2uKMCBuFq8xn` | `fe173cdd-b7bc-4d11-aee2-5221eb780519` (L2 completo a03) | `66997885-de29-4761-8e46-c034475ad321` (L1.5, **sem** Error Handler) |

**Implicação que muda o smoke:** o node `[Err] Call Handler` (executeWorkflow)
invoca a **versão ATIVA** do sub-WF, não o draft. A versão ativa ainda tem
`error_details` type `object`. Logo, **se o smoke a03 rodar sem publicar o
sub-WF antes, o Fix B falha de novo** (a string JSON será rejeitada pelo
trigger object antigo — ou pior, o object antigo aceita mas o Set Contexto
ativo faz double-stringify).

**Pergunta para Antigravity validar/confirmar:**
- O Execute Workflow node em n8n chama a active version do sub-WF, ou o draft quando a execução-pai é manual/draft? (consultar comportamento n8n / `get_node_types executeWorkflow`).
- Se chama active: o roteiro de smoke a03 DEVE incluir `publish_workflow` do sub-WF (`31307f4d`) ANTES do smoke. Confirmar e deixar explícito.
- O Agregador permanece draft (manual exec roda draft) até smoke verde; só então publica.

---

## 3. Escopo desta rodada — 6 itens

### Item 1 — `$prevNode` resolve `node_name`? (o cerne do Fix A)

Esta é a aposta central e **experimental** do a03. No smoke triste, o
n8n NÃO entregou o nome do node em `$json` (só em `source[].previousNode`
metadata). O a03 aposta que `$prevNode?.name` num Code node recupera isso.

Validar (raciocínio + evidência de docs n8n):
- `$prevNode.name` num Code node com fan-in de **15 error outputs** num único input — reflete o node que REALMENTE disparou, ou o primeiro conectado?
- Em `runOnceForAllItems`, `$prevNode` é resolvido 1× por execução do node. Se 2 error paths disparam na mesma execução-pai (ex: GBP rate-limit + Adaptador readOrThrow), são 2 runs separados do Roteador (cada um com seu `$prevNode`)?
- Risco: `$prevNode` retornar sempre o mesmo node (primeiro da lista de conexões) independente de qual falhou → `node_name` continua errado, só que agora com um nome plausível-porém-incorreto (pior que 'unknown' porque engana).
- Se Antigravity tiver baixa confiança no `$prevNode`, recomendar que o smoke a03 seja o juiz E que a04 (stamps por node) já fique especificado como contingência.

### Item 2 — Fix B resolve o "Invalid input for 'error_details'" para erro de Code node?

O bug B nasceu de erro de **Code node** (Adaptador readOrThrow), onde
`error_details: j` (object) era rejeitado. Agora é `JSON.stringify(j)` (string)
+ trigger type string.

Validar:
- Para erro de **API node** (GBP 429): `j` tem `{...campos, error: NodeApiError}`. `JSON.stringify(j)` serializa OK? NodeApiError tem propriedades não-serializáveis (circular, getters)?
- Para erro de **Code node** (Adaptador throw): qual a forma de `j`? `JSON.stringify` aguenta?
- O Set Contexto faz `JSON.parse(detailsStr)` para extrair `message`. Se `detailsStr` não for JSON válido (ex: string truncada), o `try/catch` protege? (Codex adicionou `detailsObj` com try/catch — confirmar.)
- BQ Insert: coluna `error_details` é JSON. Receber uma string JSON válida → BQ parseia. Confirmado no smoke 11373 (funcionou com string). Mantém?

### Item 3 — `sourceFromError` (parse da description) cobre os casos reais?

```js
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
```

Validar:
- `blob` inclui o `error.description` do smoke real (`businessprofileperformance.googleapis.com`)? → match 'gbp'. ✅ provável.
- Colisão: o `blob` é o JSON inteiro do item (que inclui campos como `Landing Page`, URLs do cliente). Algum cliente com domínio contendo 'analytics'/'clarity'/'notion' na Landing Page causaria falso-positivo de source?
- Ordem: `analytics` é genérico — uma URL `analytics.example.com` na landing page daria match 'ga4' indevido. Risco real?

### Item 4 — Fix C (retry) interage bem com onError?

Validar:
- Ordem n8n: retryOnFail tenta 3× ANTES de cair no error output? Confirmado pela semântica n8n?
- 3 tentativas × 2s = até 6s extra por node em falha. 6 nodes estruturais → pior caso ~36s a mais. Aceitável vs timeout do workflow?
- 429 persistente (não transitório): após 3 retries falha → error output → Error Handler cria tarefa. OK?
- Algum risco do retry mascarar erro real que deveria alertar rápido?

### Item 5 — Regressão no caminho feliz

Validar (raciocínio):
- error_details como string não quebra nada no caminho normal (não há erro → Roteador não roda → irrelevante).
- retry nos HTTP não muda o happy path (só ativa em falha).
- Conclusão esperada: smoke feliz deve manter 12/0/2/1/1/0. Confirmar que nada no a03 toca o fluxo principal de escrita t28_*.

### Item 6 — Itens da rodada 1 que permanecem válidos

Confirmar que o a03 NÃO regrediu nada que passou na rodada 1 (itens 1, 4, 6, 7, 8). Especialmente:
- DDLs t28_errors inalterados.
- Notion Demandas com properties válidas (Olavo confirmou `tipo`/`classe_sla`/`estado` existem).
- Sub-WF sanitizado.

---

## 4. Critérios de aprovação macro

**APROVAR** se:
- Fix B robusto para ambas origens de erro (API + Code node).
- Fix C sem efeito colateral no happy path.
- `sourceFromError` sem colisão grave.
- Gotcha do publish documentado no roteiro de smoke.
- `$prevNode` (item 1): mesmo que incerto, aceitar que o **smoke a03 é o juiz** — desde que a04 (stamps) esteja especificado como contingência se vier 'unknown' de novo.

**REJEITAR** se:
- Fix B ainda deixa caminho de erro que rejeita error_details.
- `sourceFromError` tem colisão que corrompe analítico sistematicamente.
- retry quebra semântica do error output.
- Regressão no happy path.

Se REJEITAR → brief Codex `a04`. Se APROVAR → smoke a03 (com publish do sub-WF antes).

---

## 5. Artefatos

| Item | Referência |
|---|---|
| Commit a03 | `c34e99c` |
| Agregador draft a03 | `4sdG2UKMCBuFq8xn` versionId `fe173cdd-b7bc-4d11-aee2-5221eb780519` |
| Agregador active (prod) | `66997885-de29-4761-8e46-c034475ad321` (L1.5, sem L2) |
| Sub-WF draft a03 | `rTS5pE34eElfuMPl` versionId `31307f4d-843d-4f96-ab75-f9d552bc2e40` |
| Sub-WF active | `81f56a35-022a-43a6-9026-f2bd5cc04728` (a02-era, error_details=object) |
| Smoke triste anterior | exec `11372` (Agregador) + `11373` (sub-WF, success E2E) |
| Execution log | `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md` (seção a03) |

---

## 6. Entrega esperada

Em `docs/handoff/2026-06-27-saude-digital-l2-antigravity-rodada2-report.md`:
- Veredito macro: APROVADO | REJEITADO
- 6 itens com PASS | FALHA | OBSERVAÇÃO
- Confirmação explícita do gotcha publish (sub-WF precisa publish antes do smoke?).
- Recomendação sobre `$prevNode`: confiar no smoke OU já exigir a04 stamps.
- Próximo passo: smoke a03 (roteiro) | brief `a04`.

Push para `claude/agentic-agency-planning-KwJEw`.

---

**Fim do brief.** Aguardo report Antigravity rodada 2.
