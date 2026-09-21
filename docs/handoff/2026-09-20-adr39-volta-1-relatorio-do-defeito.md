# [VOLTA 1 — RELATÓRIO DO DEFEITO] ADR-39 não é executável como está

| | |
|---|---|
| **Data** | 2026-09-20, 21h BRT (**dentro da janela** 09h–23h da D9) |
| **Frente** | Saúde Digital / ADR-39 |
| **Estado** | 🔴 **PARADO ANTES DE EXECUTAR — nada foi alterado em produção** |
| **Por quê** | O **passo 1** do brief (§3) não tem fonte: **a DB Clientes do Notion não tem campo Métrica-Mãe** |
| **Regra aplicada** | **R6** — *"Antes de uma ação irreversível ou em produção, verifique a premissa que a justifica — mesmo que o plano já esteja aceito num ADR. Se o dado desmentir o plano: pare, não execute, corrija o ADR e registre o porquê."* |
| **Volta** | **1 de 3** (R9) |
| **O que falta para destravar** | **uma decisão do Olavo** — três opções no §4 |

---

## 1. O defeito, em uma frase

**O passo 1 manda `primary_metric_type` vir da "Métrica-Mãe do Notion". Essa propriedade não existe
na DB que o workflow `client_config` lê.**

Ela existe — mas na **DB Campanhas**, e é **por campanha**, não por cliente. O workflow
`client_config` lê a **DB Clientes**, que não tem esse campo em lugar nenhum.

## 2. A prova

### 2.1. O schema da DB Clientes (`19fb65e5-c72b-8147-8aa3-c63aa273d205`)

As 38 propriedades, lidas do schema hoje:

> BM ID · CNPJ · Campanhas · Canal de Aquisição · Email · Endereço · Fone · Inicio Contrato ·
> **Margem de Contribuição** · NPS Atual (0-10) · Nome · Nome do Cliente · Pagamentos · Projetos ·
> Rastreador de OKR · Recursos · Reuniões · Risco de Churn · SLA · **Segmento** · Segmento Atução ·
> Serviços Prestados · Sigla Cliente · Site · **Status** · Tabela Tarefas · Ticket/LTV · Total Pago ·
> Término Contrato · client_id · id_client · id_ga4_property · id_gbp · id_google_account ·
> id_meta_account · id_meta_pixel · img · notion_id_cliente

**Não há `Métrica-Mãe`.** Não há nenhuma propriedade de tipo de métrica.

### 2.2. Onde a Métrica-Mãe realmente vive

Na **DB Campanhas** (`19fb65e5-c72b-8043-a82d-f47ede397928`), como `multi_select`, **uma por
campanha**:

| Campanha | `client_id` | Fonte | **Métrica-Mãe** | Meta |
|---|---|---|---|---|
| `[KIL] GG_…_SALÃO.BELEZA_…` | CLI-4 | Google Ads | **CPA** | 3.5 |
| `[KIL] GG_…_BARBEARIA_…` | CLI-4 | Google Ads | **CPA** | 5.2 |
| `[CHA] IG_MENS__PROD.TESTE__` | CLI-13 | **Meta Ads** | **CPL** | 4 |

É exatamente daí que o `PHI - Subworkflow Campanhas` lê hoje
(`props['Métrica-Mãe']?.multi_select?.[0]?.name`) — **da campanha, não do cliente**.

### 2.3. O problema de fundo, que não é de implementação

| | `client_config.primary_metric_type` | `Métrica-Mãe` |
|---|---|---|
| **Grão** | **um por cliente** | **uma por campanha** |
| **Onde** | BigQuery | Notion, DB Campanhas |

**Um cliente com duas campanhas pode ter duas Métricas-Mãe diferentes.** Hoje o KIL não expõe isso
porque as duas são `CPA` — mas o modelo não tem regra para o caso em que discordam. **Não dá para
"ler a Métrica-Mãe do cliente" porque ela não é do cliente.**

> 🔄 **Esta é a premissa do ADR-39 §4.1 que o dado desmentiu.** Não é detalhe de execução: é a fonte
> do passo 1 que não existe.

---

## 3. E mais três coisas que a leitura mostrou — todas mudam o plano

### 3.1. 🔴 Não é um cliente que entra. São três.

O brief e o ADR falam do CHA como *"o caso real esperando"*. **A DB Clientes tem três `ATIVO`:**

| `client_id` | Cliente | Segmento | Serviços Prestados | Campanhas |
|---|---|---|---|---|
| **CLI-4** | KILDARE & BRUNA BECKER | Negócio Local | GOOGLE ADS | 2 (Google, CPA) |
| **CLI-7** | RODRIGO VIEIRA CLARA | Negócio Local | **CRIAÇÃO DE SITE** | **nenhuma** |
| **CLI-13** | CHARLES AZEVEDO ADVOGADO | Negócio Local | **CRIAÇÃO DE SITE** | 1 (Meta, CPL) |

Repontar o `MERGE` para `phi_prod` **insere os três**, não só o CHA. O **CLI-7 não é cliente de
mídia paga** — não tem conta de anúncio nem campanha. Ele entraria em `client_config` como ativo.

> **Deduzo que** seja inofensivo hoje (o score parte de `raw_campaign_data`, e o CLI-7 não tem
> linha). Mas **o raio de alcance do passo 2 é 3× o que o ADR previu**, e isso precisa estar escrito
> antes de executar, não depois.

