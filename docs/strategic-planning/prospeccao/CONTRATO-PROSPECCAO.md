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

### O vendedor do lead — `user_id = 2`

> ✅ **Decisão do Olavo, 2026-09-14:** *"o meu user_id é 2, todo lead deve vir como eu sendo o
> vendedor."*

O P5 escreve **`user_id = 2`** (Olavo Franzin) em todo lead que cria.

**Precisa ser explícito.** O `user_id` do `crm.lead` tem `default=lambda self: self.env.user` — o
usuário da sessão. Como quem chama a API é o bot `n8n@franzcomunicacao.com`, **sem esta linha todo
lead nasceria com o bot como vendedor**, e o funil do Olavo apareceria vazio.

**O que se perde:** deixa de dar para distinguir na tela, pelo vendedor, o que a máquina criou do
que uma pessoa criou. Essa informação continua existindo no **chatter** de cada lead, que registra
`n8n@franzcomunicacao.com` como autor da criação — e em `create_uid`, que o Odoo preenche com o
usuário real da chamada e ninguém sobrescreve.

### Marketing — IDs de Meio, Origem e Lote

Lidos da instância em **2026-09-14** (execução `38884`, leitura pura):

| campo Odoo | modelo | nome | **ID** |
|---|---|---|---|
| `medium_id` | `utm.medium` | **Prospecção Ativa** | **`11`** |
| `source_id` | `utm.source` | **Google Maps** | **`11`** |
| `campaign_id` | `utm.campaign` | **PROSP-2026-09** | **`1`** |

> ⚠️ **O nome tem A maiúsculo: "Prospecção Ativa".** O brief escreveu "Prospecção ativa". Se a
> busca fosse por nome, falharia; por ID, não. Mais um ponto para a decisão de usar ID.
>
> ⚠️ **`medium_id = 11` e `source_id = 11` são o mesmo número em modelos diferentes.** Coincidência,
> não relação. Trocar um pelo outro não daria erro — daria dado errado em silêncio.
>
> **Só existe um lote hoje.** Leads de outros meses de extração precisam do lote correspondente.
> Ver a regra de auto-cura abaixo.

### Lote de campanha — fixo em `PROSP-2026-09`

> ✅ **Decisão do Olavo, 2026-09-14, registrada a pedido dele:**
> *"Insira PROSP-2026-09 em todos e anote que foi minha decisão."*

**Todos os leads levados ao CRM recebem `campaign_id = 1` (`PROSP-2026-09`), independentemente do
mês de extração.** O P5 **não calcula** o lote a partir de `mês extração` e **não cria** lote
nenhum.

Isto **substitui** o desenho do brief (§4.8), que derivava `PROSP-yyyy-MM` do mês de extração. O
motivo de o brief querer a derivação continua válido — rodar de novo no mês seguinte não pode
reetiquetar todo mundo —, mas com lote fixo o problema não existe: não há o que recalcular.

**O que se perde, dito com clareza:** deixa de ser possível separar no CRM as safras de extração
por lote. Essa informação **não se perde do sistema** — `mês extração` e `data extração` continuam
na planilha, dono **P2**. Se um dia a segmentação por safra for necessária, ela é reconstruível
dali.

**Quando revisitar:** se passarem a existir campanhas de prospecção com objetivos diferentes
convivendo, um lote só deixa de distinguir o que precisa ser distinguido.

### A regra que continua valendo: escrita incompleta não carimba data

Independente do lote, se a escrita no CRM sair incompleta, o P5 **não carimba `data_envio_crm`**.
A linha continua na fila da reconciliação e é reprocessada; o upsert por `gbp_place_id` garante
que reprocessar **atualiza**, nunca duplica.

**Não carimbar quando a escrita falhou é o que torna a fila auto-corretiva.** Carimbar sempre
transformaria falha parcial em perda permanente e silenciosa — que é exatamente a doença que o
`onError: continueRegularOutput` causou no P6 por duas semanas.

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

---

## 10. Os 95 leads que já estão no Odoo — as-built de 2026-09-15

> **R2/R6: o real vence o plano.** A carga inicial do CRM novo **não** foi feita pelo PROSP-05.
> Foi feita por um workflow temporário, `TMP Inserção odoo crm` (`7COGAPeoofZCh58B`, criado
> 09/09). Isso está registrado aqui porque muda o que o P5 encontra quando rodar, e porque
> explica dois sintomas que custaram caro para diagnosticar.

