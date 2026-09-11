# Relatorio Antigravity Rodada 2 --- Saude Digital L2 (a03)

**Data:** 2026-06-27
**Commit a03 avaliado:** `c34e99c`
**Veredito Macro:** **APROVADO com correcoes pre-smoke**
**Proximo Passo:** Corrigir Call Handler + Roteador Payload1. Publicar sub-WF. Smoke a03.

---

## Resumo Executivo

O a03 entrega os 3 fixes corretamente no nivel de codigo. Fix B (string ponta-a-ponta) e solido e inequivoco. Fix C (retry) esta corretamente aplicado nos 6 HTTP estruturais. Fix A ($prevNode) e estruturalmente presente --- o smoke e o juiz.

Ha, porem, um defeito de implementacao descoberto nesta revisao: o `[Err] Call Handler` (e `Call Handler1`) ainda mapeia `error_details` com `type: object` no schema e usa a expressao `$json.error_details.error` (acessa propriedade `.error` de uma string JSON, retornando `undefined`). Isso anularia o Fix B na pratica. Precisa correcao antes do smoke.

---

## GOTCHA --- Confirmacao do Comportamento Execute Workflow

**Execute Workflow chama a versao ATIVA, nao o draft.**

Estado atual confirmado via API:
- Sub-WF `rTS5pE34eElfuMPl`: versionId draft = `31307f4d` (error_details=string), activeVersionId = `81f56a35` (a02-era, error_details=object)
- Agregador `4sdG2UKMCBuFq8xn`: versionId draft = `fe173cdd` (L2 completo a03), activeVersionId = `66997885` (L1.5, sem L2)

**Conclusao:** O publish do sub-WF e prerequisito obrigatorio do smoke a03. Sem isso, o smoke usa a versao a02 do trigger e o Fix B falha de novo.

Roteiro correto pre-smoke:
1. Corrigir Call Handler (ver abaixo)
2. Publicar sub-WF `rTS5pE34eElfuMPl` (draft `31307f4d` -> ativo)
3. Rodar Agregador em modo manual (executa o draft `fe173cdd`)

---

## Defeito Adicional Descoberto: Call Handler com .error e schema object

**Nao estava no brief. Descoberta desta revisao. BLOQUEANTE.**

O no `[Err] Call Handler` (e `[Err] Call Handler1`) tem:
- Expressao: `error_details: ={{ $json.error_details.error }}` --- acessa `.error` de uma string JSON, retorna `undefined`
- Schema: `error_details` com `type: object` (a02-era, nao atualizado)

Impacto: o sub-WF recebe `error_details = undefined/null` em vez da string JSON. Fix B anulado na pratica.

Correcao necessaria (ambos Call Handlers):
- Alterar expressao para: `error_details: ={{ $json.error_details }}`
- Alterar schema `error_details` de `type: object` para `type: string`

---

## Avaliacao dos 6 Itens

### Item 1 --- $prevNode resolve node_name? (Fix A --- experimental)

**Status: OBSERVACAO --- smoke e o juiz; contingencia a04 especificada**

Codigo implementado:
```javascript
let prevNodeName = null;
try { prevNodeName = $prevNode?.name || null; } catch (e) { prevNodeName = null; }
const nodeName = j?.error?.node?.name || j?.node?.name || j?.nodeName || j?.node_name || prevNodeName || 'unknown';
```

Raciocinio sobre fan-in de error outputs:
- `$prevNode` em `runOnceForAllItems` e resolvido 1x por execucao do no.
- Com fan-in de error outputs: em runtime apenas 1 error output dispara por vez. Cada falha gera 1 item e 1 execucao isolada do Roteador. Logo `$prevNode` deve refletir o no que disparou.
- Risco: se multiplos itens chegarem de fontes diferentes na mesma execucao, `$prevNode` pode nao ser determinıstico. Cenario improvavel em error output.
- Se `$prevNode` retornar null, fallback e `'unknown'` --- nao e pior que antes.

Recomendacao: aceitar o smoke como arbitro. Se `node_name` ainda vier `'unknown'`, briefar a04 com stamps individuais por no.

---

### Item 2 --- Fix B resolve "Invalid input for error_details" para erro de Code node?

**Status: PASS* (condicionado a correcao do Call Handler)**

Pipeline string ponta-a-ponta verificado:
1. Roteador Payload: `error_details: JSON.stringify(j)` -> string JSON [OK]
2. Trigger sub-WF draft `31307f4d`: campo `error_details` type `string` [OK]
3. Set Contexto: `detailsStr = typeof input.error_details === 'string' ? input.error_details : JSON.stringify(...)` sem double-stringify [OK]
4. Set Contexto: `try { detailsObj = JSON.parse(detailsStr); } catch(e) { detailsObj = null; }` com protecao try/catch [OK]

JSON.stringify(j) aguenta NodeApiError?
- Para erro de API node (GBP 429): o item de error output e um POJO serializable. JSON.stringify funciona.
- Para erro de Code node (readOrThrow): idem. JSON.stringify funciona.

*Ressalva critica: expressao `.error` e schema `object` no Call Handler anulam este fix. Corrigir antes do smoke.

---

### Item 3 --- sourceFromError cobre os casos reais sem colisao?

**Status: PASS com observacao**

Analise de colisao (blob = JSON inteiro do item):

| Cenario | Risco | Conclusao |
|---|---|---|
| GBP 429: businessprofileperformance na description do erro | Presente no JSON do NodeApiError | Match correto [OK] |
| analytics em URL de landing page do cliente | `analyticsdata`/`analyticsreporting` sao especificos; `analytics` generico e risco real | Risco baixo mas real |
| clarity em dados do cliente | Endpoint e clarity.microsoft.com --- improvavel em dados do cliente | Baixo risco |

