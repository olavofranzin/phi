# [RASCUNHO] ADR-33 — Identidade Estável do Item na Pipeline de Métricas (fim do `results[0]` e do merge sem chave)

> **STATUS:** RASCUNHO (git, design-canônico). Escrito 2026-08-09 como desenho dos
> **2 itens estruturais** que ficaram fora do escopo das correções desta sessão (Fases 1–6
> em `sw metricas anuncios`/`campanhas`). Vira `Aceito` quando o Contrato de Identidade
> rodar em produção e o smoke em KIL confirmar 1-item-por-anúncio sem vazamento.
>
> **ESCOPO:** só o **desenho**. Nenhuma linha de código foi mexida por este ADR. O objetivo
> é decidir a **abordagem** antes de tocar em nó do workflow **ativo** (`96dd7975`), como o
> Olavo pediu — "documento de desenho para os 2 itens" antes de empilhar mais correção.
> Deliberadamente **separado** das Fases 1–6 (aquilo foram remendos por-fora, cirúrgicos e
> já publicados); este ADR trata da **raiz** que aqueles remendos contornaram.

---

## Contexto

Durante as Fases 1–6 desta sessão consertamos, um a um, vazamentos entre anúncios e
campanhas em `sw metricas anuncios` (ativo `96dd7975`) e `sw metricas campanhas` (ativo
`2a4c40e5`): trocamos `.first()` por casamento-por-id, matamos ROAS-fantasma, desvio
`INDEFINIDO` tratado como 0, tendência falsa. Todos os consertos **funcionaram** — mas
todos foram feitos **por fora**, remendando o sintoma em cada nó.

Ao investigar a fundo, os remendos apontam para **uma raiz só**: os itens que trafegam na
pipeline **não carregam uma chave de identidade estável** (`entity_id`/`page_id`). Sem essa
chave, nenhum nó consegue casar "esta métrica ↔ este anúncio ↔ esta página Notion" de forma
segura — e a única saída era `.first()` ou posição, que **vaza dado do vizinho** a cada
anúncio novo.

Dois nós concentram essa doença, cada um num branch de plataforma, e **os dois convergem no
mesmo `Code Cálcula Métricas`**:

```
GOOGLE:  Code Unificar Períodos → [Code Valida Dados] → Edit Fields ─┐
                                                                     ├→ Code Cálcula Métricas
META:    Code Cálculo Dados Meta ──────→ [Merge Meta Ads] ───────────┘
         If D-2 exist1 (saídas 0 E 1) ──→ Merge Meta Ads (entrada 1)
```

Isto **não é bug pontual** — é uma **falha de contrato de dado**: a identidade do item se
perde no meio do caminho, e tudo downstream tenta remontá-la por adivinhação posicional.
Mesma família do que o ADR-29 chama de "propagar em silêncio de baixo pra cima".

### Item A — `Code Valida Dados` (Google) estripa a identidade

Código real do nó (ativo `96dd7975`):

```js
const data = items[0].json;                          // (1) só o 1º item de entrada
const googleData = data.results && data.results.length > 0
  ? data.results[0]                                  // (2) só a 1ª linha de results
  : null;
// ...valida impressions/clicks/costMicros...
return { json: { ...data, has_data: true, /* flags */ } };  // (3) espalha o bruto
```

Três problemas encadeados:

1. **`items[0]`** — se o nó receber N itens, olha só o primeiro.
2. **`results[0]`** — a resposta da API Google pode trazer **várias linhas** (uma por
   anúncio/segmento). Pegar `[0]` **descarta o resto** — perda de dado e de identidade.
3. **`{ ...data, ... }`** — devolve o payload bruto da HTTP espalhado, mas **nunca eleva
   `campaign_id`/`ad_id` a campo de topo estável**. A identidade fica implícita, enterrada
   dentro de `results`. Downstream não tem chave → `.first()`/posição.

> É por isso que este nó é "a raiz que limita todo hardening por-id": **não dá pra casar
> por id um item que não carrega id no topo.**

