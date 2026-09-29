# ADR-33 — Identidade Estável do Item na Pipeline de Métricas (fim do `results[0]` e do merge sem chave)

> # ✅ ACEITO — Olavo, 2026-09-28
>
> **Aceito com a extensão do §"Agregador Multi-fonte":** o Contrato de Identidade ganha
> **`client_id` + `source` + `source_id` + `date_start`/`date_end`**, além dos cinco campos
> originais. **Junto foram aprovados:** apagar as **6 linhas** do passivo, na ordem
> *conserta → recoleta → apaga*, e **recoletar** o período depois do conserto.
>
> ## 🔴 A lição que este ADR passou a carregar, e que vale mais que o desenho
>
> **Ele ficou RASCUNHO de 09/08 a 28/09 — sete semanas.** Nesse tempo o mesmo defeito
> **reapareceu num segundo workflow** (o Agregador), gravou dado no cliente errado em **duas
> rodadas** e só foi achado porque o vigia, construído para outra coisa, apontou uma tabela.
>
> **Desenho aceito não conserta nada. Desenho que fica em rascunho é dívida com juros** — e o juro
> aqui foi o defeito se espalhar para um pipeline que ainda nem tinha consumidor.
>
> ⚠️ **O que ESTE aceite NÃO autoriza:** executar o contrato nos writers originais
> (`sw metricas anuncios` / `sw metricas campanhas`). **O escopo liberado agora é o Agregador.**
> Ampliar é decisão do Olavo, não extensão de executor.


> **STATUS (histórico):** era RASCUNHO até 2026-09-28. Escrito 2026-08-09 como desenho dos
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

## Extensão de escopo proposta — Agregador Multi-fonte (2026-09-28)

> **Estado desta seção:** desenho medido, **não publicado**. O ADR continua `RASCUNHO`.
> O Agregador ativo permaneceu em `versionId == activeVersionId == c54114b3-fdf3-46c7-83fb-20c3bdffee54`.

A execução `41535` provou a mesma falha de contrato em outro workflow. Depois que o laço termina,
o `Adaptador Input T28` usa `nodeFirst(...)` para combinar o primeiro `Set dados` com respostas
coletadas nas passagens seguintes. O primeiro cliente era `CLI-13`; GA4 e Clarity pertenciam ao
`CLI-4`. A linha resultante tem formato válido, `execution_id` válido e dono errado.

### Veredito sobre o contrato existente

O princípio do ADR-33 **cobre** o Agregador: identidade explícita viaja com o dado e todo casamento
é por chave. Os cinco campos originais, porém, descrevem a entidade de mídia e não distinguem o
dono de um lote multi-cliente. O contrato precisa desta extensão mínima:

| Campo | Papel no Agregador |
|---|---|
| `client_id` | dono obrigatório da coleta e da linha de destino |
| `source` | `ga4`, `clarity`, `gbp`, `google_ads` ou `meta_ads` |
| `source_id` | propriedade/conta/local/projeto que respondeu |
| `date_start` + `date_end` | janela da coleta; substitui casamento implícito por posição |

Os campos originais `platform`, `entity_level`, `entity_id` e `page_id` continuam valendo para
campanha, conjunto e anúncio. Não nasce ADR novo nem subworkflow: é o Contrato de Identidade do
ADR-33 aplicado ao segundo pipeline que repetiu a mesma doença.

### Passivo medido em 2026-09-28

Medição BigQuery read-only, execuções de auditoria `44188`–`44190`. A assinatura conclusiva foi
comparar a configuração observada na própria execução com a tabela escrita; contagem e período
vieram juntos para não confundir ausência com zero.

