# Desvio INDEFINIDO != zero + fim do vazamento entre anuncios - Execution Log

Data: 2026-08-08
Branch: claude/consolidacao-2026-08
Brief: docs/handoff/2026-08-08-desvio-indefinido-fix-brief.md
Fases anteriores: `2026-08-08-prefixo-expressao-n8n-*` (commit `1dd1459`) · `2026-08-08-tendencia-serie-diaria-fix-*` (commit `820b895`)

> **Resultado:** os 4 criterios de aceite passaram na pagina da barbearia. O anuncio que hoje
> de manha dizia **"Dentro da meta (CPA desvio 0%)"** com CPA 76% acima agora diz
> **"CPA 76.3% acima da meta em 7d"**, status **Crítico**, prioridade **Alta**, score **60**.
> Smoke rodado **antes** de publicar nos dois workflows. Ambos publicados.

---

## Estado inicial

| Workflow | id | versionId | activeVersionId | active |
|---|---|---|---|---|
| sw metricas anuncios | `vVAdXAJh6MW2Z5Hp` | `ba9f1aec-2f84-4398-8a04-f0346f1f918b` | `ba9f1aec-2f84-4398-8a04-f0346f1f918b` | true |
| sw metricas campanhas | `W571K320aqIHsdtH` | `4711ed2d-d719-441c-878f-23e0e39710f6` | `4711ed2d-d719-441c-878f-23e0e39710f6` | true |

**Rollback:** `restore_workflow_version`.
`sw metricas anuncios` -> `ba9f1aec` (fase 2) ou `f618a9d6` (pre-sessao).
`sw metricas campanhas` -> `4711ed2d`.

---

## Mudancas por no

### 1. `Code calculo desvio meta` (sw metricas anuncios) - desvio INDEFINIDO

**Antes:**
```js
const calcDesvio = (valor) => {
  if (meta === 0 || valor === 0) return 0;   // "nao sei" virava "dentro da meta"
  ...
};
```

**Depois:** devolve sempre `{valor, desvio, desvio_motivo}`, com `desvio = null` quando indefinido:
```js
const calcDesvio = (valor) => {
  if (!meta || meta === 0) return { valor, desvio: null, desvio_motivo: 'sem_meta' };
  if (valor === null)      return { valor, desvio: null, desvio_motivo: 'sem_valor' };
  const d = isMaiorMelhor ? ((meta - valor) / meta) * 100 : ((valor - meta) / meta) * 100;
  return { valor, desvio: parseFloat(d.toFixed(2)), desvio_motivo: 'ok' };
};
```
`calcTendencia` idem: devolve `null` em vez de `0` quando nao da para computar.

### 2. `Code calculo desvio meta` - valor por ITEM, `.first()` morto

**Antes:**
```js
if (v_d1 === 0 && v_3d === 0 && v_7d === 0) {
  const u = $("Code Unificar Períodos (D1, 3D, 7D)").first().json;   // sempre o 1o item do lote
  ...
}
```

**Depois:** resolucao so dentro do proprio item, em cascata:
```js
let v_7d = numOrNull(data.v_7d !== undefined ? data.v_7d : calcCtx.v_7d);
if (v_7d === null) v_7d = numOrNull(d7src[keys[0]]);   // metricas_calculadas.d7[cpa|roas|ctr|...]
if (v_7d === null) v_7d = numOrNull(data[keys[1]]);    // cpa_7d, roas_7d, ...
if (v_7d === null) v_7d = numOrNull(data.valor_real);

// D1/D3 so existem se o item os trouxer. Sem fallback cross-node: sem valor => INDEFINIDO.
const v_d1 = numOrNull(data.v_d1 !== undefined ? data.v_d1 : calcCtx.v_d1);
const v_3d = numOrNull(data.v_3d !== undefined ? data.v_3d : calcCtx.v_3d);
```
Mapa metrica-mae -> campo do item adicionado (`METRIC_KEYS`: CPA/CPL/CPC/CPM/ROAS/CTR/Taxa de Conversao).

> **Achado:** neste fluxo o item **nao carrega D1 nem D3** — o `Code Cálcula Métricas` so
> produz 7d e 30d. Entao `d1`/`d3` passam a sair honestamente como
> `{valor: null, desvio: null, desvio_motivo: 'sem_valor'}` em vez de `0`. Era exatamente
> isso que o `.first()` mascarava. Ver pendencia 3.