### Item B — `Merge Meta Ads` processa Meta em duplicata

Config real do nó: `type: merge`, `typeVersion: 3.2`, **`parameters: {}`** (vazio).
Parâmetros vazios ⇒ o nó roda no **modo default do n8n (append / concatenação)**, sem
nenhuma **chave de correspondência** escolhida. Fiação real:

| Entrada | Vem de | O que carrega |
|---|---|---|
| **0** | `Code Cálculo Dados Meta` | métricas Meta já calculadas |
| **1** | `If D-2 exist1` — **saída 0 (TRUE) E saída 1 (FALSE)** | itens do check de D-2 |

Dois defeitos:

1. **Append sem chave** junta os dois fluxos **empilhando**, não reconciliando por
   `ad_id`. O mesmo anúncio pode chegar **duas vezes** a `Code Cálcula Métricas` (uma da
   entrada 0, outra da entrada 1) — a "duplicata Meta".
2. **Fan-in do `If`**: pela regra 6 (CLAUDE.md), saída 0 = TRUE e saída 1 = FALSE. As
   **duas** apontam para a **mesma entrada 1**. Ou seja: decida o que decidir, o item cai
   no mesmo lugar — a decisão do `If` é **jogada fora** no merge. Um `If` cujos dois ramos
   vão pro mesmo destino não está selecionando nada.

O vazamento foi **contido** nesta sessão (por fora), mas a **causa — merge cego, sem
chave** — segue intacta.

---

## Decisão

**Todo item da pipeline de métricas carrega uma chave de identidade estável e explícita, no
topo do `json`. Nenhum nó pode descartá-la; validação e cálculo só acrescentam.** É o mesmo
princípio "só acrescenta, não recalcula/estripa" do ADR-003 e do ADR-29 — agora aplicado à
**identidade**, não só ao score.

### Contrato de Identidade do Item (o núcleo)

Campos obrigatórios no topo de cada item, do primeiro nó ao último:

| Campo | Exemplo | Papel |
|---|---|---|
| `platform` | `'google'` \| `'meta'` | de qual branch veio |
| `entity_level` | `'campaign'` \| `'adset'` \| `'ad'` | granularidade da linha |
| `entity_id` | id da plataforma (ex. id do anúncio) | **chave de casamento** |
| `page_id` | id da página Notion correspondente | casar métrica ↔ Notion |
| `date_ref` / janela | `D-1`, `D-2`, período | casar D-1 ↔ D-2 sem confundir |

**Regra de ouro:** um nó de validação/cálculo **acrescenta** flags e métricas ao item; ele
**não pode** trocar a identidade do item por `results[0]` nem espalhar o bruto por cima.

### Parte A — redesenho de `Code Valida Dados` (e irmãos `... Meta`)

> **ATUALIZAÇÃO 2026-08-09 — Passo 0 (granularidade confirmada na execução `26355`, KIL).**
> A suposição inicial ("N linhas = N anúncios") **estava errada** para este workflow. O
> `results` da query Google é uma **série diária**: 7 linhas = 7 dias da **mesma** campanha
> (Barbearia `21149189736`), 6 dias (Salão `21116045403`), cada linha com `segments.date`.
> E o nó anterior (`Code Unificar Períodos`) **já pré-agrega** tudo em campos de topo
> (`raw_cost_d1`, `v_3d`, `txt_tendencia_*`, …). Logo: `results[0]` é usado **só para
> validar** que veio dado — e isso está **correto**; **NÃO** se deve "emitir N itens" (isso
> quebraria a série já agregada). O defeito real é **só o item 2 abaixo (identidade)**.
> Prova dura: a saída do `Code Valida Dados` carrega, de identidade, apenas `requestId` e
> `validation_status` — **zero `campaign_id`/nome/`page_id` no topo**; a identidade existe só
> enterrada em `results[0].campaign.id`. É por isso que o casamento downstream caiu em
> `.first()`/posição.