| Tabela | Passivo provado | Cliente | Período | Prova |
|---|---:|---|---|---|
| `t28_ga4_landing` | **4 linhas** | `CLI-13` | 13/09 e 20/09 | `CLI-13.id_ga4 = null`; 2 linhas de `EXEC-T28-39103` + 2 de `EXEC-T28-41535` |
| `t28_clarity_daily` | **2 linhas** | `CLI-13` | 13/09 e 20/09 | execuções `39103` e `41535`; o payload repetido contém páginas e URLs de `kbbecker.com.br` |
| `t28_gbp_daily` | **0 impossíveis identificadas** | — | — | a única linha com cliente é do `CLI-4`, que tem `id_gbp_local` |
| `t28_campaign` | **0 impossíveis pela peneira** | — | — | as 12 linhas do `CLI-13` usam sua campanha Meta `120223097083780450` |
| `t28_adset` | **0 linhas existentes** | — | — | tabela sem linhas no conjunto medido |
| `t28_meta_campaign` | **0 linhas existentes** | — | — | tabela sem linhas no conjunto medido |

Além disso existem 318 linhas de `t28_campaign`, 2 de `t28_ga4_landing` e 1 de
`t28_clarity_daily` com `client_id` nulo. Elas são outro passivo de identidade, mas **não provam
troca entre clientes** e não entram nas seis linhas acima.

**Limite da peneira:** ela não pega troca entre dois clientes que ambos têm a fonte configurada,
propriedade errada dentro do mesmo cliente, configuração removida depois da escrita, linha
sobrescrita por `MERGE` nem mistura parcial dentro de uma agregação. Configuração atual, sozinha,
também não prova impossibilidade histórica; por isso a conta conclusiva usa a configuração que
viajou na execução que escreveu.

### Desenho do conserto

1. Dentro de cada passagem do `Loop`, carimbar a resposta de cada fonte com
   `client_id + source + source_id + date_start + date_end` antes de ela chegar ao `Merge1`.
   Resposta vazia ou `not_configured` também conserva esse envelope; nunca vira `{}`.
2. O `Adaptador Input T28` recebe os envelopes e indexa por essa chave. Ele não lê
   `$('Set dados').first()`, `nodeFirst(...)` nem posição de array.
3. Cada linha normalizada herda o `client_id` do próprio envelope. Para entidades de mídia, o
   casamento acrescenta `entity_level + entity_id`; ausência ou conflito de chave roteia erro e
   bloqueia somente aquela fonte/cliente.
4. Antes de publicar, reproduzir localmente a ordem de `41535`: `CLI-13` sem GA4 primeiro e
   `CLI-4` depois. O resultado esperado é zero GA4/Clarity do KIL sob `CLI-13` e os mesmos valores
   sob `CLI-4`. Depois da publicação autorizada, a prova final é a rodada semanal natural.

### Destino do passivo — decisão do Olavo

| Opção | Custo e consequência |
|---|---|
| **Apagar as 6 linhas provadas** | menor risco de atribuição falsa, mas abre dois buracos históricos; destrutivo e exige autorização + inventário antes/depois |
| **Remarcar para `CLI-4`** | preserva a série e é defensável para `39103`/`41535` quando o payload prova KIL; maior risco de colisão no `MERGE` e exige conferir chave por chave |
| **Deixar declarado** | não reescreve história; exige exclusão explícita dos consumidores ou quarentena registrada, senão a nota continua usando dado contaminado |

Nenhuma opção foi executada nesta volta.

### ⚖️ Recomendação do planejador sobre o passivo — 2026-09-28

**Recomendo APAGAR as 6 linhas. Não remarcar.** E há um motivo de prazo que muda a ordem das coisas.

| Opção | Veredito | Por quê |
|---|---|---|
| **Apagar** | ⭐ **recomendada** | as 6 linhas **não têm dono legítimo onde estão**. Apagá-las não destrói informação: destrói uma **afirmação falsa** |
| **Remarcar para `CLI-4`** | ❌ **não** | é **reescrever história por inferência**. O payload sugere o KIL, mas *sugerir* não é *provar quem coletou* — e se o KIL já tiver linha nessas datas, o `MERGE` colide ou sobrescreve. **Trocar um dono errado por um dono deduzido não é conserto: é a mesma aposta, com mais confiança** |
| **Deixar declarado** | 🟡 **aceitável só como estado temporário** | funciona **enquanto não há consumidor** — e hoje realmente não há: **o índice ainda não foi construído**. Mas "declarado" só vale se **alguém precisar ler a declaração**, e a próxima pessoa a montar o pilar de Experiência **não vai ler este ADR** |

