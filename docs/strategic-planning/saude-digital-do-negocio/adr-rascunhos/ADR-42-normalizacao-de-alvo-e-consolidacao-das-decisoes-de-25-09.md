# ADR-42 — Normalização de indicador de alvo, e consolidação das decisões de 25/09

| | |
|---|---|
| **Status** | 🟢 **ACEITO — Olavo, 2026-09-27** (*"7) Sim"*, resposta à fila de decisões daquele dia). Rascunho de 25/09 a 27/09 |
| **Data** | 2026-09-25 |
| **Decisor** | **Olavo** |
| **Tipo** | Arquitetura |
| **Relação com o ADR-41** | 🔴 **ADENDO, não superseção.** Preenche uma lacuna do **D5** e registra, no lugar onde se procura, seis decisões que hoje moram só no corpo de dois documentos |
| **Base factual** | `CONTRATO-DE-FONTES-v0.md` · `REGUAS-D6-D9-v0.md` · execuções `43038`/`43040`/`43042`/`43060`/`43061` |

> ⚠️ **Numeração:** 42 é livre em git. O campo `Número ADR` do Notion é **auto-incremento e somente leitura** — quem publicar não escolhe, e por isso título e número não batem naquela DB. Defeito de governança já registrado no ADR-41.

---

## 1. Por que este ADR existe

**Duas razões, e a segunda é uma dívida minha.**

**1.1. O D5 do ADR-41 tem uma lacuna.** Ele define normalização para indicador **positivo** e para **negativo**. **Não define para indicador de ALVO** — aquele em que existe faixa boa, e tanto abaixo quanto acima dela é pior.

Isso apareceu quando a régua do Olavo para `SD-EXP-07` (taxa de engajamento) disse: *"acima de 90%: suspeita, verificar eventos ou implementação"*. **Um indicador cujo extremo alto é ruim não é `↑`.** E `SD-EXP-07` é 🔴 **o único indicador de D6 com dado real hoje**.

**1.2. Seis decisões do Olavo, tomadas em 25/09, moram só no corpo de dois documentos.** Quem abrir o ADR-41 amanhã não vê nenhuma delas. **É o defeito que a R2 nomeia:** *"um documento pode estar completo no corpo e mentir no cabeçalho — e o cabeçalho é o que se lê"*.

---

## 2. Decisões

### A1 — 🟢 Uma fórmula só, com quatro parâmetros. O positivo e o negativo viram casos particulares dela

**Não é uma terceira fórmula. É a generalização das duas que já existem.**

Quatro parâmetros: **`L`** piso crítico · **`Ti`** início da faixa boa · **`Ts`** fim da faixa boa · **`U`** teto ruim.

```
                     x < Ti   →   z = 100 × clip( (x − L) / (Ti − L), 0, 1 )
        Ti  ≤  x  ≤  Ts       →   z = 100
                     x > Ts   →   z = 100 × clip( (U − x) / (U − Ts), 0, 1 )
```

**Nota cheia dentro da faixa; decaimento linear para fora dela; zero nos extremos.**

| O que o D5 já tinha | Como sai daqui |
|---|---|
| **positivo** (`↑`) | alvo **sem teto**: `Ts = U = +∞` ⇒ sobra exatamente `z = 100 × clip((x − L)/(T − L), 0, 1)` |
| **negativo** (`↓`) | alvo **sem piso**: `L = Ti = −∞` ⇒ sobra exatamente `z = 100 × clip((U − x)/(U − T), 0, 1)` |

> 🟢 **Por que isto é melhor que acrescentar uma terceira fórmula:** o ADR-41 **encolhe** em vez de crescer. Passa a haver **um** conceito de normalização, com quatro parâmetros, em que dois podem ser infinitos. Menos coisa para explicar, menos coisa para implementar errado, e **as duas fórmulas já aprovadas continuam valendo ao pé da letra** — não são revogadas, são reconhecidas como casos de uma só.
>
> ✅ E o **S4 continua intacto**: são **limites fixos**, definidos uma vez e congelados. Nada aqui é percentil de coorte.