**Escopo real da Parte A (corrigido):** **elevar a identidade ao topo, sem restruturar a
série.** Concretamente:

1. ~~Parar de colapsar em `results[0]` / emitir N itens~~ — **descartado**: as N linhas são
   dias já agregados upstream; manter **1 item por campanha**.
2. **Elevar `entity_id`/`entity_name`/`entity_level` a campo de topo** do item, lidos de
   `results[0].campaign.{id,name}` (ou `resourceName`). Esta é **a** correção.
3. **Manter as flags** `has_data`/`validation_status`/`reason` — são o "selo Camada-0"
   (ADR-29). Passam a vir **em cima de** um item **com** identidade.
4. **Preservar o resto** (`...data`, agregados) — não há motivo para reescrever o item; só
   **acrescentar** as chaves de identidade (fiel ao princípio "só acrescenta").

### Parte B — redesenho de `Merge Meta Ads`

> **ATUALIZAÇÃO 2026-08-09 — Passo 0-B (branch Meta investigado na execução manual `26180`,
> que rodou o fluxo COMPLETO com o branch Meta).** Achados:
> - **Cliente Meta existe:** slug **CHA**, campanha `IG_MENS__PROD.TESTE__`. Identidade Meta
>   é **rica upstream** (`Code clean propriedades`): `clean_id_meta_campaign`,
>   `clean_id_meta_ads`, `clean_id_meta_account`, `clean_notion_id_{camp,adset,ads}`,
>   `platform="Meta Ads"`.
> - **A identidade é DROPADA** já no `Code Valida Dados Meta` (emite `{data:[],
>   has_data:false, no_results}`) e some de vez no `Code Cálculo Dados Meta` (emite **`{}`**).
> - **Fonte do fantasma provada:** `Code Cálculo Dados Meta` → `{}` (in 0) + `If D-2 exist1`
>   → `{}`/no_results (in 1); o `Merge` (append) empilha os dois ⇒ **2 itens vazios sem
>   identidade** no `Code Cálcula Métricas`.
> - **Natureza real do Merge:** é um **fallback D-1/D-2 da MESMA campanha** (tenta ontem; se
>   vazio, anteontem), não a junção de duas entidades. Logo o certo é **coalescer para UM**.
> - **Artefato n8n adicional:** em cliente **Google-only** (KIL, exec `26355`) o branch Meta
>   **não roda**, mas o `Merge` ainda emite `{}` que chega ao `Code Cálcula Métricas` (quirk
>   de nó multi-entrada). Precisa de **guarda** que dropa itens sem identidade.
> - **GAP honesto:** **toda** run Meta observável volta `data:[]` — **não há nenhuma execução
>   Meta com métricas populadas**. O caminho "com dado" só é testável **sinteticamente**; o
>   caminho "sem dado" (o que gera os fantasmas) é testável 100% com dado real.

**Escopo real da Parte B (corrigido) — 3 movimentos:**

1. **Identidade Meta (espelho do Item A).** Carregar `platform` + `entity_id`
   (`clean_id_meta_campaign`/`clean_id_meta_ads`) + `entity_name` + `page_id`
   (`clean_notion_id_*`) **através** de `Code Valida Dados Meta` e `Code Cálculo Dados Meta`,
   **inclusive no caminho sem dado** — nunca emitir `{}`.
2. **Coalesce D-1/D-2 (mata o append cego).** Emitir **exatamente 1** item Meta por
   entidade: D-1 se `has_data`, senão D-2, senão um único item "sem dado Meta" **com
   identidade** (não dois fantasmas). Resolve também o fan-in das 2 saídas do `If D-2`.
3. **Guarda no `Code Cálcula Métricas`.** Dropar itens sem `entity_id`/`platform` — mata o
   `{}` que o quirk do Merge injeta em clientes Google-only.

> **Testabilidade:** movimentos 1 e 3 e o ramo "sem dado" do 2 são **verificáveis com dado
> real** (exec `26180`/`26355`). O ramo "com dado" do 2 só com **item Meta sintético** até
> CHA (ou outra campanha) ter métricas reais — registrar como risco residual.

