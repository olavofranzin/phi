# Plano da Entrega Final — PHI (Saúde Digital)

| | |
|---|---|
| **Status** | 🟡 **ESQUELETO** — 2026-09-20. **Os §1 e §2 são do Olavo e estão em branco de propósito** |
| **Papel** | **Documento-base do planejamento da frente.** Trabalha junto com o `CLAUDE.md` e o `CONTRATO-PHI.md` |
| **Método** | Desenhar o **ponto final** primeiro; depois **engenharia reversa** até o que existe hoje |
| **Precedente** | `prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md` — a frente-piloto. Mesma forma, outra frente |
| **Por que agora** | o parque tem **as-built completo** (20/09) e **contrato com 11 decisões**. Falta a pergunta que ordena tudo: **para quê** |
| **Regra que o rege** | **R7** — nada se cria sem plano pronto |

---

## 0. Por que este documento precisa existir

A varredura do parque respondeu **o que cada workflow faz**. Não respondeu **se ele deveria existir** —
e essa é a pergunta que o contrato transformou em invariante:

> **M11 — todo dado escrito tem consumidor declarado. Tabela sem leitor é custo, não ativo.**

**O M11 não é aplicável hoje**, porque ninguém escreveu qual é a entrega final. Sem isso, *"quem lê
`workflow_execution_log`?"* não tem resposta possível: não há régua.

**Foi o que aconteceu com `raw_ad_data`** — três meses de escrita diária para uma tabela que ninguém
lia, e o defeito era invisível porque não havia contra o que comparar.

---

## 0.1. A peça central — confirmada pela metade (Olavo, 2026-09-21)

O executor do parque deduziu, e pediu confirmação antes de construir em cima:

> *"O PHI não é uma ferramenta de apoio ao serviço. Ele é a **capacidade de entrega do produto
> principal** (SVC-ADS). Sem ele, a agência atende tantos clientes de tráfego quantos o Olavo
> conseguir olhar com o próprio olho."*

**Veredicto do Olavo: ✅ "Certo, mas falta metade."**

| | |
|---|---|
| ✅ **Confirmado** | o PHI existe para **a qualidade do serviço parar de depender da atenção do Olavo**. É resposta econômica, não técnica |
| ⬜ **Falta** | a outra metade — **o Olavo ainda não a escreveu**. Até lá, **nada que dependa dela é decidido** |

> ⚠️ **Registrado como meia-verdade de propósito.** Escrever a metade confirmada como se fosse o
> todo seria o erro que a casa já cometeu com dado de teste: **transformar o que se tem em mão na
> resposta inteira.** A metade que falta ordena tanto quanto a que veio.

## 1. O que existe hoje — ✍️ **a escrever pelo Olavo**

> *Preservar a redação dele, como no plano da Prospecção.*
> O que a agência entrega hoje aos clientes na gestão de tráfego: o que o cliente recebe, com que
> frequência, e o que dá trabalho fazer.

⬜ *em branco*

## 2. O que poderemos fazer — ✍️ **a escrever pelo Olavo**

> O que o PHI deveria permitir que hoje não é possível.

⬜ *em branco*

---

## 3. O que as decisões já revelam sobre o ponto final

*(derivado do `CONTRATO-PHI.md` §6 e do as-built — **é pista, não é o ponto final**)*

| Pista | De onde vem | O que sugere |
|---|---|---|
| O grão de anúncio tem **três** consumidores: tela do Notion · T28 · **relatório para o cliente** | D1b | **O PHI tem entregável externo.** Não é só ferramenta interna |
| O que acorda o Olavo é **número errado no Notion** — *"porque ele age em cima dele"* | D10 | **O Notion é a bancada de trabalho**, não um relatório. A superfície é operacional |
| O que mais dói é **dado errado**, não dado que falta | B18 | O ponto final é sobre **confiança**, não sobre cobertura |
| *"Quero o anúncio culpado"* | B1 | A entrega não é diagnóstico genérico — é **apontar o responsável pelo desvio** |
| O PHI **detecta e orienta, nunca executa** | princípio central | O ponto final inclui um **humano que dá o play** |
| O score é **fato**, não opinião | ADR-003 | Há uma fronteira dura entre **medir** e **interpretar** |

