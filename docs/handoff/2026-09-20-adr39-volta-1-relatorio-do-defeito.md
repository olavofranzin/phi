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

