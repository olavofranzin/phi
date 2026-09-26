# Checagem de rota — estamos complicando?

| | |
|---|---|
| **Data** | 2026-09-26 |
| **Origem** | provocação do Olavo: *"não estamos desviando do simples para criar algo complexo simplesmente para 'parecer' melhor? Por que estamos encontrando dificuldade? Os documentos que usamos de base não cobrem todo o processo? Precisamos aprofundar mais nas pesquisas ou o que pretendemos criar não tem parâmetro no mercado?"* |
| **O que é** | resposta do chat-mãe. **Não é decisão, não é ADR.** É leitura de rota, para ser discordada |
| **Confiança** | alta nos fatos citados (todos conferíveis) · a leitura é minha |

---

## 1. A resposta curta

**A complexidade do MÉTODO se paga. A complexidade do ESCOPO ainda não se pagou.**

E a dificuldade não é do assunto. **É de estarmos construindo o segundo andar enquanto o primeiro tem buraco** — e cada camada nova herda o buraco.

---

## 2. A parte da complexidade que eu defendo

As regras que parecem burocracia **são cicatriz, não enfeite**. Cada uma tem um prejuízo com data:

| Regra | O que ela impede de repetir |
|---|---|
| **S3** — peso só para pilar com fonte | o ADR-21: **25 dos 100 pontos** em fontes que não existiam. **3½ meses parado** |
| **S1 / M4** — não medido nunca é zero | cliente com nota baixa por falta de dado, não por falta de saúde |
| **S7** — fora da faixa por suspeita não é nota baixa | *"não sei medir"* virando *"está ruim"* |
| **Cobertura declarada** | nota que se move sozinha e ninguém sabe explicar |

**Custam um parágrafo cada e evitam meses.** Nenhuma delas é para parecer melhor: as quatro nasceram de erro já cometido nesta casa.

**E o custo até aqui foi texto.** Nenhum workflow criado, nenhuma tabela escrita, nenhuma configuração tocada. Se a rota mudar hoje, o que se perde são documentos — que continuam servindo de registro do raciocínio.

---

## 3. A parte que eu não defendo

🔴 **O inventário virou a forma do produto antes de alguém provar que o produto é esse.**

92 indicadores · 8 pilares · 10 dimensões · 4 parâmetros por indicador · média geométrica entre pilares — **para 2 clientes, um deles com uma campanha.** A própria `Metodologia` que usamos de base pede **30 a 50 empresas auditadas por dois auditores** para validar um índice assim.

**Mapear os 92 foi certo.** Inventário é barato e revela o que existe. **Tratar os 92 como o desenho do produto foi o desvio** — e ele acontece sem ninguém decidir: você lista tudo, e a lista vira plano.

**E parte disso foi minha, ontem:** propus duas linhas no gráfico do cliente, histórico recalculável e dono por pilar — **para um produto que ninguém de fora vai ver por meses.** Eu estava resolvendo o problema do mês 6 no dia 1. A sua **O4** tirou a necessidade de metade disso em uma frase.

---

## 4. Por que está difícil — a resposta honesta

**Não é o tema. É o piso.**

| O que estava acontecendo enquanto desenhávamos o índice | Há quanto tempo |
|---|---|
| duas tabelas pararam de receber e ninguém viu | **19 dias**, verde todo dia |
| 318 linhas de teste dentro de `phi_prod`, sem dono | desde antes de qualquer um olhar |
| o único alarme que funciona é **um** | sua frase, 20/09: *"qualquer outra falha só sei se abrir o Notion e ver alguma incoerência"* |
| o **F3**, que conserta exatamente isso, aprovado e não construído | desde **21/09** |

🔴 **O diagnóstico que nós dois escrevemos em setembro continua valendo e continua não atendido:** *"O PHI não tem um problema de funcionalidade. Tem um problema de evidência."*

**Um índice não é evidência. Um vigia que diz "tudo rodou ontem" é.**