> 🔴 **A ordem importa, e ela não é óbvia:** apagar **antes** do conserto deixa o buraco e o defeito.
> **Conserte primeiro, recolete depois, apague por último** — assim o dado certo entra antes de o
> errado sair, e em nenhum momento a tabela fica pior do que está.

### ⏳ O prazo que ninguém pediu, e que decide se dá para recoletar

**As 6 linhas cobrem 13/09 e 20/09.** Recoletar depois do conserto **só é possível enquanto a fonte
ainda guardar aquele período**:

| Fonte | Janela de retenção | 13/09 ainda existe? |
|---|---|---|
| **GA4** | longa | 🟢 **sim**, com folga |
| **Clarity** | 🔴 **curta — a plataforma guarda poucas semanas** | ⚠️ **13/09 está no limite, e some primeiro** |

> **Se a recoleta do Clarity importa, ela tem data de validade** — e ela chega antes do conserto, se
> o conserto esperar. **Confirmar a retenção real do Clarity é a primeira medição da próxima volta**,
> e é barata. Se já tiver passado, a saída honesta é **apagar e declarar o buraco**, nunca
> reconstruir por estimativa (**S1**: o que não foi medido não vira número).

### ✅ Medido em 2026-09-29 — o prazo venceu, e a resposta certa não era recoletar

**A primeira medição da volta 3 derrubou a quarta premissa desta etapa — e esta era minha.**

**O que o executor mediu, antes de tocar em nó nenhum:**

| # | Medição | Consequência |
|---|---|---|
| **1** | a API usada consulta **só as últimas 72 horas** | 13/09 e 20/09 **morreram**. Recoletar Clarity é **impossível** |
| **2** | o cadastro **não tem** projeto/ID Clarity por cliente | não existe chave de cliente para casar |
| **3** | o nó usa **um único projeto fixo** em todas as passagens do `Loop` | o dado é **sempre do mesmo projeto**, seja qual for o cliente da vez |
| **4** | o payload **não devolve** `project_id` | o `source_id` **não pode vir da resposta** |

> 🔴 **O item 3 é maior que o defeito que fomos consertar.** O `nodeFirst()` grava o dado no cliente
> errado **por acidente de ordem**. O projeto fixo grava o dado do mesmo projeto em **qualquer**
> cliente **por construção** — e nenhuma correção de índice no adaptador conserta isso, porque não
> há o que indexar.

**A falta de um ID de projeto por cliente virou "vale para todos". É o quarto caso da R11 regra 1
nesta casa** — e o primeiro em que o vazio não estava num filtro nem numa busca, mas **na ausência de
um campo de cadastro**.

#### A decisão já existia, e eu não a li antes de escrever o brief

`saude-digital-do-negocio/CONTRATO-DE-FONTES-v0.md` **§1.1**, decisão do Olavo de **25/09**:

> *"`t28_clarity_daily` **deixa de ser fonte do índice** — a integração zerada **sai do parque em vez
> de entrar na fila de conserto**."*

**O brief da volta 3 pôs a Clarity na fila de conserto.** Escrevi o `CA2` como *"as **6 fontes**
carimbam..."* herdando o número da topologia do Agregador, **sem conferir o contrato de fontes** —
que é justamente o documento que manda na construção. É a **R7** quebrada por mim: não procurei o
que já existia. E é a **R6 corolário 2** no seu formato mais barato: *este número eu medi, ou eu li?*
**Eu nem li — eu contei nós.**

> **Custo de obedecer: um `grep`. Preço pago: o executor parou a etapa inteira esperando uma decisão
> que estava tomada havia quatro dias.**