> **Tensão registrada:** o Olavo elegeu o **grão de anúncio** (dado que falta) para os 15 dias, mas
> diz que o que dói é **dado errado**. As duas foram mantidas por ele quando reperguntado. Isso só se
> resolve quando o §1 e o §2 existirem.

## 3.1. Entrevista do propósito — rodada 1 (Olavo, 2026-09-20)

| # | Pergunta | Resposta **verbatim** |
|---|---|---|
| **B5** | interna ou produto? | **"Interna hoje, produto depois"** |
| **B4** | quantos clientes? | **"Todos os clientes que contratarem tráfego pago"** |
| — | quem abre o Notion? | **"Alguém da equipe"** + **"Só você"** |
| **B9** | 3 dias sem rodar, perceberia? | **"Sim, pela falta de pontuação e de alerta"** |

### 🔴 O que a resposta do B4 muda — e é a mais pesada das quatro

*"Todos os clientes que contratarem tráfego pago"* **não é um número: é uma regra de entrada.** O
gatilho de um cliente entrar no PHI passa a ser **a contratação**, não um cadastro técnico.

| Consequência | Estado hoje |
|---|---|
| **O cadastro automático deixa de ser melhoria e vira pré-requisito** | 🔴 hoje o `client_config` de produção é `UPDATE` **sem `INSERT`** — cliente novo **não entra** |
| O **ADR-39** deixa de ser higiene e vira **caminho crítico do modelo de negócio** | ✅ aceito, brief pronto |
| Existe uma **passagem de bastão Comercial → Operações → PHI** que ninguém desenhou | ⚠️ o **`Board Agência`** (Miro) **já prevê** essa passagem — foi o achado de 2026-09-15 na Prospecção |
| O **`L1 - Abertura de Projeto Tecnico Setup`** cria projeto para *"cliente ATIVO sem setup"* — é **a ponte da contratação** | 🔴 **a D6 o tirou do escopo do contrato.** Decisão a revisitar: ele pode estar no caminho crítico |

### O que a resposta do B9 muda

Ele perceberia **pela falta de pontuação e de alerta**. Então o PHI **já está no caminho crítico do
trabalho** — o que é uma boa notícia, com uma ressalva dura:

> 🔴 **Os dois sinais em que ele confia são exatamente os dois que já sumiram em silêncio.** A
> pontuação parou 8 dias (Fase 3 morta, verde todo dia) e o alerta só cobre 5 workflows. **Detectar
> a ausência é hoje o único mecanismo que ele tem — e é o mecanismo que sabemos que falha.**
>
> Isso reclassifica o **D5** (vigia de consistência): não é melhoria de vigilância, é **o conserto do
> único detector existente**.

### O que a resposta do B5 exige

*"Interna hoje, produto depois"* é uma resposta honesta e a mais comum — e é também a que mais
apodrece sem data. **É a R12 em escala de projeto:** estado temporário sem prazo vira permanente.

**Não precisa de data. Precisa de um critério de virada escrito** — *"o PHI vira produto quando
\_\_\_"*. Sem ele, cada decisão de qualidade fica sem régua: *"isso é bom o bastante?"* depende de
para quem.

## 3.2. Entrevista do propósito — rodada 2 (Olavo, 2026-09-20)

| Pergunta | Resposta **verbatim** |
|---|---|
| como um cliente novo entra no PHI? | **"Eu cadastro no Notion"** |
| o PHI vira produto quando o quê? | **"Itens 1 e 2"** — quando confiar no número **e** rodar sozinho 30 dias |
| o que acontece quando chega alarme? | 🔴 **"Quase nunca chega alarme"** |

### 🔴 O diagnóstico que as três respostas fecham

**O procedimento de entrada existe e é o certo:** o Olavo cadastra na DB Clientes do Notion, e há um
workflow que sincroniza Notion → BigQuery. **Nada precisa ser inventado.** O que existe está
**quebrado no meio**: esse workflow escreve em `phi_dev`, e o score lê `phi_prod`.

