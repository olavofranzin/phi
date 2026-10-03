# F3 — o vigia de consistência: relatório de execução (volta 1)

| | |
|---|---|
| **Data** | 2026-09-26 |
| **Brief** | `docs/handoff/2026-09-26-F3-vigia-de-consistencia-construcao-subchat-brief.md` |
| **Plano canônico** | `docs/strategic-planning/saude-digital/PLANO-F3-vigia-de-consistencia.md` |
| **Workflow alvo** | `PHI - Vigia de Frescor dos Dados` — `JMgc0HdLPOFPnFYb` |
| **Resultado** | 🔴 **NÃO PUBLICADO. NADA FOI CONSTRUÍDO.** Três premissas do brief foram **refutadas pelo dado** antes do primeiro nó |
| **Volta da R9** | **1 de 3** |

---

## 0. 🔴 A frase única

**Dois dos três "defeitos vivos" que o brief chamou de *"o seu teste, e são de graça"* não estão
acontecendo — e o terceiro (V1) não pode ser construído com as credenciais que existem.** Como o
**CA3** e o **CA4** exigem literalmente que o vigia acuse esses dois defeitos *na estreia*, e a
autorização de publicar é condicionada aos **nove** critérios, **publicar viraria adaptar o critério
para ele passar — o que a regra 2 do brief proíbe em letra.**

> Isto é a **R6** funcionando como projetada: *"executar um plano aceito que o dado já desmentiu é o
> pior dos dois mundos — tem a autoridade do ADR e a consequência do erro."*

---

## 1. O que eu fiz, exatamente

| Ação | Onde | Prova |
|---|---|---|
| Li o que está **NO AR** (R13) | `JMgc0HdLPOFPnFYb` | `versionId == activeVersionId == ba3ce628-98d3-4ce8-995b-2fce4435f5a7`, `sameAsDraft: true`. **Li o vivo, não o rascunho** |
| 6 leituras no BigQuery | via `TMP - A6 BigQuery Audit` (`m8unFD0ksEc1Zvbk`, INATIVO, só SELECT) | execuções **43182, 43183, 43184, 43187** (erro de coluna), **43188, 43189** |
| 2 leituras no Notion | DB Campanhas `19fb65e5-c72b-8043-a82d-f47ede397928` | schema + 1 query agregada |
| Conferi as credenciais | n8n | 26 credenciais, **nenhuma do tipo `n8nApi`** |

**Nenhum workflow foi criado, alterado, publicado, ativado ou desativado.** A única escrita em n8n foi
a troca da query do `TMP - A6` — que é **o propósito declarado dele** (*"a query troca a cada uso"*) —
e a atualização da descrição dele pela **R5**.

---

## 2. 🔴 As três premissas refutadas

### 2.1 CA3 — o score 3× **não existe hoje**, em lugar nenhum

O brief o chama de *"defeito vivo, teste de graça"*. Procurei nos três lugares onde ele poderia estar:

| Onde | O que esperava | O que achei | Execução |
|---|---|---|---|
| `phi_prod.phi_score_history` | chave repetida | **0 chaves duplicadas em 30 dias** — inclusive em 19/09, o dia em que o 3× foi medido. 2 linhas/dia, 2 campanhas/dia, de 18/09 a 24/09 | 43184 |
| `phi_prod.phi_score_current` (a view que o CONTRATO §6.1 aponta como o lugar do 3×) | 3 linhas/campanha | **2 linhas no total — exatamente 1 por campanha** | 43189 |
| Notion, DB Campanhas (a bancada) | 3 páginas ou 3 scores | **1 página por campanha, 1 score cada:** `49.87` e `48.8` | query Notion |

**E a origem da crença — aqui eu me corrijo.** Meu primeiro rascunho deste relatório dizia que o 3×
*"nunca foi confirmado por leitura"*. **Está errado, e a correção importa.** A linha do Notion do
sub-chat de 20/09 registra a medição, com número:

> *"O score vai 3× para o Notion, todo dia. `phi_score_current` devolveu **6 linhas para 2 campanhas**
> na rodada de 19/09 — três cópias byte a byte de cada. `Sync Scores to Notion` rodou 6 vezes."*

O que estava pendente de query no as-built §L1 era **a causa**, não o fato. **O 3× era real e foi
medido em 19/09.**

**Então o quadro verdadeiro é este, e é mais interessante que o meu erro:**

