# CONTRATO DA FRENTE PROSPECÇÃO — documento canônico

> **Status:** ✅ **VIGENTE** desde 2026-09-08 (aprovado pelo **ADR-35**) · **Origem:** 2026-08-28
> ⚠️ **As-built desatualizado.** As seções §6 e §9 descrevem o estado de 2026-08-28. O estado REAL
> dos workflows está no **`ADR-35` §3** (inventário do n8n em 2026-09-08). Em caso de divergência,
> **o ADR-35 §3 vale**. Os invariantes e a matriz de colunas (§3, §4, §5) continuam válidos.
> **Escopo:** quem grava o quê na planilha `leads` e no CRM, e o que não pode mudar sem ADR.
> 🔴 **2026-09-08 — nomes de coluna mudaram.** O Olavo renomeou o bloco `hubspot*` para `crm*` na
> planilha (`id_hubspot` → **`id_crm`**, confirmado; os demais a confirmar). O CRM canônico passou a
> ser o **Odoo** (**ADR-36**). A matriz do §3 abaixo ainda usa os nomes antigos — ler junto com o
> **ADR-36 §4.2/§4.3**, que tem os nomes novos e o risco dos workflows apontarem para os antigos.
>
> **Regra de precedência:** divergência entre este contrato e um workflow é **bug do workflow**.
> Divergência entre este contrato e a planilha real é **bug do contrato** — corrigir aqui primeiro.

---

## 0. Por que este documento existe

Hoje não é possível responder **quem grava, quem apaga e quem some com registro**. Nas últimas 48h,
com o sistema em produção, encontramos:

| Achado | Consequência |
|---|---|
| `Site L4` gravava `"="` em `enriquecimento` e `site_tipo` | Apagava coluna de outro dono |
| `1º Enriquecimento` com `executeOnce` dentro do loop | Só o 1º lead do lote recebia `id_hubspot` |
| Linhas criadas só com `place_id` | Gemini recusava, a recusa marcava a linha como pronta **para sempre** |
| Deduplicador filtra por `dealstage` sem pedir `dealstage` | **Nunca encontrou uma duplicata** |
| 3 intakes idênticos ativos ao mesmo tempo | Disparo duplicado |
| 4 nós fazendo `appendOrUpdate` sem garantir a chave | Risco de linha órfã em 4 lugares |

Nenhum desses é um bug difícil. **Todos são consequência de não haver dono declarado por coluna.**

---

## 1. Princípio único

> **Uma coluna, um dono.**
> Cada coluna da aba `leads` tem exatamente **um** workflow autorizado a escrevê-la.
> Todos os outros podem ler; nenhum outro pode escrever — nem para "limpar", nem para "atualizar".

Tudo neste documento decorre disso.

---

## 2. Arquitetura alvo — 7 workflows

```
[P1 Intake]  nicho + região
     │
[P2 Descoberta]  Places API  ──▶ chave · identidade · feature(GBP) · controle
     │
[P3 Scoring]  motor de regras ──▶ scoring
     │
     ├──▶ [P5 CRM-out]  cria deal ──▶ id_hubspot
     │
[P4 Enriquecimento]  Apify + IA ──▶ enriquecimento · analise_gbp_ia   (só fila ≥ corte)
     │
[P6 Aprendizado]  HubSpot → planilha ──▶ as 17 colunas de aprendizado
     │
[P7 Zeladoria]  guarda-schema · backup diário · dedup
```

| # | Workflow | Papel — uma frase | Base atual |
|---|---|---|---|
| **P1** | Intake | Recebe nicho + região e dispara P2. **Não escreve na planilha.** | `Intake - Telegram API` (`kmsaomlIzj48YnCL`) — **decidido D2** |
| **P2** | Descoberta | Única fonte de identidade e métricas do GBP. Escreve a linha nova. | `L2b (Places API)` |
| **P3** | Scoring | Motor determinístico. Único a escrever score, dimensões e oferta. | motor de regras do `L2` |
| **P4** | Enriquecimento | Apify + IA nos leads acima do corte. Escreve só texto de enriquecimento. | `L3` |
| **P5** | CRM-out | Cria/atualiza o **DEAL** e grava `id_hubspot`. **Único a escrever no HubSpot.** Não cria Company — ver D1 | `5VRPLUB3` + parte do `1º Enriquecimento` |
| **P6** | Aprendizado | Lê o HubSpot, escreve as 17 colunas de aprendizado. **Nunca altera o CRM.** | `WRFU2NM8rLJU7bRT` ✅ já correto |
| **P7** | Zeladoria | Guarda-schema, backup diário, dedup. Não escreve dado de lead. | `vUI0pPlDASf64Htn` + `izimrLm19H4i6LOq` |

**Tudo o que não estiver nesta lista é arquivado.**

---

## 3. Matriz de propriedade — as 63 colunas

