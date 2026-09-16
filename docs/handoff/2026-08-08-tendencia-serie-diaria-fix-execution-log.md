# Tendencia serie diaria (opcao B) + publicacao dos itens 1-4 - Execution Log

Data: 2026-08-08
Branch: claude/consolidacao-2026-08
Brief: docs/handoff/2026-08-08-tendencia-serie-diaria-fix-brief.md
Log da fase 1: docs/handoff/2026-08-08-prefixo-expressao-n8n-execution-log.md (commit `1dd1459`)

> **Resumo:** opcao B aplicada e publicada em `sw metricas anuncios`. A correcao
> **funciona e esta comprovada** (`bq_campaign_id` correto por anuncio, `n_dias = 21`,
> `tendencia_metodo = 'bigquery_3d_vs_3d'` com tendencia real 57,82 no anuncio CORTE.CABELO).
> **PAREI antes do passo 5** (`sw metricas campanhas`): o smoke do passo 4 nao bateu 2 dos
> criterios de aceite **no anuncio da barbearia**, e a investigacao mostrou que a causa e um
> **defeito pre-existente em `Code calculo desvio meta`**, fora do escopo autorizado.
> Nada foi revertido - o estado publicado e estritamente melhor que o anterior.

---

## Estado inicial

| Workflow | id | versionId (rascunho) | activeVersionId (producao) | active |
|---|---|---|---|---|
| sw metricas anuncios | `vVAdXAJh6MW2Z5Hp` | `4370e727-5227-4c2e-8d23-0c1d88d9eb5c` | `f618a9d6-c153-4b0f-8cac-e7d5e19f2495` | true |
| sw metricas campanhas | `W571K320aqIHsdtH` | `4711ed2d-d719-441c-878f-23e0e39710f6` | **`4711ed2d-d719-441c-878f-23e0e39710f6`** (rascunho == producao) | true |

> `sw metricas campanhas` **nao foi tocado** nesta sessao (ver "Passo 5 - parado").
> Registro do `activeVersionId` ANTES, conforme pedido: rascunho e producao estavam
> identicos e continuam identicos.

**Rollback de `sw metricas anuncios`:** `restore_workflow_version` para `f618a9d6-c153-4b0f-8cac-e7d5e19f2495`.

---

## Verificacao previa obrigatoria: o pareamento de item funciona?

O brief manda parar se `clean_id_google_camp` nao chegar ao `Code Prep Tendencia`. A
topologia e assimetrica (`Code Prep Tendencia` roda **4 vezes**, `Code clean propriedades`
roda **3 vezes**), entao `.first()` poderia atribuir o id do anuncio errado. Verifiquei
antes de codar:

- Dois nodes que ja rodam em producao usam `.item` a essa profundidade e resolvem certo:
  `Create a database page Create Observation` usa
  `$('Code clean propriedades').item.json.clean_notion_id_ads`, e `Update a database page`
  usa `$('Get database anuncios').item.json.id`.
- Na execucao `26012` esses nodes escreveram em **3 paginas distintas e corretas**
  (`AD01-VID_9x16`, `AD01-PMAX_BARBEARIA`, `AD01-PMAX_CORTE.CABELO`), sem erro de
  "Paired item data unavailable".

**Conclusao:** o pareamento (`.item`) e confiavel; `.first()` nao seria. Como `.item` so
existe em Code node no modo `runOnceForEachItem`, o node foi trocado para esse modo - o que
tambem **garante 1 item entra / 1 item sai** (armadilha 1 do brief).

Confirmado depois no smoke - a coluna `bq_campaign_id` bate 1:1 com o anuncio de cada run
(tabela em "Smoke").

---

## Opcao B aplicada

### `sw metricas anuncios` -> `Code Prep Tendencia`

**Antes** (modo `runOnceForAllItems`):

```js
const idG = Number(data.clean_id_google || data.id_google_camp || 0);   // <- nao existe aqui
const idM = Number(data.clean_id_meta_campaign || data.id_meta_camp || 0);
let campaign_id = '';
if (idG > 0) campaign_id = 'GADS-' + idG;
else if (idM > 0) campaign_id = 'META-' + idM;
return { json: { ...data, bq_campaign_id: campaign_id } };
```

**Depois** (modo `runOnceForEachItem`): le o id da **campanha** direto da fonte, monta a
query inteira e devolve `_bq_sql_serie` + `_serie_motivo`:

```js
let clean = null;
let motivo = 'ok';
try { clean = $('Code clean propriedades').item.json; }
catch (e) { motivo = 'pareamento_indisponivel'; }

let campaign_id = '';
if (clean) {
  const idG = num(clean.clean_id_google_camp);      // CAMPANHA, nao o anuncio
  const idM = num(clean.clean_id_meta_campaign);
  if (idG > 0) campaign_id = 'GADS-' + idG;
  else if (idM > 0) campaign_id = 'META-' + idM;
  else motivo = 'sem_id_campanha';
}

const idSql = esc(campaign_id || 'SEM-ID');   // nunca SQL vazio
...
return { json: { ...data, bq_campaign_id: campaign_id, _bq_sql_serie, _serie_motivo: motivo } };
```

Por que `clean_id_google_camp` e nao `clean_id_google`: confirmado na execucao real que
`clean_id_google_ad = 6495518481` e `clean_id_google_camp = 21149189736` para o mesmo
anuncio - so coincidem em PMAX. `clean_id_google` e o alias do **anuncio**.

### `sw metricas anuncios` -> `BigQuery Serie Diaria`

- **Antes:** `sqlQuery` = a query inteira com `{{ $json.bq_campaign_id }}` embutido (violava a regra 8 do CLAUDE.md).
- **Depois:** `sqlQuery` = `={{ $json._bq_sql_serie }}`.

### Armadilhas do §2 - como cada uma foi tratada

| # | Armadilha | Tratamento |
|---|---|---|
| 1 | `Code Tendencia Real` pareia por INDICE | modo `runOnceForEachItem` garante 1:1. Smoke: prep 4 runs / bq 4 runs / tendencia real 4 runs. |
| 2 | nunca emitir `_bq_sql_serie` vazio | sem id -> query valida com `WHERE campaign_id = 'SEM-ID'` (0 linhas) + `_serie_motivo` diagnosticavel |
| 3 | query semanticamente identica | **verificada byte a byte** antes de aplicar (abaixo) |
| 4 | usar o campo de CAMPANHA | `clean_id_google_camp`, com a distincao comprovada em dados reais |

**Prova da armadilha 3** - o SQL gerado foi comparado em Node contra o `sqlQuery` original
com o id substituido:

```
--- PMAX_BARBEARIA: bq_campaign_id='GADS-21149189736' motivo='ok'
    SQL identico ao original (com id substituido): True
--- META_ad:        bq_campaign_id='META-120223097083780450' motivo='ok'
--- sem_id:         bq_campaign_id='' motivo='sem_id_campanha'
--- unpaired:       bq_campaign_id='' motivo='pareamento_indisponivel'
```

Aliases, janelas 3d/3d-anteriores, `INTERVAL 21 DAY` e `America/Sao_Paulo` preservados.
A referencia de tabela foi mantida como estava (`project-...phi_prod.raw_campaign_data`,
com project id) para nao mudar semantica - a regra 1 do CLAUDE.md pediria `phi_prod.x`,
fica como pendencia cosmetica.

---

## Publicacao

| Momento | versionId (rascunho) | activeVersionId |
|---|---|---|
| antes da sessao | `4370e727-5227-4c2e-8d23-0c1d88d9eb5c` | `f618a9d6-c153-4b0f-8cac-e7d5e19f2495` |
| apos `update_workflow` (2 ops) | `ba9f1aec-2f84-4398-8a04-f0346f1f918b` | `f618a9d6-...` |
| **apos `publish_workflow`** | `ba9f1aec-...` | **`ba9f1aec-2f84-4398-8a04-f0346f1f918b`** |

`appliedOperations: 2`. Avisos do validador apos o update: apenas os falso-positivos ja
conhecidos (`Execute SQL inserir daily entry`, `BigQuery Persistir Sinais Criativo`, schema
Notion). **`BigQuery Serie Diaria` sumiu da lista de avisos** - confirmando o `=`.

`sw metricas anuncios` publicado com **itens 1-4 + opcao B juntos**, como o brief pediu.

---

## Smoke

Execucao **`26161`** (manual, 2026-08-08 17:14:09 -> 17:14:52), status **`success`**.

### Criterios da opcao B

| run | anuncio (de `Code clean propriedades`) | `bq_campaign_id` | `_serie_motivo` | `n_dias` | `tendencia_metodo` | pagina Notion escrita |
|---|---|---|---|---|---|---|
| 0 | AD01-VID_9x16 (Meta) | `META-120223097083780450` | ok | 0 | sem_historico | AD01-VID_9x16 |
| 1 | AD01-PMAX_BARBEARIA | **`GADS-21149189736`** | ok | **21** | `sem_historico` | AD01-PMAX_BARBEARIA |
| 2 | AD01-PMAX_CORTE.CABELO | **`GADS-21116045403`** | ok | **21** | **`bigquery_3d_vs_3d`** | AD01-PMAX_CORTE.CABELO |
| 3 | AD01-VID_9x16 (2a passada) | `META-120223097083780450` | ok | 0 | sem_historico | AD01-VID_9x16 |