### 3. `Code classificar status` (sw metricas anuncios) - `null` tratado ANTES de comparar

Armadilha do brief confirmada: em JS `null <= 0` e `true`, e `Math.max(null, 0)` e `0`.
A guarda foi posta **antes** de qualquer comparacao/aritmetica:
```js
const rawD7 = analise && analise.d7 ? analise.d7.desvio : null;
const d7num = Number.isFinite(Number(rawD7)) && rawD7 !== null ? Number(rawD7) : null;
const desvioIndefinido = d7num === null;
...
if (!analise || !analise.d7 || nivel === 'nenhum' || roasSemReceita || desvioIndefinido) {
  // cai no ramo "sem base" que ja existia: final_status "Sem Dados", final_score null
}
```
`significancia` ganhou `desvio_indefinido` e `desvio_motivo`. As comparacoes de tendencia e
de pico D-1 passaram a exigir `!== null` antes de comparar.

### 4. `Code Tendência Real` (sw metricas anuncios) - rotulo honesto

```js
if (nDias >= 4) {
  ...
  metodo = 'sem_metrica_na_janela';        // ha serie, mas a metrica nao computa
  if (recente != null && anterior != null && anterior > 0) { ...; metodo = 'bigquery_3d_vs_3d'; }
}
// nDias < 4 continua 'sem_historico'
```

### 5. `sw metricas campanhas` - opcao B (fase 2 replicada)

- `Code Prep Tendência`: modo `runOnceForEachItem`; monta `_bq_sql_serie`; le o id de
  `$('Code Clean Campanhas').item.json`.
- `BigQuery Série Diária`: `sqlQuery` = `={{ $json._bq_sql_serie }}`.

> **Diferenca importante entre os dois workflows:** aqui `clean_id_google` **ja e** o id da
> CAMPANHA (`properties['id_google_camp']` no `Code Clean Campanhas`). No `sw metricas
> anuncios` o alias homonimo e o id do ANUNCIO — por isso la o campo certo e
> `clean_id_google_camp`. O codigo aceita os dois (`clean_id_google_camp || clean_id_google`)
> e esta comentado no no.

**Nao alterados** (fora do escopo do brief): `Execute SQL inserir daily entry`,
`BigQuery Persistir Sinais Criativo`, prefixo `=` de outras queries, `Code Diagnóstico
Criativo`, e o `Code calculo desvio meta` / `Code classificar status` **do sw metricas
campanhas** (ver pendencia 1).

---

## Validacao antes de aplicar

O novo `Code calculo desvio meta` + `Code classificar status` foram rodados em Node contra os
**itens reais** da execucao `26161`, com um `$()` que **lanca excecao se `.first()` for
chamado** (prova de que o cross-node morreu). Resultado do ensaio:

```
META(1a)      -> final_status=Sem Dados  score=null  (desvio indefinido)
BARBEARIA     -> d7={valor:6.17, desvio:76.29, ok}   final_status=Crítico  score=60
CORTE.CABELO  -> d7={valor:4.45, desvio:27.14, ok}   final_status=Crítico  score=30
META(2a)      -> d7={valor:null, desvio:null, sem_valor}  final_status=Sem Dados  score=null
```

Nenhuma chamada a `.first()`. Nenhum item com numero de outro item.

---

## Publicacao

| Workflow | activeVersionId antes | activeVersionId depois |
|---|---|---|
| sw metricas anuncios | `ba9f1aec-2f84-4398-8a04-f0346f1f918b` | **`b40de4dd-c639-4f33-9da2-fb3624784358`** |
| sw metricas campanhas | `4711ed2d-d719-441c-878f-23e0e39710f6` | **`bb59dde5-d7c5-4a67-91e7-12d88672d177`** |

Nos dois casos o smoke rodou **antes** do publish (execucao manual usa o rascunho), como o
brief preferia. Avisos do validador: so os falso-positivos ja conhecidos.

---

## Smoke

### `sw metricas anuncios` - execucao `26168` (manual, `success`)

| run | anuncio | d7 | final_status | final_score | tendencia_metodo |
|---|---|---|---|---|---|
| 0 | AD01-VID_9x16 (Meta) | `null` (sem_valor) | Sem Dados | `null` | sem_historico (n=0) |
| 1 | **AD01-PMAX_BARBEARIA** | **`{valor:6.17, desvio:76.29, ok}`** | **Crítico** | **60** | **sem_metrica_na_janela** (n=21, conv_3=0) |
| 2 | AD01-PMAX_CORTE.CABELO | `{valor:4.45, desvio:27.14, ok}` | Crítico | 30 | bigquery_3d_vs_3d (57.82) |
| 3 | AD01-VID_9x16 (2a passada) | `null` (sem_valor) | Sem Dados | `null` | sem_historico (n=0) |