#### O que fica decidido — e não é nenhuma das três opções apresentadas

🔴 **A porta da Clarity fecha com carimbo explícito. Ela não sai do envelope — ela entra no envelope
como "não configurada".**

| | |
|---|---|
| **O envelope continua cobrindo as 6 fontes** | o `CA2` **não reprova** — *"inclusive quando vazias"* é **exatamente** este caso |
| **O envelope da Clarity carrega** | `source_id = null` · `source_status = 'not_configured'` · **zero linhas** |
| **O vazio passa a ser "pare", escolhido** | hoje ele é **"todos"**, herdado. **É a diferença inteira** |
| **Ninguém perde consumidor** | a Clarity está **fora do índice** por decisão de 25/09; o **ADR-42** já a registra como *"hoje sem consumidor"* |
| **E isso é o M11, não conveniência** | *dado escrito tem consumidor declarado.* Sem consumidor, **escrever é o erro** — parar de escrever é o conserto |

**Por que não a opção 3 como foi proposta:** *"retirar a Clarity desta construção"* deixaria a porta
como está — **escrevendo linha para o cliente da vez**. Tirar do escopo não fecha porta. **Fechar a
porta é a correção; tirar do escopo era só adiá-la.**

**Por que não a opção 2:** criar configuração por cliente é construir cadastro, credencial e schema
para uma fonte que **não alimenta nada**. É o inverso da ordem certa.

**Por que não a opção 1:** declarar a Clarity como *"exclusiva do KIL/CLI-4"* põe a regra **dentro do
nó**, em comentário. No dia em que entrar um segundo projeto, a regra não avisa — **volta a escrever
para todos, em silêncio.** É o modo de falha da casa.

#### As três consequências que viajam com a decisão

| # | Consequência | Onde |
|---|---|---|
| **1** | 🔴 **`t28_clarity_daily` sai da lista do `V4` na mesma sessão** | o V4 pergunta *"toda tabela **que tem writer declarado** recebeu linha?"* — sem tirar, o vigia **grita todo dia para sempre**, e **alarme que sempre grita é alarme desligado** |
| **2** | as **2 linhas de Clarity** sob o `CLI-13` **se apagam e não se recoletam** | e o buraco **não precisa ser declarado a consumidor nenhum** — não há consumidor. O `S1` fica respeitado por não haver número |
| **3** | a porta **reabre por dado, não por código** | 🟢 **e o mecanismo já existe** — ver a leitura do artefato abaixo. O `id` mora no **cadastro do Notion** (`Get database clientes` → `Set dados`), não no `client_config`. 🔴 **Nada é criado agora** |

#### O que NÃO fica decidido aqui

**Aposentar a integração da Clarity** (o procedimento de 5 passos da **R5**) **não é esta decisão.**
Fechar a porta com `not_configured` já entrega o comportamento honesto sem mexer na topologia de um
workflow ativo na mesma sessão do conserto de identidade.

> **Gatilho da aposentadoria:** o **item 7 do §4 do contrato de fontes** — *"verificar se o script da
> Clarity está instalado"*. **Se não estiver, a ferramenta não serve nem ao novo papel**, e aí a
> integração se aposenta pela R5, com sticky e nome. **Duas pontas soltas que são a mesma ponta.**

### 🟢 Lido no ar em 2026-09-29 — o conserto da Clarity custa **um nó e uma linha**

**Li o Agregador ativo** (`versionId == activeVersionId == c54114b3-fdf3-46c7-83fb-20c3bdffee54`,
`sameAsDraft: true` — **R13** satisfeita) **antes de estimar o custo. A estimativa caiu por um
fator grande, e para baixo.**

#### O guarda que eu ia propor já existe — e foi construído em 18/08

