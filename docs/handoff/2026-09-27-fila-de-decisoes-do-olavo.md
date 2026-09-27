# Fila de decisões do Olavo — ordenada por importância (2026-09-27)

| | |
|---|---|
| **O que é** | as decisões que **só o Olavo** pode tomar, em ordem de quanto custa **não** tomá-las |
| **Por que existe** | o painel diz *"o que falta"* e *"o que trava"*. **Não dizia de quem é a bola.** Decisão sem dono e sem lugar volta como surpresa |
| **Como usar** | responder de cima para baixo. As duas primeiras mudam o que acontece nesta semana; as outras não |
| **Regra** | quando ele responder, a resposta vai para o **documento canônico do assunto** (ADR ou plano) na mesma sessão — **R2**. Este arquivo é fila, não é memória |
| **Atualizado** | 2026-09-27 — **8 das 11 respondidas no mesmo dia** |

---

## 🟢 PLACAR — respondido por Olavo em 27/09

| # | Pergunta | Resposta | Onde ficou registrada |
|---|---|---|---|
| **D-1** | qualquer métrica ou só CPA? | **só CPA na v1** (*"Não"* a *"tem cliente de outra métrica nos próximos 30 dias?"*) | `PLANO-ENTREGA-FINAL-PHI` §4 · cabeçalho do **ADR-40** · painel |
| **D-2** | qual o próximo da fila? | **A > B > C** — D1-d → 3 fontes → F4 | painel (§0, tabela da fila) · **ADR-38 §28.4** |
| **D-3** | quem lê o índice na v0.1? | **o Olavo e um agente** que lê tudo do cliente e trabalha pelos objetivos de negócio dele | **ADR-42 §8.1** · F6 do plano |
| **D-4** | gatilho para o cliente ver a nota? | **90 dias rodando + auditoria de aderência**, e só então a data | **ADR-42 §8.2** |
| **D-5** | dono de cada pilar? | 🟡 **pediu a lista para nomear** — apresentada em 27/09 | ⬜ **resposta pendente** |
| **D-6** | frequência e conteúdo do relatório? | **mínimo semanal, toda segunda**; peso por **nível** (bronze/prata/ouro por valor) | **ADR-42 §8.3** · F8 do plano |
| **D-7** | aprovo o ADR-42? | ✅ **sim** | ADR-42 → **ACEITO 27/09** |
| **D-8** | §1 e §2 do plano | 🟡 **pediu para rever o conteúdo antes de redigir** | ⬜ **pendente** |
| **D-9** | campo `Tipo` na DB Clientes? | ✅ **sim**, com a objeção *"pode virar item que esqueceremos"* — respondida pelo desenho: **o V3 lê o campo todo dia** | **PLANO-F3** (emenda do V3) |
| **D-10** | limpeza da Prospecção? | ✅ **sim** | **ADR-35 §3.5** · painel |
| **D-11** | T28 parado por decisão ou esquecimento? | **"possivelmente esquecimento"** ⇒ proponho **declarar parado com gatilho de volta no F2** | painel (linha do T28) — 🟡 **aguarda OK** |

### ⚖️ Duas coisas que eu registrei ERRADO e ele corrigiu no mesmo dia

| O que eu escrevi | O que ele decidiu | Onde corrigi |
|---|---|---|
| *"a v1 do PHI atende cliente de CPA"* — fronteira de produto | **"não entra cliente de outra métrica nos próximos 30 dias"** — fato de calendário, dito **para destravar a execução de hoje**. O motor multi-métrica **continua obrigatório**, com gatilho no **primeiro cliente não-CPA** | `PLANO-ENTREGA-FINAL-PHI` §4 · **ADR-40** · painel |
| *"o nível não existe como dado"*, como se ele tivesse dito que existia | ele **propôs criar** — e **só no Notion**, nunca no `client_config` | **ADR-42 §8.3** |

> 🔴 **A primeira é a mais séria: eu transformei a resposta de uma pergunta de 30 dias numa fronteira
> de produto.** A pergunta era *"entra cliente de outra métrica nos próximos 30 dias?"*; a resposta
> foi sobre 30 dias. **É a R6 pelo lado que não tem defesa escrita: não herdei número de documento,
> herdei conclusão da minha própria pergunta.**