- `bq_campaign_id` **nao vazio** e no formato canonico: **OK**
- **pareamento correto por anuncio**: OK (cada run casa com o anuncio certo e com a pagina certa)
- `n_dias >= 4`: **OK** (21 nas duas campanhas Google)
- `tendencia_metodo = 'bigquery_3d_vs_3d'`: **OK no CORTE.CABELO** (`tendencia_real = 57.82`,
  substituindo o proxy de API que dizia `151.37`) · **NAO no BARBEARIA** - ver abaixo.

**Por que o BARBEARIA ficou `sem_historico` com `n_dias = 21`:** a serie voltou
`conv_3 = 0` (0 conversoes nos ultimos 3 dias). O `Code Tendencia Real` calcula CPA como
`conv > 0 ? cost/conv : null`, entao a metrica recente e **indefinida** e ele cai no
fallback. Isso esta **correto** pelo guardrail do PHI (`conversions=0 => CPA indefinido`) -
o que esta errado e o **rotulo**: `sem_historico` mente, porque historico existe (21 dias).
O rotulo honesto seria algo como `sem_conversao_na_janela`. Correcao pertence ao
`Code Tendencia Real`, **fora do escopo deste brief**.

### Criterio de aceite dos itens 1-4 - pagina `AD01-PMAX_BARBEARIA_10/01/26`

(Notion `29db65e5-c72b-8013-9418-edfaee111e8c`, lida apos a execucao)

| campo | valor apos o smoke | criterio | resultado |
|---|---|---|---|
| `ad_status_operacional` | `Bom` | != "Em aprendizado" | **OK** |
| `ad_prioridade_otimizacao` | `Baixa` | != "Baixa" | **FALHOU** |
| `ad_tendencia` | `Estável` | != "Sem dados" | **OK** |
| `ad_diagnostico` | `Dentro da meta (CPA desvio 0% em 7d); tendência Estável [evidência parcial: 30d].` | citar desvio + janela | **OK** (formato), **conteudo errado** |
| `ad_score_operacional` | `100` | - | - |

### Causa raiz da falha - defeito pre-existente, fora do escopo

O `Code calculo desvio meta` produziu, **no mesmo item**, valores contraditorios para o
BARBEARIA (run 1):

```
cpa_7d: 6.17 | meta_estabelecida: 3.5 | status_meta: 'Acima da Meta 🚨'
analise_desvios: { meta_aplicada: 3.5, d1: {valor:0, desvio:0},
                   d3: {valor:0, desvio:0}, d7: {valor:0, desvio:0} }
```

CPA 7d real = **R$ 6,17** contra meta **R$ 3,50** = **+76% de desvio**. Mas `analise_desvios.d7.desvio`
saiu **0**, e e esse campo que o `Code classificar status` consome - dai "Dentro da meta
(CPA desvio 0% em 7d)", `Bom`, `Baixa`, score 100. O anuncio deveria estar em
`Atenção`/`Alta`.

Segundo sintoma no mesmo node (run 3, a 2a passada do anuncio Meta): `analise_desvios` veio
com os numeros do **CORTE.CABELO** (`d1: 3.04, d3: 9.15, d7: 3.64`) - ou seja, ha
**vazamento de valores entre anuncios** nesse node.

Nada disso foi causado pela opcao B: sao os mesmos campos e o mesmo node de antes. A opcao B
so corrigiu a origem do id e o SQL. Comparativo do CORTE.CABELO mostra o ganho real:
`tendencia_fonte` passou de `janela_api` (proxy 151.37) para `bigquery_3d_vs_3d` (57.82).

### Por que NAO reverti

O estado publicado e **estritamente melhor** que `f618a9d6`:
- antes: `bq_campaign_id` sempre vazio, `n_dias` sempre 0, tendencia real **nunca** funcionou;
- depois: id correto por anuncio, 21 dias de historico, tendencia real ativa onde a metrica
  e definida.

Os dois criterios que falharam ja falhavam antes (e por outro motivo). Reverter restauraria
o bug. Rollback continua disponivel: `restore_workflow_version` -> `f618a9d6-...`.

---

## Passo 5 (`sw metricas campanhas`) - PARADO

O brief manda parar se o smoke do passo 4 falhar. Dois criterios falharam, entao
**nao apliquei a opcao B nem publiquei o `sw metricas campanhas`**. Ele segue intacto:
rascunho == producao, exatamente como estava.