Mitigacao existente: `sourceFromName` tem prioridade. Para nos com nome conhecido (quando `$prevNode` funciona), `sourceFromError` nao e invocado.

Observacao (L2.5+): usar `j.error?.description` em vez do blob inteiro reduziria risco de colisao por dados do cliente.

---

### Item 4 --- Fix C (retry) interage bem com onError?

**Status: PASS**

Verificado via API nos 6 HTTP estruturais:
- HTTP Request GA4 Organico: retryOnFail=True, maxTries=3, waitBetweenTries=2000, onError=continueErrorOutput [OK]
- HTTP Request GA4 Pago (LPs): idem [OK]
- HTTP Request GBP: idem [OK]
- HTTP Request Clarity: idem [OK]
- Google Ads Conjuntos (GAQL): idem [OK]
- Google Ads Anuncios (GAQL): idem [OK]

Semantica n8n: retryOnFail tenta 3x ANTES de cair no error output. Correto.
Timing: 3x2s = 6s por no em falha. 6 nos = 36s maximo. Aceitavel (execucao semanal/mensal).
429 persistente: apos 3 retries -> error output -> Handler -> tarefa Notion. Correto.
Fetch Meta Ads e Extracting Search Terms sem retry: intencional (opcionais/analiticos --- nao eram os 6 especificados).

---

### Item 5 --- Regressao no caminho feliz

**Status: PASS**

- error_details como string: Roteador so executa com error output -> sem impacto no happy path.
- Retry nos 6 HTTP: ativa apenas em falha -> comportamento identico no happy path.
- Sem mudancas topologicas: nodeCount e connections inalterados (confirmado no log a03).

Conclusao: smoke feliz deve manter 12/0/2/1/1/0 sem regressao.

---

### Item 6 --- Itens da rodada 1 que permanecem validos

**Status: PASS com observacao no Roteador Payload1**

| Item rodada 1 | Status a03 |
|---|---|
| DDLs t28_errors inalterados | OK |
| safeGetNodeJson presente (fix A02) | OK --- presente no Roteador Payload a03 |
| bq antes de ga4 na ordem (fix A02) | OK --- presente em sourceFromName |
| Notion com tipo/classe_sla/estado | OK --- Set Contexto nao alterado nessas props |
| Sub-WF sanitizado (Telegram redacted) | OK --- Telegram node nao tocado |

Observacao: `[Err] Roteador Payload1` usa codigo a02 antigo.
O segundo roteador nao recebeu os fixes A e B do a03. Ainda usa `error_details: j` (object) e nao tem `$prevNode` nem `sourceFromError`. Erros que passem por esse caminho terao o bug B de volta. Necessita correcao.

---

## Criterios de Aprovacao Macro

| Criterio | Status |
|---|---|
| Fix B robusto para ambas origens (API + Code) | PASS* (com correcao Call Handler) |
| Fix C sem efeito colateral no happy path | PASS |
| sourceFromError sem colisao grave | PASS (risco baixo) |
| Gotcha do publish documentado no roteiro de smoke | CONFIRMADO |
| $prevNode: smoke e o juiz + a04 como contingencia | ACEITO |

---

## Itens de Acao Antes do Smoke a03

**Obrigatorios (bloqueiam o smoke):**

1. Corrigir `[Err] Call Handler` e `[Err] Call Handler1` (Agregador `4sdG2UKMCBuFq8xn`):
   - Expressao: `$json.error_details.error` -> `$json.error_details`
   - Schema: `error_details` de `type: object` -> `type: string`

2. Corrigir `[Err] Roteador Payload1` --- aplicar mesmo codigo do Roteador Payload (com `$prevNode`, `sourceFromError`, `JSON.stringify`).

3. Publicar sub-WF `rTS5pE34eElfuMPl` (promover draft `31307f4d` para ativo).

**Roteiro de smoke a03 (apos correcoes acima):**

1. Aplicar correcoes via MCP.
2. Publicar sub-WF.
3. Rodar Agregador manual (draft `fe173cdd`).
4. Provocar erro: trocar Project ID do `[T28] BQ Read raw_campaign_data` para `project-fake-000`.
5. Validar `t28_errors`: `node_name != 'unknown'`, `source` correto, `error_details` com conteudo.
6. Validar execucao: sem `"Invalid input for 'error_details'"`.
7. Reverter mutacao do BQ Read.
8. Smoke feliz: confirmar 12/0/2/1/1/0.
9. Se OK: publicar Agregador (draft -> ativo).
10. Se `node_name='unknown'`: reportar -> briefar a04 (stamps por no).

---

## Resumo Final

| Item | Veredito | Observacao |
|---|---|---|
| 1 --- $prevNode resolve node_name? | OBSERVACAO | Smoke e o juiz. a04 stamps como contingencia. |
| 2 --- Fix B resolve error_details Code node? | PASS* | *Corrigir Call Handler primeiro. |
| 3 --- sourceFromError sem colisao grave? | PASS | Risco baixo (URL cliente). |
| 4 --- Fix C retry sem efeito colateral? | PASS | Semantica correta. |
| 5 --- Regressao happy path? | PASS | Nenhuma. |
| 6 --- Rodada 1 nao regredida? | PASS* | *Roteador Payload1 com bug B --- corrigir. |
| GOTCHA publish | CONFIRMADO | Sub-WF DEVE ser publicado ANTES do smoke. |
| Defeito adicional Call Handler | BLOQUEANTE | Expressao .error + schema object --- corrigir. |

**Veredito Macro: APROVADO com correcoes pre-smoke.**

Se correcoes aplicadas e smoke OK: encerrar L2 (publicar ambos).
Se smoke mostrar node_name=unknown: briefar a04 (stamps por no).