### 3.2. 🔴 O `client_config` é só o primeiro de TRÊS portões — o CHA não chegaria ao score mesmo assim

O brief §0 diz: *"Fazer o cadastro do Notion chegar ao score — hoje ele não chega, e por isso o CHA
não existe para o PHI."* **A primeira metade está certa. A segunda é onde o plano quebra.**

Mesmo com os 5 passos executados na ordem perfeita, o CHA **não chegaria ao score**:

| # | Portão | Estado para o CHA | É deste ADR? |
|---|---|---|---|
| **1** | `phi_prod.client_config` tem linha do cliente? | 🔴 não — **é o que o ADR-39 conserta** | ✅ sim |
| **2** | Há linha em `raw_campaign_data`? (`WHERE j.tem_d1 = 1`) | 🔴 **não, e não haverá** — a campanha do CHA é **Meta**, e o `PHI - Subworkflow Campanhas` manda Meta para o noOp **`Meta Ads — em breve`** | ❌ **não** — é o **D11**, que o Olavo pôs *depois do v1* |
| **3** | `primary_metric_type = 'CPA'`? | 🔴 **não** — a Métrica-Mãe do CHA é **CPL** | ❌ **não** — é o ADR-34 / Score v2 |

**O portão 3, lido no SQL do score** (nó `Calcular e Persistir PHI Score`, CTE `qualidade`):

```sql
CASE
  WHEN primary_metric_type IS NULL OR primary_metric_type != 'CPA' THEN 'INSUFFICIENT_DATA'
  ...
CASE
  WHEN primary_metric_type IS NULL OR primary_metric_type != 'CPA' THEN 'METRIC_TYPE_UNSUPPORTED'
```

**O score de hoje só sabe calcular `CPA`.** Qualquer outra métrica vira `INSUFFICIENT_DATA` com
`calculation_last_step = 'METRIC_TYPE_UNSUPPORTED'`.

> 🔴 **Consequência direta para o CA3.** O critério diz *"cadastrar o CHA e vê-lo voltar de
> `Buscar Clientes Ativos`"*. **Esse pedaço é alcançável** — ele voltaria. Mas o objetivo do §0
> (*"chegar ao score"*) **não é**, e não por culpa deste ADR. **O CHA não é um caso de teste válido
> para o que o ADR-39 quer provar.**

### 3.3. ⚠️ O default fixo `'ROAS'` é pior do que o ADR supõe

O ADR diz que, sem o passo 1, *"cliente novo entra com `ROAS` fixo e o score dele nasce errado"*.
**Não nasce errado: não nasce.** `ROAS != 'CPA'` → `INSUFFICIENT_DATA` / `METRIC_TYPE_UNSUPPORTED`
para **todo** cliente novo. A ordem do ADR continua certa; a consequência é mais dura do que o texto.

---

## 4. As três saídas — e é decisão do Olavo, não minha (R7)

| | Saída | O que fazer | Custo | Risco |
|---|---|---|---|---|
| **A** ⭐ | **Criar `Métrica-Mãe` na DB Clientes do Notion** | o Olavo adiciona a propriedade (select: `CPA`, `CPL`, `ROAS`) e preenche os 3 ativos; o `Code limpar Notion` passa a lê-la | 1 campo + 3 preenchimentos | baixo. **Mantém a fonte da verdade onde o Olavo trabalha**, que é o argumento do §3 do ADR-39 |
| **B** | **Derivar da campanha** | o `client_config` passa a ler **também** a DB Campanhas e deduzir a métrica do cliente a partir das campanhas dele | lógica nova no workflow | 🔴 precisa de **regra para o empate** (duas campanhas, duas métricas) — e regra nova sem ADR é o que a **R7** proíbe |
| **C** | **Tirar `primary_metric_type` do escopo do ADR-39** | o `client_config` vira dono de todo o resto (`client_id`, `client_name`, `model_id`, `is_active`) e o `UPDATE` do Subworkflow **continua** dono só dessa coluna, agora **declarado** no contrato como padrão S4 | zero | ⚠️ mantém dois writers na tabela, mas em **colunas disjuntas e declaradas** — é a exceção que o **M1 já permite** |

### O que eu recomendo, e por quê

**A**, se o Olavo topar mexer no Notion. É a única que mantém o princípio do ADR-39 (*a fonte da
verdade é o Notion, onde o Olavo cadastra*) **e** dá um dono único de verdade.

**Mas C é a saída honesta se a pressa for o v1.** Ela não é derrota: o M1 **já prevê** o padrão S4 —
mesmo destino, colunas disjuntas e declaradas. É exatamente o que já acontece com
`Otimização Ativa?`, que o contrato aceita. A diferença entre hoje e a opção C não é o código: é
que hoje ninguém sabia, e na C está escrito.

🔴 **B eu não recomendo** enquanto não houver regra de empate decidida.

---

## 5. Os 6 critérios de aceite — veredicto honesto