| O que existe, vivo | Evidência |
|---|---|
| `Filtro GA4?` · `Filtro Google Ads?` · `Filtro GBP?` | três nós **antes** da chamada HTTP, testando `$('Set dados').item.json.id_ga4` / `id_google_customer` / `id_gbp_local` com `notEmpty` |
| `Reclassifica IDs (not_configured)` | nó de código que **já emite `source_status = 'not_configured'`** — exatamente o valor que esta decisão precisa |
| 🔴 **A Clarity não tem nenhum dos dois** | `HTTP Request Clarity` pende **direto da saída 1 do `Loop`**, ao lado dos filtros dos outros — **sem filtro, sem id, sem guarda** |

> 🔴 **O defeito que caçamos por duas voltas mora exatamente no buraco que o endurecimento de 18/08
> não cobriu.** A casa já tinha decidido, em agosto, que **fonte sem id não é chamada**. A Clarity
> ficou fora dessa decisão — e foi a única fonte cuja porta permaneceu aberta para todo mundo.

**O conserto, então, não é desenho novo. É o quarto irmão de três que já existem:**

| # | O que fazer | Molde |
|---|---|---|
| **1** | `Filtro Clarity?` antes do `HTTP Request Clarity`, testando `$('Set dados').item.json.id_clarity` com `notEmpty` | **cópia** do `Filtro GBP?` |
| **2** | uma linha em `Reclassifica IDs`: `na('clarity', hasClarity)` | as outras cinco já estão lá |

> **E o campo `id_clarity` não precisa existir para a porta fechar.** Campo ausente ⇒ `undefined` ⇒
> `notEmpty` falso ⇒ **zero chamadas, zero linhas, `not_configured` carimbado.** O dia em que um
> cliente tiver projeto de verdade, **o campo entra no cadastro do Notion e a porta abre sozinha —
> sem tocar em código.** É o vazio escolhido de propósito (**R11 regra 5**), e ele se abre por dado.
>
> ⚠️ **Correção do que escrevi antes nesta mesma sessão:** eu disse que o id entraria no
> `client_config`. **Errado.** Os três guardas leem do **`Set dados`, alimentado por
> `Get database clientes` — o cadastro do Notion.** Escrevi a intenção em vez de ler o artefato, que é
> a **R13 regra 3** contra a qual eu mesmo escrevi a regra.

**Ganho de brinde:** hoje o `HTTP Request Clarity` é chamado **uma vez por cliente, toda semana**,
sempre contra o mesmo projeto fixo. Fechar a porta **para de gastar a chamada**, além de parar de
gravar a linha.

#### 🔴 E achei um defeito novo, da mesma família, no próprio guarda

`Reclassifica IDs (not_configured)` lê os ids assim:

```js
const sd = $('Set dados').all();
const ids = (sd && sd[0] && sd[0].json) ? sd[0].json : {};
```

**`sd[0]` é o PRIMEIRO cliente. E o `Set dados` carrega todos** — é ele que alimenta o `Loop`
(`Get database clientes` → `Set dados` → `Code prepara datas` → `Loop`). O nó roda **uma vez por
rodada**, depois do laço, e aplica **a presença de id do primeiro cliente às linhas de todos**.

| | |
|---|---|
| **Os três filtros acertam** | usam `$('Set dados').**item**` — item pareado, um por cliente |
| 🔴 **O guarda erra** | usa `.all()[0]` — **identidade por posição**, o defeito deste ADR |
| **E ele diz isso no próprio comentário** | *"Lê os IDs do cliente **do mesmo jeito que o Adaptador** (primeiro item de `Set dados`)"* — e o jeito do Adaptador é **o defeito provado em 28/09** |
| **Estrago possível** | ele **não** rebaixa um `ok` (a guarda `ss[key] !== 'ok'` protege). Mas **converte `error`/`missing` em `not_configured`** para um cliente que **tem** o id, quando o primeiro cliente não tem |
| 🔴 **Por que isso é grave** | `not_configured` significa *"de propósito"*. **Transformar falha em ausência deliberada é desligar o alarme** — é a doença da **R11** na forma mais pura: o nó construído para evitar **falso alarme** pode produzir **falso silêncio** |