**O que existe hoje:** leads com `id_crm` de **1 a 95**, todos no estágio **Prospecção**, nenhum
movido à mão (Olavo, 15/09).

### 10.1 O filtro que dizia cortar em 60 e não cortava

O nó `Filter` do TMP compara `potencial_comercial` com o operador **`notEmpty`** — e o `60` ficou
ao lado, como valor de um operador que não compara nada. **O corte nunca existiu ali.** Entrou
todo lead com o campo preenchido, inclusive abaixo de 60.

> É a mesma família do `onError: continueRegularOutput` que escondeu a quebra do P6 por duas
> semanas: **o nó roda verde e não faz o que o nome diz.** Por isso o corte do P5 mora num `Set`
> visível (`[P5] Config`), junto da vazão — número de corte enterrado dentro de nó é número que
> ninguém confere.

Os leads abaixo de 60 **não saem sozinhos**: o corte do P5 tem a cláusula `id_crm !== ""`, que
deixa passar quem já está no CRM. É proposital — quem já está lá merece dado correto. Removê-los
é apagar lead, e fica para depois do piloto, se o Olavo mandar.

### 10.2 A causa real do "Potencial Comercial zerado"

O `Create an opportunity` do TMP mapeia 22 campos e **`gbp_potencial_comercial` não é um deles**
(só aparece no ramo `Update`). Os leads nasceram sem o número.

Não era o módulo, não era `Integer` truncando, não era o IPC descontinuado — era **campo ausente
no mapeamento do workflow**. Fica registrado para que a próxima investigação não refaça o mesmo
caminho: **quando um campo está vazio no CRM, olhe primeiro quem devia tê-lo escrito.**

### 10.3 O ping-pong que o TMP criava

O `Update` do TMP escrevia **`ia_abordagem_sugerida`** a partir da coluna `abordagem_ia` da
planilha. Mas `abordagem_ia` é do bloco **aprendizado** (§6, linha 95): dono **P6**, sentido
**CRM → planilha**. Mandar de volta ao CRM apaga o que o agente de abordagem escreveu lá dentro.

Provavelmente não destruiu nada ainda, porque o P6 está parado desde 08/09 e a coluna deve estar
vazia. **O P5 não escreve esse campo, e não deve passar a escrever.**

### 10.4 O que o P5 herda do TMP, por decisão

| Campo | Regra no P5 | Por quê |
|---|---|---|
| `lead_status = novo` | **só na criação** (`[P5] Payload para criar`) | no update desfaria a mão do vendedor a cada 6h: um lead marcado "em cadência" voltaria para "novo" sozinho |
| `gbp_score_tecnico ← score_gbp` | payload comum | o TMP já gravava esse par nos 95; sem ele, os leads novos do piloto nasceriam diferentes dos antigos |

### 10.5 O TMP é um segundo escritor e precisa sair

O §12.1 do brief de 13/09 proíbe uploader separado: dois escritores no `crm.lead` quebram o **I8**.
O TMP existiu para destravar a carga e cumpriu o papel — **não é crítica retroativa.** Mas quando
o P5 fechar o smoke, ele sai pelo procedimento da **R5**: nó chamador desabilitado, workflow
desativado, renomeado `[APOSENTADO <data>]`, sticky dizendo por que e proibindo reuso.

### 10.6 A vazão (RQ1)

`lote_max` vive no `[P5] Config`, ao lado do corte. O primeiro uso real é um **piloto de 10–20
leads** (brief §12.2), não a planilha inteira. Para rodar tudo, sobe-se o número no `Set` —
nunca dentro do nó.

### 10.7 Incidente 2026-09-15 — o "smoke de 1 lead" que escreveu em 20

**O que aconteceu.** As execuções `39612` e `39616` do PROSP-05O foram disparadas como
smoke de um lead só. Cada uma processou **20 leads** e os escreveu no Odoo. A 39612 parou no
meio (erro do `site_tipo` legado); a 39616 completou os 20: `id_crm` 96, 11, 15, 18, 19, 20,
21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33 e 34.

**A causa.** O `[SMOKE] Lead de teste` entregou item vazio, sem `place_id`. O nó do Google
Sheets filtra por `lookupValue = {{ $json.place_id }}` — e **filtro vazio no Google Sheets não
devolve zero linhas: devolve a planilha inteira.** Não avisa, não falha, execução verde.

**O que conteve.** A vazão do lote (`lote_max = 20`), instalada minutos antes por causa do
piloto. Sem ela teriam entrado os 95 e todo lead acima do corte. O limite de segurança pegou
um erro que não era o que ele fora desenhado para pegar — que é justamente para o que servem.