| # | Critério | Veredicto | Por quê |
|---|---|---|---|
| **CA1** | `phi_prod.client_config` tem um writer | ⬜ **não testado** | depende dos passos 2–4, que não foram executados |
| **CA2** | O KIL continua `CPA` | ⬜ **não testado** — e **não testável nesta sessão** | exige consultar `phi_prod.client_config`. **Sem acesso ao BigQuery** (sem `bq`, sem `gcloud`, sem MCP) |
| **CA3** | Cliente novo chega ao score | 🔴 **impossível com o CHA**, mesmo com tudo feito | portões 2 e 3 do §3.2 — Meta sem ingestão, e `CPL` não suportado |
| **CA4** | A Métrica-Mãe vence o mapa fixo | 🔴 **bloqueado** | é o defeito do §1 — não há campo de onde ler |
| **CA5** | `phi_dev` não é escrito nem lido | 🟡 **parcial, por leitura** | **`WF-T28-Orquestrador`** (`8Q5ofmAZju0hTN08`, inativo) lê `phi_dev.t28_campaign` — **reportado, não consertado**, como o brief manda. O workflow `client_config` segue escrevendo `phi_dev.client_config` |
| **CA6** | Nada rodou fora da janela | ✅ **cumprido** | a sessão correu às 21h BRT, dentro de 09h–23h. **E nada rodou: nenhuma alteração foi feita** |

---

## 6. O que NÃO foi feito, e é de propósito

- **Nenhum workflow foi alterado, publicado, ativado ou executado.** O `client_config`
  (`SI5NSzRb8lVUz74RwOhIT`) continua em `versionId = activeVersionId = 99abdada-8a61-42b3-b8c4-3699a96ea405`,
  igual a antes desta sessão.
- **Nada foi escrito no Notion** — nem cliente, nem campo, nem propriedade.
- **O passo 2 não foi feito sozinho.** Fazer o repontamento sem o passo 1 colocaria **três** clientes
  em `phi_prod.client_config` com `ROAS` fixo, e o passo 4 removeria o `UPDATE` que mantém o `CPA`
  do KIL. **Isso quebraria o score do único cliente que hoje funciona.**
- **Não construí a derivação nova** (opção B): é regra nova, e regra nova sem decisão é a **R7**
  quebrada.

## 7. Hipóteses que o dado desmentiu (R6, corolário)

| # | O que o ADR-39 / o brief assumia | O que o artefato mostra |
|---|---|---|
| 1 | *"`primary_metric_type` passa a vir da Métrica-Mãe do Notion"* | **A DB Clientes não tem Métrica-Mãe.** Ela é por campanha, não por cliente |
| 2 | *"o CHA é o caso real esperando"* para provar o CA3 | O CHA é barrado por **mais dois portões** fora deste ADR: Meta sem ingestão (D11) e `CPL` não suportado pelo score |
| 3 | *"cliente novo entra com ROAS fixo e o score dele nasce errado"* | **Não nasce.** `ROAS != 'CPA'` → `INSUFFICIENT_DATA` |
| 4 | o repontamento afeta o CHA | Afeta **três** clientes — inclusive o **CLI-7**, que não é cliente de mídia paga |

## 8. O que eu preciso para continuar

**Uma resposta:** A, B ou C do §4.

- Se **A**: o Olavo cria a propriedade `Métrica-Mãe` na DB Clientes e preenche os 3 ativos. Aí eu
  faço os 5 passos na mesma sessão, dentro da janela.
- Se **C**: eu não mexo no `primary_metric_type`. Faço os passos 2, 3 e 5 (repontar, provar o
  `INSERT`, fechar o `phi_dev`), **pulo o passo 4**, e escrevo o padrão S4 no §4.1 do contrato.
- Se **B**: preciso da regra de empate antes de escrever uma linha.

⚠️ **Em qualquer caso, o CA2 continua sem prova nesta sessão** — ele exige ler
`phi_prod.client_config`, e não tenho BigQuery. **Isso precisa de um sub-chat com credencial, ou do
Olavo rodando a query.** Executar os passos 2–4 sem poder verificar o CA2 é exatamente o que a
armadilha nº 4 do brief adverte: *confirmar que "não deu erro" não é confirmar que apareceu.*


---

# ADENDO — 2026-09-20, 21h06 BRT: a decisão do Olavo e a leitura do BigQuery

> Duas respostas do Olavo mudaram esta volta. A primeira **invalida duas das três saídas que eu
> propus**. A segunda **destravou o CA2**.

## 9. A decisão do Olavo sobre o grão

> **Olavo, 2026-09-20, verbatim:**
> *"Métrica-mãe é vinculada à campanha, cada campanha (de um mesmo cliente) pode ter métricas
> diferentes. A métrica é da campanha não do cliente."*

**Isto não é a escolha de uma das minhas três opções — é uma regra de domínio, e ela derruba duas
delas:**

| Saída | Estado depois da decisão |
|---|---|
| **A** — criar `Métrica-Mãe` na DB Clientes | ❌ **morta.** Poria um dado de campanha no grão de cliente. É exatamente o que a decisão diz que não é |
| **B** — derivar a métrica do cliente a partir das campanhas | ❌ **morta.** Não há o que derivar: campanhas do mesmo cliente **podem legitimamente divergir**, e achatar isso num valor só é inventar informação |
| **C** — tirar `primary_metric_type` do escopo do ADR-39 | 🟡 **viva, mas agora é paliativo** — ver §11 |

## 10. 🔴 A decisão está provada dentro do próprio SQL do score

Fui conferir, e o artefato dá razão ao Olavo de forma literal. No nó `Calcular e Persistir PHI Score`,
CTE `campanhas_exec`:

```sql
SELECT
  j.*,                          -- j = janelas, agrupado por (client_id, platform, campaign_id)
  ...
  cc.primary_metric_type,       -- ← do CLIENTE
  ...
FROM janelas j
INNER JOIN `phi_prod.client_config` cc ON j.client_id = cc.client_id AND cc.is_active = TRUE
```

