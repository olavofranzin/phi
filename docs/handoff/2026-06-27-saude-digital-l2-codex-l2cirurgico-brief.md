# Brief Codex — Saúde Digital L2 cirúrgico: Adaptador resiliente (crash fix + granularidade de falha)

> **STATUS:** A executar. Branch `claude/agentic-agency-planning-KwJEw`.
> **Origem:** execução real `11655` (manual) — Adaptador emitiu pelo **error
> output** (`"Cannot read properties of undefined (reading 'json') [line 81]"`),
> `main[0]` vazio → **nenhum `t28_*` escrito**, mas o n8n marcou a run `success`
> (degradada disfarçada de verde). Análise estratégica:
> `docs/handoff/2026-06-27-saude-digital-l2-plano-correcao.md` (Anexo Claude).
> **Pré-leitura:** o plano de correção + `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md`.

---

## 0. ⚠️ GUARDA DE MOJIBAKE — ler antes de tudo

O `Adaptador Input T28` contém **muitas strings acentuadas** (refs de node E
nomes de property do Notion). Toda corrupção anterior (`Ã`) nasceu de reescrever
esse jsCode via `update_workflow`. **Edite cirurgicamente** (só as linhas
listadas), **preserve verbatim** todos estes tokens acentuados:

- Refs de node: `HTTP Request GA4 Orgânico`, `Google Ads Anúncios (GAQL)`
- Property names: `Modelo de Negócio`, `Métrica-Mãe`, `Margem de Contribuição`,
  `Data de Início`, `Início`, `Conversões` (se houver)
- (O node de datas já é ASCII: `Code prepara datas para extracao` — manter ASCII.)

**Após aplicar:** `get_workflow_details` + grep `Ã` no jsCode do Adaptador.
Se aparecer **qualquer** `Ã`, **PARE** e devolva para o Olavo corrigir na UI
(não tente re-corrigir via MCP). Critério de aceite inclui "zero `Ã`".

---

## 1. Diagnóstico (causa-raiz de 11655)

O Adaptador roda **`runOnceForAllItems` + `executeOnce: true`** (1 execução
sobre todos os itens), alimentado pelo `[T28] BQ Read raw_campaign_data` que
dispara no **Loop output[0]** ("done"). Nesse modo **não existe "item atual"**,
então:

1. **Crash:** as leituras `$('...').item.json` (linhas 94-97) e `$('...').first().json`
   (linhas 143-148) dependem de paired-item / primeiro-item e resolvem
   `undefined` → `undefined.json` → o `readOrThrow` derruba o Adaptador inteiro.
2. **Granularidade all-or-nothing:** GBP, Clarity e GA4 Org/Pago estão como
   `readOrThrow` (fatal). Um **429 transitório do GBP** mata a agregação inteira
   da campanha — nenhum `t28_*` é escrito, mesmo com BQ/GA4/GAQL OK.

## 2. Escopo (cirúrgico) — e o que está FORA

| # | Mudança | Node |
|---|---|---|
| **M1** | Trocar `.item.json` / `.first().json` / `.all().map(i=>i.json)` por acessores determinísticos sobre `.all()` (helpers novos) | `Adaptador Input T28` |
| **M2** | Reclassificar **GBP, Clarity, GA4 Orgânico, GA4 Pago** de `readOrThrow` → fonte opcional (degrada só o seu `t28_*`, não aborta) | `Adaptador Input T28` |
| **M3** | Emitir `source_status` por fonte no output; threadar para a coluna `source_status` (JSON) e **não gravar linha** de `t28_*` cuja fonte ficou ausente | `Adaptador Input T28` + `Normalizador T28` |

**FORA DE ESCOPO (lotes próprios — não tocar aqui):**
- Atribuição multi-campanha do `ctx` (campaign_name de 1 campanha para N) — Task 3.
- MERGE/idempotência BQ — Task 5 (lote L1.6).
- `volume_suficiente` vs SOP — Task 6.
- Rotação de credenciais (`google_developer_token` em claro no `Set dados`) — segurança.
- Limpeza de canvas (cadeia morta Merge1→Calculate KPIs) — L2.5.

---

## 3. M1 + M2 + M3 — mudanças no `Adaptador Input T28`

> Ler o jsCode atual via `get_workflow_details`. Aplicar **só** as edições
> abaixo, preservando todo o resto verbatim (incluindo acentos).

### 3.1 Adicionar helpers (logo após a função `safeOptional`, ~linha 92)

Inserir este bloco **ASCII-puro** (sem acento):

```javascript
const nodeFirst = (nodeName) => {
  const items = $(nodeName).all();
  return (items && items.length && items[0] && items[0].json) ? items[0].json : null;
};
const nodeAll = (nodeName) => {
  const items = $(nodeName).all();
  return (items && items.length) ? items.filter((it) => it && it.json).map((it) => it.json) : [];
};
const sourceStatus = {};
const optionalSource = (key, label, fn) => {
  try {
    const v = fn();
    if (v === null || v === undefined) { sourceStatus[key] = 'missing'; return null; }
    sourceStatus[key] = 'ok';
    return v;
  } catch (e) {
    sourceStatus[key] = 'error';
    console.log(`[T28-ADAPTADOR] fonte opcional ${label} indisponivel: ${e.message}`);
    return null;
  }
};
```