### 🔴 O §1 do plano estava errado desde 21/09 — e o erro barateou um critério

Por seis dias o `PLANO-ENTREGA-FINAL-PHI` §1 afirmou que *"o cliente recebe hoje um relatório
periódico montado à mão pelo Olavo"*. **Ele não recebe: o relatório não é feito.** Eu usei essa frase
como argumento de que o **F8 era barato** (*"só devolver horas"*). **O F8 é construção nova.**

| | |
|---|---|
| **O que a resposta de 27/09 deu** | semanal · **toda segunda** · **WhatsApp** para alguns · **reunião remota de 30 min** para **cliente elegível** |
| 🟢 **O ganho escondido** | *"elegível"* é a **primeira utilidade real do nível** bronze/prata/ouro. **O campo nasce decidindo uma coisa, não esperando uso** |

### 🔴 As quatro perguntas que as respostas de 27/09 CRIARAM

**Isto não é burocracia: cada uma é um requisito que apareceu junto com a decisão.**

| # | Pergunta nova | De onde veio |
|---|---|---|
| **N-1** | 🔴 **como o sistema marca *"cliente fora do índice por decisão"***, para o **V3** não acusar o CHA todo dia? | da decisão **D-1**. Sem isso, a decisão certa estraga o único detector da casa |
| **N-2** | **bronze/prata/ouro precisa ser campo** — onde? (Notion Clientes? `client_config`?) | da decisão **D-6**. Hoje o nível não existe como dado, e regra sem fonte é o erro que o D7 proíbe |
| **N-3** | **o agente lê o índice pronto, ou lê os indicadores e forma a própria opinião?** | da decisão **D-3**. É arquitetura, não dado |
| **N-4** | **qual o critério da auditoria dos 90 dias**, escrito antes de ela chegar? | da decisão **D-4**. Critério escrito no dia vira opinião |

> ⚠️ **A N-1 e a N-2 apontam para o mesmo lugar: a DB Clientes do Notion.** Junto com a **D-9** (campo
> `Tipo`: Real/Teste/Interno), são **três campos** que o cadastro de cliente não tem — e os três
> nasceram de decisões diferentes, em dias diferentes. **Vale resolver os três de uma vez.**

---

## Bloco 1 — mudam o que acontece nos próximos dias

### 🔴 D-1. O PHI v1 atende cliente de **qualquer** Métrica-Mãe, ou só de **CPA**?

**A pergunta que decide:** *algum cliente que você vai cadastrar nos próximos 30 dias tem métrica
diferente de CPA?*

| | |
|---|---|
| **O fato** | o `Pipeline_v2` reprova `primary_metric_type != 'CPA'` como `INSUFFICIENT_DATA`. **CPL, ROAS, CPM entram e saem sem nota** |
| **Onde já está escrito** | cabeçalho do **ADR-40** (22/09): *"precisa de ADR próprio"*. **Cinco dias depois o ADR não existe** |
| **Custo de não decidir** | o **F1** pode "fechar" sem entregar: *"aparece no PHI"* ≠ *"é monitorado pelo PHI"*. Foi o caso do **CHA**, que é CPL |
| **Recomendação do planejador** | **se a resposta for "não": declarar por escrito que a v1 é só CPA** (é de graça) e abrir o ADR do motor multi-métrica **sem prazo apertado**. **Se for "sim": o motor vira prioridade 1**, à frente do F4 |

### 🔴 D-2. Fechado o ADR-39 amanhã, **qual é o próximo da fila?**

| Opção | O que é | Argumento |
|---|---|---|
| **A — D1-d** | uma credencial ruim **derruba a coleta de todos os clientes** (o laço do writer não avança) | desenho **já aprovado** no ADR-38 §28.4, só não foi executado. É o defeito que mais se repete |
| **B — as 3 fontes paradas** | GA4 **20 dias**, GA4 D-30 **57 dias**, GBP **97 dias** | **sem elas o índice não tem dado.** É o que trava o **F5** |
| **C — F4, grão de anúncio** | *"quero o anúncio culpado"* — o que você pediu para os 15 dias | entrega visível. **Sobre base que ainda cai** |
| **D — construir o índice** | os pilares de API primeiro (decisão O2) | é a frente nova, e ela está esperando |