> **O cadastro do Olavo morre no `phi_dev`.** O **CHA** é a prova viva: está cadastrado no Notion e
> não existe para o PHI. O **ADR-39 é, literalmente, o conserto do procedimento de entrada de
> cliente** — não uma limpeza de ambiente.

**E a terceira resposta é a mais grave do projeto inteiro**, porque contradiz a anterior:

| Ele disse (B9) | Ele disse (alarme) |
|---|---|
| *"perceberia pela falta de pontuação **e de alerta**"* | *"quase nunca chega alarme"* |

**As duas juntas significam que o silêncio está sendo lido como saúde.** E sabemos que não é:

| Falha real | Alarme que chegou |
|---|---|
| Fase 3 morta **8 dias**, verde todo dia | nenhum |
| `raw_ad_data` vazia **3 meses** | nenhum |
| Agregador roteando erro de cota **toda rodada**, terminando `success` | nenhum |
| Credencial do BigQuery em 17/09 | ✅ chegou — **a única vez** |

O `PHI - Alerta de Falha` cobre **5 workflows dos ~26**. Nos outros 21, **falhar é silencioso por
construção**.

> ## 🔴 O PHI não tem um problema de funcionalidade. Tem um problema de **evidência**.
> Ele roda — mas não consegue **provar** que rodou. E o dono, na ausência de prova, interpreta
> silêncio como saúde. **É a R11 elevada de nó para sistema.**

## 3.3. Correções do Olavo (2026-09-20) — e a regra de precedência desta base

### 3.3.1. 🔴 O alarme real é menor do que eu escrevi

> **Olavo, verbatim:** *"o único alerta que recebo é quando há algum erro que impediu o wf operador
> único de rodar. Se houver falha na coleta, não haver coleta, enfim, qualquer outra falha só sei se
> abrir o Notion e ver alguma incoerência."*

**Eu havia escrito "5 workflows dos 26 cobertos". Na prática vivida é pior:**

| | |
|---|---|
| **Alarme que chega** | **um**: o `operador unico metricas` não conseguiu rodar |
| **Falha na coleta** | 🔴 silenciosa |
| **Coleta que não aconteceu** | 🔴 silenciosa |
| **Qualquer outra falha** | 🔴 silenciosa |
| **Detector real** | **o olho do Olavo, abrindo o Notion e reparando numa incoerência** |

> **O único detector de qualidade do PHI hoje é uma pessoa achando estranho.** Isso não escala para
> *"todos os clientes que contratarem tráfego pago"* — com 1 cliente dá para reparar; com 12, não.
> **O F3 deixa de ser critério de qualidade e vira condição de escala.**

### 3.3.2. 🔴 A estrutura das plataformas — o que o PHI está ignorando

> **Olavo, verbatim:** *"é ele [o anúncio] que fica 'ruim' ou não, a campanha é reflexo de um ou mais
> anúncios. Um anúncio ruim não significa necessariamente uma campanha ruim, ao passo que, uma
> campanha ruim possui um ou mais anúncios ruins. Hoje não faz tanta diferença porque temos 1
> campanha com 1 anúncio, então campanha ruim = anúncio ruim, estamos esquecendo como funcionam as
> plataformas de anúncios, como elas estruturam e enxergam a campanha, o conjunto de anúncio(s) e
> o(s) anúncio(s), estamos tomando os registros que temos como absolutos."*

**A assimetria que ele aponta:**

```
anúncio ruim   ⇏   campanha ruim      (um anúncio fraco se dilui entre outros)
campanha ruim  ⇒   algo abaixo dela está ruim   (sempre)
```

**Consequência para o desenho:** o PHI hoje pontua o **agregado** e chama isso de diagnóstico. Mas
**o agregado não tem causa — quem tem causa é o nível de baixo.** *"A campanha do Salão está em
WARNING"* não é um diagnóstico: é um sintoma com nome de campanha.

**E a hierarquia tem três níveis, não dois — cada um decide coisas diferentes:**