| Data | `phi_score_current` | Fonte |
|---|---|---|
| **19/09** | **6 linhas para 2 campanhas** (3 cópias byte a byte de cada) | medição do sub-chat, registrada no Notion em 20/09 |
| **26/09** | **2 linhas para 2 campanhas** (1 cada) | execução **43189**, hoje |

🔴 **O defeito foi consertado entre 19/09 e 26/09 e ninguém escreveu que foi.** E mais: hoje a
`phi_score_history` **não tem nenhuma chave duplicada em 30 dias** — inclusive em 19/09, o dia da
medição. Ou seja, as linhas duplicadas **saíram da tabela** depois.

> **Deduzo** (e marco como dedução, não fato) que quem consertou foi o **rebuild da série histórica da
> etapa 8 do ADR-38**, executado entre 21 e 24/09: reescrever a tabela pela chave canônica com `MERGE`
> deduplica por construção. **Não confirmei** — precisaria comparar as execuções do rebuild, e isso é
> outro trabalho.
>
> **A lição é a R2 ao contrário:** a casa sabe registrar o que quebrou; **não registrou o que sarou.**
> Cinco briefs seguidos (20, 21, 22, 25 e 26/09) continuaram mandando *"não toque no score 3×"* para um
> defeito que já não existia — e o CA3 desta etapa foi escrito em cima dele.

### 2.2 CA4 — o `t28_ga4_landing` **não está morto**; está em cadência semanal

O brief afirma *"06/09 — 19 dias de atraso. É a fonte que sobrou"*, e o CA4 diz *"se não acusar, o
vigia não serve"*. O histórico de carga da tabela (execução 43184) mostra o contrário:

| business_date | janela | execution_id |
|---|---|---|
| 2026-08-31 | D-7 | `EXEC-T28-34502` |
| **2026-09-06** | D-7 | `EXEC-T28-36516` |
| **2026-09-13** | D-7 | `EXEC-T28-39103` |
| **2026-09-20** | D-7 | `EXEC-T28-41535` |

**06/09, 13/09 e 20/09 são três domingos consecutivos**, com `execution_id` crescente. É exatamente o
que se espera de uma tabela semanal alimentada pelo Agregador nas segundas. **O último dado é 20/09,
não 06/09** — e a próxima carga é devida na segunda, 28/09.

O mesmo vale para o `t28_clarity_daily`: **último dado 20/09**, não 06/09.

> 🔴 **Consequência que vai além do F3:** o achado nº 1 do relatório da Fase 0 de 25/09 — *"duas
> tabelas pararam de receber em 06/09 e ninguém viu"* — **está errado.** Elas não pararam. E o relatório
> da Fase 0 apresentou isso como *"mais urgente que construir o índice"*. **Um achado errado com
> urgência alta é pior que nenhum achado: ele repriorizou a fila.**
>
> **Não deduzo por que o número saiu errado** — não reproduzi a query da Fase 0. Ela não está no
> relatório, então não tenho como confirmar a causa.

### 2.3 V1 — não é construível com as credenciais que existem

O plano é explícito e está certo no motivo: o V1 deve ler **a execução do n8n**, nunca o
`workflow_execution_log` (que grava `FAILED` em dia que deu certo — ADR-38 §25.11.5).

**Para ler execuções de dentro de um workflow, o n8n exige uma credencial do tipo `n8nApi`** (tanto o
nó `n8n` quanto um HTTP Request para `/api/v1/executions`, que precisa do header `X-N8N-API-KEY`).
**Das 26 credenciais da instância, nenhuma é desse tipo**, e nenhum dos workflows do parque que abri
chama a API do n8n. A chave se gera na tela do n8n (Settings → n8n API) — **é ação do Olavo, não minha.**

**E não há atalho pelo dado:** o último nó do `Pipeline_v2` é a Fase 3, que num dia saudável sem
otimização a abrir **legitimamente não escreve nada**. Ausência de escrita não distingue *"chegou ao
fim e não tinha o que fazer"* de *"morreu no meio"* — que é **exatamente** o defeito de 8 dias que o V1
existe para pegar.

---

## 3. O que sobra de pé: 4 conferências construíveis hoje, 2 com ressalva