> **ATUALIZAÇÃO 2026-08-09 — Passo 0-C (arquitetura do `Code Cálcula Métricas` revelada).**
> Descoberta que **reescreve o Item B** e **fortalece a tese do ADR**:
> - `Edit Fields` (lado Google) emite **só `{meta_valor: 3.5}`** — a meta, **não** as
>   métricas. `Code Cálcula Métricas` **não consome as métricas da entrada**: usa o item como
>   **gatilho magro** e puxa o dado real de nós upstream via `$()`/`aggregateGoogleResponse`,
>   casado por `campaignId` através do **pareamento de itens do n8n** (paired items).
> - **Nenhum item carrega identidade no topo — nem o real, nem o fantasma.** O gatilho
>   Google real tem 1 chave (`meta_valor`); o fantasma Meta `no_results` tem 5. A pipeline
>   inteira depende do **pareamento** para associar gatilho ↔ dado — exatamente a fragilidade
>   que este ADR quer matar, e a raiz dos `.first()`/posição das Fases 1–6.
> - **Impacto nos movimentos 1+3:**
>   - A **guarda** NÃO pode "dropar item sem identidade" (o real também não tem). O único
>     fantasma inequívoco é o **`{}` puro (0 chaves)** — esse é 100% seguro dropar.
>   - O fantasma **Meta `no_results` (5 chaves)** é sinal legítimo "Meta voltou vazio";
>     virar-linha-zerada-ou-não é **decisão de PRODUTO** (Olavo), não conserto mecânico.
>   - **Movimento 1 (identidade Meta via `$()`)** depende do mesmo pareamento — **só
>     verificável dentro do n8n** (pinned smoke), não em sandbox local.
> - **Conclusão:** o Item B "de verdade" exige **carimbar o Contrato de Identidade nos
>   próprios gatilhos magros** (`Edit Fields` passar a levar `entity_id`; calculadores Meta
>   idem) — mudança **mais ampla** que "editar 3 nós". Fica como **design a especificar**,
>   não patch. O único patch seguro e imediato é a **guarda mínima** (dropar `{}` de 0
>   chaves), que remove o grosso do ruído em clientes Google-only sem risco.

---

## Alternativas consideradas

1. **Continuar remendando por `.first()`/posição a cada nó** (o que fizemos nas Fases 1–6).
   Rejeitado como solução final: não escala, quebra a cada anúncio/campanha novo — é
   exatamente a doença. Serviu de contenção; não pode virar o padrão.
2. **Reescrever a pipeline inteira para "1 item por anúncio" num sub-workflow.** Rejeitado
   por ora: grande demais para o ganho, mexe em tudo de uma vez, viola "a solução mais
   simples que resolve". O Contrato de Identidade entrega o resultado **sem** reescrever a
   pipeline.
3. **Contrato de Identidade + 2 ajustes cirúrgicos (escolhida).** Corrige a raiz nos dois
   nós, mantém o resto do workflow, e torna todo casamento **keyed** — `.first()` some por
   consequência, não por remendo.

## Consequências

- (+) Fim dos vazamentos entre anúncios/campanhas **na raiz**; `.first()` deixa de ser
  necessário — vira casamento por `entity_id`.
- (+) `Merge Meta Ads` keyed ⇒ acaba a duplicata Meta; o `If D-2` volta a ter sentido.
- (+) Base sólida para casar **métrica ↔ página Notion** por `page_id`, em vez de leitura
  frágil por ordem.
- (+) Coerente com ADR-003 (autoridade do score) e ADR-29 (selo de confiança): a filosofia
  "só acrescenta, não estripa" passa a valer também para a **identidade**.
- (−) Toca em nós no **caminho crítico do workflow ativo** (`96dd7975`) → exige smoke em KIL
  (Barbearia + Salão) antes de publicar, com rollback pelo `versionId`.