| Bloco | Colunas | **Dono** | Momento |
|---|---|---|---|
| **chave** | `id` (place_id) | **P2** | criação da linha |
| | `id_hubspot` | **P5** | após criar o deal |
| **identidade** (9) | `nome`, `contato`, `Cidade`, `Estado`, `Bairro`, `CEP`, `Endereço`, `Rua/Avenida` | **P2** | criação |
| | `e-mail` | **P4** | extraído do site |
| **feature** (16) | `setor`, `site`, `Categoria 1/2`, `Searchstring`, `Posição Pesquisa`, `Quantidade reviews`, `Avaliação`, `Quantidade fotos`, `Horário` | **P2** | criação |
| | `Patrocinado`, `Atributos`, `Agendamento`, `Posts` | **P4** | só Apify observa |
| | `enriquecimento`, `enriquecimento_site` | **P4** | após o agente |
| **controle** (2) | `data extração`, `mês extração` | **P2** | criação |
| **scoring** (18) | `potencial_comercial`, `oferta_recomendada`, 6 × `dim_*`, `site_tipo`, `flags_score`, `data_processamento_score`, `score_gbp`, `modelo_versao` | **P3** | após P2 |
| | ~~`score_tecnico`~~, ~~`ipc`~~ | — | ⛔ **não existem no cabeçalho** — ver ressalva 2 abaixo |
| | `fit`, `oportunidade` | **P3** | após P2 — **os dois eixos** do `potencial_comercial` |
| | `nao_reivindicado` | **P4** | só Apify observa |
| | `analise_gbp_ia` | **P4** | após o agente |
| **aprendizado** (17) | `status hubspot` *(estágio — D4)*, `hubspot_status`, `motivo_perda`, `motivo_ganho`, `valor`, `via_aquisicao`, `num_interacoes`, `ultimo_contato`, `data_criacao_deal`, `data_fechamento`, `dias_no_funil`, `probabilidade`, `nba_recomendada`, `nba_aceite`, `abordagem_ia`, `acerto_previsao`, `data_sync_hubspot` | **P6** | a cada 6h |
| | `sync_por` | **P6** | a cada sincronização |
> **`fit` e `oportunidade` (documentadas 2026-09-13 — existiam na planilha sem registro aqui).**
> Não são scores soltos: são **os dois eixos cujo produto vira o `potencial_comercial`**, com rank
> percentil dentro da mesma `Searchstring` (Fase 3.1, já as-built no **PROSP-03** — ver ADR-35 §3).
> - **`fit`** = *este negócio é um bom cliente?* (porte, qualidade, viabilidade de contato)
> - **`oportunidade`** = *tenho o que vender a ele?* (gap de fundação **ou** prontidão para ADS)
>
> São o **porquê** do score: `potencial_comercial = 72` não diz o que oferecer; `fit` alto com
> `oportunidade` baixa é outra conversa que o inverso. É o **I9** em duas colunas.
>
> ⚠️ **`score_gbp` precisa de verificação de vida.** O contrato o lista como P3, mas quem o escrevia
> era o **`GBP Scoring - L2 Discovery`** (`5j79f7oR8x1Nxs4q`) — a cadeia **L2→L3→L4** que o PROSP-03/04
> **substituiu**. Se nada mais escreve nele, é **coluna órfã de pipeline aposentado**, e o caso é o
> procedimento de aposentadoria da **R5**, não migração para o Odoo.

| **descontinuada** | `hubspot_estagio` | — | **D4:** ninguém escreve. O estágio vive em `status hubspot` |

> **`sync_por` (adicionada 2026-09-13, decisão Olavo — coluna criada à mão na planilha).**
> Guarda **quem** sincronizou a linha (hoje, sempre `P6`). Existe porque `data_sync_crm` guarda
> **quando**, e juntar os dois fatos na mesma célula transformaria a data em texto — quebrando a
> comparação *"mudou desde a última sincronização?"* de que a rotina agendada do P5 depende.
> **Um fato por coluna.** Mesma razão do `ingestion_step` no BigQuery.
>
> ⚠️ As colunas `status hubspot`, `hubspot_status` e `data_sync_hubspot` **serão renomeadas** para
> `status_crm` e `data_sync_crm` no sub-chat de troca do CRM
> (`docs/handoff/2026-09-13-prosp05-prosp06-odoo-subchat-brief.md`). Esta tabela é atualizada lá.

## A trava de sobrescrita — quando o P5 para de escrever num lead

> Decisão do Olavo, 2026-09-13. Substitui a regra "depois do CRM a planilha congela", que não
> funcionava: o **P4 escreve enriquecimento depois** de o lead já estar no CRM, e isso é trabalho
> do pipeline, não edição humana.

**A regra nova:**

> O **P5 atualiza um lead que já existe no CRM apenas enquanto ele estiver no primeiro estágio
> (`Prospeccao`). A partir do segundo, o lead é do humano — o P5 nunca mais escreve nele.**

Por que é melhor que congelar a planilha:

- **É o dado que decide, não a política.** Não depende de ninguém lembrar de não digitar. O estado
  do CRM é a trava, e ele é verificável.
- **Não atrapalha o pipeline.** Enquanto o lead está em Prospecção, P3 repontua e P4 enriquece
  livremente, e o P5 leva tudo. A porta fecha exatamente quando o vendedor encosta no lead.
- **Protege o trabalho humano.** Um telefone corrigido na mão, uma anotação, um campo ajustado —
  nada disso é sobrescrito por uma rodada de sincronização.

**Onde mora:** no **P5**, não no P6. O P6 só lê o CRM (**I8**); quem escreve no CRM é o P5, então
a trava tem de estar em quem escreve. A criação de lead novo não é afetada — lead novo nasce em
Prospecção.

**Como é verificada:** o `getAll` do P5 já traz o lead buscado por `gbp_place_id`; pede-se o campo
`stage_id` e compara-se com o **ID numérico** do primeiro estágio, guardado num `Set` de
configuração (`estagio_aberto_id`), **não enterrado num IF**.

**Por que ID e não nome** (decisão Olavo, 2026-09-13): renomear o estágio na tela é uma ação
comum e inocente — e quebraria uma trava que compara texto, em silêncio, liberando escrita sobre
lead que já é do vendedor. O ID não muda quando o rótulo muda.

### Os 6 estágios — ID, nome e sequência

Lidos do `crm.stage` da instância em **2026-09-13** (execução `38869`, leitura pura):

| sequência (pipeline) | nome | **ID** | `is_won` |
|---|---|---|---|
| 1 | **Prospecção** | **`1`** | não |
| 2 | Aguardando Aceite | `5` | não |
| 3 | Em Cadencia | `6` | não |
| 4 | Conversa Aceita | `2` | não |
| 5 | Escopo e Proposta | `3` | não |
| 6 | Ganho | `4` | **sim** |

> ⚠️ **O ID não segue a ordem do pipeline.** Os quatro estágios nativos reaproveitados ficaram com
> 1–4; os dois que criamos (`Aguardando Aceite`, `Em Cadencia`) receberam 5 e 6 e foram encaixados
> nas posições 2 e 3 pela `sequence`. Ordenar ou comparar por ID **não** equivale a ordenar pelo
> pipeline.
>
> **Consequência para a trava:** a comparação é de **igualdade** — `stage_id == 1` —, nunca
> `stage_id > 1`. Hoje o `> 1` daria o mesmo resultado por coincidência, e deixaria de dar no dia
> em que um estágio novo nascer com ID 7 e for colocado antes de Prospecção.
>
> **`estagio_aberto_id = 1`.**