A dificuldade que você está sentindo tem nome: **toda camada nova precisa confiar na de baixo, e a de baixo ainda não merece confiança.** Não é excesso de ambição — é ordem.

---

## 5. Os documentos de base cobrem o processo?

**Três respostas diferentes, e é importante não misturá-las.**

| Assunto | Cobertura | Onde |
|---|---|---|
| **Mídia paga** | ✅ **cobre com sobra** | os 3 do substrato + as regras do Método Subido (§6 liga sintoma → alavanca em 10 elos) |
| **Como se constrói um índice** | ✅ **cobre** | a `Metodologia Estatística` que você trouxe — é documento sério e nós o seguimos |
| **A operação depois da venda** | 🟡 **cobre, e nós não lemos** | o **`Board Agência`**. Em 15/09 ele já previa a passagem de bastão que o plano da Prospecção tinha deixado sem dono |
| 🔴 **O objeto em si** | ❌ **não existe parâmetro** | — |

**A última linha é a resposta à sua pergunta, e é a mais importante.**

Conferi: dos **16 benchmarks** do nosso substrato, **todos são de mídia paga**. Sobre tempo de resposta, o nosso próprio documento canônico diz que *"velocidade de resposta define o ROI"* para negócio local — **e não traz número nenhum.** Sobre GBP: nenhuma menção nos três.

> **Não há régua de mercado para "saúde digital de um negócio local".** Não é que não procuramos bem — é que a coisa não está publicada.

---

## 6. Então precisamos pesquisar mais?

🔴 **Não. Mais estudo não produz o número que falta, porque ele não existe para ser encontrado.**

**Quem produz esse número é caso.** Auditar 10 negócios e ver onde eles caem produz uma régua que nenhuma pesquisa entrega. É por isso que o **Raio-X** e o **cliente-zero** deixaram de ser ideias boas e passaram a ser **o caminho crítico**: não são produto, são **o instrumento de calibração**.

**Inverte a ordem do trabalho:** não é pesquisar até saber e depois medir. É medir alguns casos até a régua aparecer.

---

## 7. O caminho simples, se a simplicidade mandasse sozinha

Três coisas, nesta ordem, atendendo às **três razões que você escolheu** em 20/09 — *acumular aprendizado · provar valor ao cliente · agir antes do estrago*:

| # | O quê | Qual razão atende | Custo |
|---|---|---|---|
| **1** | **F3 — fazer o silêncio significar saúde** | *agir antes do estrago* | já aprovado, já planejado, **só falta construir** |
| **2** | **Raio-X manual da agência** (cliente-zero) | *acumular aprendizado* + a régua que o mercado não tem | nenhum workflow — é trabalho humano |
| **3** | **Nota dos 2 pilares que já têm dado**, no seu painel | *provar valor* — primeiro para você | SQL sobre tabela que já existe |

**Nada aqui exige coleta nova, credencial nova ou integração nova.** Os 21 dos 24 indicadores da v0.1 já vêm de três fontes em produção.

**O resto — os outros 6 pilares, os 4 parâmetros por indicador, a média geométrica — espera um caso que o justifique.** Não é descartado: fica no dicionário, que é onde inventário deve morar.

---

## 8. O que esta checagem NÃO está dizendo

- ❌ **Não** está dizendo para jogar fora os ADRs. O ADR-41 custou um dia de texto e impede repetir 3½ meses do ADR-21.
- ❌ **Não** está dizendo que o índice é errado. Está dizendo que **ele é a terceira coisa, não a primeira.**
- ❌ **Não** está dizendo que a casa é desorganizada. **Nada foi construído errado nesta frente** — a disciplina funcionou: cinco execuções, todas leitura, o erro achado no mesmo dia.
- ✅ **Está dizendo** que a sensação de dificuldade é informação, não impaciência — e que ela aponta para o piso, não para o teto.

> **A pergunta de controle, para qualquer coisa nova daqui em diante:** *se isto ficasse pronto amanhã, quem olharia, e o que essa pessoa faria diferente?* Se a resposta demorar mais que uma frase, é a terceira coisa, não a primeira.