- (−) Passo 0 obrigatório: **confirmar a granularidade real** das queries (1 linha/anúncio
  vs N linhas) — isso dimensiona a Parte A. Sem esse dado, não implementar.

## Plano de verificação (obrigatório — CLAUDE.md)

> **BASELINE CAPTURADO — execução `26355` (2026-08-09 07:00, KIL, produção).** Fonte do
> "antes" para o diff pós-conserto:
> - **Barbearia** (`21149189736`): `cost_7d=208.01`, `conv_7d=50`, `cpa_7d=4.16`,
>   `cpa_30d=4.11`, `roas=0.13`, `status="Acima da Meta 🚨"`.
> - **Salão** (`21116045403`): `cost_7d=19.16`, `conv_7d=3`, `cpa_7d=6.39`,
>   `cpa_30d=10.83`, `status="Acima da Meta 🚨"`.
> - **Evidência do Item B (duplicata/fantasma):** `Merge Meta Ads` emitiu **[2, 1]** itens
>   (run 0 duplicou); `Code Cálcula Métricas` emitiu **5 itens para 2 campanhas** (2 reais +
>   3 zerados/`no_results`) — KIL é Google-only, mas o branch Meta empilha itens vazios.
> - **Identidade:** **0** campos de id no topo de qualquer nó (só `requestId` +
>   `validation_status`).
> Pós-conserto, o alvo é: identidade no topo em 100% dos itens, e **2 itens reais** (um por
> campanha) sem fantasmas.

1. **Baseline.** ~~Rodar o workflow~~ — **feito** (execução `26355` acima; sem gasto novo de
   API, leitura de log).
2. **Confirmar granularidade.** Inspecionar 1 execução real: quantas linhas `results` a API
   devolve por chamada e se `entity_id` está presente na resposta (Google e Meta).
3. **Pós-ajuste.** Rodar de novo em KIL Barbearia + Salão e conferir:
   - cada anúncio aparece **exatamente uma vez**, com `entity_id`/`page_id` no topo;
   - Meta **não duplica** (contagem de itens = nº real de anúncios);
   - nenhum valor "vazou" do anúncio vizinho (comparar com o baseline).
4. **Diff.** Valores por anúncio batem com o baseline onde deveriam; divergências só onde a
   correção era o objetivo (duplicata removida, linha antes descartada agora presente).
5. **Publicação.** Só com **OK de budget do Olavo**; registrar o `versionId` de rollback no
   Ledger "PHI — Registro de Execuções" (ADR-32).

## Reavaliar quando

- A granularidade confirmada divergir do suposto (ex.: a query já é 1-linha-por-anúncio) →
  reabrir a Parte A com o dado real.
- Surgir a necessidade de casar 3+ plataformas → promover o Contrato de Identidade a
  **sub-workflow reutilizável** (padrão ADR-25).
- `Code Cálcula Métricas` mostrar que precisa de mais campos de identidade (ex. `adset_id`)
  → estender o contrato.

## Conexões com ADRs vigentes

- **ADR-003** (autoridade do score / só-acrescenta): mesma filosofia, agora sobre
  **identidade** — nenhum nó estripa o que recebe.
- **ADR-29** (Guardião da métrica-mãe): as flags de `Code Valida Dados` **são** o selo
  Camada-0; identidade estável é **pré-requisito** para o Guardião casar histórico por id.
- **ADR-25** (sub-WFs reutilizáveis): candidato futuro se o Contrato virar componente.
- **Regras CLAUDE.md:** 5 (splitInBatches — reconexão do loop), 6 (IF 0=TRUE/1=FALSE — o
  fan-in do `If D-2 exist1`), 8 (SQL montado no Code node).
- **Fases 1–6 desta sessão:** este ADR é a **cura** do que aquelas correções contiveram por
  fora.

---

*Rascunho de desenho. Não implementar sem: (a) granularidade confirmada, (b) baseline
salvo, (c) OK de budget do Olavo, (d) smoke em KIL antes de publicar.*