> **Não meça isto por dedução, meça.** Eu provei a **forma** (o `sd[0]`, e que o `Set dados` carrega
> todos os clientes). **Não medi uma ocorrência real.** Vale a **R6 corolário 2** contra mim mesmo:
> *este número eu medi, ou eu li?* **Li o código — não vi acontecer.**

### 🟡 O `sd[0]` foi medido e **não** apareceu — e por que isso não o absolve (**R6 corolário 1**)

**Registro obrigatório de hipótese não confirmada**, para a próxima auditoria não levantar o mesmo
alarme e o trabalho não se repetir.

| | |
|---|---|
| **Hipótese (minha, 29/09)** | o `Reclassifica IDs (not_configured)` lê `sd[0]` e aplica a presença de id do **primeiro** cliente às linhas de **todos** |
| **Medição** | execução **`44239`** (saudável) — **a ocorrência não apareceu** |
| 🔴 **Por que a medição não decide** | a `44239` rodou com **um cliente**. **Com um cliente, `sd[0]` É o cliente certo** — o defeito é *"aplica a todos"*, e não havia "todos". **A medição não refutou: ela não teve como testar** |

> **É a lição de 18/09 aplicada ao teste em vez do nó:** *"o que acontece no dia em que ela não pega
> nada?"* Aqui o teste **não pegou nada porque não havia o que pegar** — e um teste que não pode
> falhar não é prova, **é um verde a mais**.

**A forma permanece provada** (o `sd[0]` está no código; o `Set dados` carrega todos os clientes,
porque é ele que alimenta o `Loop`). **O que não está provado é a ocorrência.**

**E há uma guarda que torna o disparo raro:**

```js
const na = (key, present) => { if (!present && ss[key] !== 'ok') ss[key] = 'not_configured'; };
```

`ss[key] !== 'ok'` **protege fonte que respondeu bem.** O estrago exige **três condições juntas**:
(1) mais de um cliente na rodada; (2) o **primeiro** sem um id que um **posterior** tem; (3) essa
fonte **não** ter retornado `ok` para o posterior.

| | |
|---|---|
| **Classificação** | **defeito real na forma · raro no disparo · silencioso quando dispara** |
| 🔴 **Por que ainda importa** | quando dispara, troca `error`/`missing` por `not_configured` — **troca um alarme por um "de propósito"**. Um falso alarme incomoda; **um alarme que não toca engana** |
| 🟢 **Decisão (29/09)** | **não consertar nesta volta.** Fica **latente, com a condição de disparo escrita**. O conserto — leitura pareada por `client_id`, como manda este ADR — viaja **na próxima vez que esse nó for aberto** |
| **Por quê não agora** | é obra nova em produção no mesmo dia de outra obra, e a **R11** é explícita: *salvaguarda é código novo e exige o mesmo smoke que a mudança que ela protege* |
| **Onde o teste sai de brinde** | o **teste da ordem invertida** (`CLI-13` sem GA4, depois `CLI-4` com GA4) é **exatamente** a condição 1+2. **Um teste, dois critérios** |

### ✅ CONFIRMADO em 2026-09-29 (`44493`) — o `sd[0]` dispara, e não é raro

**A seção anterior classificou este defeito como *"raro no disparo"* e decidiu deixá-lo latente. As
duas coisas caíram na mesma execução.**

| | |
|---|---|
| **Execução** | `44493`, manual, sucesso — `CLI-13` primeiro **sem ids**, `CLI-4` depois **com** os seus |
| **O que aconteceu** | `CLI-4` tinha `id_gbp_local = 269166995970029765`, e **depois do `Reclassifica IDs` o `gbp` ficou `not_configured`** |
| **Causa** | confirmada: `$('Set dados').all()[0]` — os ids do **primeiro** cliente aplicados aos demais |
| 🟢 **E ao lado, a boa notícia** | **`CA4` passou**: o Normalizador emitiu linhas **só sob `CLI-4`**, **nenhuma sob `CLI-13`** — o conserto de identidade funciona **na ordem exata que causou o defeito original** |