| # | Estado | Por quê |
|---|---|---|
| **V2** | ✅ construível | consulta pronta. **Mas nasce sem defeito para acusar** (§2.1) |
| **V3** | ✅ construível | lê o Notion (credencial existe) e cruza com `phi_score_history` |
| **V4** | ✅ construível | com período por tabela e os **três** estados (§4) |
| **V7** | ✅ construível | e **tem defeito histórico para provar**: `primary_metric_type` vazio em **1 de 3** campanhas, de 16/09 a 20/09 (execução 43184). Zero de 21/09 em diante |
| **V5** | 🟡 construível **diferente do plano** | o plano pede *"terminou verde tendo roteado erro"* (precisa do status da execução). Dá-se pelo dado: a `t28_errors` tem **157 linhas**, última em 20/09, com `workflow_name`, `node_name`, `severity`, `resolved`. **Erro roteado com destino visível é detectável sem a API.** É desvio de desenho — **decisão do Olavo, não minha** |
| **V6** | 🟡 construível **pela metade** | o lado `Pipeline_v2` sim: `phi_score_history.snapshot_timestamp` existe e mostra a janela (07:01 BRT todo dia; **em 25/09 escreveu 09:10 BRT**, duas horas fora). O lado `operador unico` **não**: `raw_campaign_data` **não tem coluna de timestamp de carga** — só `date` e `execution_id` |
| **V1** | 🔴 bloqueado | §2.3 |

**O desenho completo das 4 construíveis, com o SQL escrito e conferido contra o schema real, está em
`docs/strategic-planning/saude-digital/F3-conferencias-sql-e-codigo.md`.** A próxima volta é montagem,
não desenho.

---

## 4. O que a verificação achou de novo (registrado, **não consertado**)

A regra 3 do brief: *o vigia avisa, não conserta*. Vale para mim também.

### 4.1 🔴 A view `phi_score_current` perdeu o `platform` — e é um multiplicador armado

A chave canônica do ADR-38 é `(client_id, platform, campaign_id, date)`. A view **não tem a coluna
`platform`**, e o subselect que escolhe o "mais recente" agrupa por `(client_id, campaign_id)`:

```sql
INNER JOIN (
  SELECT client_id, campaign_id, MAX(calculated_date) AS max_date
  FROM phi_prod.phi_score_history
  WHERE calculation_status = 'SUCCESS'
  GROUP BY client_id, campaign_id      -- <<< sem platform
) latest
```

Hoje não multiplica, porque só existe **um** platform (`google_ads`) e uma linha por dia. **No dia em
que a mesma campanha existir em duas plataformas, ou em que duas linhas `SUCCESS` dividirem a data, a
bancada passa a mostrar duas ou três linhas para uma campanha.**

**Isto NÃO é a causa do 3× de 19/09** — aquele eram *três cópias byte a byte*, o que exige três linhas
na `phi_score_history`, não um `JOIN` mal agrupado. **São dois problemas diferentes**, e o da view
continua no ar:

| | O 3× de 19/09 | A view sem `platform` |
|---|---|---|
| **Onde estava** | linhas duplicadas na `phi_score_history` | no `GROUP BY` da `phi_score_current` |
| **Hoje** | **sumiu** (deduzo: rebuild do ADR-38) | **continua** |
| **O que faz** | triplicava o score na bancada | **amplifica** qualquer duplicação futura, e some com a distinção de plataforma |

> **Corrijo também o que o sub-chat de 20/09 escreveu:** ele disse que *"a checagem de unicidade não
> pega isso por construção (agrupa por `platform`)"*. O problema da **view** é o oposto — ela **não**
> agrupa por `platform`. São dois artefatos diferentes olhando a mesma chave de dois jeitos errados
> em direções contrárias. **Nenhum dos dois foi tocado por mim.**

### 4.2 Uma data-sentinela em produção

`phi_score_history.MIN(calculated_date)` = **2000-01-01** (execução 43183). Uma linha com data de
sentinela dentro da tabela que o `phi_value` usa como fato.

### 4.3 Os três estados de "tabela sem linha" são de fato três, e um é pior do que o brief supôs