**Contrapartida, e ela é real:** ID não se lê na tela. Por isso o nó carrega, como comentário, a
**tabela completa dos 6 estágios — ID e nome** —, para que qualquer pessoa entenda a comparação
sem abrir o Odoo. Sem essa tabela, `stage_id == 3` é um número mágico, e número mágico sem
legenda é o começo da próxima doença de documentação.

## §6 — Direção por campo (planilha ↔ Odoo)

> ### ⚠️ Cabeçalho real lido em 2026-09-13 — três divergências com este contrato
>
> O cabeçalho da aba `leads` foi lido **ao vivo** (loadOptions do nó Sheets, 64 colunas). Ele
> desmente três coisas escritas aqui. **O dado vence o plano (R6).**
>
> **1. `id_hubspot` e `data_sync_hubspot` NÃO EXISTEM MAIS.** Já foram renomeadas para `id_crm` e
> `data_sync_crm`. Ou seja: o nó do P5 que grava `id_hubspot` e o do P6 que casa por
> `matchingColumns: ["id_hubspot"]` apontam para **colunas inexistentes** desde a renomeação. Com
> `onError: continueRegularOutput` nos dois, isso falhou em silêncio. **Deixa de ser hipótese: é
> fato medido.**
>
> **2. A planilha NÃO TEM as colunas `ipc` nem `score_tecnico`.** Este contrato lista as duas no
> bloco `scoring`. Elas não estão no cabeçalho. O que existe no lugar: `score_gbp`, `fit`,
> `oportunidade`, `modelo_versao`. **Consequência:** `gbp_ipc` e `gbp_score_tecnico` no Odoo não têm
> origem — ficam **vazios** (I3), e a aposentadoria do IPC já aconteceu na prática, na origem.
>
> **3. `data_envio_crm` NÃO EXISTE.** A rotina agendada do P5 (§5 do brief) depende dela. Precisa ser
> criada à mão, como foi feito com `sync_por`.
>
> **Colunas confirmadas existindo:** `id_crm`, `status_crm`, `data_sync_crm`, `sync_por` — os quatro
> nomes que o Olavo confirmou, conferidos contra o cabeçalho.

> **Escrita em 2026-09-13**, antes de cabear qualquer nó, como manda o brief
> `2026-09-13-prosp05-prosp06-odoo-subchat-brief.md` §6. Os nomes dos campos Odoo foram **lidos ao
> vivo** da instância (`crm.lead`, via credencial do bot), não de memória.
>
> **A regra:** o workflow é bidirecional; **o campo é sempre de mão única.** Se um campo aparecer nos
> dois lados, é erro de desenho — pare.

### Mão 1 — planilha → CRM (dono **P5**)

| Coluna na planilha | Campo no Odoo | Tipo |
|---|---|---|
| `id` (place_id) | `gbp_place_id` | char · **a chave** |
| `nome` | `name` | char · obrigatório |
| `e-mail` | `email_from` | char |
| `site` | `website` | char |
| `Cidade` | `city` | char |
| `CEP` | `zip` | char |
| `contato` | `phone` | char |
| `Estado` | ⛔ `state_id` é many2one — exige ID, fora do escopo | — |
| `Endereço` / `Rua/Avenida` | `street` / `street2` | char |
| `enriquecimento` | `ia_dados_enriquecimento` | text |
| `enriquecimento_site` | `ia_analise_site` | text |
| `analise_gbp_ia` | `ia_analise_gbp` | text |
| `potencial_comercial` | `gbp_potencial_comercial` | integer |
| `oferta_recomendada` | `gbp_oferta_recomendada` | selection |
| ~~`score_tecnico`~~ | `gbp_score_tecnico` | ⛔ **coluna não existe na planilha** — fica vazio |
| ~~`ipc`~~ | `gbp_ipc` | ⛔ **coluna não existe na planilha** — fica vazio |
| `dim_saude` · `dim_seo` · `dim_autoridade` · `dim_conversao` · `dim_engajamento` · `dim_conteudo` | `gbp_dim_saude` · `gbp_dim_seo` · `gbp_dim_autoridade` · `gbp_dim_conversao` · `gbp_dim_engajamento` · `gbp_dim_conteudo` | integer |
| `site_tipo` | `gbp_site_tipo` | selection |
| `flags_score` | `gbp_flags_score` | char |
| `nao_reivindicado` | `gbp_nao_reivindicado` | boolean |
| `data_processamento_score` | `gbp_score_atualizado_em` | **date** (`yyyy-MM-dd`) |
| `mês extração` (derivada) | `campaign_id` → `PROSP-yyyy-MM` | many2one |
| — (fixo) | `medium_id` = *Prospecção ativa* · `source_id` = *Google Maps* | many2one |

### Mão 2 — CRM → planilha (dono **P6**, bloco `aprendizado`)

| Campo no Odoo | Coluna na planilha |
|---|---|
| `stage_id` | `status_crm` |
| `won_status` + `lost_reason_id` | `motivo_perda` / `motivo_ganho` |
| `expected_revenue` | `valor` |
| `source_id` / `medium_id` | `via_aquisicao` |
| `create_date` | `data_criacao_deal` |
| `date_closed` | `data_fechamento` |
| `day_close` | `dias_no_funil` |
| `probability` | `probabilidade` |
| `ia_proxima_acao_recomendada` | `nba_recomendada` |
| `proxima_acao_aceite` | `nba_aceite` |
| `ia_abordagem_sugerida` | `abordagem_ia` |
| *(derivado no P6)* | `acerto_previsao` · `data_sync_crm` · `sync_por` |

### ⚠️ O conflito que esta tabela achou

Três campos de IA estão **nas duas listas de nome parecido**, e é aí que o ping-pong nasceria:

| Campo Odoo | Quem escreve | Quem NUNCA escreve |
|---|---|---|
| `ia_analise_gbp` | **P5** (vem de `analise_gbp_ia`, produzido pelo P4) | P6 não lê de volta |
| `ia_proxima_acao_recomendada` | **ninguém do P5** — nasce no CRM | **P5 não pode escrever** |
| `ia_abordagem_sugerida` | **ninguém do P5** — nasce no CRM | **P5 não pode escrever** |
| `proxima_acao_aceite` | **só o humano, na tela** | P5 e P6 não escrevem |