**Exemplo com a régua do Olavo para `SD-EXP-07`:** `L = 0,35` · `Ti = 0,50` · `Ts = 0,75` · `U = 0,90`.
Engajamento de 0,64 (o do CLI-4 orgânico) cai dentro da faixa ⇒ **nota 100**.

### A2 — 🔴 Fora da faixa por SUSPEITA não é nota baixa. É "não confiável" + alerta

**Esta é a parte que eu não tinha visto quando propus a fórmula, e ela importa mais que a fórmula.**

Há **duas razões diferentes** para um valor estar acima da faixa, e tratá-las igual seria um erro grave:

| Razão | Exemplo | Tratamento |
|---|---|---|
| **desempenho** | CLS em 0,30 · investimento acima do teto | 🟢 **decai a nota** pela fórmula do A1 |
| 🔴 **suspeita de medição** | engajamento **> 90%** — *"verificar eventos ou implementação"* | 🔴 **NÃO decai a nota.** O indicador vira **`não confiável`**, entra como **não medido** (S1) e **dispara alerta** (S5) |

> 🔴 **O raciocínio, e ele já é lei nesta casa:** *"acima de 90% é suspeito"* **não quer dizer que a saúde é ruim — quer dizer que o número não é de confiança.** Rebaixar a nota nesse caso seria transformar *"não sei medir"* em *"está ruim"*, que é exatamente o que o **M4** e o **S1** proíbem.
>
> **É a mesma família da taxa de preenchimento do D9 (A5) e da cobertura declarada (D3):** a casa já decidiu três vezes que **ausência ou desconfiança de dado nunca vira nota baixa.** Aqui é a quarta.

**Cada limite carrega o seu tipo:** `tipo_limite_inferior` e `tipo_limite_superior`, cada um `desempenho` ou `suspeita`.

**Novo invariante — `S7`:** 🔴 **Valor fora da faixa por suspeita de medição nunca vira nota baixa: vira "não medido" com alerta.**

### A3 — 🟢 O pilar Experiência entra como ALERTA, não como nota ponderada

**Aprovado pelo Olavo em 25/09.** O critério dele para "página problemática" é **conjuntivo** e termina em *"confirmação visual nas gravações"* — que é humano e não automatizável. **Isso é a forma de um gatilho de investigação, não de um componente 0–100.** É o **S5** aplicado a um pilar inteiro.

**Consequência na cobertura:** o pilar **não conta** como pilar pontuado. A cobertura da v0.1 cai para **2 de 8 pontuados**, com Experiência publicado ao lado como **alerta e evidência**. 🔴 **Isto é declarado, não escondido** (D3 / S2).

### A4 — 🟢 Indicador derivável de outro não pontua duas vezes

**Aprovado:** `SD-EXP-06` (taxa de rejeição) é **literalmente `1 − engagementRate`**. **Coletar e exibir; não pontuar.**

**Generalização:** dois indicadores em que um é função determinística do outro **contam como um só** na média do pilar. O segundo existe como leitura, não como peso. *(É o §4 do dicionário — duplicidades — virando regra.)*

### A5 — 🟢 Todo indicador de origem humana carrega taxa de preenchimento

**Aprovado para D9**, e registro a generalização: **todo indicador cuja fonte depende de alguém preencher** publica junto a **taxa de preenchimento**. Abaixo do mínimo ⇒ **não medido** (S1), **nunca nota baixa**.

> 🔴 **Sem isso o índice pune o cliente organizado que registra perdas e premia o desorganizado que não registra nada.**

### A6 — 🟢 `não coletamos` é decisão registrada

**Aprovado:** `SD-DES-07` (visibilidade local multi-busca), `SD-DES-08` (share of voice), `SD-DES-09` (citações em IA) e `SD-REP-08` (menções externas) **não serão coletados**. Não é lacuna, não é dívida, e **não reaparece em auditoria**.

⚠️ **O que isto obriga:** nenhum dos quatro pode ser prometido comercialmente enquanto esta decisão valer.

### A7 — 🟢 A organização é por DIMENSÃO enquanto a estrutura nominal de pilares estiver aberta

**Aprovado.** O item 6 do §4 do ADR-41 segue aberto e **não bloqueia nada** — com pesos iguais (D2), a diferença entre as candidatas é de agrupamento, não de nota.