E dentro de `janelas`, por campanha:

```sql
MAX(IF(date = …INTERVAL 1 DAY, primary_metric_goal, NULL)) AS primary_metric_goal
```

**As duas metades da mesma métrica vivem em grãos diferentes:**

| | Vem de | Grão |
|---|---|---|
| `primary_metric_goal` (**a meta**) | `raw_campaign_data` | ✅ **por campanha** |
| `primary_metric_type` (**o tipo**) | `client_config` | 🔴 **por cliente** |

**A meta já viaja com a campanha. Só o tipo ficou para trás, no cliente.** Hoje isso não aparece
porque o KIL tem duas campanhas e as duas são `CPA` com metas diferentes (3.5 e 5.2) — **a meta
diverge e funciona; o tipo não pode divergir e ninguém tinha reparado.**

> 🔴 **O defeito latente, em produção agora:** o `UPDATE` do `PHI - Subworkflow Campanhas` roda
> **uma vez por campanha**, dentro do `Loop Over Items1`. Para um cliente com duas campanhas de
> Métricas-Mãe diferentes, **a última campanha processada ganha** — e o tipo do cliente passa a ser
> o da campanha que por acaso veio por último no loop. **É a decisão do Olavo descrevendo um bug que
> já existe.**

## 11. A saída que a decisão do Olavo aponta — **opção D**

| | Saída | O que muda |
|---|---|---|
| **D** ⭐ | **`primary_metric_type` passa a viajar com a campanha**, em `raw_campaign_data`, ao lado do `primary_metric_goal` que já está lá. O score passa a ler `j.primary_metric_type` em vez de `cc.primary_metric_type` | os dois writers **já leem** a Métrica-Mãe da campanha no Notion — só precisam gravá-la na linha. `client_config.primary_metric_type` vira coluna morta |

**Por que D é melhor que C:**
- **Põe o dado no grão a que ele pertence**, que é a decisão do Olavo aplicada, não contornada.
- **Dissolve o conflito do ADR-39 em vez de declará-lo.** Sem coluna disputada, não há dois donos.
- 🔴 **Destrava a Fase 2 do ADR-37.** Hoje o `UPDATE` do Subworkflow não pode ser removido porque é o
  único writer do tipo em produção. Com D, ele fica **sem função** — e aposentar o Subworkflow deixa
  de quebrar o KIL.
- Resolve o bug latente do §10 de graça: cada campanha carrega o seu tipo, e não há mais "a última
  ganha".

**O custo, dito de frente:** é maior que o de C. Mexe no schema de `raw_campaign_data`, nos dois
writers e no SQL do score. **É arquitetura, e arquitetura é ADR novo e é do chat-mãe (R1/R7).**
**Eu não construí nada disso** — estou propondo, não fazendo.

> **C continua sendo a saída honesta se a pressa falar mais alto**, e as duas não se excluem: C hoje
> (declarar o padrão S4 e seguir), D como o conserto de verdade. Mas **C não resolve o bug do §10** —
> só o deixa escrito.

---

## 12. ✅ CA2 — provado, com o workflow temporário que o Olavo autorizou

> **Olavo, 2026-09-20, verbatim:** *"Pode criar um workflow temporário no n8n para puxar a informação
> e depois arquivá-lo."*

**O que foi feito, e desfeito:**

| Passo | |
|---|---|
| Criado | `TMP - ADR39 Leitura client_config (ARQUIVAR APOS USO)` (`SwVDXIkOHloajCeS`) — 3 nós, **dois `SELECT` e nada mais**. Criado **inativo** |
| Executado | execução **41352**, `mode: manual`, `success`, 21:06:28→21:06:31 BRT |
| **Arquivado** | ✅ **sim, na mesma sessão (R12)** — e **conferido lendo**: `get_workflow_details` devolve *"Workflow is archived and cannot be accessed"* |
| Escreveu algo? | **não.** Nenhum `INSERT`, `UPDATE` ou `MERGE`. Só leitura |

### 12.1. O resultado — `phi_prod.client_config`

| `client_id` | `client_name` | `model_id` | **`primary_metric_type`** | `is_active` | `client_slug` | `updated_at` |
|---|---|---|---|---|---|---|
| **CLI-4** | KILDARE & BRUNA BECKER | MODEL-VAREJO-001 | **`CPA`** | true | KIL | **2026-09-20T07:01:10 BRT** |
| CLI-5 | IMPACTO WEB CURSOS | MODEL-VAREJO-001 | ROAS | false | IMP | 2026-07-04T10:29:55 |

### 12.2. O resultado — `phi_dev.client_config`

| `client_id` | **`primary_metric_type`** | `is_active` | `updated_at` |
|---|---|---|---|
| **CLI-4** | 🔴 **`ROAS`** | true | **1969-12-31T21:00:00** *(epoch zero — nunca foi atualizado)* |
| CLI-5 | ROAS | false | 2026-07-04T10:29:56 |

### 12.3. O que isso prova, linha por linha

1. ✅ **CA2, linha de base: o KIL é `CPA` em `phi_prod` hoje.** Registrado, não deduzido.
2. 🔴 **O `updated_at` do KIL é `2026-09-20T07:01:10` — 07h BRT, a janela exata do
   `PHI - Subworkflow Campanhas`.** É a **prova direta** de que aquele `UPDATE` é o writer vivo. O
   achado A10 deixa de ser leitura de código e passa a ser fato datado.