### 3.2 Core estrutural (linhas 94-97, 120) — só troca de acessor, segue `readOrThrow`

DE → PARA (manter `readOrThrow`, manter os labels/acentos; só muda o corpo do `fn`):

```javascript
// 94
const ids = readOrThrow('Set dados', () => nodeFirst('Set dados'));
// 95
const campProps = readOrThrow('Get database campanhas', () => nodeFirst('Get database campanhas')?.properties);
// 96
const cliProps = readOrThrow('Get database clientes', () => nodeFirst('Get database clientes')?.properties);
// 97  (ref ja e ASCII)
const windows = readOrThrow('Code prepara datas para extracao', () => nodeFirst('Code prepara datas para extracao'));
// 120
const bqCampaigns = readOrThrow('[T28] BQ Read raw_campaign_data', () => nodeAll('[T28] BQ Read raw_campaign_data')) || [];
```

**Mantém `readOrThrow` (fatal) apenas nestas 5 fontes core.** Sem elas não existe
`t28_campaign`.

### 3.3 Fontes opcionais já-existentes (linhas 98-99, 127, 131, 133, 148) — trocar acessor

`Get database conjuntos/anuncios` (98-99) usam `.all()` — manter, mas via helper
`nodeAll` por consistência (sem status, são contexto Notion):

```javascript
const conjuntosItems = $('Get database conjuntos').all();   // pode manter como esta (all() ja e seguro)
const anunciosItems = $('Get database anuncios').all();
```
(Se preferir, deixe as 98-99 exatamente como estão — `.all()` não causa o crash.)

GAQL/Meta/SearchTerms (127, 131, 133, 148): trocar `.first().json` por
`nodeFirst(...)` e registrar status. Ex.:

```javascript
// 127
const gAdsetRows = (optionalSource('gaql_adsets', 'Google Ads Conjuntos (GAQL)', () => nodeFirst('Google Ads Conjuntos (GAQL)'))?.results || []).map((r) => ({ json: r }));
// 131
const gAdRows = (optionalSource('gaql_ads', 'Google Ads Anúncios (GAQL)', () => nodeFirst('Google Ads Anúncios (GAQL)'))?.results || []).map((r) => ({ json: r }));
// 133
const metaRows = (optionalSource('meta', 'Fetch Meta Ads', () => nodeFirst('Fetch Meta Ads'))?.data || []).map((r) => ({ json: r }));
// 148
const searchTermsFeatures = optionalSource('search_terms', '[T28] Search Terms Features', () => nodeFirst('[T28] Search Terms Features')) || {};
```

### 3.4 M2 — GBP / Clarity / GA4 deixam de ser fatais (linhas 143-147)

DE (readOrThrow, fatal) → PARA (optionalSource, degradável):

```javascript
const ga4 = {
  organic: ga4Norm(optionalSource('ga4_organic', 'HTTP Request GA4 Orgânico', () => nodeFirst('HTTP Request GA4 Orgânico')), 'organico', landingPage),
  paid: ga4Norm(optionalSource('ga4_paid', 'HTTP Request GA4 Pago (LPs)', () => nodeFirst('HTTP Request GA4 Pago (LPs)')), 'pago', landingPage),
};
const gbp = optionalSource('gbp', 'HTTP Request GBP', () => nodeFirst('HTTP Request GBP')) || {};
const clarity = optionalSource('clarity', 'HTTP Request Clarity', () => nodeFirst('HTTP Request Clarity')) || {};
```

`ga4Norm` já trata `resp` null (guard `(resp && resp.metricHeaders)`), retornando
zeros — OK. `gbp`/`clarity` viram `{}` quando ausentes — o Normalizador decide
não gerar a linha (ver §4).

### 3.5 M3 — emitir `source_status` (linha 150, output)

Acrescentar `source_status` ao objeto retornado (não remover nenhum campo
existente):

```javascript
return [{ json: { ctx, windows: { /* ...inalterado... */ }, google: { /* ... */ }, meta: { /* ... */ }, ga4, gbp, clarity, search_terms_features: searchTermsFeatures, source_status: sourceStatus } }];
```

---

## 4. M3 — `Normalizador T28` (ler o código atual e ajustar)

Objetivo: a falha de uma fonte degrada **só** a tabela daquela fonte, e isso
fica registrado.

1. **Threadar `source_status`** para a coluna `source_status` (JSON, `NOT NULL`
   no DDL) de **todas** as linhas `t28_*` (já deve existir um campo análogo —
   espelhar o `input.source_status` do Adaptador).