Os tres rotulos de tendencia agora aparecem separados e corretos: `sem_historico`,
`sem_metrica_na_janela`, `bigquery_3d_vs_3d`.

### Criterio de aceite - `AD01-PMAX_BARBEARIA_10/01/26` (`29db65e5-c72b-8013-9418-edfaee111e8c`)

CPA 7d R$ 6,17 vs meta R$ 3,50:

| campo | esperado | **observado** | |
|---|---|---|---|
| `ad_diagnostico` | desvio ~76% (nao 0%) | **"CPA 76.3% acima da meta em 7d; tendência Sem dados [evidência parcial: 30d]."** | OK |
| `ad_status_operacional` | Crítico | **Crítico** | OK |
| `ad_prioridade_otimizacao` | Alta | **Alta** (Urgente rebaixado por evidencia parcial) | OK |
| `ad_score_operacional` | calculado, nao 100, nao vazio | **60** | OK |

**Nenhum anuncio com `analise_desvios` de outro anuncio.** Antes (exec 26161) a 2a passada do
anuncio Meta trazia `d1: 3.04, d3: 9.15, d7: 3.64` — os numeros do CORTE.CABELO. Agora traz
`{valor: null, desvio: null, desvio_motivo: 'sem_valor'}`. **Vazamento eliminado.**

Comparativo do mesmo anuncio, antes -> depois:

| campo | antes (exec 26161) | depois (exec 26168) |
|---|---|---|
| ad_diagnostico | "Dentro da meta (CPA desvio 0% em 7d)..." | "CPA 76.3% acima da meta em 7d..." |
| ad_status_operacional | Bom | Crítico |
| ad_prioridade_otimizacao | Baixa | Alta |
| ad_score_operacional | 100 | 60 |
| ad_tendencia | Estável | Sem dados |

> `ad_tendencia` saiu de "Estável" para "Sem dados" **de proposito**: "Estável" vinha do
> `tend_proxy = 0`, que era o mesmo erro de tratar ausencia como zero. Com `conv_3 = 0` a
> tendencia de CPA e genuinamente indefinida. "Sem dados" e a resposta honesta.

### `sw metricas campanhas` - execucao `26170` (manual, `success`)

| run | campanha | `bq_campaign_id` | `_serie_motivo` | n_dias | tendencia |
|---|---|---|---|---|---|
| 0 | Meta (CHA) | `META-120223097083780450` | ok | 0 | sem_historico |
| 1 | BARBEARIA | `GADS-21149189736` | ok | **21** | sem_historico (conv_3=0) |
| 2 | SALÃO.BELEZA | `GADS-21116045403` | ok | **21** | **bigquery_3d_vs_3d = 57.82** |

Pareamento por `.item` funcionou (`_serie_motivo: 'ok'` nos tres). Antes, `bq_campaign_id`
era `""` nos tres e `n_dias` era sempre 0.

---

## Mapa dos `.first()` restantes (NAO corrigidos, so mapeados)

Em `sw metricas anuncios`, apos esta fase. Todos em nos `runOnceForAllItems`.

| no | busca em | o que busca | tipo | risco |
|---|---|---|---|---|
| ~~`Code calculo desvio meta`~~ | ~~`Code Unificar Períodos`, `Code Cálcula Métricas`~~ | ~~v_d1/v_3d/v_7d~~ | **CORRIGIDO nesta fase** | — |
| `Code classificar status` | `HTTP Request Google Ontem (D7)` | `clicks` / `conversions` do anuncio | **dado por-item** | **bug em potencial** — so dispara quando `clicks7d===0 && conv7d===0`, e esta em try/catch; na passada duplicada do Meta pegaria o volume da campanha errada e poderia abrir o gate de evidencia indevidamente |
| `Code Recupera Metas p Comparação` | `Edit Fields` | `meta_valor` | **dado por-item** | **bug em potencial** — meta de um anuncio aplicada a outro |
| `Code Unificar Períodos (D1, 3D, 7D)` | `HTTP Request Google Ontem (D1)`, `(D3)`, `(D7)`, `HTTP Request Google (D30)`, `v23 Bloco 1 Core` | respostas da API Google | **dado por-item** (5 ocorrencias) | **bug em potencial** — mesma classe |

