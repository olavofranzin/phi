# Fase 4: desvio em Campanhas + matar os `.first()` + "Fora da Meta?" - Execution Log

Data: 2026-08-08
Branch: claude/consolidacao-2026-08
Brief: docs/handoff/2026-08-08-fase4-campanhas-first-forameta-brief.md
Fases anteriores: commits `1dd1459` (prefixo) · `820b895` (tendencia) · `79956ab` (desvio indefinido)

> **Resultado:** os 4 itens (A, B, C, D) aplicados e publicados. Aceite verde na pagina da
> barbearia: **Crítico / Alta / score 60 / "CPA 76.3% acima" / Fora da Meta? = YES**, sem
> nenhum anuncio com `analise_desvios` de outro. Smoke rodado ANTES de cada publicacao.
> Item A saiu antes das 07:00.

---

## Estado inicial

| Workflow | id | activeVersionId antes | activeVersionId depois |
|---|---|---|---|
| sw metricas campanhas | `W571K320aqIHsdtH` | `bb59dde5-d7c5-4a67-91e7-12d88672d177` | **`67e0366e-68b5-4355-86dc-463882e0951b`** |
| sw metricas anuncios | `vVAdXAJh6MW2Z5Hp` | `b40de4dd-c639-4f33-9da2-fb3624784358` | **`96dd7975-1da5-43ca-a49a-d319e84e4cdf`** |

**Rollback:** `restore_workflow_version` -> `bb59dde5` (campanhas) · `b40de4dd` (anuncios).

---

## Item A - `sw metricas campanhas`: mesmo bug de desvio da fase 3

Dois nos alterados, copia direta da fase 3 adaptada ao contexto de campanha:

### `Code calculo desvio meta`
- `calcDesvio` devolve `{valor, desvio: null, desvio_motivo}` quando meta/valor sao 0 - nunca `0`.
- `calcTendencia` devolve `null` (nao `0`) quando indefinido.
- `.first()` cross-node (`Code Unificar Períodos` / `Code Cálcula Métricas`) removido; `v_7d`
  sai do proprio item (`metricas_calculadas.d7[chave]` -> campo plano -> `valor_real`); `v_d1`/`v_3d`
  do item, sem fallback -> INDEFINIDO se ausentes.

### `Code classificar status` (versao antiga, gate binario - preservado)
- Guarda `d7 === null` **antes** de comparar (armadilha `null <= 0`); ramo "Sem Dados" com
  `final_score: null`.
- Comparacoes de tendencia/D1 exigem `!== null`.
- **Nao mexi no `.first()` do HTTP D7 desse no** (fora do escopo do Item B, que e so anuncios).
  Registrado como pendencia.

**Aceite (Item A) - smoke exec `26175` (`success`):**

| campanha | `bq_campaign_id` | d7.desvio (antes: 0) | status_meta (Notion) | final_status |
|---|---|---|---|---|
| Meta CHA | META-120223097083780450 | null | No Alvo ? | Sem Dados |
| **BARBEARIA** | GADS-21149189736 | **18.65** | **Acima da Meta 🚨** | Dados Insuficientes* |
| **SALÃO** | GADS-21116045403 | **27.14** | **Acima da Meta 🚨** | **Crítico** |

Nenhuma campanha diz "dentro da meta" com CPA fora. O SALÃO e a prova limpa (Crítico, 27,14%).