A distinção: `analise_gbp_ia` é **feature**, calculada antes do CRM e levada para lá. A NBA e a
abordagem são **produzidas dentro do CRM** pelos agentes, e o P6 só as traz de volta para treino.
Se o P5 escrevesse essas três, ele apagaria a cada 6h o que o agente acabou de gerar.

### Campos sem par — N/D honesto, não zero

| Coluna | Situação |
|---|---|
| `num_interacoes` | O HubSpot tinha `num_contacted_notes`. **Não há equivalente direto em `crm.lead`.** Fica **vazia** até decidirmos a fonte — nunca `0` (**I3**) |
| `ultimo_contato` | Candidato: `date_last_stage_update`. **Não é a mesma coisa** que "último contato". Deixar vazia até confirmar |
| `Estado` | `state_id` é **many2one** — exige o ID do estado, não a sigla. Fora do escopo desta rodada |
| `contato` | ✅ **É telefone** (Olavo, 13/09) → `phone`. Na tela do Odoo o rótulo pt-BR é "Telefone", mas o nome técnico é `phone` — não é campo customizado |
| `score_gbp` | ✅ **VIVO, não órfão.** Lido no nó `[P3] Gravar score` do PROSP-03 (`V0f80LU1ZH8PUtdc`): é a **média simples das dimensões que tiveram valor** — e as dimensões são **percentis dentro do grupo** (`Categoria 1 + Cidade`). **Não é o `score_tecnico`** do modelo antigo: aquele media otimização absoluta, este é média de posição relativa. Grandezas diferentes. **Não mapear** |
| `fit` · `oportunidade` | **Float 0–1** (`round2`), não 0–100. Vão para `gbp_fit` e `gbp_oportunidade` no Odoo |
| `modelo_versao` | Existem na planilha e **não estão neste contrato**. Sem destino definido no Odoo — precisam de decisão antes de qualquer mapeamento |

### Colunas com conflito ativo hoje

| Coluna | Quem escreve hoje | Quem deve escrever |
|---|---|---|
| `enriquecimento` | `1º Enriquecimento` **e** `Site L4` (com `"="`) | **P4**, só |
| `site_tipo` | motor **e** `Site L4` (com `"="`) | **P3**, só |
| `status hubspot`, `hubspot_status` | `1º Enriquecimento`, `kED2` **e** R3 | **P6**, só |
| `id_hubspot` | `1º Enriquecimento`, `Update id_deal`, `kED2` | **P5**, só |

---

## 4. Invariantes — não mudam sem ADR

| # | Invariante | Por que |
|---|---|---|
| **I1** | Uma coluna, um dono | É o que torna "quem apagou?" respondível |
| **I2** | **Nunca `appendOrUpdate`** em escrita por chave. Só `update`. Append só na criação da linha, e só por P2 | Foi a origem do risco de linha órfã em 4 nós |
| **I3** | Campo **não observado** grava **vazio** — nunca `0`, `false` ou `"="` | Espelha o guardrail BLOCO COMUM (`source_status error/missing ⇒ N/D, não 0`). `false` afirma um fato |
| **I4** | Dedup por `place_id`. Junção planilha↔CRM por `id_hubspot`. **Nome nunca é chave** | Nome é texto livre; foi o que quebrou o dedup e o `Search deal` |
| **I5** | **Todos** os leads descobertos vão à planilha e ao CRM. O corte governa gasto de Apify/IA, não entrada | Filtrar a entrada torna o score irrefutável (viés de seleção). Decisão Olavo 2026-08-27 |
| **I6** | **Nenhum gasto de LLM antes de validar identidade mínima** (`nome` não vazio E (`site` OU `Categoria 1`)) | Gastamos Gemini para produzir recusas que marcavam o lead como pronto |
| **I7** | Score é **fato**. Quem não é P3 não recalcula nem sobrescreve | ADR-003 |
| **I8** | P6 **só lê** o HubSpot. P5 é o único que escreve no CRM | Evita duas fontes alterando o mesmo deal |
| **I9** | O `Potencial Comercial` roteia oferta, **não** gateia abordagem: `max(gap, prontidão) × viabilidade` | Decisão Olavo 2026-07-10 — perfil forte vira lead de ADS, não é descartado |
| **I10** | Todo workflow ativo tem descrição **fiel**. Descrição copiada é bug | 3 workflows hoje têm descrição de outro |
| **I11** | O lead é sempre um **DEAL**. `Company` só é criada quando o lead **vira cliente**, por processo de pós-venda — nunca pela Prospecção | Decisão Olavo 2026-08-28 (D1). Evita 353 companies órfãs no CRM |

---

## 5. Regras de escrita

1. **Antes de escrever por chave, garanta que a chave existe.** Sem correspondência → desviar o
   item, nunca criar linha.
2. **Escreva apenas as colunas que você possui.** Não inclua colunas alheias no mapeamento "para
   não perder o valor" — ler e reescrever é a forma mais comum de apagar.
3. **Nunca use expressão vazia** (`"="`) como valor. Se não há o que gravar, omita a coluna.
4. **`executeOnce` é proibido em nó dentro de loop** que grava dado por item.
5. **Ao pedir dados de uma API, peça todos os campos que o código usa.** O dedup filtra por
   `dealstage` sem pedir `dealstage`.
6. **Toda escrita em produção carimba a data**: `data_processamento_score`, `data_sync_hubspot`,
   `data extração`. Sem carimbo não há como auditar.

---

## 6. Plano de migração

### Fase 0 — Estancar (nada é construído)

| # | Ação | Estado |
|---|---|---|
| 0.1 | Desativar `Site L4` | ✅ feito |
| 0.2 | Remover `executeOnce` do `1º Enriquecimento` | ✅ feito |
| 0.3 | Reduzir a 1 intake | ✅ feito |
| 0.4 | R3: `update` em vez de `appendOrUpdate` | ✅ feito |
| 0.5 | Guard I6 no IF do `1º Enriquecimento` | ⬜ |
| 0.6 | Limpar `enriquecimento` nas linhas com a recusa do Gemini | ⬜ (depois de 0.5) |
| 0.7 | Corrigir o deduplicador (pedir `dealstage`/`createdate`, chave por `place_id`) | ⬜ |
| 0.8 | Arquivar os 8 workflows mortos | ⏳ agendado |

