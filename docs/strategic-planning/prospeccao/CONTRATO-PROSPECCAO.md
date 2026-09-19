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

### Exceção documentada ao I1 — o `id_crm` no payload do P6

O `[P6] Gravar na planilha` inclui **`id_crm`** no mapeamento de colunas, e `id_crm` é **coluna do
P5**. Parece violação do I1. **Não é.**

O nó do Google Sheets em `mappingMode: defineBelow` **exige a coluna de casamento dentro dos
valores** — é por ela que ele encontra a linha. O valor escrito é **idêntico** ao que ele acabou de
ler para casar: o P6 não decide nada sobre esse campo, só o devolve.

> **O P6 escreve `id_crm` porque o nó do Google Sheets exige a coluna de casamento no payload. O
> valor é sempre o mesmo que ele leu para achar a linha. Não remover — remover quebra o `update`.**

Está escrito aqui porque a próxima auditoria vai marcar como violação, e o "conserto" óbvio —
tirar a chave do mapeamento — transformaria o `update` em nada, em silêncio. **Benigno por desenho
só é benigno se estiver escrito** (R5).

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

`modo` (`backfill` / `continuo`), junto do corte e da vazão. No `backfill`, `lote_max` é
**obrigatório** — sem ele o filtro não deixa passar nada.

> ⚠️ **Corrigido em 16/09 — ver §11.9.** O `modo` morava no `[P5] Config`, que é **único e serve aos
> dois caminhos**. Resultado: a guarda aceitava `continuo` como valor válido e não discriminava nada,
> e o backfill da execução `39647` rodou inteiro carimbado como `continuo`. Hoje o `Config` guarda só
> os números, e **cada ramo carimba o próprio modo** antes dele (`[P5] Modo: continuo` /
> `[P5] Modo: backfill`). Caminho novo que esquecer de carimbar deixa `modo` indefinido e a guarda
> barra tudo — falta de critério **para** o fluxo, não libera (R11, regra 1).

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

### 11.9 A primeira rodada de backfill (16/09) — 20 leads, e um carimbo que mentia

A carga de lote rodou pela primeira vez ponta a ponta. **Execução `39647`**, 50 s, entrada pelo
`[P5] Reconciliacao 6h` com a planilha inteira:

| Desfecho | Quantos | Quais |
|---|---|---|
| Atualizados (já existiam no Odoo) | **18** | `id_crm` 35 a 52 |
| Criados | **2** | `id_crm` 97 e 98 |
| Erros | 0 | — |
| Arquivados / lead do vendedor | 0 | — |

**CA11 provado no cenário real.** A fila parou em exatamente 20 (`maxRunIndex: 20`) com a planilha
inteira na entrada. É o contrário exato do incidente de 15/09 (§10.7): lá a falta de critério virou
"todos"; aqui a vazão segurou sozinha.

**CA1 provado com 20 leads, não com 1.** 18 dos 20 já existiam, foram achados pelo `gbp_place_id` e
atualizados. Nenhuma duplicata.

**Confirmado:** os leads que o `TMP Inserção odoo crm` inseriu estão **sem `data_envio_crm`** e por
isso voltam à fila do backfill. Não é desperdício — cada um desses updates grava o
`gbp_potencial_comercial` que o TMP nunca mapeou (§10.2). Mas a fila consome lead velho antes de
chegar ao lead novo, e isso muda o número de rodadas do piloto.

**O defeito: a rodada mentiu sobre si mesma.** A execução entrou pelo gatilho de horário, mas o
`[P5] Config` estava em `modo: continuo`. A guarda D4 deixou passar porque `continuo` é um valor
válido. Não houve dano — o comportamento é idêntico —, mas **o campo que existe para dizer que tipo
de rodada foi aquela registrou o oposto**. É a R11 na sua forma mais pura: verde, correto no
resultado, mentindo no carimbo.

**Conserto (16/09):** o `modo` saiu do `Config`. Cada caminho carimba o seu — `[P5] Modo: continuo`
(entre `Ler a linha do lead` e o `Config`) e `[P5] Modo: backfill` (entre `Ainda nao enviado?` e o
`Config`). O `Config` ficou só com `corte_potencial` e `lote_max`. **Execução `39649`** provou o ramo
contínuo depois do conserto: `modo: "continuo"` carimbado pelo nó novo, 1 lead, `id_crm` 11, zero
erro. **CA8 passa a ser verificável** — antes não era.

> **A lição, que generaliza:** configuração global que serve a dois caminhos **não é carimbo, é
> chute**. Quem sabe em que modo a rodada está é o caminho por onde ela entrou — então é ele que
> assina. Config que alguém precisa lembrar de trocar antes de rodar é processo que já falhou.

**Limitação registrada:** o backfill **só pode ser disparado por quem tem o editor aberto**. Ele
pendura no gatilho de horário, e gatilho de horário só dispara com o workflow **ativo** — o que
significaria rodar sozinho a cada 6 h, sem OK de budget. A execução por MCP entra sempre pelo
`[SMOKE] Trigger manual`. Foi o que aconteceu na `39639`: pedi backfill, saiu smoke.

**Ainda não sei:** quantas rodadas faltam (os nós de filtro carregam a planilha inteira e não há como
contá-los sem puxar tudo), nem por que a fila começou no `id_crm` 35 e não nos primeiros.

**Critérios de aceite — placar em 16/09:** provados **CA1, CA2, CA3, CA4, CA8, CA11**. Faltam CA5
(depende do P6 Odoo, que não existe), CA6, CA7, CA9, CA10.

### 11.10 As 4 rodadas de backfill (16/09) — o piloto fechou em 19 leads

| Rodada | Execução | Atualizados | Criados | Erros |
|---|---|---|---|---|
| 1 | `39647` | 18 (`id_crm` 35–52) | 2 (97, 98) | 0 |
| 2 | `39652` | 19 (53–71) | 1 (99) | 0 |
| 3 | `39653` | 19 (72–90) | 1 (100) | 0 |
| 4 | `39656` | 5 (91–95) | **15** (101–115) | 0 |

**Total: 81 linhas carimbadas, 62 atualizações, 19 leads novos, zero erro em 81 escritas.** A vazão
segurou a fila em exatamente 20 nas quatro rodadas.

**A rodada 4 foi o ponto de virada**, e era previsível: o maior `id_crm` do TMP era 95, então ao
chegar nele o estoque antigo acabou e a fila passou a ser criação pura. A previsão foi escrita antes
da rodada e bateu — 5 atualizações e 15 criações.

**Decisão do Olavo (16/09): parar aqui.** O brief definia piloto de 10–20 leads; são 19. Continuar
batendo "próxima rodada" transformaria o piloto em carga total por inércia, e o piloto existe
justamente para descobrir se a oferta cola **antes** de gastar 100 leads descobrindo.

**O `TMP Inserção odoo crm` (`7COGAPeoofZCh58B`) está obsoleto.** Todos os 95 leads dele passaram
pelo P5O e foram corrigidos — inclusive o `gbp_potencial_comercial` que ele nunca mapeou (§10.2).
Pode entrar no procedimento de aposentadoria da R5.

#### O enriquecimento que falta não se resolve com backfill

Muitos dos leads criados estão **sem enriquecimento** no CRM — nasceram crus porque a carga rodou
antes do PROSP-04. A reação natural (*"rodar amanhã uma rodada só de atualização"*) **não
funcionaria**: o filtro `[P5] Ainda nao enviado?` corta toda linha com `data_envio_crm`, e as 81
estão carimbadas. A fila viria vazia, e a conclusão errada seria "não há nada a atualizar".

**Quem resolve é o próprio P4**, e sem rodada extra:

1. A fila dele pula quem já tem `enriquecimento_site` bom — não paga token duas vezes.
2. Ao terminar cada lead ele chama o `[P5] CRM-out`, que é o P5O em **modo contínuo**.
3. Esse caminho entra pelo `[P5] Entrada` e **não passa** pelo filtro do `data_envio_crm` — o lead é
   atualizado no Odoo mesmo já tendo sido enviado.

> **Enriquecer já é sincronizar.** Os dois caminhos do P5O existem para isso: o backfill é
> *"leve quem nunca foi"*, o contínuo é *"leve este agora, de novo se preciso"*. Quem confunde os
> dois conclui que o dado sumiu.

**E o contador que faltava está no P4, não no P5.** O `[P4] Fila` emite `_elegiveis`, `_na_fila`,
`_adiados_pelo_limite` e `_fora_ja_enriquecido` no primeiro item — a próxima execução dele diz de
graça quantos leads ainda faltam enriquecer, número que não se consegue tirar do P5.

⚠️ **Custo:** o P4 gasta Apify + PageSpeed + Gemini Flash por lead, com `LIMITE_LOTE = 10`
(~35 min/rodada, escolha do Olavo em 02/09). Cada rodada é gasto real e depende do OK dele.

### 11.11 Achado na leitura do lead 115 — o P5O pode estar mapeando `score_gbp` errado

Ao ler um lead real do Odoo para construir o P6 (execução `39660`, lead `id` 115, AGROLU), apareceu
`gbp_score_tecnico: 56`. O `[P5] Montar payload Odoo` faz `inteiro("gbp_score_tecnico", j.score_gbp)`.

A skill `phi-odoo-crm` diz o contrário, com todas as letras:

> **`score_gbp` (planilha) NÃO é o `gbp_score_tecnico`.** É a **média das dimensões disponíveis**,
> que são percentis dentro do grupo. Grandeza diferente do score técnico do modelo antigo.
> **Não mapeie.**