| Nível | O que se configura ali | O que dá errado ali |
|---|---|---|
| **Campanha** | objetivo, orçamento, estratégia de lance | orçamento estrangulado, objetivo errado, lance mal escolhido |
| **Conjunto / grupo de anúncios** | **público, palavras-chave, posicionamento, otimização** | público errado, termo caro, posicionamento ruim |
| **Anúncio** | criativo, copy, promessa, destino | criativo fraco, promessa incoerente com a página |

> ⚠️ **Um refinamento à afirmação, não uma correção:** uma campanha pode ir mal **com anúncios bons**
> — se o público estiver errado ou o orçamento estrangulado, o criativo está sendo mostrado para a
> pessoa errada. **O culpado pode morar no conjunto.** Isso reforça exatamente o ponto do Olavo: o
> nível do meio é onde metade das causas vive, e é o que o PHI mais ignora hoje.

**O que isso revela sobre o parque:** o `sw metricas conjuntos` **existe, roda e escreve no Notion** —
e foi classificado como *"ativo que não produz nada"* por duas varreduras seguidas, porque ninguém
sabia para que serviria. **Ele estava certo o tempo todo; a régua é que faltava.**

### 3.3.3. ⚖️ A regra de precedência desta nova base

> **Olavo, verbatim:** *"até termos um documento escrito nesta nova base nada é imutável. O que já
> temos como documentação serve para mostrar o raciocínio que nos trouxe até aqui, o porquê cada
> coisa foi criada, para mostrar que o pensamento base, criador, ainda permanece e está se
> formatando. A base permanece, o que queremos com o PHI permanece, o restante pode (e se preciso)
> deve ser alterado ou descartado."*

| O que permanece | O que é revisável |
|---|---|
| **o propósito do PHI** e a base do raciocínio | ADRs, contratos, matrizes, invariantes, nomes de tabela, desenho de workflow |
| **o princípio:** detecta, classifica e orienta — nunca executa | a forma como isso é implementado |

**Como isso se aplica na prática, para não virar licença para apagar história:**

1. **A documentação anterior não é lei; é o registro de por que cada coisa nasceu.** Ela continua
   sendo lida — mas como **explicação**, não como ordem.
2. **Quando este documento divergir de um ADR anterior, este documento vence** — e a divergência é
   **escrita no ADR antigo**, não apagada. (É a R2: o real vence o plano, e o histórico ganha banner.)
3. **Descartar exige dizer o que substitui.** "Isto sai" sem "aquilo entra no lugar" é buraco, não
   simplificação.

---

## 4. O ponto final — 🟡 **PROPOSTA (derivada das 7 respostas), aguarda §1/§2 e confirmação**

**"PHI pronto" = estes 6 critérios.** Escritos em linguagem de negócio, não de sistema — como os 8
da Prospecção.

| # | Critério | De onde veio | Hoje |
|---|---|---|---|
| **F1** | **Todo cliente que contrata tráfego aparece no PHI sem ninguém precisar lembrar** | *"todos os que contratarem"* + *"eu cadastro no Notion"* | 🔴 o cadastro morre no `phi_dev` |
| **F2** | **O número que está no Notion é o número certo** — sem duplicata, sem zero que significa "não achei" | *"o que dói é dado errado"* + virada item 1 | 🔴 o score chega **3×** |
| **F3** | **Silêncio significa saúde** — se o que devia acontecer não aconteceu, chega alarme | *"perceberia pela falta"* × *"quase nunca chega alarme"* | 🔴 21 de 26 sem cobertura |
| **F4** | **O PHI enxerga a campanha como a plataforma a enxerga — campanha, conjunto e anúncio — e aponta em qual nível está a causa** | *"quero o anúncio culpado"* + §3.3.2 | 🔴 pontua só o agregado |
| **F5** | **Rodou 30 dias sem intervenção manual** | virada item 2 | ⬜ nunca medido |
| **F6** | **Alguém da equipe opera sem ter desenhado** | *"alguém da equipe"* + *"só você"* | ⬜ nunca testado |