### Fase 1 — Consolidar (sem funcionalidade nova)

| # | Ação |
|---|---|
| 1.1 | Extrair **P5** do `1º Enriquecimento` + `5VRPLUB3` — único dono do CRM e do `id_hubspot` |
| 1.2 | Reduzir o `1º Enriquecimento` a **P4**: enriquece e escreve só o que é dele |
| 1.3 | Remover do `1º Enriquecimento` a escrita de `hubspot_status`/`hubspot_estagio` (é de P6) |
| 1.4 | Desmembrar/arquivar o `kED2` (48 nós, 7 funções) |
| 1.5 | Backfill do `id_hubspot` nos 64 leads sem chave |

### Fase 2 — Migrar a descoberta

| # | Ação |
|---|---|
| 2.1 | Validar `L2b` (Places API) contra o `L2` na mesma busca — plano de 6 testes já escrito |
| 2.2 | Promover `L2b` a **P2**; `L2` vira fonte só do que a Places não observa, dentro de P4 |
| 2.3 | Aplicar I3 aos 4 campos ausentes da Places (`nao_reivindicado` etc.) |

### Fase 3 — Melhorar o modelo

| # | Ação |
|---|---|
| 3.1 | `fit × oportunidade` com rank percentil (testado: 18 valores distintos em 20) |
| 3.2 | Eixo Intent retroativo sobre os backups diários |
| 3.3 | `origem_fila` (`topo`/`exploracao`) + amostra de exploração de 10–15% |

### Fase 4 — Só quando houver dado

`EV`, `CLV` e modelo preditivo. Bloqueados por **ticket por serviço** (não definido) e **rótulo**
(0 `closedlost` no CRM). Não construir antes.

---

## 7. O que a proposta do GBP contribui — e onde entra

| Contribuição | Onde |
|---|---|
| E-mail e redes sociais do site | **P4** — a coluna `e-mail` existe e está vazia |
| Dedup por telefone e domínio | **P7** — hoje o dedup casa por nome, que é o pior critério |
| Tier de esforço Hot/Warm/Cold | **P3** — complementa o roteamento por oferta: *o que vender* × *quanto investir* |
| Formulário de entrada | **P1** |

Não adotados, com motivo: `TotalScore` aditivo (satura), `priority` com `EV_norm` (pode ficar
negativo e inverter o sinal), Intent multiplicativo (zera prospecção fria), filtrar entrada do CRM
(viola I5).

---

## 8. Decisões — Olavo, 2026-08-28

| # | Decisão | Consequência no contrato |
|---|---|---|
| **D1** | ✅ **O lead continua sendo só DEAL.** Company é criada **apenas quando o lead vira cliente** | P5 cria e atualiza apenas `DEAL`. A criação de Company passa a ser evento de **pós-venda**, fora do escopo da Prospecção. Simplifica P5 e evita a migração |
| **D2** | ✅ **Telegram.** P1 = `Intake - Telegram API` (`kmsaomlIzj48YnCL`) | Os outros 3 intakes vão para a lista de arquivamento |
| **D3** | ✅ **Não tratar o passivo agora.** Corrigir o deduplicador e observar se ele resolve | O passivo de duplicatas fica conhecido só depois da 1ª execução real. Rodar em `DRY_RUN = true` primeiro e conferir o relatório antes de deixar arquivar |
| **D4** | ✅ **Manter `status hubspot`; descartar `hubspot_estagio`** | Fica **uma** coluna de estágio, e o dono passa a ser **P6** — ver §8.1 |

### 8.1 D4 — como fica

Decisão do Olavo, contrária à minha recomendação (eu sugeria o inverso). O critério dele prevalece:
a coluna que **já existe e é lida** é `status hubspot`; criar dependência de uma coluna nova só
para renomear a mesma informação não agrega.

**O que muda:**

| Coluna | Antes | Agora |
|---|---|---|
| `status hubspot` | escrita por `1º Enriquecimento` (fixo `"Prospectado"`) e `kED2` | **dono: P6.** Recebe o estágio real do CRM a cada 6h |
| `hubspot_estagio` | escrita por P6 | **descontinuada.** Ninguém escreve; conteúdo histórico permanece |

O ganho da coluna nova não se perde: o que valia não era o nome, era **ter um dono só e ser
atualizada de verdade**. Isso passa para a `status hubspot`.

**Ação concreta:** no P6 (`WRFU2NM8rLJU7bRT`), o mapeamento `hubspot_estagio` vira `status hubspot`.
E o `1º Enriquecimento` deixa de gravar `status hubspot` (I1) — hoje ele grava `"Prospectado"` fixo,
o que reintroduziria a divergência.

> ⚠️ **Não confundir com `hubspot_status`.** São colunas diferentes:
>
> | Coluna | Conteúdo | Situação |
> |---|---|---|
> | `status hubspot` | o **estágio** do funil: `Prospectado`, `Reunião Agendada`, `Contrato Enviado`… | **mantida**, dono P6 |
> | `hubspot_status` | o **desfecho**: `Aberto` / `Vencido` / `Perdido` | **mantida** — é o rótulo mestre do aprendizado e alimenta `acerto_previsao` |
> | `hubspot_estagio` | duplicava o estágio | **descontinuada** |
>
> A decisão D4 remove apenas a terceira. Remover `hubspot_status` quebraria o cálculo de
> `acerto_previsao` e a variável-alvo do modelo.

---

*Uma coluna, um dono. Sem isso, toda descoberta obriga a reentender o conjunto inteiro.*

---

## 9. O parque final — nomes, ordem e o que muda em cada um

### 9.1 Convenção de nome

`PROSP-NN Nome curto` — o prefixo numérico ordena a lista do n8n na ordem do fluxo. Hoje os nomes
não têm padrão (`L2`, `L2b`, `1º Enriquecimento`, `kED2`) e a ordem alfabética não diz nada.

### 9.2 Os 8 workflows