3. 🔴 **O mesmo cliente, ao mesmo tempo: `CPA` em prod, `ROAS` em dev.** A divergência dos dois
   writers, lado a lado, num retrato só.
4. 🔴 **O `updated_at` de `phi_dev` é epoch zero.** O workflow `client_config` inseriu aquela linha e
   **nunca mais a tocou** — coerente com as **0 execuções** no histórico retido. Ele está ativo,
   verde, e parado.
5. 🔴 **Nem `CLI-7` nem `CLI-13` existem em nenhuma das duas tabelas.** Confirma o §3.1: dos 3
   clientes `ATIVO` no Notion, **só 1 chegou ao BigQuery** — e chegou um dia, à mão.

## 13. 🔴 Achado NOVO, e é um quarto portão: o `client_slug`

A leitura revelou uma coluna que eu não sabia que existia em `client_config`: **`client_slug`**
(`KIL`, `IMP`).

**O `MERGE` do workflow `client_config` não escreve essa coluna.** A lista do `WHEN NOT MATCHED` é:

```
INSERT (client_id, client_name, model_id, primary_metric_type, is_active, created_at)
```

**`client_slug` não está lá.**

**E ela é consumida.** No nó `Buscar Campanhas Alertas` do Pipeline_v2:
```sql
cc.client_slug,
```

> 🔴 **Consequência direta para o passo 3 do brief:** se o `MERGE` for repontado para `phi_prod` como
> está, **todo cliente novo entra com `client_slug` NULL** — e o `client_slug` vai para a tarefa do
> gestor no Notion. O CA3 passaria (*"o CHA volta de `Buscar Clientes Ativos`"*) **enquanto instala um
> campo vazio na tela de quem trabalha.**
>
> **É o mesmo padrão do `primary_metric_type`: uma coluna que o writer candidato não sabe preencher.**
> Precisa entrar na correção, seja qual for a saída escolhida.

## 14. Os 6 critérios — veredicto atualizado

| # | Critério | Veredicto | Prova |
|---|---|---|---|
| **CA1** | um writer em `phi_prod.client_config` | ⬜ **não testado** | depende dos passos 2–4, não executados |
| **CA2** | O KIL continua `CPA` | ✅ **linha de base provada** — `CPA`, `updated_at 2026-09-20T07:01:10` | execução **41352** · §12.1 |
| **CA3** | Cliente novo chega ao score | 🔴 **impossível com o CHA** · e agora **com um defeito a mais**: entraria com `client_slug` NULL | §3.2 e §13 |
| **CA4** | A Métrica-Mãe vence o mapa fixo | 🔄 **critério inválido como escrito** | a decisão do §9 diz que a métrica **não é do cliente**. O CA4 pressupõe o contrário |
| **CA5** | `phi_dev` não é escrito nem lido | 🟡 **parcial** · `phi_dev.client_config` **existe e tem 2 linhas** (§12.2) · `WF-T28-Orquestrador` lê `phi_dev.t28_campaign` — **reportado, não consertado** | §12.2 · leitura do `activeVersion` |
| **CA6** | Nada rodou fora da janela | ✅ **cumprido** | tudo entre 20:56 e 21:10 BRT, dentro de 09h–23h |

## 15. Hipóteses desmentidas — lista final desta volta

| # | O que se assumia | O que o dado mostra |
|---|---|---|
| 1 | `primary_metric_type` vem da *"Métrica-Mãe do Notion"* no grão de cliente | **A DB Clientes não tem o campo** — e a decisão do Olavo diz que **não deveria ter** |
| 2 | O CHA é o caso de teste do CA3 | Barrado por **mais dois portões** fora deste ADR (Meta sem ingestão · `CPL` não suportado) |
| 3 | *"cliente novo entra com ROAS fixo e o score nasce errado"* | **Não nasce:** `ROAS != 'CPA'` → `INSUFFICIENT_DATA` |
| 4 | O repontamento afeta o CHA | Afeta **três** clientes — um deles sem mídia paga |
| 5 | O `UPDATE` em `phi_prod` *"é o que mantém o CPA do KIL"* (ADR-39 §2) | ✅ **confirmado com data**: `updated_at 2026-09-20T07:01:10`, a janela das 07h |
| 6 | O `MERGE` do `client_config` sabe preencher a linha de `phi_prod` | 🔴 **não sabe.** Falta o **`client_slug`**, que o Pipeline lê |
| 7 | *(minha, na 1ª parte deste relatório)* as saídas eram A, B ou C | **A e B morreram** com a decisão do §9, e apareceu a **D** |

## 16. O que eu preciso agora

**Uma escolha entre C e D** (§11) — as duas são compatíveis com a decisão do Olavo:

- **D** é o conserto de verdade e destrava a Fase 2 do ADR-37, mas **precisa de ADR novo** (é
  arquitetura, R1/R7): mexe no schema de `raw_campaign_data`, nos dois writers e no SQL do score.
- **C** destrava o ADR-39 hoje, com custo zero, declarando o padrão S4 — **mas deixa vivo o bug do
  §10** (duas campanhas, duas métricas, a última ganha).

⚠️ **Em qualquer das duas, o `client_slug` (§13) tem de entrar na correção** — senão o passo 3
instala um campo vazio na tela do gestor.


---

# ADENDO 2 — 2026-09-21: as 4 verificações do ADR-40