> **Recomendação do planejador: A → B → C.** Os dois primeiros são *"o sistema não coleta"*.
> **Construir índice sobre coleta que cai é construir sobre areia** — e é literalmente o erro do
> `raw_ad_data`, três meses de escrita para tabela vazia.

---

## Bloco 2 — travam o índice, não travam esta semana

### D-3. Na **v0.1**, quem lê a nota — e para decidir o quê?
Você corrigiu, com razão, que *"zero leitor vivo"* era falso: o consumo é interno primeiro. **Falta o
nome e a decisão.** Sem isso o **M11** (*todo dado escrito tem consumidor declarado*) não é aplicável
ao índice — e foi por não ter isso que o `raw_ad_data` passou 3 meses vazio sem ninguém notar.

### D-4. Qual **evento** faz o cliente passar a ver a nota? (o gatilho do **O4**)
Hoje está escrito *"até segunda ordem"*. **"Segunda ordem" não é gatilho** — é ausência de gatilho.
Pode ser: *N semanas sem alerta falso* · *os 3 pilares de API no ar* · *a agência como cliente-zero
rodando 30 dias*. **Qualquer um serve; nenhum é o padrão.**

### D-5. Quem é o **dono de cada pilar** — a agência ou o cliente?
Precisa entrar no `DICIONARIO-DE-INDICADORES`. É o que decide **de quem é a culpa** quando um pilar
está baixo — e, por consequência, **o que é upsell e o que é nossa falha**.

### D-6. Com que **frequência** o cliente recebe o relatório, e **o que vai dentro**?
É o molde do **F8**. Já sabemos duas coisas suas: o relatório **já é feito à mão** por você, e a
reunião **é falada**. Então o F8 não é criar valor novo: é **devolver as suas horas** e **municiar a
conversa**.

### D-7. Aprovo o **ADR-42** (normalização de indicador de alvo)?
Está em rascunho desde 25/09. É adendo do ADR-41, não superseção.

### D-8. Os **§1 e §2** do `PLANO-ENTREGA-FINAL-PHI` — nas suas palavras.
O §1 tem resposta parcial vinda de escolha de opção; **escolher chip não é redigir.** O §2 está em
branco.

---

## Bloco 3 — sim ou não, custam um minuto

### D-9. Crio o campo **`Tipo`** (Real / Teste / Interno) na DB Clientes do Notion?
Sem ele, cliente de teste e cliente que paga são indistinguíveis para todo workflow — e foi por isso
que o `CLI-13` apareceu como defeito no vigia sendo cadastro de teste.

### D-10. Gasto **uma rodada de limpeza** na Prospecção?
Arquivar os **5 workflows mortos** do ADR-35 §3.5 (medidos hoje: os 5 continuam de pé) e renomear
`Comercial - Guarda-Schema + Backup` → `PROSP-07`. **É o único item de acabamento que resta na
frente.**

### D-11. O **T28 continua parado** — por decisão ou por esquecimento?
Medido em 27/09: os dois workflows **inativos**, sem alteração desde **24/07** e **01/08**. Se é por
decisão (consome o score, que está em obra), **escrever isso** vale mais que o silêncio: evita a
próxima auditoria levantar o mesmo alarme.

---

## O que NÃO está nesta fila, de propósito

| Assunto | Por que não é decisão sua |
|---|---|
| o **4.4** e o **4.5** de amanhã | já pré-autorizados por você, com condição escrita |
| as **07h** | **decidido** em 26/09 e registrado no ADR-37 em 27/09 |
| **nota por pilar + composta · lotes · cliente-zero · Clarity fora do índice** | **decididos** em 26/09 |
| a ordem **F1→F3→F2** antes do F4 | **decidida** em 20/09 |
| o desenho do **D1-d** | aprovado no desenho; o que falta é **quando**, e isso é o D-2 |