**Não corrigi** — é escopo do P5, não do P6, e mexer num writer que acabou de carregar 81 leads sem
plano seria a R7 ao contrário. Fica registrado para decisão.

O mesmo lead traz `gbp_ipc: 0`, e a skill diz que esse campo **não tem fonte** e deveria ficar vazio
(I3). Aqui a causa é provavelmente outra — campo `Integer` no Odoo armazena `0` quando ninguém
escreve — mas vale confirmar antes de tratar como violação.

### 11.12 O P6 do HubSpot estava ativo, e ninguém sabia

`Comercial - Sync HubSpot -> Planilha (loop de aprendizado)` (`WRFU2NM8rLJU7bRT`) rodava **a cada
6 horas**. Não aparecia em nenhuma busca por "PROSP" porque **nunca foi renomeado** para o padrão, e
a descrição dele era **`null`** — o caso que a R5 descreve: inventário pega estrutura, intenção só
existe se alguém escrever.

**Por que não causou dano:** o cursor estava congelado em **08/09** e a busca por deals modificados
voltava vazia. Rodava em 0,7 s e parava ali — verde, sem escrever.

**Por que era uma arma carregada:** bastava alguém tocar num deal do HubSpot para ele acordar, trazer
tudo desde 08/09 de uma vez e escrever na planilha com o mapeamento antigo. E o mapeamento dele casa
por **`id_hubspot`** e escreve **`data_sync_hubspot`** — duas colunas que **não existem mais**. Com
`onError: continueRegularOutput` no nó de escrita, é exatamente o bug das duas semanas da R11, ainda
armado.

**Desativado em 16/09** com OK do Olavo, antes de o substituto existir. A aposentadoria formal (nome
e sticky) fica para quando o PROSP-06O estiver provado — pôr `[APOSENTADO]` num workflow cujo
substituto ainda não roda seria mentir no nome.

**O `[APOSENTADO 2026-09-16] PROSP-05 CRM-out (deal + id)`** (`94lSWJfxfu653KdN`), esse sim, completou
os cinco passos da R5 no mesmo dia.

### 11.13 PROSP-06O rodada 1 (16/09) — a drenagem dos 100, e o P6-5 reprovado

**As-built da rodada 1 do `PROSP-06O Sync Odoo -> Planilha`** (`Yc4shCqDzqiYHR3s`, inativo). Escrito
**com o reprovado dentro**: a regra não é documentar quando ficar pronto, é documentar o que
aconteceu (R2).

**O que aconteceu.** Sete execuções manuais em 16/09. Seis drenaram, a sétima expôs o defeito. Os
100 leads que o Odoo devolve foram todos escritos na planilha, **zero erro de cota e zero erro de
escrita**.

**A cadeia do cursor, execução a execução** — lida das próprias execuções, não do relatório:

| Execução | `since` que entrou | cursor que saiu |
|---|---|---|
| `39926` | `2026-08-17T19:58:55Z` (recuo de 30 dias — **o cursor estava vazio**) | `2026-09-16T00:03:08Z` |
| `39932` | `2026-09-16T00:03:08Z` | `2026-09-16T01:44:05Z` |
| `39933` | `2026-09-16T01:44:05Z` | `2026-09-16T01:56:30Z` |
| `39934` | `2026-09-16T01:56:30Z` | `2026-09-16T02:00:16Z` |
| `39935` | `2026-09-16T02:00:16Z` | `2026-09-16T02:01:52Z` |
| `39936` | `2026-09-16T02:01:52Z` | `2026-09-16T02:02:27Z` |
| `39937` | `2026-09-16T02:02:27Z` | 🔴 **erro** — fila vazia |

**A cadeia não tem buraco:** o cursor que sai de uma rodada é exatamente o `since` da seguinte. É
isso que prova que nenhum lead foi pulado nem repetido — **sem abrir a planilha**.

**A contabilidade fecha em 100.** A fila por rodada foi
**100 → 97 → 77 → 57 → 37 → 17 → 0**, ou seja **3 + 20 + 20 + 20 + 20 + 17 = 100** escritas.
A primeira rodada escreveu **3** porque a vazão ainda estava em 3, do smoke do conserto; só depois
subiu para 20. A última escreveu **17** porque era o que sobrava. Conferido na `39936`
(`_lidos_no_odoo: 100`, `_modificados: 17`, `_fora_nao_modificado: 83` — **83 + 17 = 100**) e na
`39937` (`_modificados: 0`, `_fora_nao_modificado: 100`): não sobrou nada.

⚠️ **Correção ao relatório da rodada 1:** ele diz que `_modificados` caiu 20 e
`_fora_nao_modificado` subiu 20 **em toda rodada**. **Nas duas pontas não foi 20** — foi 3 na
primeira e 17 na última. A conclusão (a contabilidade fecha sozinha, sem abrir a planilha)
continua de pé; o número por rodada, não. Fica escrito porque número afirmado sem medir é a R6
quebrada, e porque quem ler daqui a três meses vai conferir a soma.

**O placar dos sete critérios, como ficou:**

| # | Estado | Por quê |
|---|---|---|
| **P6-1** | não testado | `_fora_sem_linha_na_planilha` deu `0` nas sete rodadas. **Contador zerado não é prova** — nenhum lead sem linha foi exercitado |
| **P6-2** | ✅ **provado** | execução `39937`, na linha do `id_crm` 11: nenhuma coluna do P5 foi tocada |
| **P6-3** | não testado | depende de um lead marcado ganho ou perdido no Odoo |
| **P6-4** | atendido **por acidente** | o `[P6] Calcular novo cursor` lê a **entrada** da escrita. Só não há perda porque o `[P6] Gravar na planilha` **não tem `onError`** e qualquer falha derruba a execução. **A trava é hoje a ausência de uma configuração, e ausência não se documenta sozinha** |
| **P6-5** | 🔴 **reprovado** | execução `39937`. Fila vazia derruba a execução: o sentinela `__SEM_LEAD__` não tem `_write_ms` e o `[P6] Ordenar pelo mais antigo` morre com *"Couldn't find the field '_write_ms' in the input data"* |
| **P6-6** (CA6) | não testado | exige P5 e P6 rodando juntos |
| **P6-7** (CA5) | não testado | mesmo bloqueio do P6-3 |

**O que a rodada 1 deixou armado, e a rodada 2 desarma:**

1. **P6-5** — fila vazia derruba a execução, e **rodada vazia passa a ser o estado normal do P6**.
2. **O cursor lê o que *deveria* ter sido escrito**, não o que foi. A trava é a ausência de
   `onError` — basta alguém pôr um para virar perda silenciosa e permanente.
3. **O empate de segundo.** Os leads criados em lote ficam a ~2 s um do outro (`02:02:23`,
   `02:02:25`, `02:02:27`). Com o filtro `w <= since`, se dois leads tiverem o **mesmo**
   `write_date` e a vazão cortar entre eles, o que ficou de fora **é descartado para sempre**. Não
   aconteceu nesta rodada; está armado.
4. **`acerto_previsao` guarda um veredito já julgado** (`"acertou (alto->ganhou)"`), com a régua do
   dia em que a linha foi escrita, e **nada na linha diz qual régua foi**. Como este campo é a base
   de aprendizado do score, misturar duas réguas sem etiqueta não deixa a base imprecisa: deixa
   **inutilizável**, e o estrago é **retroativo**.

**`data_criacao_deal` mudou de significado — registrar, não desfazer.** Na linha do `id_crm` 11 o
campo era `2026-05-06` e virou `2026-09-09`. **O comportamento é o desenhado** — é coluna do P6 e o
valor é o `create_date` real do Odoo. Mas para os ~100 leads migrados o **`dias_no_funil` passa a
contar da migração, não do primeiro contato**. Quem ler a base de aprendizado daqui a três meses vai
achar que esses leads fecharam muito rápido. A planilha ainda tem a coluna `data extração` se um dia
quisermos o funil de verdade — mas isso é mudança de desenho, não conserto.

**Pergunta aberta, fora do caminho crítico:** o que o nó do Google Sheets faz com uma chave que não
casa em `update`? Não sabemos, e depois da decisão de pôr um IF antes da ordenação **não precisamos
saber para seguir**. Fica registrado para não voltar como dúvida.

### 11.14 PROSP-06O rodada 2 (17/09) — os quatro consertos, e o P6-5 provado

Quatro mudanças no `Yc4shCqDzqiYHR3s`, nó a nó.

**1. `[P6] Tem lead?` (novo, IF, antes da ordenação) — fecha o P6-5.**
Condição: `id_crm` **diferente de** `__SEM_LEAD__`. Saída verdadeira segue para o
`[P6] Ordenar pelo mais antigo`; **a falsa não vai a lugar nenhum** — o fluxo para de propósito, e o
diagnóstico continua visível na saída do `[P6] So os modificados`.

🔴 **Por que não é `_modificados > 0`:** o diagnóstico só é colado no **item 0**. O IF avalia item a
item, então numa rodada de 20 leads o item 0 passaria e os **19 outros cairiam** com `undefined > 0`
— 1 linha escrita em vez de 20, sem erro nenhum. **Filtro item a item só pode testar campo que
existe em todo item.** Campo que só o primeiro item carrega é diagnóstico, não critério.

**2. `[P6] Calcular novo cursor` — o cursor passa a avançar sobre o que foi escrito.**
Antes lia a **entrada** da escrita. Agora lê a **saída** do `[P6] Gravar na planilha` e busca o tempo
de cada lead no `[P6] Vazao do lote`, **casando por `id_crm`**.