| | |
|---|---|
| **Pedido** | `docs/handoff/2026-09-21-adendo-adr39-verificacoes-do-adr40.md` |
| **Natureza** | **só leitura.** Nada foi alterado: nem schema, nem writer, nem SQL. O ADR-40 não foi aceito |
| **Fonte** | `activeVersion` de cada workflow, **lida em 20/09 e guardada em arquivo** · DB do Notion **lida hoje, 21/09** |
| ⚠️ **Limite declarado (R13)** | **O n8n está fora do ar nesta sessão** (o conector pede autenticação). Não consegui **reconfirmar hoje** que as `activeVersion` continuam nos mesmos `versionId`. Cada afirmação abaixo traz o `versionId` que eu li |

## 17. 🔴 Primeiro, a minha própria frase — ela **se sustenta**, mas eu a escrevi mal

> **Minha frase:** *"Os dois writers já leem a Métrica-Mãe da campanha; só precisam gravá-la."*

**O conteúdo está certo. A redação foi ambígua, e a ambiguidade é minha.**

Quando escrevi *"os dois writers"*, eu falava dos **dois writers de `raw_campaign_data`** —
`sw metricas campanhas` e `PHI - Subworkflow Campanhas`. O chat-mãe leu como podendo incluir o
workflow **`client_config`**, e por isso levantou o §A9.

**As duas coisas são verdadeiras ao mesmo tempo, porque são workflows diferentes:**

| Workflow | É writer de `raw_campaign_data`? | Lê a Métrica-Mãe? |
|---|---|---|
| `sw metricas campanhas` | ✅ sim | ✅ **sim** |
| `PHI - Subworkflow Campanhas` | ✅ sim | ✅ **sim** |
| `client_config` | ❌ **não** — escreve `client_config` | ❌ **não** — mapa fixo (o §A9 está certo) |

> **O §A9 não contradiz a minha frase: ele fala de um terceiro workflow.** Mas a frase, como escrita,
> permitia a leitura errada — e numa casa que tem o P-27 na memória, **a frase ambígua é o defeito**.
> Deveria ter sido *"os dois writers de `raw_campaign_data`"*.

**Conclusão: o ADR-40 é da categoria barata.** A Métrica-Mãe já chega aos dois writers.

---

## 18. V1 — os dois writers leem a Métrica-Mãe? De onde, e em qual nó

### 18.1. `sw metricas campanhas` (`W571K320aqIHsdtH`, activeVersion `a9bd0584`) — ✅ **LÊ**

Em **dois** lugares, e um deles é mais forte que ler: é **exigir**.

| Nó | O que faz |
|---|---|
| **`Get many database Campanhas`** | lê a DB **Campanhas** (`19fb65e5-c72b-8043-a82d-f47ede397928`) com **três filtros**, e um deles é `Métrica-Mãe\|multi_select` **`is_not_empty`** |
| **`Code Clean Campanhas`** (linha 74) | `const metricaPrimaria = extractMultiSelectNames(properties['Métrica-Mãe']?.multi_select);` |
| **`Code Clean Campanhas`** (linha 147) | emite o valor como **`clean_metrica_mae`** |

> 🔴 **Campanha sem Métrica-Mãe nem entra neste workflow.** O filtro a torna **obrigatória** na
> ingestão. Isso é mais forte do que eu tinha afirmado: a Métrica-Mãe não é um enfeite do cadastro —
> ela já é pré-requisito de coleta.

### 18.2. `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`, activeVersion `ac55503a`) — ✅ **LÊ**

| Nó | O que faz |
|---|---|
| **`Code in JavaScript`** | `const primary_metric_type = props['Métrica-Mãe']?.multi_select?.[0]?.name?.trim() \|\| 'ROAS';` — da mesma DB **Campanhas**, via `Get database Campanhas` |
| **`Code transformar retorno Google Ads`** | já repassa `primary_metric_type: campaignData.primary_metric_type` no item de saída |

> ⚠️ **Atenção ao `|| 'ROAS'` no fim da linha.** É um *fallback* silencioso: campanha sem
> Métrica-Mãe vira `ROAS`. Hoje é inalcançável **por este caminho** (as campanhas vêm filtradas), mas
> é a mesma doença do mapa fixo, numa linha só. **Se o ADR-40 for aceito, esse `|| 'ROAS'` tem de
> virar erro alto, não default** — senão o tipo errado passa a viajar com a campanha, que é pior que
> ele estar no lugar errado.

### 18.3. 🔴 O achado que barateia o ADR-40 mais do que eu esperava

**Os dois writers leem, carregam — e jogam fora na porta do BigQuery.**

| | `primary_metric_goal` (**meta**) | `primary_metric_type` (**tipo**) |
|---|---|---|
| `sw metricas campanhas` → `Code Montar SQL` | ✅ **gravado** (`primaryMetricGoal`, vindo de `context.raw_notion_data?.clean_meta_metrica_mae`) | 🔴 **lido como `clean_metrica_mae` e descartado** |
| `PHI - Subworkflow Campanhas` → `Execute SQL  INSERT raw_campaign_data` | ✅ **gravado** | 🔴 **presente no item de entrada e descartado** |

**O valor já está na mão do nó que monta o SQL.** No `Code Montar SQL`, a meta é buscada por
`context.raw_notion_data?.clean_meta_metrica_mae` — **o tipo está no mesmo objeto**, como
`clean_metrica_mae`. É a mesma expressão, trocando o nome do campo.