| Tabela | primeiro | último | linhas | Estado real |
|---|---|---|---|---|
| `raw_campaign_data` | 2026-01-01 | **2026-09-25** | 509 | ✅ em dia (diário) |
| `phi_score_history` | **2000-01-01** | 2026-09-24 | 266 | ✅ em dia (o de 25/09 entra às 07h de 26/09) |
| `t28_campaign` | 2026-06-01 | 2026-09-20 | 634 | ✅ em dia (semanal) · **318 sem `client_id`** |
| `t28_ga4_landing` | 2026-06-21 | 2026-09-20 | 30 | ✅ em dia (semanal) |
| `t28_clarity_daily` | 2026-06-21 | 2026-09-20 | 16 | ✅ em dia (semanal) · em estudo, sem consumidor |
| `t28_errors` | 2026-06-22 | 2026-09-20 | 157 | recebe |
| `t28_gbp_daily` | 2026-06-21 | **2026-06-21** | **1** | 🟡 **nunca recebeu de verdade** — uma linha só, há 97 dias |
| `t28_adset` · `t28_meta_campaign` · `raw_ad_data` | — | — | **0** | 🟡 nunca recebeu |

**O `t28_gbp_daily` é o caso que o `COUNT` esconde melhor de todos:** não está vazio (tem 1 linha),
então uma checagem de "tem dado?" passa; e não está em dia, então uma de frescor grita. **É a quarta
cara do vazio: a linha única de teste que fica parecendo nascimento.**

### 4.4 As 318 linhas sem cliente: confirmado

`t28_campaign` tem **634 linhas, 318 sem `client_id`** — mais da metade. O brief estava certo, e o
filtro `client_id IS NOT NULL` está em todas as consultas que escrevi.

---

## 5. Os 9 critérios de aceite: onde cada um está

| # | Estado | Prova / motivo |
|---|---|---|
| **CA1** | ⬜ não testado | nada foi construído |
| **CA2** | ⬜ não testado | idem |
| **CA3** | 🔴 **IMPOSSÍVEL** | o defeito **era real em 19/09 e sumiu até 26/09** (§2.1) — 3 leituras independentes hoje. Não há o que acusar na estreia |
| **CA4** | 🔴 **IMPOSSÍVEL** | a tabela não está atrasada (§2.2) — histórico de carga semanal |
| **CA5** | ⬜ não testado | ⚠️ e o código **vivo hoje** falha nele: `if (lacunas.length === 0) { return []; }` — **o vigia atual morre calado todo dia saudável.** É o defeito de 18/09 dentro do próprio vigia |
| **CA6** | ⬜ não testado | — |
| **CA7** | ⬜ não testado | o SQL escrito já filtra; sem execução não há prova |
| **CA8** | ✅ **PASSA JÁ** | `settings.errorWorkflow = "UZ7sIE5cWrrO8xea"` (vale sem publicar — R13 item 4) |
| **CA9** | ⬜ não aplicável | nada foi publicado |

**1 passa, 2 impossíveis, 6 não testados. A autorização condicional não foi atingida — e por isso não
publiquei.**

---

## 6. 🔴 As perguntas que devolvo ao chat-mãe

Não escolhi por ele em nenhuma. Cada uma com as opções e a consequência. **São cinco.**

### P1 — Como ficam o CA3 e o CA4, agora que os defeitos não existem?

| Opção | Consequência |
|---|---|
| **A** — trocar os dois por defeitos **reais e medidos**: o **V7** (vazio em 1 de 3 campanhas, 16–20/09, provável pelo histórico) e o **V4** contra o `t28_gbp_daily` (1 linha há 97 dias) | mantém o espírito do CA3/CA4 (*prove com defeito de verdade, não com simulação*) e é executável hoje. **É a que eu recomendaria** — mas a troca de critério é decisão sua, não minha |
| **B** — provar por injeção em ambiente controlado | o CA2 já permite; mas injetar exige escrever em `phi_prod` ou criar tabela de teste — **fora do escopo deste brief** |
| **C** — publicar com 7 de 9 | ⛔ contraria a regra 2 em letra. **Não faço sem você dizer** |

### P2 — O V1 vale uma chave de API do n8n?

| Opção | Consequência |
|---|---|
| **A** — você gera a chave (Settings → n8n API) e eu crio a credencial | o V1 nasce como desenhado. **Custo: 1 clique seu + um segredo novo no parque** |
| **B** — o V1 sai do v0 do vigia | o vigia entrega 4 de 7 e **fica cego para o defeito mais caro da casa** (Fase 3 morta 8 dias). O V5 e o V6 também ficam pela metade |
| **C** — heartbeat: o último nó do `Pipeline_v2` escreve uma linha própria | resolve o V1 sem a API, **mas exige alterar o `Pipeline_v2`** (fora do escopo) e cria mais uma tabela que pode ficar sem writer — o contra da opção B do §5 do plano |