### A8 — Faixas de frustração aprovadas, **em reserva**

`T = 1%` · `U = 10%` para taxa de sessões afetadas. ⚠️ **Hoje sem consumidor:** a frustração virou ferramenta (Clarity fora do índice). **Ficam escritas para quando houver indicador que as use.**

---

## 3. 🔴 O que escrever a fórmula descobriu: metade dos `⊙` está classificada errado

**Ao listar quem usaria a fórmula, 6 dos 12 não são alvo.**

| Indicador | Marcado | O que é de verdade |
|---|---|---|
| `SD-EXP-04` profundidade de scroll | ⊙ | ✅ **alvo** de verdade |
| `SD-EXP-07` taxa de engajamento | ↑ | 🔴 **é alvo** — a régua do Olavo criou o teto. **Corrigir no dicionário** |
| `SD-AQU-01` investimento | ⊙ | ✅ alvo |
| `SD-AQU-13` composição de termos | ⊙ | ✅ alvo |
| `SD-CVR-14` LTV:CAC | ⊙ | ✅ alvo |
| `SD-REP-06` distribuição de notas | ⊙ | ✅ alvo |
| `SD-EXP-08` Core Web Vitals | ⊙ | 🔴 **são três indicadores NEGATIVOS** (LCP, INP, CLS). Não há extremo inferior ruim |
| `SD-AQU-07` métrica-mãe | ⊙ | 🔴 **direção variável** conforme `primary_metric_type` (CPA ↓, ROAS ↑). Não é alvo — é direção que se lê do dado |
| `SD-AQU-09` conjuntos · `-10` criativo · `-14` Meta | ⊙ | 🔴 **são COMPOSTOS**, não indicadores. Cada um é um pacote de métricas e precisa ser decomposto |
| `SD-REL-10` motivos de perda | ⊙ | 🔴 **é CATEGÓRICO.** Não produz 0–100 de jeito nenhum — é evidência, não nota |

> 🟢 **Seis usam a fórmula do A1. Os outros seis precisam de correção no dicionário** — e nenhum deles precisava de fórmula nova. **A lacuna era menor do que parecia, e a bagunça de classificação era maior.**

---

## 4. Invariante novo

| # | Invariante |
|---|---|
| **S7** | 🔴 **Valor fora da faixa por suspeita de medição nunca vira nota baixa** — vira "não medido" com alerta. Extensão do **M4 / S1** ao limite de faixa |

*(S1–S6 estão no ADR-41 e não mudam.)*

---

## 5. O que este ADR **NÃO** decide

| # | Em aberto |
|---|---|
| **1** | 🔴 **Se o índice tem autoridade de fato**, como o `phi_value` tem pelo ADR-003. **Sem isso o agente consumidor recalcula, e a casa fica com duas notas para a mesma coisa.** Candidato a `S8` — **não foi decidido** |
| **2** | Os valores de `L`, `Ti`, `Ts`, `U` de cada indicador. 🔴 **Este ADR dá a fórmula, não os números.** Cada número vem com fonte e força de evidência |
| **3** | A decomposição dos três compostos (`SD-AQU-09`, `-10`, `-14`) |
| **4** | Tudo que já estava aberto no §4 do ADR-41 |

---

## 6. Consequências

**Positivas**
- ✅ O ADR-41 **encolhe**: uma fórmula em vez de três.
- ✅ `SD-EXP-07`, o único indicador de D6 com dado, passa a ser normalizável.
- ✅ O **S7** fecha a última porta pela qual *"não sei medir"* virava *"está ruim"*.
- ✅ A limpeza do §3 tira 6 indicadores mal classificados antes de virarem código.

**Negativas / atenção**
- ⚠️ **A cobertura pontuada da v0.1 cai para 2 de 8** com o A3. É mais honesto e **é comercialmente mais difícil**.
- ⚠️ Quatro parâmetros por indicador é **mais cadastro** que dois. O ganho de exatidão é real; o custo de manutenção também.
- 🔴 **O A2 exige que quem define a régua diga o TIPO de cada limite.** Um limite superior sem tipo declarado **não pode ser implementado** — e o padrão não pode ser "desempenho", porque erraria justamente no caso do engajamento.

