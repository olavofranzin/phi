# Brief Antigravity rodada 3 — Saúde Digital L2 (a05)

> **Tipo:** addendum focado no a05. NÃO re-revisar o que já passou nas
> rodadas 1 e 2.
> **Ordem desta etapa:** Codex implementa a05 → **Antigravity (este brief)**
> → pré-revisão Claude → smoke a05 (Olavo).
> **Pré-leitura:** brief a05 `docs/handoff/2026-06-27-saude-digital-l2-codex-a05-brief.md`
> (o que o a05 deveria fazer) + execution log `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md`
> (seção a05) + relatório rodada 2 `docs/handoff/2026-06-27-saude-digital-l2-antigravity-rodada2-report.md`.
> **Branch:** `claude/agentic-agency-planning-KwJEw`
> **Commit a05:** (preencher com o SHA que o Codex entregar)

---

## 1. Onde estamos — smoke a04 validou o núcleo do L2

O smoke a04 (execuções reais `11404` + `11426`) provou:
- **Fix A (`$prevNode`)**: `node_name` correto para todos os erros
  (`HTTP Request GBP`, `Google Ads Anúncios (GAQL)`, `Adaptador Input T28`).
  Fim do 'unknown'. `$prevNode` venceu — sem necessidade de stamps por node.
- **Fix B (`error_details` string)**: sem mais "Invalid input for error_details";
  erros de Code node tratados como JSON string; execução pôde concluir.

O smoke também expôs 3 itens de borda + 1 regressão (já corrigida pelo Olavo):

| Item | Status |
|---|---|
| Mojibake nos 3 refs acentuados do Adaptador (`extração`/`Anúncios`/`Orgânico`) | ✅ **Corrigido manualmente pelo Olavo** (fora do a05; Codex NÃO toca o Adaptador) |
| **B1** — Notion body > 2000 chars (exec `11426`: `content.length 3296`) | a05 |
| **R1** — Call Handler sem `onError` derruba a execução principal | a05 |
| **P1** — `errMessage='unknown'` para erro de Code node | a05 |

---

## 2. O que o a05 deveria ter feito

| Fix | Mudança | Onde |
|---|---|---|
| **B1** | `[ErrHdl] Set Contexto` cria `error_details_block = detailsStr.slice(0, 1800)`; o bloco de corpo da tarefa Notion passa a usar `$json.error_details_block` (em vez de `$json.error_details` cheio) | sub-WF `rTS5pE34eElfuMPl` |
| **R1** | `[Err] Call Handler` recebe `onError: continueRegularOutput` (Error Handler best-effort — falha dele não derruba a agregação) | Agregador `4sdG2UKMCBuFq8xn` |
| **P1** | `[Err] Roteador Payload`: `errMessage` trata `typeof json.error === 'string'` antes de tentar `json.error.message` | Agregador `4sdG2UKMCBuFq8xn` |
| **publish** | sub-WF `rTS5pE34eElfuMPl` publicado (Execute Workflow chama a versão ativa) | sub-WF |

**Inalterados (verificar que continuam intactos):** `observacoes` (trunca
1200) e BQ `error_details` (coluna JSON, valor cheio); Adaptador Input T28;
todo o resto da cadeia de erro a04 (1 Roteador + 1 Call Handler + 15 error
outputs).

---

## 3. Escopo desta rodada — 7 itens

### Item 1 — B1 resolve o estouro de 2000 chars de forma robusta?