A correcao la e mecanicamente identica e o mecanismo esta provado - mas a mesma familia de
defeito (`Code calculo desvio meta`) provavelmente existe la tambem, e publicar antes de
decidir o que fazer com ele so espalharia diagnostico errado. Aguardo o Olavo.

---

## PHI - Subworkflow Campanhas (`b1pbn8qmzCNTufTp`) - **NAO e orfao**

Correcao da minha propria suspeita na fase 1. Evidencia:

- **21 execucoes**, todas `success`, mode `integrated` - a mais recente `26054` em
  2026-08-08 10:00:55.
- `metadata.parentExecution` da execucao `26054`:
  `{ executionId: "26053", workflowId: "ITWG3Ge0asXtUM8U" }` - ou seja, e chamado por
  **`PHI - Pipeline_v2`** todo dia as 10:00, na Fase 1 (ingestao).
- Recebe payload real: `{ client_id: "CLI-4", model_id: "MODEL-VAREJO-001",
  primary_metric_type: "CPA", execution_id: "EXEC-PHI-20260808100052-2b918a62" }`.

**Esta vivo e escrevendo em `phi_prod.raw_campaign_data`. Nao arquivar.** (De quebra, o
`execution_id` resolvido no payload e mais uma prova de que o `{{ }}` sem `=` avalia.)

---

## Pendencias para o Olavo

### 1. `Code calculo desvio meta` - bug que invalida o diagnostico (prioridade alta)

E o que faz o anuncio da barbearia aparecer como "Bom / Baixa / desvio 0%" tendo CPA 76%
acima da meta. Dois sintomas: (a) `analise_desvios.d1/d3/d7` zerados apesar de `cpa_7d`
correto no mesmo item; (b) vazamento de valores de um anuncio para outro na passada extra.
E exatamente a classe de problema que abriu esta investigacao. Precisa de um brief proprio.

### 2. Rotulo `sem_historico` mentiroso no `Code Tendencia Real`

Com `n_dias = 21` e `conv_3 = 0`, o metodo devolve `sem_historico`. O comportamento
(nao inventar CPA sem conversao) esta certo; o rotulo esta errado e esconde a diferenca
entre "nao ha dados" e "ha dados, mas a metrica e indefinida na janela". Sugestao:
`sem_conversao_na_janela`.

### 3. `sw metricas campanhas` - aplicar a opcao B?

Parado por causa do stop condition. Decisao: publicar a correcao mecanica agora, ou esperar
o item 1.

### 4. Passada duplicada do anuncio Meta

`Code Prep Tendencia` roda 4x para 3 anuncios; o anuncio Meta e processado duas vezes e a
pagina do Notion e escrita duas vezes (a 2a com numeros diferentes: `7d: 0 cliques / 0 conv`
na 1a e `7d: 27 cliques / 6 conv` na 2a). Pre-existente, provavelmente o `Merge Meta Ads`.
Nao investiguei a fundo - fora do escopo.

### 5. Cosmetico

`BigQuery Serie Diaria` ainda referencia a tabela com project id
(`project-0e7c58d4-656f-49e8-807.phi_prod.raw_campaign_data`); a regra 1 do CLAUDE.md pede
`phi_prod.raw_campaign_data`. Mantido identico de proposito (armadilha 3).

---

## Fora de escopo respeitado

- Nenhuma mudanca no `=` de qualquer outra query (as 30 ocorrencias da fase 1 seguem como estavam).
- `Execute SQL inserir daily entry` e `BigQuery Persistir Sinais Criativo`: intocados.
- `PHI - Subworkflow Campanhas`: investigado, **nao arquivado**.
- `sw metricas campanhas`: intocado.
- Sem force-push, sem deletar branch, sem PR.

## Como verificar este log

1. `get_workflow_details` de `vVAdXAJh6MW2Z5Hp` -> `activeVersionId = ba9f1aec-2f84-4398-8a04-f0346f1f918b`; `BigQuery Serie Diaria.sqlQuery = "={{ $json._bq_sql_serie }}"`; `Code Prep Tendencia.mode = "runOnceForEachItem"`.
2. `get_execution` `26161`, nodes `Code Prep Tendencia` / `BigQuery Serie Diaria` / `Code Tendencia Real` -> tabela do smoke.
3. `get_execution` `26161`, node `Code calculo desvio meta` -> contradicao `cpa_7d: 6.17` vs `d7.desvio: 0` no run 1.
4. `get_execution` `26054` do workflow `b1pbn8qmzCNTufTp` -> `parentExecution.workflowId = ITWG3Ge0asXtUM8U`.
