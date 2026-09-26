# [FASE B.1 — AS-BUILT] `revenue` no writer 1 · + proposta do **D1-d** (não executada)

> **Data:** 2026-09-24 · **Sub-chat:** Saúde Digital / ADR-38 etapa 8
> **Autorização:** §27.6 do ADR-38 — *"Fase B liberada — é aditiva. Pode ir."*
> ✅ **B.1 executada e publicada.** ⬜ **1.4 não executada** — depende da P-20, que segue aberta.
> 📋 **D1-d: proposta escrita, NÃO executada**, como pedido.

---

## 1. O que foi feito — B.1

**`revenue` deixou de ser coluna exclusiva do `PHI - Subworkflow Campanhas`.**
Era a única perda real da Fase C (Fase A, §26.1) — e agora não é mais.

| | |
|---|---|
| Workflow | `sw metricas campanhas` (`W571K320aqIHsdtH`) |
| Nó | `Code Montar SQL` |
| Versão **publicada** | `fa2bb6ef-d682-4137-87d8-31893b6a9cb5` |
| Conferência R13 | ✅ **`versionId == activeVersionId`** relido **depois** de publicar |
| Descrição do workflow (R5) | ✅ atualizada: *"Fase B.1 (24/09): grava tambem revenue"* |

### 1.1. As cinco mudanças, e nenhuma a mais

| # | Onde | O quê |
|---|---|---|
| 1 | novo helper `hasFirstResult()` | distingue **"a consulta não voltou"** de **"voltou sem a métrica"** — o `firstResultMetrics()` existente devolve `{}` nos dois casos |
| 2 | novo `revenueSql` | `metrics.conversions_value` do D-1, **só** quando `platform === 'google_ads'` **e** houve resultado |
| 3 | `USING … SELECT` | `${revenueSql} AS revenue` |
| 4 | `WHEN MATCHED` | `target.revenue = COALESCE(source.revenue, target.revenue)` |
| 5 | `WHEN NOT MATCHED` | `revenue` na lista de colunas e `source.revenue` na de valores |

**Nenhuma coluna existente mudou de comportamento.** A mudança é estritamente aditiva.

### 1.2. 🔴 As três decisões de semântica, e por que cada uma

| Decisão | Por quê |
|---|---|
| **A mesma GAQL do writer 2** | o `HTTP Request Google Ontem (D1)` já pede `metrics.conversions_value`, com **os mesmos campos, o mesmo `WHERE` e o mesmo `DURING YESTERDAY`** do writer 2. **De propósito:** assim aposentar o writer 2 na Fase C **não muda o número** — se as fontes divergissem, a Fase C viraria uma mudança de dado disfarçada de limpeza |
| **Sem resultado ⇒ `NULL`, nunca `0`** (M4) | zero é *"vendeu zero"*; ausência é *"não sei"*. **Mas dentro de um resultado que existe**, a ausência do campo significa zero de verdade — o Google **omite métrica de valor zero** no JSON. Daí o `hasFirstResult()`: o `|| 0` só vale depois de saber que houve linha. É a **R11 regra 5** aplicada antes do fato, não depois |
| **`COALESCE` no `UPDATE`** | se a consulta do D-1 não voltou, `source.revenue` é `NULL` — e `NULL` ali significa *"não sei"*. **Não pode APAGAR** um valor já gravado para a mesma campanha e o mesmo dia. **Ausência nunca destrói conhecimento** |

> **Meta fica de fora, e é correto:** o writer 2 nunca cobriu Meta (`Meta Ads — em breve` é um `noOp`),
> então não há de onde tirar o valor. **`NULL`, e não `0`** — manter a lacuna visível é a única
> resposta honesta.

### 1.3. Como verifiquei **antes** de publicar

**Não li o código e chamei de certo.** Renderizei o SQL que o nó produz, fora do n8n, com stubs dos
nós de origem, e conferi os **três** cenários:

| Cenário | `revenue` gerado | ✅ |
|---|---|---|
| Google com resultado (`conversionsValue: 1234.56`) | `CAST(1234.56 AS FLOAT64) AS revenue` | ✅ |
| Google **sem** resultado na consulta D-1 | `CAST(NULL AS FLOAT64) AS revenue` | ✅ **não virou 0** |
| Plataforma **Meta** | `CAST(NULL AS FLOAT64) AS revenue` | ✅ |

E conferi no SQL renderizado que a **lista de colunas do `INSERT` e a de valores continuam alinhadas**
(19 e 19, `revenue` na mesma posição nas duas) — o erro clássico de acrescentar coluna a um `INSERT`.

---

## 2. 🔴 A prova em produção ainda NÃO aconteceu — e os critérios estão escritos **antes**

**Não executei o workflow à mão.** Duas razões, e as duas são regra da casa:

1. **Orçamento:** *"não ativar/executar workflow sem OK de budget do Olavo"*. Uma rodada manual gasta
   cota da API do Google, do Notion e do BigQuery.
2. **Efeito colateral:** o workflow **cria página no Notion** (`Create a database page Create
   Observation`) e **atualiza a DB Campanhas**. Não é uma rodada inócua.

> **A prova chega sozinha:** a rodada natural das **00h BRT** e a das **04h BRT** exercem o caminho
> com dado real, de graça. Escrevo os critérios agora, **antes**, para não julgar depois pelo que der.

### 2.1. Os quatro critérios de aceite da B.1

| # | Critério | Como se mede |
|---|---|---|
| **B1-a** | a rodada das 00h **terminou verde** | execução do `W571K320aqIHsdtH` com `status: success` |
| **B1-b** | `revenue` **preenchido** nas linhas do Google de D-1 pelo **writer 1**, antes das 07h | `ingested_at < 07:00 BRT` **e** `revenue IS NOT NULL` |
| **B1-c** | 🔴 o valor do writer 1 **bate** com o que o writer 2 grava às 07h | comparar o `revenue` às 04h com o das 07h. **Divergência aqui invalida a premissa da Fase C** |
| **B1-d** | nenhuma coluna existente mudou | `cost`, `conversions`, `clicks`, `impressions`, `cost_3d/7d`, `conversions_3d/7d`, `primary_metric_goal`, `primary_metric_type` iguais aos dos dias anteriores em forma e ordem de grandeza |

**Query de conferência** (roda depois das 04h BRT de 25/09, antes das 07h para o B1-c ser limpo):

```sql
SELECT date, client_id, campaign_id, ingestion_step, revenue,
       FORMAT_TIMESTAMP('%d/%m %H:%M:%S', ingested_at, 'America/Sao_Paulo') AS ingerido_sp
FROM phi_prod.raw_campaign_data
WHERE date >= DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 2 DAY)
ORDER BY date DESC, campaign_id;
```

> ⚠️ **O B1-c é o que importa.** Os outros três confirmam que não quebrei nada; **o B1-c confirma que
> a Fase C pode acontecer sem mudar o dado.**

---

## 3. ⬜ Por que a **1.4** não foi executada

O plano chama de **1.4** o re-puxe de **D-1..D-3** (o **D4** do ADR-37). **Ele não é construível hoje**,
e não por falta de tempo:

> O **§27.4 do ADR-38** deixa a **P-20/D4** explicitamente **⬜ do Olavo**, *"e agora com mais peso"*.
> E as três opções do §5 B.2 do plano **constroem coisas diferentes**:
>
> | Opção | O que se constrói |
> |---|---|
> | **(a)** | a rodada das **00h** vira o re-puxe D-1..D-3; a das 04h segue como a do dia |
> | (b) | desativa-se a das 00h e o re-puxe vai para a das 04h |
> | (c) | não se implementa o D4 |
>
> **Construir antes de escolher é construir para jogar fora** — é a **R7**. E é uma mudança que mexe
> na janela de coleta, ou seja, **não é aditiva** como a B.1.