### P3 — O V5 pode ler `t28_errors` em vez do status da execução?

É desvio do plano aprovado. **Fato a favor:** a `t28_errors` recebe, tem 157 linhas e carrega
severidade e nó. **Fato contra:** ela só cobre quem usa o `WF-T28-Error-Handler` — **não cobre erro
roteado em workflow que não seja T28.** Cobertura parcial, e é você que decide se parcial serve.

### P4 — Quem fechou o score 3×, e por que isso não está escrito?

O 3× era real em 19/09 (6 linhas para 2 campanhas) e **não existe mais**. **Deduzo** que o rebuild do
ADR-38 o resolveu de raspão. Duas consequências que são suas, não minhas:

1. Se foi o rebuild, o **F2** (a frente que existe para consertar o 3×) **pode estar pronto sem que
   ninguém saiba** — e vale conferir antes de gastar sub-chat nele.
2. A view `phi_score_current` **continua sem `platform`** (§4.1). O sintoma sumiu; **um caminho para
   ele voltar, não.**

### P5 — O achado errado da Fase 0 muda a fila?

O relatório de 25/09 disse que consertar a observabilidade era *mais urgente que construir o índice*,
com base em duas tabelas que **não** estavam mortas. **Se a urgência veio do número errado, a
repriorização merece uma segunda olhada** — e isso é planejamento, não execução.

---

## 7. O que eu **não** fiz, de propósito

- ❌ **Não publiquei nada.** `JMgc0HdLPOFPnFYb` está byte a byte como estava às 04:58 UTC de 26/09.
- ❌ **Não deixei rascunho divergente.** Não escrevi uma linha no workflow alvo — justamente para não
  criar o estado da **R13** (`sameAsDraft: false`), que já escondeu produção quebrada por dois dias.
- ❌ **Não consertei** a view `phi_score_current`, a data-sentinela, as 318 linhas, nem nada do §4.
- ❌ **Não aposentei nem apaguei** o ramo do Clarity (decisão de 26/09: fica coletando).
- ❌ **Não adaptei nenhum critério** para ele passar.
- ❌ **Nenhum nó de LLM** em lugar nenhum. Custo de modelo desta etapa: **zero**.

### R12 — o que mexi para teste, e como voltou

| Mudado | Estado agora | Prova |
|---|---|---|
| query do `TMP - A6 BigQuery Audit` | ficou na última leitura (a da view). **Não volta — é o propósito do artefato**, que existe para ter a query trocada | descrição do workflow **atualizada pela R5** com o novo último uso e as execuções |

**Nada foi desabilitado. Nada ficou ligado que devia desligar.**

---

## 8. R4 — onde estamos, quanto falta, e o que atualizei para provar

**Onde estamos:** o F3 não começou a ser construído, e a razão é boa: **o alvo estava descrito errado
em dois dos nove critérios**, e um terço dele depende de uma credencial que não existe. O plano segue
aprovado e válido no princípio; o que caiu foram três premissas factuais.

**Quanto falta:** 4 das 7 conferências estão com SQL escrito e conferido contra o schema real — é
montagem de nó, não desenho. 2 dependem de uma decisão sua (P2, P3). 1 depende de você responder a P1
para que a publicação volte a ser autorizável.

**O que atualizei para provar:**

| Artefato | O que mudou |
|---|---|
| `docs/handoff/2026-09-26-F3-vigia-execucao-relatorio.md` | este relatório |
| `docs/strategic-planning/saude-digital/PLANO-F3-vigia-de-consistencia.md` | **banner no topo**: construção não ocorreu, premissas refutadas, com data |
| `docs/strategic-planning/saude-digital/F3-conferencias-sql-e-codigo.md` | novo: o SQL das 4 construíveis, conferido contra o schema |
| descrição do `TMP - A6 BigQuery Audit` no n8n | R5: último uso passa a ser o F3, com as execuções |
| DB Notion *"PHI — Registro de Execuções (Sub-chats)"* | linha de início e de encerramento (R3) |

> ⚠️ **Divergência de branch, declarada:** o brief manda trabalhar em `claude/consolidacao-2026-08`.
> A instrução da minha sessão fixa `claude/exciting-bardeen-ozheq6`, e eu obedeci a ela. Trouxe o brief
> e o plano canônicos da `consolidacao-2026-08` para esta branch antes de escrever, para não versionar
> uma cópia velha. **Alguém precisa juntar as duas.**