#### Por que *"raro"* estava errado

**A terceira condição de disparo era** *"a fonte não ter retornado `ok` para o cliente posterior"*.
Tratei isso como coincidência. **Para o GBP é permanente:** enquanto a cota do Google for **zero**, o
GBP **nunca** retorna `ok`. Logo, para o GBP, o defeito dispara **toda rodada em que um cliente sem
`id_gbp_local` venha antes de um que tenha**.

> 🔴 **E o estrago não é um número errado — é um alarme trocado.** `error`/`missing` vira
> `not_configured`: *"falhou"* vira *"é assim de propósito"*. **Quem lê `source_status` lê silêncio
> onde havia falha.**

> ⚠️ **Hipótese levantada, não medida:** parte do motivo de o GBP ter ficado **três meses morto sem
> ninguém ver** pode ser este nó. 🔴 **A causa-raiz do GBP não muda** — é cota zero, medido. **O que
> este defeito explicaria é o silêncio, não a falha.** Checagem barata: olhar o `source_status`
> histórico do `gbp` e ver se diz `not_configured` em vez de `error`. **Fica registrada; não bloqueia
> nada** (**R6 corolário 1**).

#### Decisão revertida — consertar antes de publicar

| Antes | Agora |
|---|---|
| latente, conserta quando alguém abrir o nó | 🟢 **conserta agora, no mesmo draft, antes da publicação** |

**Motivos:** (1) as duas premissas da decisão anterior caíram; (2) o nó **já está aberto e não
publicado** — custa uma linha e **uma republicação a menos**; (3) 🔴 **o GBP volta entre 08 e
13/10**, e publicar como está é decidir que ele volta para dentro de um cano que **mente sobre ele**.

> ⚠️ **O argumento contrário, registrado:** o defeito é **pré-existente em produção** — publicar o
> draft **não o introduz**. Era a defesa de *"publica agora, conserta depois"*. **Perde para o motivo
> 3:** a pergunta não é se piora, é **o que estará no ar quando o GBP voltar**.

**O conserto:** índice `client_id → ids` montado do `Set dados`, procurado **por chave**. 🔴 **Chave
ausente ⇒ não reclassifica e sinaliza — nunca cair para `[0]`, nunca para "todos"** (**R11 regra 1**,
que é exatamente o que criou este defeito). A guarda `ss[key] !== 'ok'` **fica**.

### ✅ AS-BUILT — 2026-09-29: a extensão do ADR-33 no Agregador está NO AR

**O real bate com o desenho.** Registrado na mesma sessão (**R2**).

| O que foi construído | Onde |
|---|---|
| carimbo por **`client_id` + `source` + `source_id` + janela**, conservado inclusive quando vazio | Agregador `ecec7073-a8ef-4d98-9502-ba2fb8c08d67` |
| adaptador **indexa por chave** — saiu o `nodeFirst()`, saiu a posição de array | idem |
| `Filtro Clarity?` — **porta fechada**, `not_configured`, zero linhas, zero chamadas | idem |
| `Reclassifica IDs` — **índice por `client_id`, sem fallback posicional**; chave ausente **preserva o status** e emite **`CLIENT_IDS_NOT_FOUND`** | idem |
| `t28_clarity_daily` fora do `V4` | vigia `9f443157-8787-444a-9bf0-11d1fd3d7981` |
| **rollbacks preservados** | Agregador `c54114b3-…` · V4 `125b437b-…` |

**As provas, contra o draft final:**

| Teste | Resultado |
|---|---|
| saudável `44507` | GA4 orgânico 20 / pago 4 · GBP **`error`** · Clarity **`not_configured`** |
| 🎯 invertido `44510` | **zero linhas sob `CLI-13`** · só `CLI-4` · **GBP continuou `error`** |