**Recomendação (não decisão):** a **(a)**. Com um writer só depois da Fase C, a janela de coleta passa
a ser única, e a rodada das 00h é a que menos custa transformar — ela já roda, e o dado das 00h é o
menos maduro dos dois, ou seja, **o de menor valor como leitura do dia**.

---

## 4. 📋 Proposta do **D1-d** — consertar o laço do writer 1 (**NÃO executada**)

> **Pré-requisito da C1**, conforme §27.2. **Proposta apenas** — nada disto foi aplicado.

### 4.1. O defeito, lido no artefato

O laço é **uma corrente única**, e o **único caminho de volta** para o `Loop Over Items` é o último nó:

```
Loop Over Items [saída 1] → Code Clean Campanhas → … → If Plataforma
                                                        ├─[0] Google: v23 Bloco 1/2/3 → D1 → D3 → D7 → …
                                                        └─[1] Meta:  HTTP Meta → HTTP Meta D-2 → …
   … → Update a database page → Code Montar SQL → Execute SQL inserir daily entry ──┐
                                                                                     │
   └─────────────────────────────────────────────────────────────────────────────────┘
```

🔴 **Nenhum nó do corpo tem `onError`.** Todos são `stopWorkflow` por omissão. Então **qualquer erro em
qualquer ponto da corrente encerra a execução inteira** — e, como só o nó de SQL reconecta ao laço, o
laço **nunca avança**.

> **Foi exatamente o que aconteceu em 22/09:** o token do Meta expirou, o `HTTP Request Meta Ads`
> lançou, e o **Google — que vinha depois na fila de campanhas — nem foi consultado.**
>
> ⚠️ **E `retryOnFail: true` não salvou:** os nós HTTP já têm retry. **Credencial expirada não é erro
> transitório** — as três tentativas falham igual. **Retry cura contenção, não cura autorização.**

### 4.2. O que proponho — **uma fronteira de erro, não N**

| # | Mudança | Por quê |
|---|---|---|
| **1** | `onError: continueErrorOutput` nos **nós HTTP** (`HTTP Request Meta Ads`, `HTTP Request Meta Ads D-2`, `HTTP Request Google Ontem (D1)`, `(D3)`, `(D7)`, `v23 Bloco 1/2/3`) | são **onde a falha externa entra**: credencial, cota, indisponibilidade |
| **2** | 🆕 um nó **`Campanha pulada`** que recebe **todas** as saídas de erro | **uma** fronteira, não oito tratamentos espalhados |
| **3** | o `Campanha pulada` **reconecta ao `Loop Over Items`** | é o que faz o laço **avançar** em vez de morrer. (Regra Crítica nº 5: o corpo do laço tem de reconectar) |
| **4** | 🔴 o `Campanha pulada` manda **Telegram** com cliente, campanha, nó e motivo | **R11 regra 2:** `continueErrorOutput` **só com destino visível**. Sem isto, eu trocaria "falha ruidosa" por **"falha silenciosa"**, que é o modo de falha desta casa |

### 4.3. 🔴 O que esta proposta deliberadamente **não** faz

| Não faço | Por quê |
|---|---|
| **não reordeno a fila** para o Google vir antes do Meta | **esconderia o bug** em vez de consertá-lo — é o mesmo argumento com que o §27.2 recusou manter o writer 2 como rede |
| **não extraio o corpo do laço para um subworkflow** | é o desenho mais limpo, e é **uma obra**. A fronteira de erro resolve o problema declarado com uma fração do risco. **Se um dia o corpo crescer, aí sim** |
| **não engulo o erro em silêncio** | ver item 4 acima |
| **não mexo em `retryOnFail`** | já está ligado nos nós HTTP, e **não é o remédio para este defeito** |