> *BARBEARIA cai em "Dados Insuficientes" pelo **gate binario pre-existente** do classificador
> de campanhas (`MIN_CONV_7D = 10`; ela teve 3 conv em 7d). Isso e honesto (nao "dentro da
> meta") e e outra coisa - a escada de evidencia da fase 3 nunca foi portada para o
> classificador de campanhas. Ver pendencia 2.
>
> **Nota sobre o alcance no Notion:** o `Update a database page` de campanhas escreve **apenas
> metricas** (CPA, CPC, ...), nao `final_status`/`analise_desvios`. O unico veredito textual
> que a pagina de campanha recebe e `status_meta` (calculado por outro caminho, ja correto:
> "Acima da Meta 🚨"). Ou seja, o bug de desvio em campanhas era interno; nenhuma pagina de
> campanha exibia "dentro da meta". Ainda assim a correcao e necessaria: `analise_desvios` e
> `final_status` agora estao certos para qualquer consumidor futuro, e o `.first()`/`return 0`
> foram eliminados.

---

## Item B - matar a classe `.first()` (3 nos de `sw metricas anuncios`)

Topologia confirmada (exec 26168): `Code Recupera Metas` e `Code classificar status` rodam
**4x** (todos os anuncios, apos o Merge Meta); `Edit Fields`, `HTTP D1/D3/D7` e
`Code Unificar Períodos` rodam **2x** (so Google). E essa divergencia de contagem que o
`.first()` transforma em vazamento.

| no | `.first()` alvo | dado | **fix escolhido** | por que |
|---|---|---|---|---|
| `Code Unificar Períodos (D1, 3D, 7D)` | `HTTP D1/D3/D7`, `HTTP (D30)`/`v23 Bloco 1 Core` | por-item | **casar por ID** (`campaign.id`) | o input do no JA E a resposta D7 do anuncio corrente -> dela sai o id alvo; D1/D3/D7 selecionam `campaign.id`, entao `.all().find(por id)` casa certo. Fallback: `{}` (nunca outro anuncio). |
| `Code Recupera Metas p Comparação` | `$('Edit Fields').first().json.meta_valor` | por-item | **ler do proprio item** (`data.meta_valor ?? sop_config.meta_valor ?? clean_meta_metrica_mae`) | o item NAO tem id estavel aqui (clean_* ja espalhados por `Code Valida Dados`), mas a meta ja RIDE no item para anuncios Google. Sem id, casar por valor-no-item e o correto. |
| `Code classificar status` | `$('HTTP D7').first()` (fallback de volume) | por-item | **remover o fallback** (usar so `raw_*_7d` do item) | o item nao tem id (clean_* espalhados) e o HTTP rodou contagem diferente -> nem id nem indice alinhado sao seguros. Os `raw_*_7d` do item sao autoritativos; 0/0 -> gate (correto). |

**Validacao antes de aplicar (Node, dados reais):**
- Unificar id-match reproduziu os valores por-anuncio corretos: CORTE `v_d1=3.04, v_3d=9.15`
  (batendo com a resposta D1/D3 da campanha 21116045403), BARBEARIA os seus. `id_ok=True` nos 2.
- classificar (novo): mesmos `final_status`/`score` da fase 3 (BARBEARIA Crítico/60, CORTE
  Crítico/30), e o harness lanca excecao se `.first()` for chamado -> nao foi.

**STOP-and-register do brief acionado (parcialmente):** ao tentar casar por id em
`Code Recupera Metas` e `Code classificar status`, confirmei que **o item nao carrega mais os
campos de identidade** (`clean_id_*`, `clean_nome_*`, `clean_plataforma` todos ausentes ja em
`Code Recupera Metas`). E o mesmo `Code Valida Dados` espalhando a resposta da API por cima
dos campos limpos que diagnostiquei na fase 1. Nao forcei id-match onde nao ha id: usei
leitura-no-item (Recupera) e remocao do fallback (classificar). Consequencia colateral: a
correcao do `Code Unificar Períodos` produz `v_d1/v_3d` corretos, mas eles sao **estripados
por `Code Valida Dados`** antes de chegar ao desvio - por isso `d1` continua `null` a jusante
(o que e inofensivo: a regra D1 esta morta, ver Item D). O Unificar id-match continua valendo
como blindagem contra o vazamento e para os campos que sobrevivem (`v_7d`, `raw_*`).

---

## Item C - `Fora da Meta?` (checkbox)

`Fora da Meta?` e um **checkbox** no DB Anuncios (`__YES__`=true / `__NO__`=false / NULL->false),
nao escrito por nenhum workflow ate agora.

- **`Code Diagnóstico Criativo`** (uma variavel nova, derivada do status que ja existe):
  ```js
  let ad_fora_da_meta = null;                       // indefinido/Sem Dados/Em Aprendizado -> null
  if (finalStatus === 'Crítico' || finalStatus === 'Atenção') ad_fora_da_meta = true;
  else if (finalStatus === 'OK') ad_fora_da_meta = false;
  ```
- **`Update a database page`** (23 -> **24** propriedades): nova propriedade `Fora da Meta?|checkbox`.
  Quando `ad_fora_da_meta` e `null` (indefinido), a expressao **mantem o valor atual da pagina**
  (`$('Get database anuncios').item.json.properties?.['Fora da Meta?']?.checkbox ?? false`),
  honrando o "nao escrever quando indefinido". Usa `.item` (pareado), consistente com o `pageId`
  do mesmo no.

---

## Item D - D1/D3 inexistentes: regra dormente marcada

`Code Cálcula Métricas` so produz janelas 7d e 30d; D-1 nunca existe neste fluxo. Em
`Code classificar status` (anuncios), o ajuste "pico D-1" (`if (d1 > 30)`) e o desconto de
score por `d1` **nunca disparam** - `d1` e sempre `null` e as guardas null-safe da fase 3 ja
o respeitam. Marquei a regra como **morta/dormente** com um comentario explicito no no. **Nao
calculei D1/D3** (seria escopo novo sem demanda). Zero mudanca de comportamento.

---

## Publicacao e smoke

| Workflow | smoke (antes do publish) | resultado |
|---|---|---|
| sw metricas campanhas | exec `26175` `success` | Item A ok -> publicado `67e0366e` |
| sw metricas anuncios | exec `26180` `success` | B+C+D ok -> publicado `96dd7975` |

### Aceite consolidado - `AD01-PMAX_BARBEARIA_10/01/26` (exec `26180`, valores escritos no Notion)

| campo | esperado | **observado** | |
|---|---|---|---|
| `ad_diagnostico` | desvio ~76% | **"CPA 76.3% acima da meta em 7d; tendência Sem dados [evidência parcial: 30d]."** | OK |
| `ad_status_operacional` | Crítico | **Crítico** | OK |
| `ad_prioridade_otimizacao` | Alta | **Alta** | OK |
| `ad_score_operacional` | calculado (nao 100/vazio) | **60** | OK |
| `Fora da Meta?` | YES | **true (__YES__)** | OK |

**Sem vazamento entre anuncios** (Item B): na 2a passada do anuncio Meta (run 3),
`analise_desvios.d7 = null` (nao os numeros do CORTE.CABELO como na exec 26161 pre-fix).
Os 4 runs:

| run | anuncio | d7 | status | prio | score | Fora da Meta? |
|---|---|---|---|---|---|---|
| 0 | AD01-VID_9x16 (Meta) | null | Sem dados | Baixa | — | false (mantido) |
| 1 | **AD01-PMAX_BARBEARIA** | `{6.17, 76.29}` | **Crítico** | **Alta** | **60** | **true** |
| 2 | AD01-PMAX_CORTE.CABELO | `{4.45, 27.14}` | Crítico | Urgente | 30 | true |
| 3 | AD01-VID_9x16 (2a passada) | null | Sem dados | Baixa | — | false (mantido) |

Anuncios Meta (indefinido): `Fora da Meta?` **manteve o valor existente** (false) em vez de
derivar do status - comportamento pretendido do Item C.

---

## `.first()` restantes no instance (mapa, nao corrigidos)

Apos a fase 4, em `sw metricas anuncios` **nao ha mais** `.first()` cross-node por-item nos 3
nos alvo. Restam:
- `Code Recupera Metas p Comparação`: `$input.first()` - e o **input do proprio no** (1 item por
  run), nao cross-node. Legitimo.
- `sw metricas campanhas` / `Code calculo desvio meta`: **corrigido** no Item A.
- `sw metricas campanhas` / `Code classificar status`: **ainda tem** `$('HTTP D7').first()`
  (fallback de volume). Fora do escopo (Item B era so anuncios). So dispara quando o item tem
  clicks7d/conv7d ambos 0; mesma classe de risco. Ver pendencia 1.
- Outros `.first()` no instance (fora destes 2 workflows) nao foram tocados.

---

## Pendencias para o Olavo

1. **`sw metricas campanhas` / `Code classificar status`** ainda tem `.first()` no fallback de
   volume (HTTP D7) e usa o **gate binario antigo** (`MIN_CONV_7D=10`), nao a escada de
   evidencia da fase 3. Efeito: campanhas de baixo volume (ex.: BARBEARIA, 3 conv) ficam
   "Dados Insuficientes" em vez de classificadas. Portar a escada de evidencia + matar o
   `.first()` la seria a proxima simetria. (Nao no escopo desta fase.)

2. **`Code Valida Dados` (RAIZ)** continua espalhando a resposta da API por cima dos campos
   limpos (`clean_id_*`, `clean_nome_*`, `v_d1/v_3d`, `calc_context`). E o que:
   (a) impede casar por id em `Code Recupera Metas`/`Code classificar status` (tive de usar
   leitura-no-item e remocao de fallback); (b) estripa os `v_d1/v_3d` corretos do
   `Code Unificar Períodos` antes do desvio. Enquanto existir, hardenings por-id ficam
   limitados. Merece um brief proprio para preservar a identidade do item ao longo da cadeia.

3. **`Merge Meta Ads` / passada duplicada do anuncio Meta** (4 runs para 3 anuncios): so
   registrado, conforme instrucao. O Item B neutralizou o vazamento que ela causava (agora id-
   match / item-only), mas a causa (o Merge processar o Meta duas vezes) segue de pe e escreve
   a pagina do Meta duas vezes. Brief separado.

4. **D1/D3**: decisao registrada de NAO calcular. Se o Olavo quiser o ajuste "pico D-1" vivo,
   precisa coletar D-1 por anuncio (novas chamadas de API) - escopo novo.

---

## Fora de escopo respeitado

- Prefixo `=` de outras queries: intocado.
- `Execute SQL inserir daily entry` e `BigQuery Persistir Sinais Criativo`: intocados.
- `PHI - Subworkflow Campanhas`: NAO arquivado (vivo, chamado pelo Pipeline_v2 - fase 2).
- Passada duplicada do Meta: so registrada.
- D1/D3: nao calculados.
- Sem force-push, sem deletar branch, sem PR.

## Como verificar

1. `get_workflow_details` `W571K320aqIHsdtH` -> activeVersionId `67e0366e`; `Code calculo desvio meta` sem `return 0`/sem `.first()`.
2. `get_workflow_details` `vVAdXAJh6MW2Z5Hp` -> activeVersionId `96dd7975`; Update com 24 props (inclui `Fora da Meta?|checkbox`); Unificar com `pickById`; Recupera/classificar sem `.first()` cross-node.
3. `get_execution` `26180` node `Update a database page` run1 -> Crítico/Alta/60/`Fora da Meta?`=true; run3 (Meta) `analise_desvios.d7`=null.
4. `get_execution` `26175` node `Code calculo desvio meta` -> SALÃO d7.desvio=27.14 (era 0), final_status Crítico.