> 🟢 **O `CA13` passou no lugar exato onde havia falhado:** na `44493` o GBP virava
> `not_configured`; na `44510` ele **segue `error`**. **O alarme voltou a tocar** — e a API do GBP
> volta do Google entre **08 e 13/10**, para dentro de um cano que agora diz a verdade sobre ela.

> 🟢 **`CLIENT_IDS_NOT_FOUND` é a R11 regra 1 cumprida ao pé da letra.** Chave ausente não virou *"o
> primeiro"* nem *"todos"* — virou **sinal com nome**. É assim que o guarda devia ter nascido em
> 18/08.

#### 🔴 Achado do fechamento: o Agregador não sabe fazer backfill

A recoleta de 13/09 e 20/09 **parou no gate do §5**: duas datas exigem **duas trocas de janela**, e
uma alteração única que emitisse as duas **exigiria mexer no adaptador** — *"ele agrupa somente por
cliente e colapsaria as janelas"*.

| | |
|---|---|
| **O que isso é** | **uma rodada = uma janela.** Para um workflow semanal nunca incomodou |
| 🔴 **Quando vai doer** | **no dia em que o Índice de Saúde Digital precisar de histórico.** É a parede que espera aquela frente |
| **Encaminhamento** | **tarefa própria, não construir agora.** Registrar para a frente do Índice saber |

#### A recoleta saiu — e com ela mudou a justificativa do apagamento

**O Olavo autorizou apagar em 28/09 sob a premissa** *"recoletar primeiro, apagar depois"*. **Sem
recoleta, apagar deixa de ser troca e vira perda** ⇒ premissa diferente ⇒ **decisão nova, dele**
(**R6**: antes de ação irreversível, verifique a premissa que a justifica, **mesmo com o plano
aceito**).

**Recomendação registrada: apagar mesmo assim** — (1) linha sob o cliente errado é **afirmação
falsa**, pior que buraco; (2) **o GA4 ainda tem o dado** — falta caminho de ingestão, não fonte; (3)
remarcar exigiria afirmar que as linhas **são do `CLI-4`**, e provamos apenas que **não são do
`CLI-13`** — *escrever inferência em tabela de fato foi como chegamos aqui*; (4) o conserto **já está
no ar**, então apagar não deixa mais *"buraco E defeito"*.

### 🔴 E o passivo maior está ao lado, não medido

A mesma volta encontrou **318 linhas de `t28_campaign`, 2 de `t28_ga4_landing` e 1 de
`t28_clarity_daily` com `client_id` NULO**. **Isso é 53× o passivo que acabamos de medir** — e é
outro defeito: não é dono trocado, é **dono nenhum**.

| | |
|---|---|
| **Não se mistura com este** | são causas diferentes e consertos diferentes |
| **Já tinha sido visto** | o `PLANO-F3` §4 registra *"a `t28_campaign` tem 318 linhas de teste sem cliente dentro de `phi_prod`"* — e por isso o **V4 filtra `client_id IS NOT NULL`** |
| 🔴 **O que isso significa** | **o vigia está passando por cima delas de propósito.** Foi a decisão certa para o vigia funcionar, **e criou um ponto cego declarado**: 318 linhas que ninguém olha e ninguém conta |
| **Encaminhamento** | **etapa própria**, depois desta. **Não apagar por conta** — "linha de teste" é rótulo herdado, não medição (**R6, corolário 2**) |

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

**Design de implementação (o "como"):** ver anexo
`ADR-33-anexo-design-gatilhos-identidade.md` — mudança por nó, ordem faseada (A → B1 → B2 →
B3 → B4), decisão de produto pendente (no-data ⇒ linha ou não) e plano de verificação.

---

*🟢 **Aceito em 2026-09-28 para o Agregador.** As quatro condições continuam valendo para os
writers originais, cujo escopo NÃO foi liberado: (a) granularidade confirmada, (b) baseline salvo,
(c) OK de budget do Olavo, (d) smoke em KIL antes de publicar.*