**7 ocorrencias em 3 nos.** Nenhuma e config global; todas sao dado por-item. Hoje elas
"acertam" porque cada no de origem produz 1 item por iteracao do loop e os indices de run
coincidem. **Quebram exatamente quando as contagens de run divergem** — que e o caso da
passada duplicada do anuncio Meta (4 runs de prep para 3 de clean). Foi assim que o
`Code calculo desvio meta` vazou.

`sw metricas campanhas` tem a mesma familia (`Code calculo desvio meta` la ainda tem
`calcDesvio` devolvendo `0` e `.first()`) — ver pendencia 1.

---

## Pendencias para o Olavo

### 1. `sw metricas campanhas` tem o MESMO bug de desvio (alta)

Confirmei: o `Code calculo desvio meta` de la ainda tem `if (meta === 0 || valor === 0)
return 0;` e ainda usa `.first()`. O brief desta fase mandou aplicar so a opcao B nesse
workflow, entao **nao toquei** na parte de desvio. As paginas de **Campanhas** no Notion
podem estar afirmando "dentro da meta" com desvio zero pelo mesmo motivo. Correcao e
identica a que fiz aqui — e uma copia direta.

### 2. Os 7 `.first()` restantes

Mapeados acima. O de `Code Recupera Metas p Comparação` (meta_valor) e o mais perigoso:
aplica a meta de um anuncio a outro. Sugiro tratar junto com o item 3.

### 3. D1 e D3 nao existem no fluxo de anuncios

`Code Cálcula Métricas` so produz janelas 7d e 30d, mas `Code calculo desvio meta` e
`Code classificar status` esperam D1/D3 (ha ate um ajuste `if (d1 > 30)`). Hoje isso sai
honestamente como INDEFINIDO, mas significa que **o ajuste por pico D-1 nunca dispara**.
Decidir: ou passar a calcular D1/D3 por anuncio, ou remover as regras que dependem deles.

### 4. Passada duplicada do anuncio Meta (registrado, nao perseguido)

`Code Prep Tendência` roda 4x para 3 anuncios; a pagina do Meta e escrita duas vezes, com
numeros diferentes em cada passada (`7d: 0 cliques / 0 conv` na 1a, `27 / 6` na 2a).
Pre-existente, provavelmente o `Merge Meta Ads`. E o gatilho que transforma os `.first()`
restantes em vazamento real.

### 5. Cosmetico: diagnostico do ramo "sem base"

Quando o desvio e indefinido, o `Code Diagnóstico Criativo` cai no template
"Volume abaixo do mínimo para leitura — ...". O motivo real pode ser outro
(`desvio_motivo: 'sem_valor' | 'sem_meta'`), que agora esta disponivel em
`significancia.desvio_motivo`. Nao inventa mais "dentro da meta", entao nao e urgente.

### 6. `PHI - Subworkflow Campanhas` continua vivo

Reforcando a fase 2: **nao arquivar**. Roda diariamente chamado pelo `PHI - Pipeline_v2`.

---

## Fora de escopo respeitado

- Os outros 7 `.first()`: apenas mapeados.
- Prefixo `=` de outras queries: intocado.
- `Execute SQL inserir daily entry` e `BigQuery Persistir Sinais Criativo`: intocados.
- `PHI - Subworkflow Campanhas`: nao arquivado.
- Passada duplicada do Meta: so registrada.
- Sem force-push, sem deletar branch, sem PR.

## Como verificar

1. `get_workflow_details` `vVAdXAJh6MW2Z5Hp` -> `activeVersionId = b40de4dd-c639-4f33-9da2-fb3624784358`.
2. `get_workflow_details` `W571K320aqIHsdtH` -> `activeVersionId = bb59dde5-d7c5-4a67-91e7-12d88672d177`.
3. `get_execution` `26168` node `Code calculo desvio meta` -> run 1 com `d7.desvio = 76.29`; run 3 com `d7.desvio = null`.
4. Pagina Notion `29db65e5-c72b-8013-9418-edfaee111e8c` -> Crítico / Alta / 60 / "CPA 76.3% acima da meta em 7d".
5. `get_execution` `26170` node `Code Prep Tendência` -> `bq_campaign_id` preenchido nos 3 runs.