O desvio existe porque o `_write_ms` é campo auxiliar e **não está no mapeamento de colunas**: a
saída do nó de escrita traz as 14 colunas mapeadas e mais nada. **Conferido na execução `39936`
antes de escrever o código** — ler o que a saída traz de verdade, em vez de supor, é a R6.

Se nenhum gravado casar com um tempo conhecido, o nó devolve `[]` e **o cursor não se mexe**.

**3. O empate de segundo — corte com sobreposição condicional.**
Se um lead que ficou **de fora** do lote tem exatamente o mesmo `_write_ms` do último gravado, o
cursor **recua 1 segundo** para que ele volte na rodada seguinte. Sem isso ele voltaria com
`w <= since` e seria **descartado para sempre**.

⚠️ **Não é nenhuma das duas formas de uma linha que o brief ofereceu** (`maxMs - 1000` sempre, ou
`w < since` sempre), e o motivo é que as duas têm a **mesma consequência não prevista**: elas
re-incluem o segundo do cursor **em toda rodada**, inclusive quando nada mudou. O lead da fronteira
seria reescrito 4× por dia para sempre, e **a fila nunca ficaria vazia** — o que contradiz a premissa
da §2.1 (*"rodada vazia passa a ser o estado normal do P6"*) e o próprio P6-5 (*"a execução diz 0
leads modificados"*).

Recuar **só quando um empate foi mesmo cortado** dá o mesmo invariante sem o custo: nenhuma repetição
em regime, e nenhuma perda na fronteira. **Trava contra parada eterna:** se recuar 1 s não fizesse o
cursor passar do `since` da rodada (só acontece se um único segundo tiver mais leads que a vazão
inteira), o nó **avança e carimba `_empate_maior_que_o_lote: true`** no log — progresso visível é
melhor que travar em silêncio.

**4. `acerto_previsao` leva a régua dentro do texto.**
`"acertou (>=60 -> ganhou)"` no lugar de `"acertou (alto->ganhou)"`. O número está **escrito à mão**
no código do `[P6] So os modificados`, numa constante usada **tanto na comparação quanto no texto** —
assim o carimbo não pode discordar da régua que o produziu. **Não foi para nó de config:** config se
troca em silêncio, e foi assim que o carimbo do modo passou a mentir (§11.9).

⚠️ **Os dois `60` do projeto não são a mesma coisa.** O **corte de entrada** do P5
(`potencial_comercial >= 60`) decide quais leads vão ao CRM e é **temporário** — o Olavo já disse que
sobe. A **régua de aprendizado** decide o que conta como "alto" ao julgar o acerto, e é pergunta de
**análise**. Quando o corte subir para 70, a régua **não tem obrigação de subir junto**. Está escrito
no comentário do nó.

**O que ficou provado (execução `40249`, 17/09):**

| Cenário da §3 | Resultado |
|---|---|
| **Fila vazia** | ✅ **provado**. Execução **verde**. `_lidos_no_odoo: 100`, `_modificados: 0`, `_regua_acerto: 60`. O `[P6] Tem lead?` mandou o sentinela para a saída falsa, **`lastNodeExecuted` parou nele**: zero linha escrita e **o cursor não se mexeu** (segue em `2026-09-16T02:02:27Z`) |
| **Fila com leads** | ⏸️ **não testado — sem fila para testar.** Os 100 leads estão todos abaixo do cursor e ninguém tocou no Odoo. É justamente o cenário que reprovaria a condição errada do IF |

**O código do cursor foi verificado fora do n8n**, contra os dados reais da `39936`, em cinco casos:
caminho normal, empate cortado (recua 1 s), nada gravado (devolve `[]`), empate maior que o lote
(avança e avisa) e gravado sem tempo casado (ignora sem derrubar). Os cinco deram o esperado. **Não
há skill instalada de JavaScript de nó Code** — registrado para a próxima sessão não procurar de novo.

**Achado de §0 que corrige o brief:** `notes` de nó **é gravável** pelas ferramentas disponíveis — o
`[P6] Tem lead?` foi criado com `notes` e o campo está lá na releitura. A afirmação de que não era
(§11.6 da rodada 1) está errada. **Sticky continua legítimo**, mas não por falta de alternativa.

### 11.15 PROSP-06O rodada 2 (17/09) — a sequência de três rodadas que fecha P6-4 e P6-5

**O problema de método:** os 100 leads estavam todos abaixo do cursor e ninguém tinha tocado no
Odoo, então o cenário *"fila com leads"* — **o único que reprovaria a condição errada do IF** — não
tinha fila para acontecer. Com OK do Olavo, o cursor foi **rebobinado** para
`2026-09-16T02:00:16Z`, recolocando 37 leads na fila. Repetir é inofensivo: o P6 faz `update` em
linha que já existe, nunca `appendOrUpdate` (I2).

Como **não há ferramenta MCP que escreva linha em Data Table**, isso exigiu um workflow descartável,
`[TEMP 2026-09-17] Rebobinar cursor do P6O` (`uFcx8z2kvadipVrO`), **arquivado logo após o teste**.
Registrado para a próxima sessão não procurar a ferramenta de novo.

**Os números foram declarados ANTES de rodar** (R11, regra 4) e conferidos depois:

| Rodada | Execução | `since` | `_modificados` | escritas | cursor ao fim | previsto? |
|---|---|---|---|---|---|---|
| **A** | `40254` | `02:00:16Z` | 37 | **20** | `02:01:52Z` | ✅ |
| **B** | `40256` | `02:01:52Z` | 17 | **17** | `02:02:27Z` | ✅ |
| **C** | `40257` | `02:02:27Z` | **0** | **0** | parado | ✅ |

**As três coisas que isso prova, e que provar isolado não provaria:**

1. 🟢 **A condição do IF está certa** — a rodada A escreveu **20 linhas, não 1**. Se o teste fosse
   `_modificados > 0`, o item 0 passaria e os 19 outros cairiam com `undefined > 0`. **É o teste que
   o brief mandou fazer, e ele passou.**
2. 🟢 **P6-4 — o cursor avança sobre o que foi escrito.** A cadeia A→B→C não tem buraco: o cursor que
   sai de uma rodada é o `since` da seguinte, e para exatamente no `write_date` do último lead
   **gravado** (`id_crm` 101 em A, o 115 em B). Agora isso vale **por desenho**, não pela ausência de
   um `onError`.
3. 🟢 **P6-5 re-provado em sequência**, que vale mais que isolado: a fila **voltou a ficar vazia
   sozinha**, ao fim da drenagem, e a execução terminou **verde** com `_modificados: 0`, zero linha
   escrita e o cursor parado. É o estado normal do P6 acontecendo de verdade, não montado.

O `[P6] Ler a planilha` executou **1 vez por rodada** nas três — o `executeOnce` segue de pé.

**O que estas três rodadas NÃO provam:** o recuo de 1 segundo. Os leads estão ~2 s um do outro, o
corte de A caiu limpo e `_empate_cortado` deu `false`. Esse ramo segue provado **só fora do n8n**, no
teste contra os dados reais da `39936`. **Não invente que foi provado em execução.**

#### 11.15.1 O ramo do empate maior que o lote passa a PARAR, não a avançar

Decisão do chat-mãe, e está certa: na primeira versão, quando um único segundo tivesse mais leads que
a vazão inteira, o nó **avançava o cursor e só avisava no log** — e ali **um lead é perdido de
verdade**. Agora o `[P6] Calcular novo cursor` **lança erro e para**.

As linhas daquele lote **já foram gravadas** e o cursor **não avança**, então a rodada seguinte as
repete — inofensivo. A mensagem do erro diz o que fazer: **aumentar o `maxItems` do
`[P6] Vazao do lote`**. **Parar é recuperável; perder não é.** Entrou antes da ativação, como pedido.

#### 11.15.2 A janela de prova do P6-1 é UMA rodada

Lead sem linha na planilha é contado em `_fora_sem_linha_na_planilha` **na rodada seguinte à
modificação dele** — e ele **nunca é gravado**, então o cursor passa por cima dele assim que outro
lead mais recente for escrito. **Depois disso ele some do contador.**

**Consequência prática:** quando o Olavo criar o lead à mão no Odoo, a **primeira** rodada depois
disso é a prova do P6-1. Se alguém rodar o workflow sem olhar o diagnóstico, **a janela fecha** e o
gesto precisa ser repetido. Quem for provar o P6-1: rode **uma** vez e leia
`_fora_sem_linha_na_planilha` e `_sem_linha_ids` na saída do `[P6] So os modificados`.

### 11.16 O gatilho do P6 — e o achado de que não há gatilho do P5

> 🔴 **CORRIGIDO EM 17/09 — a conclusão desta seção está ERRADA. Ver §11.20.**
> O `PROSP-05O` **tem** um gatilho agendado (`[P5] Reconciliacao 6h`), e ele cai no **minuto 0**.
> A colisão que a §12.2 temia é **real**. O resto da seção (o P6 ser o único agendado *hoje*, por o
> P5O estar inativo, e a decisão do minuto 20) continua de pé.

O brief (§12.2) pedia: leia o minuto do gatilho do P5, e declare um diferente para o P6. **Li o
parque inteiro, e a premissa não se sustenta.**

🔴 **Nenhum workflow da cadeia P1→P2→P3→P4→P5O tem gatilho agendado.** Conferido um a um:

| Workflow | Ativo? | Gatilho |
|---|---|---|
| `PROSP-01 Intake (Telegram)` | sim | **`[P1] Telegram Trigger`** — e só |
| `PROSP-02 Descoberta` | sim | nenhum — chamado pelo P1 |
| `PROSP-03 Scoring` | sim | nenhum — chamado pelo P2 |
| `PROSP-04 Enriquecimento` | sim | `executeWorkflowTrigger` — chamado pelo P1 |
| `PROSP-05O CRM-out Odoo` | não | nenhum — chamado pelo P4 |

A cadeia inteira **só anda quando uma pessoa manda "Iniciar prospecção" no Telegram e aperta o botão
de aprovação** (`[P1] Aprovar prospeccao?`, com `approverIds` travado no chat que iniciou). O P6 será
**o primeiro e único workflow agendado da Prospecção**.

**O que isso muda no risco:**

- **A colisão determinística de minuto não existe.** Não há dois cron caindo em `:00`. O medo da
  §12.2 era real como categoria e não se materializa aqui.
- **O que resta é sobreposição aleatória:** alguém inicia uma prospecção pelo Telegram e uma rodada
  de 6 h do P6 cai no meio. Um minuto escolhido **reduz** a chance de coincidir no minuto exato, mas
  **não elimina** a janela — uma rodada de prospecção dura vários minutos.
- **O que de fato contém:** o P6 é barato no Sheets — **1 leitura da aba** (`executeOnce`) e **no
  máximo 20 escritas** por rodada. Foi o loop da rodada 1 que multiplicava leitura, e ele não existe
  mais.

**Decisão, escrita em vez de herdada:** `triggerAtMinute: 20`, `hoursInterval: 6`. O padrão do
`scheduleTrigger` é minuto `0`, e estava **sem declarar** — o minuto 20 tira o P6 do topo da hora,
onde tudo que fica no padrão se junta. **Não é proteção contra o P5; é higiene contra o resto da
instância.**

### 11.17 Como provar o P6-6 / CA6 sem ativar nada

O critério é *"com P5 e P6 rodando, nenhum campo tem dois donos"*. **Não precisa dos dois ativos —
precisa dos dois tendo rodado sobre a mesma linha.**

**O teste, em quatro passos:**
1. Rodar o **P6** sobre um lead e **anotar a linha inteira**.
2. Rodar o **P5** sobre o **mesmo** lead.
3. **Ler a linha de novo.**
4. Comparar.

**O que tem de acontecer:** as colunas do P6 **não podem ter mudado**, e as colunas do P5 **não podem
ter sido tocadas pelo P6** — com a única exceção do **`id_crm`**, que o P6 reescreve com o **mesmo
valor** por exigência do nó do Sheets (ver a *Exceção documentada ao I1*, no §4).

### 11.18 Rótulos honestos do que ficou

- **O recuo de 1 segundo:** *provado em teste fora do n8n, contra os dados reais da `39936`; **não
  exercitado em produção***. Em todas as rodadas reais `_empate_cortado` deu `false`, porque os leads
  estão a ~2 s um do outro. **Forçar um empate artificial seria fabricar o teste.** O momento em que
  ele será exercido de verdade já é conhecido: **a próxima carga em lote no Odoo**.
- **O `[TEMP 2026-09-17] Rebobinar cursor do P6O`** (`uFcx8z2kvadipVrO`): ferramenta de uma vez,
  **arquivada**. Não cabe o procedimento de aposentadoria da R5 — ele não substituiu nada. O que o
  torna seguro é estar registrado aqui: **a R5 é sobre intenção, e a intenção está escrita.**
- **A descrição do workflow** ainda termina em `EM CONSTRUCAO`, e fica assim **de propósito** até os
  sete critérios fecharem. **Descrição que diz "pronto" antes da prova mente**, e é exatamente o que
  a R5 existe para impedir.

**A ordem do que falta:** os dois gestos do Olavo no Odoo → **uma** rodada do P6 (janela única,
§11.15.2) → P6-1, P6-3 e P6-7/CA5 → o teste do §11.17 → **então** a descrição → **então** a proposta
de ativação.

### 11.19 A rodada dos dois gestos (17/09) — P6-1, P6-3, P6-7/CA5 e o CA7 medido pela 1ª vez

Olavo marcou **um lead ganho** (`id_crm` 66), **um perdido** (`id_crm` 43) e **criou um à mão**
(`id_crm` 116, sem linha na planilha). **Uma rodada** — execução **`40263`** — fechou os três
critérios de uma vez. Números declarados antes de rodar.

| Campo | Esperado | Obtido | |
|---|---|---|---|
| `_modificados` | 2 | **2** | ✅ |
| `_fora_sem_linha_na_planilha` | 1 | **1** | ✅ |
| `_sem_linha_ids` | o id do novo | **`116`** | ✅ |
| `_lidos_no_odoo` | ~116 | **101** | ⚠️ ver abaixo |
| linhas escritas | 2 | **2** | ✅ |
| cursor | avança | **`2026-09-17T19:13:05Z`** (o `write_date` do 66) | ✅ |

#### 11.19.1 🟢 CA7 **PASSA** — o `active_test` está sendo desligado

Este é o número que ninguém tinha medido: o ramo `[P6] Ler leads arquivados` **nunca tinha tido um
lead arquivado para ler**. Agora teve.

**`_lidos_no_odoo` deu `101`, não `231`.** E o ramo arquivado devolveu **exatamente 1 item** — o lead
43. Ou seja: o filtro `active=false` **está** desligando o `active_test` nesta instância, os dois
ramos são disjuntos (100 ativos + 1 arquivado = 101) e **nenhum lead entra duas vezes**.

**Dito com todas as letras: o CA7 passou.** Se tivesse dado ~202, cada lead estaria entrando duas
vezes e todo o resto desta rodada seria suspeito.

⚠️ **O `101` contraria a estimativa de `~116` do brief, e o certo é o `101`.** O maior `id_crm` hoje é
**116**, mas **id não é contagem**: há buracos na sequência. **Não tenho como confirmar** o que
consumiu os 15 ids que faltam — leads apagados, fundidos, ou ids queimados em tentativas de criação.
Fica registrado como pergunta aberta, porque `101` é o número que a base devolve e `116` era uma
inferência a partir do último id.

#### 11.19.2 🟢 P6-1 — conta sem criar linha

O lead `116` não tem linha na planilha. Ele apareceu em `_fora_sem_linha_na_planilha: 1` com o id em
`_sem_linha_ids`, e **a planilha continuou com 314 linhas**: foi **contado, não criado**.

#### 11.19.3 🟢 P6-3 — o desfecho vem do `won_status`, não do estágio

O lead 43 é a prova limpa. No Odoo ele está assim:

```
stage_id: [1, "Prospecção"]   active: false   won_status: "lost"
lost_reason_id: false          probability: 0  date_closed: 2026-09-17 19:12:35
```

**O estágio dele ainda é "Prospecção" e a probabilidade é 0** — perder no Odoo **arquiva**, não move
de estágio. Ainda assim a planilha recebeu **`status_crm: Perdido`**. Se o rótulo viesse do estágio,
diria "Prospecção"; se viesse da probabilidade, diria qualquer outra coisa. **Veio do desfecho.**

O mesmo vale para o 66: o estágio dele também não é um estágio de ganho, e a linha recebeu **`Ganho`**
porque `won_status` é `won`.

#### 11.19.4 🟢 P6-7 / CA5 — o desfecho chegou à planilha na rodada seguinte

Marcados no Odoo às `19:12:35` e `19:13:05`; a rodada das `19:17` levou os dois à planilha.

#### 11.19.5 A linha, antes e depois — nenhuma coluna do P5 tocada

Comparação da linha inteira, lida da aba **antes** (execução `40263`) e **depois** (execução `40264`):

| `id_crm` | linha | o que mudou | o que **não** mudou |
|---|---|---|---|
| **43** | 29 | `status_crm` `Prospecção`→`Perdido` · `data_fechamento` vazio→`2026-09-17T19:12:35Z` · `acerto_previsao` vazio→`acertou (<60 -> perdeu)` · `dias_no_funil` 7→8 · `data_sync_crm` | **NENHUMA outra.** `potencial_comercial` 52, `score_gbp` 59, dimensões, `id`, `data extração` — intactos |
| **66** | 52 | `status_crm` `Prospecção`→`Ganho` · `data_fechamento` vazio→`2026-09-17T19:13:05Z` · `acerto_previsao` vazio→`acertou (>=60 -> ganhou)` · `probabilidade` vazio→100 · `dias_no_funil` 7→8 · `data_sync_crm` | **NENHUMA outra.** `potencial_comercial` 97, `score_gbp` 99 — intactos |

**O `id_crm` foi reescrito com o mesmo valor nas duas**, exatamente como a *Exceção documentada ao I1*
prevê. **É a comparação campo a campo que fecha isso**, não a leitura do mapeamento.

A **régua bate com o dado** nos dois casos: o 43 tem `potencial_comercial` **52** (`< 60`) e perdeu —
`acertou`; o 66 tem **97** (`>= 60`) e ganhou — `acertou`.

#### 11.19.6 `motivo_perda` vazio é o I3, não defeito

A linha do perdido ficou com **`motivo_perda` vazio**. Conferido na origem antes de chamar de bug:
no Odoo o lead 43 tem **`lost_reason_id: false`** — ele foi marcado como perdido **sem escolher um
motivo**. Campo não observado grava **vazio**, nunca `0` nem um motivo inventado. **É o I3
funcionando.**

Para exercitar o `motivo_perda` de verdade, basta marcar um lead como perdido **escolhendo um motivo**
na tela do Odoo. **Não é pendência do P6.**

#### 11.19.7 A janela do P6-1 não fechou

A execução `40264` (feita só para reler a aba) mostrou `_fora_sem_linha_na_planilha: 1` de novo, com
`_sem_linha_ids: 116`. O cursor parou em `19:13:05Z` e o `write_date` do 116 é **posterior** a isso,
então ele **continua na contagem** até que algum lead mais recente seja gravado. A janela da §11.15.2
é real, mas **neste caso ela ainda está aberta**.

A `40264` também re-provou o P6-5 pela terceira vez: `_modificados: 0`, verde, **zero escrita**,
cursor parado.

### 11.20 Correção da §11.16 — o P5O TEM gatilho agendado, e ele cai no minuto 0

**Eu errei na §11.16.** Escrevi que nenhum workflow da cadeia P1→P5O tem gatilho agendado. O
`PROSP-05O CRM-out Odoo` (`0H1mdPuICHsyWGxt`) tem:

```
[P5] Reconciliacao 6h   scheduleTrigger   { field: "hours", hoursInterval: 6 }
                                          SEM triggerAtMinute  ->  padrao = minuto 0
```

E ele **não está desabilitado** — ao contrário dos outros dois gatilhos do mesmo workflow
(`[P5] Entrada` e `[SMOKE] Trigger manual`, os dois `disabled`).

**Como eu errei:** confiei no `triggerCount: 0` que a listagem de workflows devolve. **`triggerCount`
conta gatilhos ATIVOS, não gatilhos declarados** — o P5O está inativo, então reporta `0` mesmo tendo
um `scheduleTrigger` dentro. Para o P1 e o P4 eu li os nós um a um; para o P5O aceitei o número da
listagem e a descrição (*"chamado pelo P4"*). **É a R11 aplicada ao próprio método de auditoria: um
campo que roda verde dizendo o contrário do que o nome sugere.**

> **A regra que sai daí:** *para saber se um workflow tem gatilho, leia os NÓS. `triggerCount` só
> responde se ele está disparando agora.*

**O que isso muda — e o que não muda:**

| | |
|---|---|
| **A §12.2 estava certa** | os dois gatilhos são de 6 em 6 horas, e o do P5O está no **minuto 0** por omissão. No dia em que o P5O for ativado, com o P6 no padrão, **os dois disparariam no mesmo minuto, em toda rodada** |
| **O minuto 20 do P6 deixa de ser higiene e vira conserto** | foi declarado por precaução e agora está **justificado por dado**: `:20` contra `:00` |
| **Hoje ainda não colidem** | o P5O está **inativo**. O risco é na ativação dele, não agora |
| **Fica uma recomendação para o P5O** | quando for ativado, **declarar o minuto dele também**, em vez de herdar o `0`. Dois workflows no padrão é uma colisão esperando o segundo ser ligado |

### 11.21 Por que o teste do P6-6 não pode ser feito como foi pedido

A instrução era *"rodar o P5O direto pelo MCP, `lote_max = 1`, sobre o lead 66"*. **Li o workflow
antes de executar, e por este caminho isso não existe.** Os três gatilhos do P5O:

| Gatilho | Estado | Para onde vai |
|---|---|---|
| `[P5] Entrada` (sub-workflow) | **desabilitado** | `[P5] Ler a linha do lead` — o caminho de UM lead |
| `[SMOKE] Trigger manual` | **desabilitado** | `[SMOKE] Lead de teste` → o mesmo caminho de um lead |
| `[P5] Reconciliacao 6h` | **ativo** | `[P5] Ler a planilha inteira` — o caminho de LOTE |

**Executar o P5O por MCP hoje entra pelo único gatilho habilitado, o de reconciliação.** E o primeiro
filtro desse caminho é:

```
[P5] Ainda nao enviado?   ->   data_envio_crm VAZIO
```

🔴 **O lead 66 já tem `id_crm` e `data_envio_crm` preenchidos. Ele é descartado no primeiro filtro.**
O que esse caminho faria é pegar até `lote_max` leads **que nunca foram enviados** e **criar leads
novos no CRM de produção** — o oposto exato de um teste controlado sobre uma linha conhecida.
`lote_max = 1` reduziria o estrago a um lead, mas **ainda seria um lead novo, e não o 66**.

**O caminho cirúrgico existe e está desligado.** O `[SMOKE] Lead de teste` é um nó Code com o
`place_id` escrito à mão (hoje o da Niti), e o comentário dele diz *"Trocar aqui para testar outro
lead"*. O `place_id` do lead 66 é **`ChIJRbRZHD6tvZQRnfJIsYfMH8Q`**.

**Procedimento proposto, não executado** (mexe em workflow que não é desta frente e escreve no CRM):
1. **Desabilitar** `[P5] Reconciliacao 6h` — senão há risco de o MCP entrar pelo gatilho errado e
   criar até 20 leads novos no CRM.
2. **Habilitar** `[SMOKE] Trigger manual`.
3. Trocar o `place_id` do `[SMOKE] Lead de teste` para o do lead 66.
4. Rodar **uma vez**.
5. **Desfazer os três** — restaurar o `place_id` da Niti, desabilitar o smoke, reabilitar o 6h.

### 11.22 🔴 Pergunta aberta — o `[P5] Entrada` está desabilitado

A descrição do P5O diz *"chamado pelo P4 desde 16/09"*. Mas o `[P5] Entrada`, que é o
`executeWorkflowTrigger` — **a única porta pela qual o P4 consegue chamá-lo** — está **desabilitado**.

**Não sei dizer qual das duas coisas é verdade**, e as duas são graves de formas diferentes:
- ou a **descrição está desatualizada** e o P4 não chama mais o P5O (R5 quebrada, e a passagem
  P4→P5 não existe);
- ou o **P4 chama e a chamada não entra**, e a perna do P5 está quebrada em silêncio desde que o nó
  foi desabilitado.

**É a perna P5 do pipeline, não é escopo do P6, e não dá para descobrir sem olhar uma execução do P4.**
Fica registrado como a pergunta mais urgente da frente.

### 11.23 A resposta da §11.22 — nem descrição mentindo, nem quebra: **arma que nunca disparou**

**A última execução do `PROSP-04` é de `2026-09-10T01:18Z` (`37437`, com erro). Não há nenhuma desde
então** — e a religação para o Odoo é de **16/09**. Como o chat-mãe antecipou: a ausência de execução
**já é a resposta**.

Então as duas hipóteses da §11.22 estavam as duas erradas, e a verdade é uma terceira:

> **O caminho `P4 → P5O` nunca foi exercitado.** A descrição não mentia sobre a ligação — a fiação
> foi mesmo feita em 16/09. Ela mentia sobre o **tempo verbal**: *"chamado pelo P4"* descreve algo
> que **nunca aconteceu nem uma vez**.

#### 11.23.1 🔴 E estava armado para falhar em silêncio

O nó chamador, o **`[P5] CRM-out` dentro do `PROSP-04`**, está assim:

```
onError: "continueRegularOutput"     retryOnFail: true
options: { waitForSubWorkflow: true }
```

Com o `[P5] Entrada` desabilitado, a chamada não teria entrada válida. E com
`continueRegularOutput`, **o P4 seguiria verde**: nenhum lead chegaria ao CRM, `id_crm` ficaria vazio,
e **nem `erro_envio_crm` seria gravado** — porque o ramo de erro do P5O nunca chegaria a rodar.

**É o modo de falha da casa, exatamente:** verde por fora, nada por dentro. É o mesmo desenho que
custou as duas semanas do `id_hubspot`. A única razão de não ter acontecido é que **ninguém rodou o
P4 desde 10/09**.

⚠️ **Recomendação, fora do escopo do P6 e não executada:** o `onError` do `[P5] CRM-out` precisa de
**destino visível** (R11, regra 2) — ou vira `continueErrorOutput` com um ramo que grava
`erro_envio_crm`, ou sai. Erro que só existe no log de execução não existe. **Decisão do dono do P4.**

#### 11.23.2 O que foi feito

| Item | Estado |
|---|---|
| `[P5] Entrada` religado | ✅ `disabled: false`, confirmado na releitura |
| Sticky `[P5] Por que o Entrada fica LIGADO` | ✅ diz por que ele fica ligado, que o chamador tem `onError`, e que **desabilitar exige quem, quando e até quando por escrito** |
| Descrição do P5O corrigida | ✅ agora diz *"Religado ao P4 em 16/09, mas o P4 não roda desde 10/09: esse caminho nunca foi exercitado"* |

⚠️ **Precisão sobre o `notes` de nó** (refina a §11.18): ele é gravável **só na criação do nó**
(`addNode` aceita `notes`). Para nó que já existe **não há operação que escreva `notes`** — por isso
esta nota virou **sticky**. A afirmação original ("não é gravável") estava errada; a correção da
§11.18 ("é gravável") estava incompleta. **O certo é: gravável na criação, não depois.**

### 11.24 P6-6 / CA6 provado por leitura, sem executar nada

O critério é *"com P5 e P6 rodando, nenhum campo tem dois donos"*. **Prova por leitura**: listar o que
cada um escreve e mostrar que não se cruzam. Não precisa de execução — e executar o P5O por MCP
**criaria leads novos no CRM** (§11.21).

**Todos os nós do Google Sheets no `PROSP-05O`** — quatro, e só dois escrevem:

| Nó | Operação | Casa por | Colunas escritas |
|---|---|---|---|
| `[P5] Ler a linha do lead` | leitura | — | — |
| `[P5] Ler a planilha inteira` | leitura | — | — |
| `[P5] Gravar id_crm e data_envio_crm` | `update` | **`id`** (place_id) | `id_crm`, `data_envio_crm`, `erro_envio_crm` |
| `[P5] Gravar o erro na planilha` | `update` | **`id`** (place_id) | `erro_envio_crm` |

**O único nó de escrita do `PROSP-06O`:**

| Nó | Operação | Casa por | Colunas escritas |
|---|---|---|---|
| `[P6] Gravar na planilha` | `update` | **`id_crm`** | `status_crm`, `motivo_perda`, `valor`, `probabilidade`, `via_aquisicao`, `data_criacao_deal`, `data_fechamento`, `dias_no_funil`, `nba_recomendada`, `nba_aceite`, `acerto_previsao`, `data_sync_crm`, `sync_por` |

**O cruzamento:**

```
P5O (valor proprio): data_envio_crm, erro_envio_crm, id_crm
P6  (valor proprio): acerto_previsao, data_criacao_deal, data_fechamento, data_sync_crm,
                     dias_no_funil, motivo_perda, nba_aceite, nba_recomendada,
                     probabilidade, status_crm, sync_por, valor, via_aquisicao

INTERSECAO = VAZIA
```

🟢 **CA6 / P6-6 PASSA.** Nenhuma coluna tem dois donos. As duas sobreposições que existem são de
**chave**, não de valor:

- **`id_crm`** — dono é o **P5O**, que o cria. O P6 o reescreve **com o mesmo valor que leu**, por
  exigência do nó do Sheets (*Exceção documentada ao I1*, §4). **Provado campo a campo** na §11.19.5:
  a coluna não mudou nas duas linhas.
- **`id`** (place_id) — chave do P5O. O **P6 não escreve essa coluna**, e a §11.19.5 confirma que ela
  ficou intacta.

**Uma observação menor, não é violação:** o `[P5] Gravar id_crm e data_envio_crm` inclui `row_number`
no mapeamento — metadado do próprio nó do Sheets, não coluna de negócio, e não é coluna do P6. Fica
anotado para não virar falso achado numa auditoria.

### 11.25 Veredito do CA9 e do CA10 — os dois que quase passaram batido

Os critérios da entrevista de execução iam de CA1 a CA11. O **CA9** e o **CA10** não eram
mencionados desde a §11.8. **Vereditos, por leitura, como o CA6.**

#### 11.25.1 🟢 CA10 — **PROVADO**

> *"Estágio nunca é escrito. Mover um lead para 'Em Cadência' e rodar o P5: o lead continua em 'Em
> Cadência' e nenhum campo dele foi alterado."*

Duas travas independentes, as duas lidas no `PROSP-05O`:

1. **`[P5] Estagio ainda aberto?`** — IF com `stage_id[0] === 1` (Prospecção). Saída **verdadeira**
   vai para `[P5] Payload para atualizar`; a **falsa** vai para um nó cujo nome é o próprio critério:
   **`[P5] Lead e do vendedor - nao mexer`**. Lead em "Em Cadência" é estágio 3 → cai no falso →
   **nada é escrito nele**.
2. **`stage_id` nunca entra no payload.** O `[P5] Montar payload Odoo` não o monta em lugar nenhum, e
   a skill `phi-odoo-crm` proíbe com todas as letras: *"Nunca escrever `stage_id`, won/lost, nem
   qualquer campo computado"*.

**Passa.** E passa por desenho, não por acidente — a entrevista já dizia *"CA10 já é atendido pelo
desenho atual (trava de estágio)"*; **faltava alguém verificar, e agora está verificado.**

#### 11.25.2 CA9 — **metade provada, metade RETIRADA com justificativa**

> *"Zero honesto × zero falso. Lead com `dim_seo = 0` e outro com `dim_seo` vazio: o primeiro mostra
> `0` no Odoo; o segundo mostra **vazio** — não `0`."*

**A metade da escrita: 🟢 PROVADA.** O `[P5] Montar payload Odoo` usa `autoMapInputData`, em que
**campo ausente do payload não é enviado**. E a função que decide:

```js
function num(v) {
  const s = txt(v).replace(",", ".");
  if (s === "") return null;          // vazio -> null -> campo OMITIDO
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function inteiro(campo, valor) { const n = num(valor); if (n !== null) p[campo] = Math.round(n); }
```

`num("")` devolve `null` → o campo **some do payload**. `num(0)` devolve **`0`**, que é `!== null` →
**o zero é enviado**. É a diferença entre `=== ""` e um `if (!n)` descuidado — e é ela que salva o
sinal. **O `gbp_dim_engajamento = 0` da Niti, que é o achado crítico do diagnóstico e não ausência de
dado, sobrevive.**

**A metade da leitura: 🔴 RETIRADA — o critério pede o que o desenho recusa de propósito.**

`gbp_dim_seo` é **Integer** no `phi_crm`. Coluna Integer no PostgreSQL **não guarda "vazio"**: lead
novo nasce com `0`. Não existe configuração que faça um Integer "mostrar vazio" — a §11.11 já tinha
anotado esse comportamento sem tirar a conclusão.

E o módulo **decidiu não resolver isso campo a campo**. A skill `phi-odoo-crm` é explícita:

> *"a ausência é marcada **no conjunto** (`gbp_score_atualizado_em` vazio esconde o card inteiro), e
> **nunca campo a campo**"* — e, na lista de verificação: *"Um `0` num campo GBP continua aparecendo
> como `0`"*.

**Por que o desenho está certo e o critério errado:** marcar ausência por campo obrigaria a
distinguir "vazio" de `0` em seis Integers, e **qualquer esquema que apague zeros destrói o sinal
mais valioso** — o zero da Niti. O módulo escolheu o contrário: **o zero é sempre zero, e a ausência
é do conjunto**. O `gbp_score_atualizado_em` vazio diz *"o PHI nunca rodou neste lead"*, e o campo
computado `gbp_diagnostico` esconde o card inteiro.

**O CA9 foi escrito antes de o desenho do card estar claro.** Fica retirado, e no lugar dele o que
vale e está provado:

> **CA9 (revisado):** *o P5 omite campo GBP não observado e envia o zero observado; a ausência de
> dado é sinalizada no conjunto, por `gbp_score_atualizado_em` vazio, nunca campo a campo.*

⚠️ **Consequência a não esquecer:** como o Integer nasce `0`, **ler um `0` num lead sem
`gbp_score_atualizado_em` não significa "dimensão zero"** — significa "o PHI nunca rodou". Quem for
usar as dimensões em análise **tem de filtrar por `gbp_score_atualizado_em` preenchido primeiro.**

### 11.26 Proposta de ativação do PROSP-06O — **proposta, não executada**

**Pré-requisitos, todos atendidos:** os sete critérios do P6 provados, mais CA6 e CA7; a descrição do
workflow reescrita (§11.27); CA9 e CA10 com veredito escrito.

#### 11.26.1 Os minutos

| Workflow | Gatilho | Minuto | Estado |
|---|---|---|---|
| `PROSP-06O` | `hours`, a cada 6 | **20**, declarado | ✅ já gravado |
| `PROSP-05O` | `[P5] Reconciliacao 6h`, a cada 6 | **sem declarar → 0 por omissão** | 🔴 **declarar antes de ativar** |

**Recomendação: `triggerAtMinute: 40` no P5O.** Fica a 20 minutos do P6 nos dois sentidos — é o
espaçamento máximo possível entre dois gatilhos de 6 h, e tira os dois do `:00`, onde tudo que fica
no padrão se junta. **O P6 é barato** (1 leitura da aba + no máximo 20 escritas), mas espaçar custa
zero e a §11.20 mostrou o que custa não decidir.

#### 11.26.2 O error workflow — **já existe, não construir** (R7)

Procurei antes de propor construção. **Existe e está ativo:**

> **`PHI - Alerta de Falha (errorWorkflow)`** — `UZ7sIE5cWrrO8xea`
> *"Handler de erro compartilhado: dispara quando um workflow do PHI falha em producao e manda o
> motivo no Telegram do Olavo. Existe porque a falha morria na lista de execucoes do n8n — foi o caso
> da credencial do BigQuery em 09/09."*

**A proposta é uma linha de configuração, não um artefato:** apontar o `errorWorkflow` do `PROSP-06O`
(e das demais pernas) para `UZ7sIE5cWrrO8xea`. Hoje o P6O **não tem `errorWorkflow` nenhum**.

**É diferente do Telegram que já existe dentro do P5O**, e os dois convivem:

| | Pergunta que responde | Granularidade |
|---|---|---|
| Telegram dentro do P5O (D3) | *"este lead deu problema"* | **por lead** |
| `PHI - Alerta de Falha` | *"esta execução morreu"* | **por execução** |

⚠️ **Duas ressalvas honestas:**
1. **Error workflow só dispara em execução de produção**, nunca em manual/teste. Todas as provas
   desta rodada foram manuais — **o alerta nunca foi exercitado no P6O**, e só será depois de ativar.
2. Existe um **`PHI - Alerta de Erro (Telegram)`** (`Oj1RbA0laZTzJZPx`), **inativo**, que parece ser o
   antecessor do `UZ7sIE5cWrrO8xea`. **Não apagar sem os cinco passos da R5** — mas vale decidir se
   ele é legado, porque dois workflows com o mesmo nome-conceito é a próxima confusão de auditoria.

#### 11.26.3 Item separado, para antes da próxima prospecção: o `onError` do `[P5] CRM-out`

**Não é do P6 e não foi executado.** Recomendação do chat-mãe, acatada e registrada aqui para não se
perder: **remover o `onError` do `[P5] CRM-out` (no `PROSP-04`), não dar destino a ele.**

O que falha ali é **a chamada do sub-workflow**, não um lead. Falha de lead já tem tratamento dentro
do P5O (D3: grava `erro_envio_crm` e avisa no Telegram, provado na `39633`). Se a **chamada** falha,
não é *"este lead deu problema"* — é **"a perna do CRM está fora do ar"**, e vai falhar para todos
igualmente. **Continuar em silêncio quando a perna inteira caiu é o pior comportamento possível.**
O `retryOnFail` fica, que cobre falha passageira; sem o `onError`, o que sobrar **para e aparece** —
e agora aparece no Telegram, via `errorWorkflow`.

**E por que NÃO dar a ele um ramo que grave `erro_envio_crm`:** essa coluna é do **P5**. O P4
escrevendo nela criaria **dois donos** — exatamente o que o CA6 acabou de provar que não existe.

#### 11.26.4 A ordem sugerida para ligar

1. Declarar `triggerAtMinute: 40` no `[P5] Reconciliacao 6h`.
2. Apontar o `errorWorkflow` das duas pernas para `UZ7sIE5cWrrO8xea`.
3. Remover o `onError` do `[P5] CRM-out` (§11.26.3).
4. **Ativar o `PROSP-06O` primeiro, sozinho**, e observar **uma** rodada de produção: ela deve
   terminar verde com `_modificados: 0` — é o estado normal dele.
5. Só depois ativar o `PROSP-05O`, que é quem escreve no CRM.

> **Por que o P6 primeiro:** ele **só lê** o Odoo e escreve em colunas que são só dele. Se algo der
> errado, o estrago é uma coluna de desfecho desatualizada. O P5 cria lead no CRM — e é o que já
> custou caro duas vezes nesta frente.

**Nada disso foi executado. Aguarda o OK do Olavo.**

### 11.27 A descrição do PROSP-06O — o segundo workflow do parque a passar na R5

Antes terminava em **`EM CONSTRUCAO`**. Agora que os critérios fecharam, ficou honesto escrevê-la:

> *"P6 do CONTRATO na versao Odoo. So LE o crm.lead (I8) e devolve a planilha o desfecho: status,
> perda, datas e o acerto da previsao, base do aprendizado do score. Substituiu o Sync HubSpot ->
> Planilha, desativado em 16/09, que casava por id_hubspot."*

Ela responde as três perguntas da R5: **o que faz** (só lê o CRM e devolve o desfecho), **por que
existe** (o acerto da previsão é a base do aprendizado do score) e **o que substituiu, e por quê** (o
`Sync HubSpot -> Planilha`, que casava por `id_hubspot` — coluna que não existe mais).

**O teste prático da R5 — *"a auditoria semanal precisa perguntar ao Olavo para entender?"* — passa.**
É o segundo workflow do parque a conseguir, depois do `[APOSENTADO 2026-07-21] PHI - Loop Alerta
Fase 1`.

### 11.28 Ativação do PROSP-06O (17/09) — e o furo que a ativação destapou

#### 11.28.1 🟢 §17.2 — a rede está provada, e revelou um incidente vivo

O `PHI - Alerta de Falha (errorWorkflow)` (`UZ7sIE5cWrrO8xea`) **já disparou** — **cinco vezes só em
17/09** (03:00, 07:00 duas vezes, 10:00 e 11:00 UTC), todas `mode: "error"` e `status: "success"`.

**Provado end-to-end**, não só "existe": na execução `40137` dá para ver a cadeia inteira — Error
Trigger → `Montar mensagem do erro` → **`Avisar no Telegram` com `message_id: 629` entregue no chat do
Olavo**. **Ligamos com rede de verdade, não com a foto de uma rede.**

🔴 **Mas cinco disparos num dia é um alarme tocando, não um teste.** O que está falhando:

> **`PHI - Vigia de Frescor dos Dados`** (`JMgc0HdLPOFPnFYb`), no nó `Buscar lacunas de ontem`:
> *"The credential **Google BigQuery account** needs to be reconnected."* — `Access could not be
> refreshed because the connected account has revoked access, the refresh token expired, or the
> account password or permissions changed.*

**É outra frente** (saúde digital / BigQuery), **e só o Olavo pode reconectar** — a própria mensagem
do alerta diz isso. Credencial `UhLRAanVarQeOpQy`. Fica registrado aqui porque foi esta rodada que
encontrou, e porque um vigia de frescor de dados parado é justamente quem deveria avisar que os dados
pararam.

#### 11.28.2 🟢 §17.3 — `PHI - Alerta de Erro (Telegram)` aposentado pelos cinco passos

| Passo da R5 | Estado |
|---|---|
| 1. função consolidada no que fica | ✅ o `UZ7sIE5cWrrO8xea` faz o trabalho, e agora está **provado** |
| 2. desabilitar o chamador | ✅ sem chamador por nó; o "chamador" é o `errorWorkflow` das pernas, e as três que tocamos (P6O, P5O, P4) apontam para o `UZ7sIE5cWrrO8xea` |
| 3. desativar o workflow | ✅ já estava inativo |
| 4. prefixo | ✅ **`[APOSENTADO 2026-09-17] PHI - Alerta de Erro (Telegram)`** |
| 5. sticky com o porquê e proibindo reuso | ✅ diz que o substituto é o `UZ7sIE5cWrrO8xea` e onde configurar |

⚠️ **Limite honesto do passo 2:** não varri o `errorWorkflow` de **todos** os workflows da instância —
só das três pernas desta frente. Se outro workflow apontar para o aposentado, o rename **não quebra
nada** (a referência é por id), mas o alerta dele vai para um workflow que ninguém liga.

#### 11.28.3 🔴 O PROSP-04 ATIVO ainda chama o P5 do HubSpot APOSENTADO

Ao tentar aplicar a remoção do `onError`, o n8n recusou:

```
Cannot publish workflow: Node "[P5] CRM-out" references workflow 94lSWJfxfu653KdN
("[APOSENTADO 2026-09-16] PROSP-05 CRM-out (deal + id)") which is not published.
```

A leitura que isso forçou:

| | aponta para | `onError` |
|---|---|---|
| **Rascunho** do P4 | `0H1mdPuICHsyWGxt` — o **P5O Odoo** | `stopWorkflow` (já com o meu conserto) |
| **Versão ATIVA** do P4 | **`94lSWJfxfu653KdN`** — o **P5 do HubSpot, APOSENTADO** | `continueRegularOutput` |

**E o P4 está `active: true`.**

> **A repontagem de 16/09 foi salva no RASCUNHO e nunca publicada.** O que roda — se alguém rodar o
> P4 — ainda chama o P5 do HubSpot, que está aposentado e inativo. E com `continueRegularOutput`,
> **falharia em silêncio**.

Isto **substitui** a conclusão da §11.23. Lá eu escrevi *"nem descrição mentindo, nem quebra: arma que
nunca disparou"*. A parte de "nunca disparou" continua certa (o P4 não roda desde 10/09). **A parte
de "a fiação foi mesmo feita em 16/09" estava errada: foi feita no rascunho.** A descrição do P5O que
eu corrigi — *"Religado ao P4 em 16/09"* — **também está errada pelo mesmo motivo**, e fica marcada
aqui até alguém publicar o P4.

#### 11.28.4 A regra nova — irmã da R12

Eu li o P4 duas vezes e as duas vezes li o **rascunho**, porque é isso que `get_workflow_details`
devolve em `workflow.nodes`. O que **roda** está em `workflow.activeVersion.nodes`, e o próprio
retorno traz **`sameAsDraft: false`** quando os dois divergem — eu tinha esse campo na tela e não
olhei.

> **Em workflow ativo, `nodes` é o rascunho. O que roda é `activeVersion.nodes`. Antes de afirmar o
> que um workflow ativo faz, compare `versionId` com `activeVersionId` — e se `sameAsDraft` for
> `false`, o rascunho é uma proposta, não o sistema.**

É exatamente a R12 noutra roupa: **estado divergente que não tem cor, não tem alarme e não aparece em
lista nenhuma.**

**E uma mecânica a não esquecer:** `update_workflow` num workflow **ativo** salva o rascunho **e
depois** tenta publicar. Quando a publicação é recusada, **a alteração do rascunho permanece**. Foi o
que aconteceu: o `onError: stopWorkflow` e o `errorWorkflow` **estão no rascunho do P4**, sem
publicar. Não é atômico através da fronteira da publicação.

#### 11.28.5 O que ficou no ar, e o que não

| Item da §11.26.4 | Estado |
|---|---|
| 1. `triggerAtMinute: 40` no `[P5] Reconciliacao 6h` | ✅ gravado |
| 2. `errorWorkflow` → `UZ7sIE5cWrrO8xea` | ✅ nas três pernas (P6O, P5O, e no rascunho do P4) |
| 3. remover o `onError` do `[P5] CRM-out` | 🟡 **no rascunho, não publicado** — bloqueado pela §11.28.3 |
| 4. **ativar o `PROSP-06O`** | ✅ **NO AR** |
| 5. ativar o `PROSP-05O` | ⏸️ não feito, por desenho — espera as duas rodadas do P6O |

**O `PROSP-06O` está ativo**, confirmado na releitura: `active: true`,
`versionId === activeVersionId === 54a43b23`, `triggerCount: 1` — e o `triggerCount` só virou `1`
**porque agora está ativo**, que é a R12 se confirmando na prática.

#### 11.28.6 As duas rodadas a observar (§17.4)

`hoursInterval: 6` com `triggerAtMinute: 20` — *estimativa, não verificada*: o n8n monta disso um cron
equivalente a `20 */6 * * *`, ou seja **00:20, 06:20, 12:20 e 18:20 UTC** (21:20, 03:20, 09:20 e 15:20
BRT). O P5O, quando for ativado, cai nos `:40` dos mesmos horários.

1. **A rodada cheia vem primeiro, e é de propósito.** O Olavo marcou um lead como perdido **com
   motivo**, e ele está na fila agora. **Não rodei na mão** justamente para não gastá-lo: o §17.4 pede
   que a primeira rodada com `_modificados > 0` seja **em horário automático**, e é ela que fecha o
   último furo do P4 — o `motivo_perda` preenchido, que nunca foi exercido.
2. **A rodada vazia** vem na sequência, e prova que o gatilho dispara mesmo sem trabalho.

**O que olhar na cheia:** `_modificados >= 1`, **`motivo_perda` preenchido** na linha do lead perdido,
`acerto_previsao` com a régua, e o cursor avançando. **O que olhar na vazia:** verde, `_modificados: 0`,
zero escrita, cursor parado.

### 11.29 A Prospecção destravada (19/09) — o P4 fechou, e as três pernas estão publicadas

#### 11.29.1 🟢 O P4 fechou — os 8 critérios, na rodada automática

Execução **`40975`**, `mode: trigger`, verde, **21:20 UTC de 19/09**. Diagnóstico lido no
`[P6] So os modificados`:

| campo | valor |
|---|---|
| `_modificados` | **1** |
| `id_crm` | `59` |
| `status_crm` | `Perdido` |
| **`motivo_perda`** | **`Too expensive`** |
| `data_fechamento` | `2026-09-19T21:07:25.000Z` |
| `acerto_previsao` | `errou (>=60 -> perdeu)` |
| `dias_no_funil` | `10` |
| `_lidos_no_odoo` | `101` |
| `_fora_sem_linha_na_planilha` | `1` · `_sem_linha_ids: "116"` |

O `motivo_perda` **chegou preenchido** — o caminho que nunca tinha sido exercido. **Fechou.**

E o `_fora_sem_linha` continua **1**, com o **mesmo id 116** do lead criado à mão em 17/09. Não é lead
novo: **não há nada a avisar ao Olavo.** Se viesse `2`, seria outro lead sem linha na planilha.

#### 11.29.2 ⚠️ Os dois motivos de perda registrados são TESTE — decisão do Olavo (19/09)

**Nenhuma conclusão comercial sai deles.** Os motivos de perda no CRM são **os de fábrica do Odoo**, o
motivo escolhido foi **arbitrário** (só para destravar a prova do caminho) e o `expected_revenue` era
**0**. O `acerto_previsao: errou` da linha 59 é **prova de mecânica, não medida de score**.

> **A régua do `acerto_previsao` só começa a valer quando o Olavo avisar que a prospecção começou
> para valer — e a data disso entra aqui, nesta seção.** Até lá, qualquer leitura do aprendizado do
> score sobre estas linhas é leitura de dado de teste.

#### 11.29.3 🔴 Correção da §11.28.6 — os horários do gatilho que eu estimei estão errados

Eu escrevi, marcado como estimativa: *"00:20, 06:20, 12:20 e 18:20 UTC"*. **Está errado.** As
execuções reais do P6O caem em:

**03:20 · 09:20 · 15:20 · 21:20 UTC** — ou seja **00:20 · 06:20 · 12:20 · 18:20 BRT**.

Eu tinha trocado UTC e BRT de lugar. O P5O, no minuto 40, cai nos mesmos horários: **03:40 · 09:40 ·
15:40 · 21:40 UTC**. **Isto agora é fato lido em execução, não estimativa** — para o P6O, pelas 8
execuções de 18 e 19/09; para o P5O, ainda é dedução do mesmo `hoursInterval`, e se prova na primeira
execução dele.

#### 11.29.4 ✅ PROSP-05O ativado

Antes de publicar, **lido e não lembrado** (R12):

| o que | estado lido |
|---|---|
| `[P5] Reconciliacao 6h` | `hoursInterval: 6`, **`triggerAtMinute: 40`** |
| `[P5] Entrada` | `disabled: false` — ligado |
| `[P5] Config` | `lote_max: 20`, `corte_potencial: 60` |
| `errorWorkflow` | `UZ7sIE5cWrrO8xea` |

O `lote_max = 1` do teste do P6-6 foi passado **na chamada**, nunca gravado no nó — a R12 fecha limpa.
Único nó desabilitado: `[SMOKE] Trigger manual`, que é porta de teste e fica fechada por desenho.

**Descrição corrigida antes de publicar (R5).** A anterior afirmava duas coisas falsas: *"Religado ao
P4 em 16/09"* (a repontagem vivia só no rascunho do P4) e *"Inativo"*. A nova:

> *P5 do CONTRATO na versao Odoo. Busca por gbp_place_id (I4), cria ou atualiza o lead e devolve
> id_crm. Escreve so id_crm, data_envio_crm e erro_envio_crm. Substituiu o PROSP-05 do HubSpot,
> aposentado em 16/09. Ativo desde 19/09, reconciliacao no minuto 40.*

**Conferido depois de publicar (R13):** `active: true` · `versionId === activeVersionId ===
a4564f52-f60a-445a-9473-b7c99afccb2b` · `triggerCount: 1`.

> **Achado de mecânica:** o `versionId` **não mudou** com a troca de descrição. Descrição é **metadado
> de workflow, não conteúdo de versão** — muda fora do versionamento e vale na hora, sem publicar.

#### 11.29.5 ✅ PROSP-04 publicado — o furo da §11.28 está fechado

Li o nó `[P5] CRM-out` **inteiro** no rascunho antes de tentar de novo. O rascunho estava **limpo**:

| | rascunho | versão ATIVA (antes) |
|---|---|---|
| `parameters.workflowId.value` | `0H1mdPuICHsyWGxt` (P5O Odoo) | `94lSWJfxfu653KdN` (HubSpot aposentado) |
| `onError` | `stopWorkflow` | `continueRegularOutput` |
| `retryOnFail` / `maxTries` | `true` / `3` | `true` / `3` |

Varredura do JSON inteiro: o id do aposentado aparecia **duas vezes** — uma como **texto** dentro de
`parameters.notes` (memória do repontamento, inofensiva) e **uma como referência de verdade**, em
`activeVersion.nodes[17].parameters.workflowId.value`. **Só a versão ativa apontava para o morto.**

**Por que a recusa de 17/09 citava o id do HubSpot:** ela não estava reclamando do rascunho. O
rascunho apontava para o `0H1mdPuICHsyWGxt`, que **naquele momento ainda estava inativo** — a publicação
do P4 dependia da publicação do P5O. Publicado o P5O, a publicação do P4 passou **de primeira**.

**Conferido depois de publicar (R13):** `active: true` · `versionId === activeVersionId ===
6cf4f1c2-70d3-4242-b6c0-452aed7a2589` · **`sameAsDraft: true`** · a referência ao aposentado some:
`94lSWJfxfu653KdN` aparece **0 vezes** na versão ativa.

**§18.3 respondido — o `errorWorkflow` não estava preso no rascunho.** `settings` é **de workflow, não
de versão**: a `activeVersion` só carrega `nodes`, `connections` e `nodeGroups`. O `errorWorkflow` do
P4 valia desde 17/09, sem depender desta publicação.

#### 11.29.6 Limite honesto — uma nota velha que não consigo consertar

O nó `[P5] CRM-out` tem **duas notas**. A de `parameters.notes` está correta e conta o repontamento.
A **nota de nó** (`notes`, a que aparece nas configurações do nó no editor) continua dizendo:

> *"I8: o P5 e o unico que escreve no **HubSpot**."*

Está errada desde 16/09. **Não dá para corrigir pelo MCP:** `notes` de nó só aceita escrita **na
criação**; nenhuma operação de `update_workflow` alcança o campo num nó que já existe. O sticky
`Sticky Note repontamento`, que entrou junto com a correção, guarda a memória certa ao lado. **Fica
registrada como dívida de uma linha, para quem abrir o editor.**

#### 11.29.7 O estado do parque agora

| perna | estado | gatilho |
|---|---|---|
| `PROSP-04 Enriquecimento` | **ativo e publicado**, chamando o P5O com `stopWorkflow` | sub-workflow (sem gatilho próprio) |
| `PROSP-05O CRM-out Odoo` | **ativo** | `:40` — 03:40 · 09:40 · 15:40 · 21:40 UTC |
| `PROSP-06O Sync Odoo -> Planilha` | **ativo** | `:20` — 03:20 · 09:20 · 15:20 · 21:20 UTC |

Os três apontam para o mesmo `errorWorkflow` (`UZ7sIE5cWrrO8xea`), que já provou entregar no Telegram.

**A Prospecção está destravada. O Olavo pode prospectar.**

#### 11.29.8 O que vigiar na primeira rodada do P5O

Ela ainda **nunca rodou em produção**. Na primeira execução: que a `[P5] Reconciliacao 6h` dispare no
`:40`, que o `lote_max: 20` segure a vazão, e que a `[P5] Entrada` — a porta pela qual o P4 agora chama
de verdade — seja exercida pela primeira vez desde que foi religada. **O caminho P4 → P5O deixou de ser
teórico hoje: até esta publicação, nunca tinha existido em produção.**