**Dano.** Nenhum lead criado, nenhum estágio movido, nada apagado. Foram `update` em leads que
já existiam, completando campos que estavam vazios — o backfill previsto, feito sem o OK
explícito para aquele volume. Na planilha, `id_crm` e `data_envio_crm` foram carimbados nas 20
linhas.

**A correção.** O `lookupValue` cai em `__SEM_PLACE_ID__` quando não há `place_id`: uma chave
que não existe na planilha. Sem entrada válida o fluxo **para**, em vez de processar todo mundo.

> **Regra que fica, e vale para qualquer nó de busca deste projeto:**
> **a falta de critério nunca pode significar "todos".**
> É a mesma família do filtro `notEmpty` do TMP (§10.1) e do `onError` que escondeu o P6: nó
> que roda verde fazendo o contrário do que o nome diz.

**E uma regra de método, para mim:** antes de chamar uma execução de "smoke", conferir
**quantos itens entraram na fila**. Afirmar escopo sem medir é o mesmo erro do plano que não
verifica a premissa (R6), só que mais rápido.

---

## 11. As decisões da entrevista de execução (2026-09-16) — as-built

> Origem: `docs/handoff/2026-09-16-entrevista-execucao-prosp05-06-resultado.md`.
> Cinco decisões do Olavo, construídas no mesmo dia. Aqui fica o **as-built**: o que existe no
> workflow, não o que foi planejado.

### 11.1 Contato só preenche vazio (D1)

Nos campos **`phone`, `email_from`, `website`, `street`, `zip`, `city`**, o P5 escreve **apenas se
estiverem vazios no Odoo**. Implementado no `[P5] Payload para atualizar`, que lê o lead na busca e
remove do payload cada campo de contato já preenchido.

**Por que não bastava a trava de estágio:** ela protege quem já **saiu** de Prospecção. O lead que o
vendedor corrigiu **dentro** de Prospecção era sobrescrito pela planilha a cada 6h.

**Custo real quase zero:** o P4 não escreve `contato`, `site` nem endereço na planilha. O único
campo de contato que o enriquecimento melhora é o `e-mail`, que nasce vazio.

**Os campos GBP não entram nessa regra.** Score, dimensões, eixos, oferta e flags são **cálculo**,
refeitos pelo P3 a cada rodada — sobrescrever é o correto neles.

### 11.2 Lead arquivado é pulado (D2)

Marcar um lead como perdido no Odoo **arquiva** o registro (`active = False`), e a busca padrão não
o devolve. Sem tratamento, o P5 concluiria "não existe", tentaria criar, e bateria na
`UNIQUE(gbp_place_id)` — **erro em toda rodada, para sempre, em todo lead perdido**.

Novo ramo: `[P5] Buscar entre arquivados` → `[P5] Esta arquivado?`. Achou: **nada é escrito**,
carimba a planilha e segue. Perdido é desfecho humano.

⚠️ **Premissa a verificar (CA7):** o filtro cita `active` de propósito — quando o domínio menciona
esse campo, o ORM do Odoo desliga o `active_test`. É o comportamento documentado, **não medido
nesta instância**.

### 11.3 Falha parcial não trava a fila (D3)

As duas escritas no Odoo passaram a ter **saída de erro**. O lead que falha recebe data e motivo em
**`erro_envio_crm`** (coluna nova, dono P5), o aviso vai ao Telegram, e a fila continua. Sem
`data_envio_crm`, a rodada seguinte tenta de novo. **O sucesso limpa a coluna.**

**Os dois canais, e não um:** o Telegram avisa **na hora**, a coluna guarda **depois**. Só Telegram
some quando ninguém lê a mensagem — foi assim que a quebra do `id_hubspot` passou semanas invisível.

O motivo vem de `error.description`: o `error.message` do Odoo é sempre o genérico *"The service was
not able to process your request"*, que não diz nada.

### 11.4 Modo explícito (D4)

`modo` (`backfill` / `continuo`) no `[P5] Config`, junto do corte e da vazão. No `backfill`,
`lote_max` é **obrigatório** — sem ele o filtro não deixa passar nada.

**Por quê:** em 15/09 o modo era decidido por **qual trigger entrava**, o trigger errado entrou
calado, e um teste de 1 lead virou 20 escritas (§10.7). Nada no dado dizia em que modo a execução
rodou.

### 11.5 O telefone do Apify entra na planilha (D5)