| # | Nome novo | Base atual | Papel |
|---|---|---|---|
| 01 | `PROSP-01 Intake (Telegram)` | `Intake - Telegram API` `kmsaomlIzj48YnCL` | Recebe nicho + região, dispara o 02 |
| 02 | `PROSP-02 Descoberta (Places API)` | `L2b Discovery` `n7Z0xwi1dCDioln1` | Busca, normaliza, cria a linha |
| 03 | `PROSP-03 Scoring (motor de regras)` | motor extraído do `L2` | Calcula score, dimensões e oferta |
| 04 | `PROSP-04 Enriquecimento` | `L3` `EFD7Drr0LDMqfDXw` | Apify + IA nos leads acima do corte |
| 05 | `PROSP-05 CRM-out (deal + id)` | `5VRPLUB3V3YmhjJ5` | Cria o deal, grava `id_hubspot` |
| 06 | `PROSP-06 Aprendizado (HubSpot→planilha)` | `WRFU2NM8rLJU7bRT` | Traz o desfecho de volta |
| 07 | `PROSP-07 Zeladoria (schema + backup)` | `vUI0pPlDASf64Htn` | Guarda-schema e backup diário |
| 08 | `PROSP-08 Dedup CRM` | `izimrLm19H4i6LOq` | Remove deals duplicados |

**19 → 8.** As 7 funções da §2 viram 8 workflows porque a Zeladoria tem dois trabalhos distintos
(planilha e CRM), com cadências diferentes, e juntá-los não traz ganho.

### 9.3 Por que o 03 é sub-workflow e não um bloco dentro do 02

O scoring precisa rodar em **duas** situações: logo após a descoberta, e **sozinho**, quando a
fórmula mudar e for preciso repontuar a base sem redescobrir. Se ele viver dentro do 02, a
repontuação obriga a refazer a busca — gasto e risco de sobrescrever dado bom.

**Decisão:** `PROSP-03` é sub-workflow (`executeWorkflowTrigger`), chamado pelo 02 no fluxo normal e
executável isoladamente para recalibração.

---

### 9.4 O que muda em cada um

#### `PROSP-01 Intake (Telegram)` — 🔴 inspecionado 2026-08-28: **não é um intake**

`Intake - Telegram API` (`kmsaomlIzj48YnCL`, **ativo**) contém o pipeline inteiro:

```
Telegram → formulário → Apify Google Maps → dedup por placeId → normaliza
   → busca na planilha → salva lead → Gemini enriquece → cria deal → grava status
```

São **P1 + P2 + P4 + P5 num workflow só**. Ele escreve na planilha em **3 nós** e escreve no
HubSpot. E é ele que roda de verdade: o `L2 Discovery`, apesar de `active`, tem `triggerCount: 0`.

##### 🔴 É a origem dos leads envenenados — confirmado no código

```
Normalizar campos do lead  →  Buscar lead por place_id  →  If lead ja existe
                                                              └─(falso)→ Salvar lead bruto
```

`Salvar lead bruto na planilha` mapeia `={{ $json.nome }}`, `={{ $json.place_id }}` etc. — mas
seu `$json` vem do **`Buscar lead por place_id`**, não do `Normalizar campos do lead`. Para lead
**novo** o lookup não acha nada e (com `alwaysOutputData: true`) emite item vazio. **A linha é
gravada com os campos de identidade em branco.**

É exatamente o defeito 2 do brief do Codex, agora confirmado no nó. Fecha a cadeia da §7 do
panorama: linha sem identidade → Gemini recusa → recusa marca a linha como pronta para sempre.

##### 🔴 Duas referências a nós que não existem

| Nó | Referência | Existe? |
|---|---|---|
| `Criar deal no HubSpot` | `$('Salvar lead bruto na planilha1')` → `dealName` | ❌ o nó chama-se `…planilha`, sem o `1` |
| `Atualizar status prospectado na planilha` | `$('Atualizar lead enriquecido na planilha1')` → `id` | ❌ idem |

Consequências diretas:

- `dealName` fica indefinido → **deal criado sem nome** — os que o Olavo apagou à mão
- `id` fica indefinido no `appendOrUpdate` → não casa → **acrescenta linha** só com
  `status hubspot: "Prospectado"`

São sobras de cópia do `1º Enriquecimento`, que tem nós com sufixo `1`. Os dois workflows são
variantes um do outro.

##### Outros defeitos

| Defeito | Efeito |
|---|---|
| `Agente de Enriquecimento` sem guarda de identidade | Gasta Gemini em lead sem nome — **é aqui que o I6 tem de entrar** |
| Agente ligado em paralelo a `Atualizar lead` **e** `Criar deal` | O deal é criado mesmo se o enriquecimento falhar |
| `Calcular vagas disponiveis` só copia `total_leads` | O nome mente; não calcula vaga nenhuma |
| `Update row(s)` na Data Table com `filters: [{keyValue: "1"}]` sem `keyName` | Filtro malformado |
| Credencial Apify diferente da do `L2` (`Apify account gmail`) | Duas contas Apify em uso |

##### O que fazer

**Desmembrar**, não corrigir no lugar. Ele vira:

| Vai para | O quê |
|---|---|
| `PROSP-01` | Telegram trigger, formulário, parâmetros, mensagem de confirmação. **Para de escrever na planilha e no CRM** |
| `PROSP-02` | Apify/Places, dedup, normalização, gravação da linha — com `$json` vindo do **Normalizar**, não do lookup |
| `PROSP-04` | Agente de enriquecimento **com o guard do I6** |
| `PROSP-05` | Criação do deal e `id_hubspot`, com as referências corrigidas |

##### ✅ Correções aplicadas 2026-08-28 (`activeVersionId f62f1f21`)

Autorizado pelo Olavo. O workflow segue ativo, mas só dispara por mensagem específica no Telegram.