> **Isto não é "adaptar dois workflows". É acrescentar uma coluna a duas listas de `MERGE` que já
> recebem o valor.**

---

## 19. V2 — onde a Métrica-Mãe mora no Notion

✅ **Mora na DB Campanhas. Não existe na DB Clientes.** *(lido hoje, 21/09)*

| | |
|---|---|
| **DB** | **Campanhas** — `19fb65e5-c72b-8043-a82d-f47ede397928` |
| **Propriedade** | **`Métrica-Mãe`** · tipo **`multi_select`** |
| **Companheira** | `Meta da Métrica-mãe` · tipo `number` — **as duas na mesma DB, no mesmo grão** |
| **Na DB Clientes?** | 🔴 **não.** Enumerei as **38** propriedades de `19fb65e5-c72b-8147-8aa3-c63aa273d205`: nenhuma é tipo de métrica |

**Os valores reais hoje:**

| Campanha | `client_id` | Fonte | Métrica-Mãe | Meta |
|---|---|---|---|---|
| `[KIL] …SALÃO.BELEZA…` | CLI-4 | Google Ads | **CPA** | 3.5 |
| `[KIL] …BARBEARIA…` | CLI-4 | Google Ads | **CPA** | 5.2 |
| `[CHA] IG_MENS__PROD.TESTE__` | CLI-13 | Meta Ads | **CPL** | 4 |

> ✅ **Consequência para o ADR-40: o cadastro do Olavo NÃO precisa mudar.** A Métrica-Mãe já está no
> grão certo, no lugar certo, preenchida. **O ADR-40 não cria trabalho manual para o Olavo** — só
> conserta o caminho entre o que ele já preenche e onde o dado é guardado.
>
> **E isso é o oposto exato da opção A**, que teria pedido a ele um campo novo e três
> preenchimentos. A opção D não pede nada.

---

## 20. V3 — quantos lugares leem `client_config.primary_metric_type`

**Um workflow só. Três nós de SQL, e dois consumidores no Notion a jusante.**

Varri os 4 dumps de `activeVersion` que tenho:

| Workflow | Ocorrências de `primary_metric_type` |
|---|---|
| **`PHI - Pipeline_v2`** (`ITWG3Ge0asXtUM8U`, `e4f6d90a`) | **13** |
| `PHI — Agregador` (`4sdG2UKMCBuFq8xn`, `c54114b3`) | **0** |
| `sw metricas anuncios` (`vVAdXAJh6MW2Z5Hp`, `ff681a25`) | **0** |
| `sw metricas campanhas` (`W571K320aqIHsdtH`, `a9bd0584`) | **0** |

### 20.1. Os três leitores de SQL — todos no Pipeline_v2

| # | Nó | O que faz com a coluna |
|---|---|---|
| **L1** | **`Buscar Clientes Ativos`** | `SELECT client_id, model_id, primary_metric_type FROM phi_prod.client_config WHERE is_active = TRUE` — ⚠️ **provavelmente morto**: a saída segue para `Code INSERT execution_id` → `Loop Clientes` → `Call Subworkflow Campanhas`, e o `Start` do subworkflow só aceita `execution_id`, `client_id` e `source_execution_id`. **O tipo não é repassado a ninguém** |
| **L2** | **`Calcular e Persistir PHI Score`** | `cc.primary_metric_type` na CTE `campanhas_exec` (linha 37) → usado nas **duas portas de qualidade** da CTE `qualidade` (linhas 50 e 56) → e projetado no `source` do MERGE (linha 124) |
| **L3** | **`Buscar Campanhas Alertas`** | `cc.primary_metric_type` (linha 103) — alimenta a tarefa do gestor |

### 20.2. Os dois consumidores no Notion — e é aqui que o dado chega no gestor

Via `Code Enriquecer Campanha`, o valor vai para o campo **`Métrica Afetada`** em:

- **`Create a database page`** (DB **Tasks**)
- **`Criar Log Otimizacoes`** (DB **Log de Otimizações**)

> **Ou seja: o tipo de métrica sai do `client_config` e aparece na tarefa que o Olavo abre.** Não é
> coluna interna. **Se ela estiver errada para uma das duas campanhas de um cliente, a tarefa mente.**

### 20.3. 🔴 Achado da V3: o score **não guarda** a régua que usou

Conferi a lista de colunas do `WHEN NOT MATCHED THEN INSERT` do `phi_score_history`. São 30 colunas,
e **`primary_metric_type` não é uma delas** — ele aparece só na projeção do `source` (linha 124), que
alimenta o MERGE e morre ali.

**O mesmo padrão dos writers: lido, carregado, descartado na porta.** Três vezes o mesmo gesto.

| O que é guardado por campanha/dia | Onde |
|---|---|
| a **meta** (`primary_metric_goal`) | ✅ `raw_campaign_data` · e há `client_goal_history` com `valid_from`/`valid_until` |
| o **tipo** (`primary_metric_type`) | 🔴 **em lugar nenhum com histórico** — só em `client_config`, que é mutável e não versiona |

> **O projeto já tem o conceito de régua versionada — para a meta.** `client_goal_history` existe
> exatamente para isso. **Para o tipo, não existe nada.** Um score de julho não sabe dizer contra que
> métrica foi julgado. É a preocupação de *"régua histórica imutável"* do ADR-40, e ela **não está
> resolvida hoje em lugar nenhum** — não é algo que o ADR-40 arrisca quebrar; é algo que ele conserta.