2. **Não gerar linha de fonte ausente:**
   - `source_status.gbp !== 'ok'` → **0 linhas** em `t28_gbp_daily` nessa run.
   - `source_status.clarity !== 'ok'` → 0 linhas em `t28_clarity_daily`.
   - `source_status.ga4_organic`/`ga4_paid` ausentes → 0 linhas em `t28_ga4_landing`.
   - `source_status.meta !== 'ok'` → 0 linhas em `t28_meta_campaign` (já é o caso hoje).
   - `t28_campaign` e `t28_adset` dependem de BQ/GAQL (core/quase-core) — seguem como hoje.
3. **`volume_suficiente`** continua sendo preenchido como hoje (NÃO mudar a regra
   aqui — é o lote da Task 6).

> Se o Normalizador já produz `source_status` por outra via, apenas garanta que o
> novo `input.source_status` do Adaptador seja a fonte de verdade e que o filtro
> de "fonte ausente → sem linha" exista. Documentar no execution log o que foi
> alterado.

---

## 5. Aplicação (MCP)

1. `get_workflow_details` no `4sdG2UKMCBuFq8xn` — ler jsCode atual do Adaptador e
   do Normalizador.
2. `update_workflow` no `4sdG2UKMCBuFq8xn`:
   - `setNodeParameter` path **`/jsCode`** no `Adaptador Input T28` (jsCode completo
     com as edições §3 — **JSON Pointer começa com `/`**).
   - `setNodeParameter` path `/jsCode` no `Normalizador T28` (edições §4).
3. **NÃO publicar** — Agregador segue **draft** até o smoke verde (o Olavo roda
   manual no draft).
4. `validate_node_config` nos 2 Code nodes alterados: PASS.

> Atenção: o sub-WF `rTS5pE34eElfuMPl` **não muda** neste lote.

## 6. Validação (Codex, pré-smoke)

- `get_workflow_details` no `4sdG2UKMCBuFq8xn`:
  - Adaptador: helpers `nodeFirst`/`nodeAll`/`optionalSource` presentes; **nenhum
    `.item.json`** e **nenhum `.first().json`** restante no jsCode; GBP/Clarity/GA4
    via `optionalSource` (não `readOrThrow`); output inclui `source_status`.
  - **grep anti-mojibake:** zero `Ã` no jsCode do Adaptador e do Normalizador.
  - Normalizador: filtro de fonte-ausente presente; `source_status` mapeado.
- `validate_node_config`: PASS nos 2 nodes.
- Registrar no execution log os novos versionId (draft).

## 7. Smoke L2 cirúrgico (Olavo, após Codex)

1. **Smoke feliz** (Execute Workflow manual no draft):
   - Adaptador `executionStatus: success` **sem error output** (`main[1]` vazio).
   - Counts: `t28_campaign`=12, `t28_adset`=0 (PMAX), `t28_ga4_landing`=2,
     `t28_gbp_daily`=1, `t28_clarity_daily`=1, `t28_meta_campaign`=0.
   - `source_status` gravado nas linhas (todas as fontes presentes = 'ok').
2. **Smoke de resiliência (o teste-chave):** forçar o GBP a falhar (ex.: Project/
   credencial inválida temporária, ou aproveitar um 429 real):
   - Adaptador **conclui** (não cai no error output).
   - `t28_campaign`=12 ainda escrito; **`t28_gbp_daily`=0** nessa run.
   - `source_status.gbp` = 'error'/'missing'.
   - Error Handler dispara como aviso (não derruba); run final `success` real
     (não-degradada para as demais fontes).
3. Se ambos verdes → **publish** do Agregador draft → **L2 fecha** (de verdade
   desta vez). Aí atualizo ESTADO/§3.8 + execution log.

## 8. Critérios de aceite

- [ ] Helpers `nodeFirst`/`nodeAll`/`optionalSource` adicionados.
- [ ] Zero `.item.json` e zero `.first().json` no Adaptador.
- [ ] Só as 5 fontes core seguem `readOrThrow`; GBP/Clarity/GA4 viram `optionalSource`.
- [ ] Output do Adaptador inclui `source_status`.
- [ ] Normalizador: fonte ausente → 0 linhas na tabela daquela fonte; `source_status` na coluna JSON.
- [ ] **Zero `Ã` (mojibake)** no Adaptador e no Normalizador.
- [ ] `validate_node_config` PASS; Agregador segue draft.
- [ ] Execution log + commit + push.

## 9. Commit

```
fix(saude-digital-l2): Adaptador resiliente - acessores .all() + granularidade de falha por fonte

M1: troca .item.json/.first().json por nodeFirst/nodeAll (runOnceForAllItems +
executeOnce nao tem item atual; paired-item resolvia undefined -> crash de 11655).
M2: GBP/Clarity/GA4 Org/Pago saem de readOrThrow para optionalSource - um 429 do
GBP degrada so t28_gbp_daily em vez de abortar a agregacao inteira. Apenas as 5
fontes core (Set dados, campanhas, clientes, datas, BQ Read raw) seguem fatais.
M3: Adaptador emite source_status por fonte; Normalizador grava na coluna JSON e
nao gera linha de fonte ausente. Fora de escopo (lotes proprios): multi-campanha,
MERGE/idempotencia, volume_suficiente, credenciais, canvas.
```