| # | Correção | Efeito |
|---|---|---|
| 1 | `Salvar lead bruto na planilha` lê de **`Normalizar campos do lead`**, não do lookup | **Estanca a raiz** — linhas param de nascer sem identidade |
| 2 | `Criar deal no HubSpot` → `dealName` vem de `Normalizar` | Para de criar deal sem nome |
| 3 | `Atualizar status prospectado` grava **`id_hubspot`** com chave `place_id` | **Passa a fechar o elo planilha↔CRM**, que este workflow nunca fechava |
| 4 | 🔴 Removida a ligação direta `Agente → Criar deal` | O nó tinha **duas entradas** (direta e via `Atualizar lead enriquecido`) e **criava o deal duas vezes** |
| 5 | Guard do **I6** antes do agente | Não gasta Gemini sem `nome` e (`site` ou `categoria`) |
| 6 | Os 2 nós de atualização passam a `update` + `onError: continueRegularOutput` | I2 — nunca acrescentam linha |
| 7 | `Atualizar lead enriquecido` para de gravar `nome` | I1 — é coluna do P2 |

**O item 4 é o achado mais consequente:** explica os deals duplicados que o Olavo relatou. Não era
falha do deduplicador sozinho — este workflow **produzia** duplicatas na origem, dois deals por lead.
O deduplicador, quebrado, nunca as removeu.

O fluxo ficou linear:

```
Salvar lead bruto → [I6] guard ─(sim)→ Agente → Atualizar enriquecido → Criar deal → grava id_hubspot
                              └─(não)→ NoOp → volta ao loop
```

⚠️ **Isto estanca, não conclui.** O desmembramento em 01/02/04/05 continua pendente — o workflow
ainda acumula quatro papéis.

##### Defeitos conhecidos e **não** corrigidos

| Defeito | Por que ficou |
|---|---|
| `Endereço` recebe `rua_avenida`; `Rua/Avenida` nunca é escrita | Mapeamento errado, mas mexer exigiria alterar o schema do nó. Corrigir no P2 |
| `Calcular vagas disponiveis` só copia `total_leads` | Nome mente, comportamento é inofensivo |
| `Update row(s)` com `filters: [{keyValue: "1"}]` sem `keyName` | Filtro malformado na Data Table `Prospeccao` |
| Duas contas Apify em uso | Decisão de custo, não de código |
| Nada escreve `mês extração`, `Avaliação`, `Quantidade fotos`, `Horário` | Colunas do contrato que este workflow ignora — entram no P2 |

#### `PROSP-02 Descoberta (Places API)`

| Mudança | Motivo |
|---|---|
| Re-colar a chave da Places API na credencial | Funciona via curl, falha dentro do n8n |
| Remover a credencial residual `Evolution API Header Auth` do nó de busca | Sobra de cópia |
| Reativar os 2 nós desabilitados (`Upsert Planilha`, `Chamar L3`) | Foram desligados no smoke |
| **Extrair o bloco de scoring para o `PROSP-03`** | I1 — P2 não é dono das colunas de score |
| Gravar **vazio** em `nao_reivindicado`, `Patrocinado`, `Agendamento`, `Posts` | I3 — a Places não observa esses campos |
| Rodar os 6 testes de validação contra o L2 | Antes de aposentar o Apify na descoberta |
| Ser o **único** com `append` (criação de linha) | I2 |

#### `PROSP-03 Scoring` — ⬜ a criar

| Mudança | Motivo |
|---|---|
| Extrair o motor de regras do `L2` para sub-workflow próprio | I1 e §9.3 |
| Trocar `max()` por `fit × oportunidade`, com rank percentil | Fase 3 — 18 valores distintos em 20, contra 6 |
| Aplicar piso `fit ≥ 0,05` | Nenhum lead sai da fila para sempre |
| Preservar `max(gap, prontidão)` **dentro** do eixo oportunidade | I9 |
| Corrigir ou aposentar o `ipc` | Máximo 23 numa escala 0–100 |
| Único a escrever `site_tipo` | Hoje o `Site L4` também escrevia |

#### `PROSP-04 Enriquecimento`

| Mudança | Motivo |
|---|---|
| **Adicionar o guard do I6** — só enriquece com `nome` E (`site` OU `Categoria 1`) | Impede novos leads envenenados |
| Absorver o enriquecimento do `1º Enriquecimento` | Uma função, um dono |
| Absorver a análise de site do `Site L4` — **sem** o `"="` | Regra de escrita 3 |
| **Adicionar extração de e-mail e redes sociais** do site | Contribuição da proposta GBP; a coluna `e-mail` está vazia |
| **Parar de gravar** `id_hubspot`, `status hubspot`, `site_tipo` | I1 — são de P5, P6 e P3 |
| Rodar só na fila `prioridade ≥ 60` | Governa o gasto de Apify/IA, não a entrada (I5) |

#### `PROSP-05 CRM-out` — ✅ **construído 2026-08-28** (`94lSWJfxfu653KdN`, inativo)

7 nós, sub-workflow. Recebe `place_id`, `nome`, `telefone`, `descricao`:

```
[P5] Entrada → Buscar deal por place_id → Deal ja existe?
                                            ├─(sim)→ Reusar deal existente ─┐
                                            └─(nao)→ Criar deal → Novo ─────┴→ Gravar id_hubspot
```

| Invariante | Como é cumprido |
|---|---|
| I8 — único a escrever no CRM | É o único com nó de criação de deal |
| I1 — único dono de `id_hubspot` | Grava a coluna; ninguém mais deve |
| I4 — dedup por `place_id` | A busca filtra por `place_id`, nunca por `dealname` |
| I11 — só DEAL | Não há nó de Company |
| I2 — nunca append | `operation: update`; se a linha não existir, não cria |

O deal criado passa a carregar `place_id` como propriedade — o que torna a próxima busca eficaz.

##### ✅ Backfill construído e executado 2026-08-28

`PROSP-BF Backfill place_id nos deals` (`nJOHONMffxiO6dxp`, 9 nós, manual). Lê a aba `leads`,
seleciona as linhas que têm `place_id` **e** `id_hubspot`, e grava o `place_id` no deal
correspondente. Loop de 1 em 1 com retry, `dry_run` e `limite` no nó `[BF] Config`.

**Dry run mediu — e o número corrige uma estimativa minha:**

```
linhas lidas na aba leads : 263
elegiveis (place_id + id_hubspot) :  88
sem place_id              : 127
sem id_hubspot            :  48
```

Eu havia estimado ~289 elegíveis a partir da exportação markdown do Drive. **O número real é 88.**
A estimativa anterior veio de uma fonte que já sabíamos ser não confiável (nomes com `|`, abas
concatenadas); esta veio do nó Google Sheets lendo a planilha ao vivo. Vale mais.