---

## 21. V4 — a coluna sai de `client_config` ou fica órfã?

> **Regra do Olavo (21/09):** *"Descartar exige dizer o que substitui."*

### Recomendação: **sai — e entram DUAS coisas no lugar, não uma**

| Sai | Entra | Papel |
|---|---|---|
| `client_config.primary_metric_type` | **`raw_campaign_data.primary_metric_type`** | **o fato do dia** — qual métrica valia para aquela campanha, naquela data |
| | **`phi_score_history.primary_metric_type`** | **a régua congelada** — contra o que aquele score foi julgado, imutável como o resto da linha |

**Por que duas e não uma:** são perguntas diferentes, e hoje nenhuma tem resposta.
*"Qual é a métrica desta campanha hoje?"* é estado corrente. *"Contra o que este score de 12/07 foi
julgado?"* é história. Guardar só na `raw_campaign_data` responde a primeira e deixa a segunda
dependendo de um `JOIN` por data — que é exatamente o tipo de coisa que apodrece.

**E a ordem tem de ser a mesma do ADR-39, pelo mesmo motivo:** os três leitores repontados **antes**
de a coluna sair. `Buscar Clientes Ativos` (L1) provavelmente nem precisa ser repontado — precisa ser
**apagado da lista do `SELECT`**, depois de confirmado que ninguém usa.

### ⚠️ O custo que não está no código, e é o maior

`ALTER TABLE ... ADD COLUMN` nasce com **`NULL` em toda a série histórica**. E a porta de qualidade do
score é:

```sql
WHEN primary_metric_type IS NULL OR primary_metric_type != 'CPA' THEN 'INSUFFICIENT_DATA'
```

> 🔴 **Sem backfill, qualquer recálculo de dia passado vira `INSUFFICIENT_DATA` — a série inteira.**
> O ADR-40 precisa decidir uma das duas: **(a)** backfill de `primary_metric_type` na
> `raw_campaign_data` a partir do `client_config` atual (é o que o valor era, de fato), ou
> **(b)** um `COALESCE(j.primary_metric_type, cc.primary_metric_type)` de transição, com prazo escrito.
>
> **Eu recomendo (a) com (b) como rede** — e (b) com data, senão é a R12 outra vez.

---

## 22. Estimativa de custo do ADR-40

**Pequeno no encanamento, médio na transição.** Seis artefatos:

| # | Artefato | Mudança | Tamanho |
|---|---|---|---|
| 1 | **BigQuery** `phi_prod.raw_campaign_data` | `ADD COLUMN primary_metric_type STRING` | 1 DDL |
| 2 | **BigQuery** `phi_prod.phi_score_history` | `ADD COLUMN primary_metric_type STRING` | 1 DDL |
| 3 | `sw metricas campanhas` → **`Code Montar SQL`** | o valor já está em `context.raw_notion_data.clean_metrica_mae`; acrescentar à projeção, ao `UPDATE SET` e ao `INSERT` | ~4 linhas |
| 4 | `PHI - Subworkflow Campanhas` → **`Execute SQL  INSERT raw_campaign_data`** | o valor já chega no item; mesmas 3 listas. **E trocar o `\|\| 'ROAS'` por erro alto** | ~4 linhas + 1 |
| 5 | `PHI - Pipeline_v2` → **`Calcular e Persistir PHI Score`** | na CTE `janelas`, agregar o tipo como já se agrega a meta (`MAX(IF(date = D-1, …))`); trocar `cc.primary_metric_type` por `j.primary_metric_type`; **acrescentar a coluna ao `INSERT` do target** | ~4 linhas |
| 6 | `PHI - Pipeline_v2` → **`Buscar Campanhas Alertas`** e **`Buscar Clientes Ativos`** | repontar o primeiro; apagar a coluna do segundo depois de confirmar que é morta | ~2 linhas |

**Mais a decisão do §21 (backfill ou COALESCE com prazo), que é onde mora o risco real.**

> **Comparado à opção A:** a A exigia **uma propriedade nova no Notion + três preenchimentos manuais
> do Olavo**, e teria posto o dado no grão errado. **A D não pede nada ao Olavo** e tira o dado do
> lugar errado. A avaliação do chat-mãe está correta.

---

## 23. Hipóteses desta rodada

| # | O que se supunha | O que o artefato mostra |
|---|---|---|
| 1 | O §A9 (mapa fixo) contradizia a minha frase sobre os dois writers | **Não contradizia** — fala do `client_config`, que **não é** writer de `raw_campaign_data`. A frase estava certa; **a redação, ambígua** |
| 2 | *(minha)* os dois writers "só precisam gravar" a Métrica-Mãe | ✅ **confirmado, e mais barato**: o valor já chega **ao próprio nó que monta o `MERGE`** nos dois |
| 3 | *(minha)* a Métrica-Mãe seria obrigatória de preencher | **Já é obrigatória na prática**: o `Get many database Campanhas` filtra por `is_not_empty` |
| 4 | O ADR-40 arriscaria a régua histórica | 🔄 **ao contrário** — hoje **não existe** régua histórica: `phi_score_history` não guarda `primary_metric_type`. O ADR-40 a cria |
| 5 | *(minha)* `client_config.primary_metric_type` seria coluna interna | **Não é.** Chega ao campo `Métrica Afetada` da Tarefa e do Log de Otimizações, no Notion do gestor |