> **F1 a F3 são os pré-requisitos da virada** que o Olavo definiu (*"confiar no número"* + *"rodar
> sozinho 30 dias"*). **F4 é o que ele pediu para os 15 dias.** F5 e F6 são consequência: só medíveis
> depois dos outros.

### ⚖️ A tensão de calendário, registrada e não resolvida

O Olavo elegeu o **grão de anúncio (F4)** para os 15 dias. As respostas do propósito apontam para
**F1 → F3 → F2** primeiro. **As duas escolhas são dele.** A diferença:

- **F4 primeiro:** entrega visível e nova, sobre uma base que ainda não prova que funciona.
- **F1–F3 primeiro:** ninguém vê nada novo por ~2 semanas, e depois tudo o que vier é confiável.

**Isto precisa ser decidido explicitamente, não por ordem de chegada dos briefs.**

> ### ✅ **DECIDIDO pelo Olavo em 2026-09-20:** *"Vamos prosseguir com o que sugeriu."*
> **Ordem aprovada: F1 → F3 → F2 → F4.**
>
> O **F1** já tem brief pronto (ADR-39) e destrava a regra de entrada de cliente. O **F3** é o que
> torna os 30 dias mensuráveis — e, pela §3.3.1, é condição de escala, não refinamento. O **F4** sai
> dos 15 dias imediatos, **mas cresceu de escopo**: deixou de ser "coletar grão de anúncio" e virou
> "enxergar os três níveis". O brief do grão precisa ser reescrito antes de ir para execução.

## 4.1. 🔴 A régua do F4 já existe — e nenhum sub-chat a leu

O executor do parque escreveu: *"não li o `regras-otimizacao-metodo-subido.md`… se o PHI precisa
apontar o culpado, ele precisa saber o que você considera 'ruim'. Posso fechar essa lacuna quando
quiser."*

**A lacuna não precisa ser fechada — ela já estava fechada, em `docs/strategic-planning/`, desde
antes desta conversa.** O documento tem 9,8 KB e responde as duas perguntas do F4:

| Seção | O que dá |
|---|---|
| **§2 — Métrica-mãe (Bússola) por objetivo** | a tabela `objetivo de campanha → métrica-mãe` |
| **§6 — Cadeia de diagnóstico do funil ("ONDE o cano vaza")** | **10 elos, cada um com sintoma → alavanca**: CPM, Hook Rate, CTR, CPC, Connect Rate, "Curioso", jornada, CPA, ROAS, LTV |
| **§5 — A Ordem Sagrada das Alterações** | o que mexer, e em que ordem |

> **O §6 é literalmente o F4 escrito em linguagem de negócio.** *"CTR baixo → o algoritmo encarece o
> leilão; novos hooks/headlines"* é apontar o culpado e a ação, no nível do criativo. **O PHI não
> precisa de um modelo novo de diagnóstico: precisa executar o que a casa já escreveu.**
>
> E o documento chega a nomear o caso: *"o 'Curioso' (CPC baixo, muitos cliques, conversão zero) é
> **exatamente o padrão da Salão/CLI-4**"*. **O diagnóstico do cliente de referência já está escrito
> — e o PHI nunca o produziu.**

**Isto é a R7 em estado puro:** três varreduras do parque, duas entrevistas e um contrato, e a régua
estava numa pasta vizinha o tempo todo. **Quem lê o parque procura workflow; ninguém procurou o
método.**

## 4.2. 🔴 A Métrica-Mãe é da CAMPANHA — e a casa já tinha escrito isso

> **Olavo:** *"A métrica é da campanha, não do cliente."*

**Confirmado por documento, não por opinião.** O `regras-otimizacao-metodo-subido.md` §2 titula a
tabela **"Métrica-mãe (Bússola) por objetivo"**, e a coluna da esquerda é **objetivo de campanha**.
O objetivo é escolhido **na campanha** — é *"a ordem que se dá ao algoritmo"*.

| Onde a métrica-mãe **deveria** morar | Onde ela **mora** |
|---|---|
| na campanha (deriva do objetivo dela) | em **`client_config.primary_metric_type`** — por **cliente** |

**É a mesma doença de grão que o Olavo apontou nos anúncios**, um nível acima: *dado guardado num
grão mais grosso do que o grão onde a decisão mora.*

> ⚠️ **Hoje isso não dói porque há 1 cliente com 1 campanha.** Dói no dia em que um cliente tiver
> uma campanha de **Vendas** (ROAS) e outra de **Leads** (CPA) — e o PHI julgar as duas pela mesma
> régua. **Com *"todos os clientes que contratarem tráfego pago"*, esse dia é logo.**

**Status:** o executor do ADR-39 propôs uma **opção D** em cima disso. **O chat-mãe ainda não a leu**
— e não decide sobre o que não leu (**R6**). O que está decidido é só o fato acima.

## 4.3. O doc mestre não é legível — e isso é defeito, não tamanho

O `ESTADO-DO-PROJETO.md` tem **190.779 caracteres**. O `CLAUDE.md` da raiz manda lê-lo **primeiro**.
O executor, honestamente: *"não li — são 190 mil caracteres e eu não abri."*

**Ele está certo em não ter aberto.** Um documento que ninguém consegue ler não cumpre o papel de
porta de entrada — e é a mesma família de defeito do cabeçalho do ADR-38: *o conteúdo existe, mas
não chega a quem precisa*. **Enquanto ele não for fatiado, todo sub-chat começa cego e deduz o que
poderia ter lido.**

## 5. A engenharia reversa — a pergunta única

> Formato do precedente: uma lista curta de critérios em linguagem de negócio, não de sistema.
> *"Prospecção pronta"* virou **8 critérios**. *"PHI pronto"* provavelmente vira 5 a 8.

⬜ *aguarda §1, §2 e a entrevista do §6*

## 5. A engenharia reversa — a pergunta única

Escrito o §4, **cada um dos ~26 workflows ativos responde a uma pergunta só**:

> ### *"Qual dos 6 critérios (F1–F6) você serve?"*

| Resposta | Destino |
|---|---|
| **Serve** | fica, e **ganha descrição dizendo qual pedaço** (R5) |
| **Servia, e outro assumiu** | aposentadoria pela **R5** (5 passos) |
| **Nunca serviu** | apagar — é o caso dos templates importados (D8) |
| **Deveria servir e não serve** | é **defeito**, e vira brief |

⚠️ **Esta é a etapa que o parque não pôde fazer em 20/09.** O as-built classificou por camada
técnica — ingestão, cálculo, entrega, vigilância, consumo. **Camada técnica não decide existência;
só a entrega final decide.**

## 6. As perguntas que faltam — a dívida declarada da entrevista de 20/09

A entrevista do parque respondeu **11 decisões** e deixou **8 perguntas sem resposta**. Lidas juntas,
elas não são detalhes soltos: **são exatamente as perguntas do propósito.**

| # | Pergunta | Por que ela define o ponto final |
|---|---|---|
| **B5** | O PHI é **ferramenta interna** ou **o produto que se vende**? | muda tudo: interface, confiabilidade exigida, quem paga |
| **B4** | Quantos clientes **hoje**, e quantos em **30/11**? | 1 cliente e 20 clientes são arquiteturas diferentes |
| **B7** | Quando um alarme chega, **o que você faz**? Qual você já **ignorou**? | alarme ignorado é alarme que não deveria existir |
| **B8** | **Quantos alarmes por dia** é demais? | define o orçamento de atenção, que é o recurso mais escasso |
| **B9** | Se o PHI ficasse **3 dias sem rodar**, você perceberia? Por qual sinal? | a resposta honesta mede o valor real percebido |
| **B12** | Os workflows merecem **prefixo de nome**? | hoje não dá para olhar a lista e saber o que é PHI |
| **B19** | Há **orçamento de API**? | o grão de anúncio multiplica chamadas |
| **B22** | O que você **já tentou consertar e desistiu**? | costuma ser onde o ponto final está mal desenhado |

> **A B5 é a raiz.** Todas as outras mudam de resposta conforme ela.

## 7. Controle de mudança (herdado do precedente §12.3)

Fechado o §4: **nada entra ou sai sem justificativa e pelo menos uma alternativa. Se algo entra,
algo sai.** Foi o que impediu a Prospecção de crescer sem fim.