### 4.4. Como se prova que o D1-d funcionou

> **O teste NÃO é *"o laço continua?"*. É *"o que acontece no dia em que uma credencial cai?"*** — e é
> a lição da salvaguarda de 18/09: **a rede que se instala para proteger é código novo em produção, e
> exige o mesmo smoke que a mudança que ela protege.**

| # | Prova |
|---|---|
| 1 | forçar a falha de **uma** campanha (credencial inválida num cliente de teste) e conferir que **as outras foram gravadas** |
| 2 | conferir que **chegou o Telegram** nomeando a campanha pulada |
| 3 | conferir que o **Vigia de Frescor das 08h** acusa a campanha pulada como `SEM INGESTAO` — **o alarme de lacuna já existe e já cobre este caso** |
| 4 | conferir que a execução termina **verde**, e que isso **não é sucesso silencioso** porque os itens 2 e 3 gritam |

### 4.5. ⚠️ O que o D1-d **não** resolve, e devia virar item próprio

**Credencial expirada continua sendo descoberta tarde.** Depois do D1-d, a coleta dos outros clientes
sobrevive — **mas ninguém avisa que a credencial do Meta venceu** até alguém ler o Telegram da campanha
pulada. É melhor que hoje, e **não é o mesmo que monitorar validade de credencial.**

> **Registrado como adjacente, não proposto** — seria ampliar o escopo do D1-d por conta própria.

---

## 5. 🆕 Achado lateral desta sessão — **registrado, não consertado**

🟡 **O `sw metricas campanhas` chama três versões da API do Google Ads ao mesmo tempo:**

| Nó | Versão |
|---|---|
| `HTTP Request Google Ontem (D1)` | 🔴 **v22** |
| `HTTP Request Google Ontem (D3)` | 🔴 **v22** |
| `HTTP Request Google Ontem (D7)` | v23 |
| `v23 Bloco 1 / 2 / 3` | v23 |

A **Regra Crítica nº 12/13** do `CLAUDE.md` fala de **v23**, e o writer 2 usa **v23**.

> **Por que isto importa para a Fase C:** o `revenue` que acabei de acrescentar vem do nó **D1**, que é
> **v22** — enquanto o do writer 2 vem de um nó **v23**. **Os campos pedidos são idênticos**, então
> espero o mesmo número; **mas é premissa, não medição** — e é exatamente o que o critério **B1-c**
> existe para conferir.

**Não consertei:** trocar versão de API num caminho de produção não é mudança aditiva, não foi pedido,
e o **B1-c** vai dizer se há divergência real antes de valer a pena mexer. **Vira pendência P-34.**

---

## 6. R12 — configuração mexida nesta sessão

| O quê | Estado ao fechar |
|---|---|
| `Code Montar SQL` do `W571K320aqIHsdtH` | ✅ **mudança definitiva e publicada** (`fa2bb6ef`), não temporária. Relido depois de publicar |
| descrição do `W571K320aqIHsdtH` | ✅ atualizada na mesma sessão (R5) |
| `TMP - A6 BigQuery Audit` | inativo, query rotulada — **sem mudança nesta fase** |
| qualquer coisa desabilitada "para testar" | 🔴 **nenhuma.** Não desabilitei nada |

---

## 7. Estado ao fechar

| Item | Estado |
|---|---|
| **B.1** (`revenue` no writer 1) | ✅ **publicada** — prova em produção nas rodadas de 00h/04h de 25/09, critérios escritos em §2.1 |
| **1.4** (re-puxe D-1..D-3) | ⬜ **bloqueada pela P-20**, que o §27.4 deixa em aberto |
| **D1-d** (conserto do laço) | 📋 **proposta escrita, não executada** (§4) |
| **C1 / C2** | 🔴 **bloqueadas pelo F3**, por decisão do Olavo (§27.6) |
| **P-34** 🆕 | versões v22/v23 misturadas no writer 1 |