---

## 7. Como verificar

| O que | Como |
|---|---|
| Que o D5 do ADR-41 não cobre alvo | ler o §2 D5 do ADR-41: só duas fórmulas |
| Que a régua do engajamento tem teto | `REGUAS-D6-D9-v0.md` §3.12 — *">90%: suspeita"* |
| Que as 6 decisões foram tomadas | `CONTRATO-DE-FONTES-v0.md` §5 |
| Que `SD-EXP-07` tem dado real | execução `43061` — engajamento 0,64 a 0,81 |
| 🔴 **O que NÃO foi verificado** | **nenhum valor de `L/Ti/Ts/U` foi calibrado contra base.** São réguas de julgamento, força **C/D**, n=1 |

**Confiança na fórmula e na generalização: 0,9** — é álgebra, e é conferível relendo o D5. **Na reclassificação do §3: 0,8.** **Nos limites numéricos: não são meus — são do Olavo, e estão declarados como tal.**

---

# 8. 🟢 Decisões do Olavo de 2026-09-27 — quem lê o índice, quando o cliente vê, e o que ele recebe

> **Por que entram aqui.** Este ADR existe, entre outras coisas, para **registrar no lugar onde se
> procura** decisões que só moravam no corpo de outros documentos (§1). As três abaixo vinham
> ocupando a fila de decisões desde 25/09 e **não tinham lugar canônico nenhum**.

## 8.1. B1 — O índice v0.1 tem **dois** leitores, e um deles é máquina

> *"Eu e um agente (pode ser um que lê tudo do cliente e trabalhará auxiliando para que os objetivos
> de negócio sejam alcançados)."* — Olavo, 27/09

| | |
|---|---|
| **Fecha** | a pendência *"quem é o leitor vivo do índice na v0.1"*, aberta desde 25/09 |
| **Atende o M11** | *todo dado escrito tem consumidor declarado*. **Agora o índice tem dois, nominais** |

🔴 **A consequência que essa resposta cria, e que não estava escrita em nenhum ADR:** um dos
leitores é **agente**. Isso muda o que a nota tem de ser.

| Se o leitor fosse só humano | Com um agente lendo |
|---|---|
| a nota pode ser um número com um texto ao lado | a nota tem de ser **estruturada** — campo por campo, legível sem interpretar prosa |
| evidência é boa prática | **evidência é obrigatória**: o agente não "sabe" o contexto, ele só tem o que o registro carrega |
| *"índice 62"* basta para conversar | *"índice 62 · cobertura 3 de 8 · pilares não medidos: …"* é o mínimo para um agente **não inventar** |

> ✅ **Isto promove o D9 do ADR-41** (*toda nota carrega evidência: fonte, período, força A/B/C/D,
> problema, impacto, prioridade, responsável, próxima ação*) **de boa prática a requisito de
> interface.** O D9 já estava certo; o que faltava era o motivo — e o motivo é o segundo leitor.
>
> ✅ **RESPONDIDO por Olavo, 27/09:** *"o agente poderia ler os indicadores e formar hipóteses e dar
> sugestões."*
>
> | | |
> |---|---|
> | **O agente lê** | os **indicadores** — não a nota fechada |
> | **O agente produz** | **hipóteses** e **sugestões** |
> | 🔴 **O que ele NÃO produz** | **conclusão** e **ação**. *Hipótese* não é diagnóstico; *sugestão* não é execução |
>
> **Isto é o guardrail da casa aplicado uma camada acima:** *"o PHI detecta, classifica e orienta —
> otimizar é humano"*. O agente do índice fica do mesmo lado da linha: **ele opina sobre o negócio, e
> o play é do Olavo.**
>
> ⚠️ **Consequência de projeto:** se o agente lê **indicador**, e não nota, então **a nota não é
> pré-requisito dele**. Os dois consumos são independentes — **o agente pode existir antes do índice
> fechar**, e o índice não precisa esperar o agente.

## 8.2. B2 — O cliente vê a nota depois de **90 dias rodando + auditoria**. A data vem depois