⚠️ **127 linhas sem `place_id` na coluna A** é um achado novo e não explicado. Fica como pendência.

##### 🔴 Dependência original: backfill de `place_id` nos deals existentes

A propriedade `place_id` foi criada em 2026-08-28 (grupo *IA / Enriquecimento*). **Os ~98 deals já
existentes têm o campo vazio.**

Consequência: se o P5 rodar hoje para um lead que **já tem** deal, a busca por `place_id` não acha
nada e ele **cria um segundo deal**. O P5 só é seguro depois que os deals atuais forem casados com
os `place_id` da planilha.

**Ordem obrigatória:**

1. Backfill: para cada linha da planilha com `id_hubspot`, gravar o `place_id` no deal correspondente
2. Só então ligar o P5 no fluxo
3. Só então arquivar a criação de deal do `Intake - Telegram API`

Enquanto o passo 1 não for feito, o P5 fica **inativo** e a criação de deal continua no Intake.

##### O que ainda falta no P5

| Item | Nota |
|---|---|
| Smoke com lead real | Não executado — depende do backfill |
| Aviso de validação `resource: deal` | Falso positivo do validador; o nó idêntico roda em produção |

---

#### `PROSP-05` — plano original (referência)

| Mudança | Motivo |
|---|---|
| Promover a oficial e absorver a criação de deal do `1º Enriquecimento` | Único escritor do CRM (I8) |
| **Buscar deal por `place_id`, nunca por `dealname`** | I4 — a busca por nome é a origem das duplicatas |
| Único a gravar `id_hubspot`, **uma vez por lead** | I1 + regra 4 (nada de `executeOnce` em loop) |
| Criar apenas **DEAL**, nunca Company | I11 |
| Backfill dos 64 leads sem `id_hubspot` | Passivo atual |
| **Não** gravar `status hubspot` | I1 — é de P6 |

#### `PROSP-06 Aprendizado` — ✅ já conforme

| Mudança | Estado |
|---|---|
| `update` em vez de `appendOrUpdate` | ✅ feito |
| Estágio em `status hubspot` | ✅ feito (D4) |
| Renomear | ⬜ |
| Conferir na 1ª execução com deals que nenhuma linha nova aparece | ⬜ pendente de verificação |

#### `PROSP-07 Zeladoria` — ✅ conforme

Só renomear. Produz o backup diário que viabiliza o eixo Intent retroativo.

#### `PROSP-08 Dedup CRM` — ✅ consertado e medido 2026-08-28

O diagnóstico anterior estava **incompleto**. Pedir `dealstage` resolveu só metade: o nó HubSpot
`getAll` devolve o **formato v1**, em que cada propriedade é um **objeto** `{value, timestamp,
versions}` e o id do deal vem em `json.dealId`, não `json.id`.

```js
p.dealstage === STAGE      // objeto === string  →  SEMPRE falso
item.json.id               // sempre undefined
```

| Correção | Estado |
|---|---|
| Pedir `dealstage`, `createdate`, `telefone` em `properties` | ✅ |
| Helper `prop()` que aceita v1 e v3 | ✅ |
| `deal_id` de `dealId` com fallback para `id` | ✅ |
| Chave: telefone normalizado (10 últimos dígitos) → nome **completo** normalizado | ✅ |
| Faixa de acentos corrigida; `slice(0,3)` removido | ✅ |
| `DRY_RUN = true` | ✅ |
| 🔴 **SyntaxError nos 2 nós de relatório** — quebra de linha literal dentro de string | ✅ |

O último é grave e era invisível: `linhas.join('` + quebra de linha real + `')`. O workflow
**morria antes de enviar o relatório**. Mesmo que tivesse achado duplicatas, o Telegram nunca
receberia nada. Dois bugs independentes garantiam silêncio total.

##### O passivo, finalmente medido

```
deals lidos         : 101
em Prospectado      :  98   (antes: 0)
grupos com duplicata:   4
deals a arquivar    :   8
```

| Deal a arquivar | Mantido | Chave |
|---|---|---|
| Dra. Mariana Aguiar ×3 | o mais antigo | `tel:7991532257` |
| Dentz Rio Preto ×3 | o mais antigo | `tel:7996605040` |
| Dr Fabrício Correa | o mais antigo | `tel:7991934797` |
| Dentista 24h Dr. Rodrigo Belmonte | ODONTOLOGIA 24 HORAS - RIO PRETO | `tel:7981613934` |

⚠️ **Conferir a última antes de sair do DRY_RUN.** Nomes diferentes, telefone igual — pode ser o
mesmo negócio com dois nomes, ou dois negócios que compartilham telefone.

⚠️ **Só 101 dos ~141 deals foram lidos.** O `getAll` parece truncar a paginação. Pode haver
duplicata entre os ~40 não lidos. Investigar antes de confiar no número 8 como total.

**Confirma a causa dos duplicados:** 3 dos 4 grupos são o **mesmo lead criado 2–4 vezes** — o padrão
que a ligação dupla do `Criar deal` (§9.4, correção 4) produzia.

---

### 9.5 Os 11 que saem

| Arquivar | Motivo |
|---|---|
| `WPP Intake - Evolution API` · `WPP Intake copy 2` · `Intake - db's apify` | D2 escolheu Telegram |
| `L2 Discovery (Pipeline A)` | Substituído pelo 02 — **só depois** dos 6 testes |
| `L2 Discovery (ignora id hubspot)` · `L1 Core Engine (teste)` | Fork e teste |
| `Automate Scrape Google Maps` · `Apify vide II` · `SCRATCH reviews` | Legado e template |
| `Enriquecimento Site L4` | Absorvido pelo 04 |
| `1º Enriquecimento` | Desmembrado em 04 e 05 |
| `HubSpot - Atualizar status e disparar extracao` (`kED2`, 48 nós) | Desmembrado; a parte de status morre (o 06 já faz melhor) |

⚠️ **Ordem obrigatória:** o `1º Enriquecimento` e o `L2` só são arquivados **depois** que o 04, o 05
e o 02 estiverem rodando. Hoje o `1º Enriquecimento` é o único que cria deals.