O `[P4] Sinais do Apify` captura um telefone que **nunca entrava na planilha** — ia direto ao P5 por
parâmetro. Como o P5O lê **só da planilha**, ele se perdia, e o campo ficava preenchido com o dado
pior (o da Places).

Agora o P4 grava **`contato`**, com a regra de D1 embutida: só quando o Apify achar **e** a coluna
estiver vazia. O valor já gravado nunca é desfeito.

### 11.6 O P4 aponta para o Odoo (M6)

O nó `[P5] CRM-out` dentro do P4 apontava para `94lSWJfxfu653KdN` — o P5 do **HubSpot**. Cada
enriquecimento alimentava o CRM antigo.

**Repontado em 16/09** para `0H1mdPuICHsyWGxt` (PROSP-05O). Decisão do Olavo, contra a
recomendação de esperar o cutover (ADR-36 C3).

> O `PROSP-05 CRM-out (deal + id)` do HubSpot **continua existindo e ativo**. Aposentadoria pelos 5
> passos da R5 quando o Olavo decidir. **Não apagar antes.**

### 11.7 As duas pendências — resolvidas em 16/09

1. ~~A coluna `erro_envio_crm` não existe~~ → **criada pelo Olavo**, e já exercitada: a execução
   39633 gravou um erro nela e a 39634 o limpou.
2. ~~O nó do Telegram está desabilitado~~ → **ligado**, com o `chatId` informado pelo Olavo e a
   credencial `Telegram phi_prospeccao`. *(O número mora no n8n, não no git.)*

⚠️ **O nó do Telegram ainda não foi exercitado.** O ramo de erro foi provado até a planilha
(execução 39633), mas naquele momento este nó estava desabilitado. O primeiro erro real depois de
16/09 é que vai provar o último elo.

**Uma exceção consciente à R11 neste nó:** ele tem `onError: continueRegularOutput`. A regra diz que
isso só vale com destino visível para o erro — e aqui existe: o erro **já foi gravado** na planilha
antes de chegar ao Telegram. Se o Telegram cair, a fila não pode parar por causa do aviso.

### 11.8 Smoke de 16/09 — 5 dos 11 critérios de aceite provados

Com a coluna `erro_envio_crm` criada, o smoke rodou com **`lote_max = 1`** — a rede armada antes,
não depois. Três execuções, e cada uma provou alguma coisa:

| Execução | O que aconteceu | O que provou |
|---|---|---|
| `39631` | parou em 1,6 s no nó de leitura, **zero escritas** | **a trava do filtro vazio funciona**: sem `place_id`, o lookup procura `__SEM_PLACE_ID__` e o fluxo para |
| `39633` | achou a Niti, montou o payload, **a escrita falhou** | **CA2** (`_contato_preservado: phone,website,street,zip,city`) e **CA3** — o erro foi para a planilha e a fila seguiu, exatamente como desenhado |
| `39634` | **passou**: 1 lead, `id_crm` 11, planilha carimbada | **CA1, CA4, CA11** — e `erro_envio_crm` foi **limpo**, apagando o erro da rodada anterior |

**O defeito da 39633 era meu, e é uma regra nova.** Eu tinha posto `_contato_preservado` **dentro do
payload**, para deixar visível o que a D1 havia respeitado. Com `autoMapInputData`, **toda chave do
payload vira campo do `crm.lead`** — e esse campo não existe. O Odoo recusou a escrita inteira.

> **Regra:** no payload do P5, **toda chave tem de ser um campo real do `crm.lead`**. Diagnóstico e
> telemetria vão para `console.log`, nunca para o objeto que é enviado.

**O `[SMOKE] Lead de teste` deixou de ser um `Set`.** Ele entregava item **vazio** nas execuções
39612, 39616 e 39631 — o `place_id` nunca chegava ao nó seguinte, e foi essa a origem do incidente
de 15/09. **Não descobri a causa**; troquei por um `Code`, que não depende de valor-padrão que o n8n
retira ao salvar. É contorno, e está registrado como contorno.

**Também melhorei a captura do erro.** O `error.message` do Odoo é sempre o genérico *"The service
was not able to process your request"*. O nó agora procura o detalhe em seis lugares, do mais
específico ao menos, e joga o erro cru inteiro no log da execução.

**Ainda não provados:** CA5 (desfecho pelo P6 — o P6 Odoo não existe), CA6, CA7 (lead arquivado),
CA8 (guarda do modo), CA9, CA10.