- `error_details_block = detailsStr.slice(0, 1800)`: 1800 + cercas ```` ```json ````
  (~10 chars) < 2000. Folga suficiente? Considerar que `slice` corta no meio
  de um caractere multibyte/JSON — o bloco vira JSON inválido visualmente, mas
  é só corpo informativo (não parseado). Aceitável?
- O corte em 1800 perde informação de erros grandes. A informação COMPLETA
  está preservada no BQ `t28_errors.error_details` (coluna JSON, sem corte)?
  Confirmar que o BQ insert NÃO foi truncado (só o bloco Notion).
- Há outro campo Notion que possa estourar 2000? (titulo: já `.slice(0,60)`/`(0,80)`;
  observacoes: `.slice(0,1200)`.) Algum rich_text sem limite?

### Item 2 — R1 (`onError: continueRegularOutput`) tem efeito colateral?

- Com `continueRegularOutput`, falha do sub-WF Error Handler → Call Handler
  emite item vazio e segue. A execução principal deixa de ser marcada `error`
  por causa do handler. Correto?
- Risco: mascarar uma falha REAL do Error Handler (ex: BQ/Notion fora do ar)
  — o erro do handler ainda fica visível no log da execução? Ou some
  silenciosamente? (Antigravity rodada 2 item 7 sugeriu Error Workflow nativo
  como rede de segurança — é caso de recomendar para L2.5?)
- A agregação principal (Loop→Adaptador→Normalizador→BQ Inserts) é
  independente do ramo de erro — confirmar que `continueRegularOutput` no Call
  Handler não interfere no fluxo de dados principal.

### Item 3 — P1 não regrediu o `errMessage` para erros de API node

```javascript
const errMessage = (json) => {
  if (typeof json?.error === 'string') return json.error;
  return json?.error?.message || json?.message || json?.errorMessage || json?.description || 'unknown';
};
```
- Para erro de API node (GBP 429): `j.error` é objeto `{message, ...}` →
  `typeof === 'string'` é false → cai no `json.error.message`. Preserva o
  comportamento a04? ✅ esperado.
- Para erro de Code node (Adaptador): `j.error` é string → retorna a string.
  Resolve o 'unknown'? ✅ esperado.

### Item 4 — ⚠️ Mojibake NÃO reapareceu no Roteador

O a05 reescreve o jsCode inteiro do `[Err] Roteador Payload`, que contém o
ref acentuado `$('Code prepara datas para extração')`. **Verificar via
`get_workflow_details` que o jsCode do Roteador NÃO contém `Ã`** (zero
ocorrências de mojibake). Se reapareceu, REJEITAR — o Roteador quebraria
o `business_date` igual ao que aconteceu no Adaptador.

### Item 5 — Adaptador Input T28 intocado

Confirmar que o a05 NÃO alterou o `Adaptador Input T28` (o mojibake dele foi
corrigido manualmente pelo Olavo; o jsCode deve estar com acentos corretos
e não pode ter sido sobrescrito). Verificar via `get_workflow_details` que
o Adaptador não contém `Ã` e que seus 3 refs (`extração`/`Anúncios`/`Orgânico`)
estão corretos.

### Item 6 — sub-WF publicado + cadeia a04 preservada

- `rTS5pE34eElfuMPl` `activeVersionId` == novo draft (com `error_details_block`
  + trigger `error_details` type string). Sem isso, o Execute Workflow chama
  versão antiga.
- Cadeia de erro a04 intacta: **1** `[Err] Roteador Payload` + **1**
  `[Err] Call Handler` (sem duplicados `...1`), 15 error outputs → Roteador.

### Item 7 — Regressão no happy path

- Nenhum dos 3 fixes toca o fluxo principal de escrita t28_*.
- Com o mojibake do Adaptador corrigido + Call Handler best-effort, o smoke
  feliz deve voltar a 12/0/2/1/1/0. Confirmar (raciocínio) que nada no a05
  impede isso.

---

## 4. Critérios de aprovação macro

**APROVAR** se:
- B1 evita o estouro de 2000 sem perder a informação completa no BQ.
- R1 não mascara silenciosamente falha do handler (ou a observação vira
  recomendação L2.5).
- P1 não regride errMessage para API nodes.
- **Zero mojibake** no Roteador (item 4) e Adaptador intocado (item 5).
- sub-WF publicado + cadeia a04 preservada.

**REJEITAR** se:
- Mojibake reapareceu no Roteador.
- Adaptador foi sobrescrito/corrompido.
- B1 quebra o BQ insert (truncando onde não devia) ou ainda estoura 2000.
- R1 derruba o fluxo principal ou esconde falha crítica sem rastro.

Se REJEITAR → brief Codex `a06`. Se APROVAR → pré-revisão Claude (confirmação
estrutural) → smoke a05 (Olavo).

---

## 5. Artefatos

| Item | Referência |
|---|---|
| Commit a05 | (SHA do Codex) |
| Agregador draft a05 | `4sdG2UKMCBuFq8xn` (novo versionId no execution log) |
| Agregador active (prod) | `66997885-...` (L1.5, sem L2 — inalterado até smoke) |
| Sub-WF a05 | `rTS5pE34eElfuMPl` (novo activeVersionId pós-publish) |
| Smoke a04 | exec `11404` (Fix A/B green) + `11426` (B1 exposto) |
| Brief a05 | `docs/handoff/2026-06-27-saude-digital-l2-codex-a05-brief.md` |
| t28_errors (BQ) | `phi_prod.t28_errors` — rows do smoke a04 já gravadas |

---

## 6. Entrega esperada

Em `docs/handoff/2026-06-27-saude-digital-l2-antigravity-rodada3-report.md`:
- Veredito macro: APROVADO | REJEITADO
- 7 itens com PASS | FALHA | OBSERVAÇÃO
- Confirmação explícita: zero mojibake no Roteador + Adaptador intocado.
- Recomendação sobre R1 (Error Workflow nativo como rede L2.5?).
- Próximo passo: pré-revisão Claude + smoke a05 | brief `a06`.

Push para `claude/agentic-agency-planning-KwJEw`.

---

**Fim do brief.**