> *"Após 90 dias rodando faremos uma auditoria para determinar se os números refletem o que deveriam
> refletir, após isso decidiremos uma data."* — Olavo, 27/09

| | |
|---|---|
| **Fecha** | o gatilho do **O4** (26/09), que até hoje dizia *"até segunda ordem"* |
| **Por que é melhor que uma data** | *"até segunda ordem"* **não é gatilho, é a falta de um.** Agora existe condição: **90 dias de operação** e depois **auditoria de aderência** — os números refletem o que deviam refletir? |
| **O relógio começa** | ⬜ **quando o índice v0.1 estiver calculando** — não hoje. **Nada a contar ainda** |
| 🔴 **O que essa decisão exige e ainda não existe** | a **auditoria dos 90 dias** precisa de critério escrito **antes** de chegar, senão vira opinião no dia. Não é urgente; é inevitável |
| ✅ **Quando o critério se escreve** — Olavo, 27/09 | *"após terminarmos a configuração voltaremos e escreveremos os critérios."* **Gatilho, não data:** a configuração do índice terminar. 🔴 **E uma condição que eu acrescento:** escrever **antes** de o 90º dia chegar, nunca no dia — critério escrito depois do resultado deixa de ser critério |

## 8.3. B3 — O relatório é **no mínimo semanal, toda segunda**, com peso por nível de cliente

> *"Dependerá do nível do cliente para nós (quanto maior o valor $$ maior o peso — podemos
> estabelecer algum tipo de peso como bronze, prata e ouro), mas o mínimo será semanal (toda
> segunda)."* — Olavo, 27/09

| | |
|---|---|
| **Fecha** | o molde do **F8** do `PLANO-ENTREGA-FINAL-PHI` (*o cliente recebe alguma coisa*) |
| **O piso** | **toda segunda**, para todo cliente. Quem é mais caro recebe **mais**, nunca menos |
| **Encaixe feliz** | o **Agregador** já roda **semanalmente, nas segundas 09h**. O relatório semanal **não precisa de coleta nova** |
| 🔴 **O que falta para isto ser implementável** | **o nível não existe como dado** — e o Olavo nunca disse que existia. Ele **propôs criar** |
| ⚖️ **Correção de 27/09** | eu escrevi como se ele tivesse afirmado que o campo existe. Ele corrigiu: *"não disse que os campos existem, disse que poderíamos criar (e apenas no Notion) essa categorização."* |
| 🟢 **Onde o nível mora — decidido** | **só no Notion.** 🔴 **Não vai para o `client_config`, não vira coluna em BigQuery** enquanto ninguém no BigQuery precisar dele (**M11**: dado escrito tem consumidor declarado). Quem lê o nível é o **envio do relatório**, não o cálculo do score |
| 🟢 **A primeira utilidade dele, no dia 1** | **decidir quem é elegível à reunião de 30 minutos** — ver `PLANO-ENTREGA-FINAL-PHI.md` §1. **O nível não nasce esperando uso: ele nasce decidindo uma coisa** |

> ⚠️ **Registrado como decisão de destino, não de implementação.** O *quanto mais* cada nível recebe
> (frequência? profundidade? reunião?) **não foi decidido**, e deduzir isso seria inventar produto.

## 8.4. ⬜ O que ficou aberto de propósito nesta rodada

| # | Pendência | Estado |
|---|---|---|
| **1** | **dono de cada dimensão** (agência × cliente) | 🟡 a lista D1–D10 foi apresentada em 27/09 — **resposta pendente** |
| **2** | ~~o agente lê o índice pronto ou os indicadores?~~ | ✅ **RESPONDIDO 27/09** — indicadores → hipóteses e sugestões (§8.1) |
| **3** | critério da auditoria dos 90 dias | ✅ **gatilho definido 27/09** — ao fim da configuração (§8.2). ⬜ o critério em si segue a escrever |
| **4** | o que cada nível recebe **além** do semanal | 🟡 **parcial:** a **reunião de 30 min** é o que o nível decide (§8.3). ⬜ falta o resto da escada |
| **5** | **campo de nível** (bronze/prata/ouro) | 🟢 **decidido 27/09: criar, só no Notion** (§8.3). ⬜ falta criar |
