# Parecer do planejador sobre o report da reformulação da Saúde Digital

| | |
|---|---|
| **Data** | 2026-09-25 |
| **Pedido** | report do sub-chat da reformulação (branch `claude/exciting-bardeen-ozheq6`), 7 perguntas, *"o pedido não é validar o caminho, é procurar o que está escondido nele"* |
| **O que li antes de opinar** | `ADR-41` (276 linhas, aceito) · `ADR-42` (rascunho) · `2026-09-25-fase0-indice-saude-digital-relatorio.md` · `PLANO-F3-vigia-de-consistencia.md` · o report |
| **O que NÃO li** | o `DICIONARIO-DE-INDICADORES-v0.md` (549 linhas) e o `CONTRATO-DE-FONTES-v0.md` inteiros. **Minha leitura dos pilares vem do nome deles, não dos 92 indicadores** |
| **Confiança** | alta no §1 e no §2 · **média no §3**, que é a parte que ninguém verificou ainda · a decisão é do Olavo em todos os pontos |

---

## 0. Veredito em uma frase

**O trabalho está certo e a moldura é que precisa de uma pergunta a mais: o report pergunta se o produto é índice ou alerta, e a pergunta que falta é de QUEM é cada nota — do negócio do cliente, ou do trabalho da agência.**

---

## 1. Sobre o report

**É o melhor report que esta casa produziu, e o motivo é um só: ele se corrigiu no mesmo dia.**

Contar `COUNT(x IS NOT NULL)` e chamar de *"tem dado"* é o **M4** (*zero nunca é ausência*) aplicado à leitura e esquecido na verificação. Ele achou o próprio erro, disse que metade dos oito achados vinha dele, e **transformou em regra de aceite**. Isso vale mais que os oito achados.

Três coisas a registrar, sem elogio vazio:

1. **Nada foi construído.** Cinco execuções, todas `SELECT`, em workflow sem versão publicada, com a R13 conferida antes. É o padrão que a casa vinha tentando e não conseguia.
2. **A causa raiz do ADR-21 é a descoberta do dia**, e não está entre os oito. *"25 dos 100 pontos foram atribuídos a pilares sem fonte alguma; um índice assim não tem primeiro passo possível."* Três meses e meio de parado deixaram de ser mistério.
3. **O D7/S3 (peso só para pilar com fonte) é a regra mais importante do ADR-41** — vale mais que os pesos que ele escolheu.

**Uma correção técnica ao ADR-41:** o §"Como verificar" manda conferir que Clarity e GA4 *"têm dado"* pelo `CONTRATO-PHI.md` §4.1. A Fase 0 provou que **as duas estão mortas desde 06/09**. O ADR foi aceito sobre uma premissa que a própria Fase 0 derrubou horas depois. **Não invalida a decisão** (o D7 vale mais ainda agora), **mas o ADR-41 precisa de adendo** dizendo que o pilar Experiência entrou na conta por as-built e saiu por medição.

---

## 2. As sete perguntas

### 1. Índice composto ou sistema de alerta e diagnóstico?

🔴 **Nenhum dos dois como pergunta. A pergunta está mal posta, e é por isso que ele não conseguiu puxá-la até o fim.**

Quase tudo que o ADR-41 decidiu **serve aos dois igualmente**: a normalização por distância à meta, a cobertura declarada, a evidência obrigatória, o S1 ao S7. **A única coisa exclusiva da nota composta é a média geométrica entre pilares.** Uma linha de SQL.

**Minha recomendação: publique nota POR PILAR e segure a nota composta.**

| | Nota por pilar | Nota composta |
|---|---|---|
| Cobertura | irrelevante — cada pilar é medido ou não é | 2 de 8, e precisa explicar |
| Estabilidade no tempo | ✅ estável | 🔴 **muda quando um pilar entra**, por razão que não é do cliente |
| Diz o que fazer | ✅ aponta para o problema | ❌ aponta para uma média |
| Custo de adiar | **zero** | — |

**Isto não descarta o índice: adia a última linha de soma.** Se em três meses a cobertura justificar, a composta nasce sem nada precisar ser refeito.

> ⚠️ **E uma observação sobre método, que vale além desta decisão:** ele escreveu *"cheguei perto dessa conclusão e não a puxei até o fim, porque o índice já estava decidido em dois ADRs"*. **A R6 existe exatamente para isso:** plano aceito não dispensa verificação, e hipótese desmentida se registra. **ADR não é motivo para parar de pensar — é motivo para escrever o adendo.**

### 2. Um índice que declara 2 de 8 ajuda ou atrapalha comercialmente?

🔴 **Atrapalha — e não é pela cobertura. É pelo D3.**

A cobertura declarada é honesta e defensável. O problema é a **redistribuição de peso**: quando o GBP destravar e Visibilidade entrar, **a nota de todo mundo se move sem ninguém ter feito nada.** O cliente vê 72 virar 61 e conclui que piorou.

O ADR-41 já viu metade disso (*"a série histórica precisa gravar quais pilares entraram na conta"*). Mas gravar resolve a auditoria, **não resolve a conversa com o cliente.**

**Nota por pilar não tem esse problema em nenhum grau.** A resposta 1 e a 2 são a mesma resposta.

### 3. O que está escondido no pilar mais valioso ser o que não tem dado?

**O padrão que ele achou é real e está provado duas vezes** — Orgânico e Social em junho, Atendimento agora. **Mas a leitura dele está pela metade, e a metade que falta inverte a conclusão.**

Ele diz: *"a casa atribui peso ao que quer vender, não ao que consegue medir."*

**Eu diria:** o que vale mais é justamente **o que não vem de graça numa API.** Mídia paga é medida porque o Google entrega pronto. Tempo de resposta no WhatsApp, reputação, orgânico — ninguém entrega. **A correlação não é com o que se quer vender: é com o que é caro de medir.** E é caro de medir **porque é difícil** — que é a definição de diferenciação.

> 🔴 **Então o pilar sem dado não é um viés a corrigir. É o mapa de onde está o valor que ninguém captura.**
>
> **E há um risco no S3 que precisa ser dito:** *"peso só para pilar com fonte"* é a regra certa **para o índice**, e seria a regra errada **para o roadmap**. Se virar critério de priorização, a casa passa a só construir onde já é fácil — e nunca chega no que vale.

### 4. Depender do CRM do cliente é alavanca ou risco?

**É risco, e o mecanismo de defesa já existe:** o **A5** (taxa de preenchimento) mais o **S1** já garantem que cliente que não preenche vira *"não medido"*, nunca nota baixa. A frase *"transforma disciplina do cliente em nota do cliente"* **já está resolvida** pelo próprio ADR-42.

**O risco que ele não nomeou é outro:** põe o produto da agência em cima de um ativo que a agência **não controla e pode perder da noite para o dia** — e obriga a agência a enxergar dado de venda do cliente, que é sensível.

**E há uma alternativa que não foi considerada:** o tempo até a primeira resposta **não precisa vir do CRM do cliente.** Ele pode ser medido **no ponto de entrada do lead**, que é da agência — o formulário e o número de WhatsApp que a campanha alimenta. *(O parque tem peça de Evolution/WhatsApp ativa desde 26/05.)*

> ⚠️ **[HIPÓTESE MINHA, não verificada]** — não sei se o WhatsApp dos clientes passa por ali. **Mas se passar, o pilar mais valioso da casa fica mensurável sem depender de ninguém.** Vale uma pergunta antes de fechar a arquitetura em cima do CRM alheio.

### 5. Vale parar o índice e consertar a observabilidade primeiro?

✅ **Sim — e não é decisão nova. É evidência para uma que já foi tomada.**

O **F3 (vigia de consistência) está aprovado desde 21/09 e é o PRIMEIRO da fila desde 24/09.** Ele não está competindo com o índice; ele já ganhou.

**Mas o achado dele conserta o F3, e essa é a contribuição real:**

O **V4** do plano pergunta *"toda tabela que tem writer declarado recebeu linha?"* — **diariamente.** As tabelas que morreram são **semanais**. Do jeito que está escrito, o V4 ou grita todo dia para tabela semanal, ou é desligado — e **deixa de cobrir exatamente o caso que acabou de acontecer.**

🔴 **O V4 precisa de período esperado POR TABELA:** diária para `raw_campaign_data` e `phi_score_history`, semanal para as `t28_*`. **Sem isso o F3 nasce cego para o buraco de 19 dias que ele mesmo achou.**

> **A inclinação dele está certa e ele não está dando peso demais a um achado de acaso:** *"um índice que lê tabela morta nasce mentindo"* é a frase mais exata do report.

### 6. A ordem de trabalho está certa?

🔴 **A ordem alternativa é melhor — e o próprio ADR-41 já a nomeou, no §4 item 3, e ninguém decidiu.**

Vender o diagnóstico manual primeiro resolve **três coisas de uma vez**, e nenhuma solução automática resolve alguma delas:

| O que resolve | Por quê |
|---|---|
| **A amostra** | a `Metodologia` pede 30 a 50 empresas auditadas. A casa tem **2 clientes**. Vender diagnóstico é a única via realista para chegar lá |
| **A prova de valor** | descobre se alguém paga por isso **antes** de automatizar |
| **O pilar de atendimento** | a auditoria manual mede tempo de resposta sem API nenhuma |

**E boa parte já existe:** a Prospecção já diagnostica presença digital de lead — GBP, avaliações, site, fotos, horário, 63 colunas. **O Raio-X está meio construído, e para o público errado.**

> **É decisão comercial, é sua, e é a que mais muda o resto.** De todas as pendências desta frente, é a única que altera a ordem de tudo.

### 7. O que não foi perguntado?

**§3 inteiro, abaixo.**

---

## 3. 🔴 O que não foi perguntado

### 3.1. A nota mede o negócio do cliente, ou o trabalho da agência?

**As duas coisas estão debaixo do mesmo nome, e elas se comportam de maneira oposta.**

| | Mede | Quem pode consertar | Para que serve |
|---|---|---|---|
| **"Como vai o seu negócio no digital"** | site, atendimento, reputação, presença | **o cliente** | vender serviço novo · lista de tarefas |
| **"Como vai o trabalho que você me paga"** | campanha, mídia, entrega | **a agência** | justificar o contrato |

🔴 **E a média geométrica, escolhida por bom motivo metodológico, faz a coisa errada aqui:** ela existe para *"impedir que um pilar excelente esconda outro crítico"*. Na prática, **campanha ótima (trabalho da agência) é puxada para baixo por site ruim (do cliente)** — e o cliente lê a nota baixa como falha de quem ele paga.

**O conserto é barato AGORA e caro depois:** cada pilar e cada indicador carrega **um dono — `agência` ou `cliente`** — no dicionário, antes de qualquer construção. O relatório passa a mostrar **dois agregados**: *o que está sob nossa gestão* e *o que depende de você*.

> 🟢 **E isso transforma o ponto fraco em argumento de venda:** a metade baixa do cliente vira a lista do que a agência pode vender para consertar. **É a resposta comercial que faltava para a pergunta 2 — e ela não precisa da nota composta.**

### 3.2. Cada pilar tem alavanca — e de quem ela é?

A lei da casa é **M8: o PHI detecta, nunca executa.** Detectar funciona quando existe alavanca do outro lado. Para mídia paga ela existe e está escrita — `regras-otimizacao-metodo-subido.md` §6 liga **sintoma → alavanca** em 10 elos do funil.

**Para os outros sete pilares não existe alavanca mapeada.** Um índice que aponta *"Experiência ruim"* produz o quê? Recomendação que a agência não executa, num site que não é dela.

🔴 **Detectar em pilar sem alavanca disponível não produz ação: produz frustração** — e, pior, produz a impressão de que o sistema reclama e não resolve.

**Cada pilar deveria declarar, antes de entrar:** qual é a alavanca, de quem ela é, e **se a agência vende esse conserto**. Pilar cuja alavanca ninguém tem é **informação**, não produto — e entra como leitura, não como nota. *(É o A3 do ADR-42 generalizado: o que ele fez com Experiência vale como teste para todos.)*

### 3.3. Qual é o período — e ele bate com o relatório?

O índice é por `(client_id, período)`, e o dado é **janela D-7 / D-30**, não série diária.

**Mas a frequência e o conteúdo do relatório ao cliente ainda são uma decisão sua, pendente desde 21/09** — está no `PLANO-ENTREGA-FINAL-PHI.md` §1, esperando você. **É ela que define o período do índice, não o contrário.** Definir agregação antes de saber o que o cliente recebe é montar a régua antes de saber o que se vai medir.

---

## 4. O que eu recomendo decidir agora

| # | Decisão | Custo se decidir agora | Custo se decidir depois |
|---|---|---|---|
| **1** | **Dono por pilar** (`agência` / `cliente`) no dicionário | uma coluna | reescrever o dicionário e o relatório |
| **2** | **Segurar a nota composta; publicar por pilar** | zero — só não escrever a última soma | explicar ao cliente por que a nota dele mudou sozinha |
| **3** | **V4 do F3 com período por tabela** | uma coluna no plano | o vigia nasce cego para o caso que motivou tudo |
| **4** | 🔴 **O Raio-X vira produto de entrada?** | é comercial, é sua, e muda a ordem de tudo | a amostra de calibração continua sendo 2 |

**As 1, 2 e 3 são minha recomendação e não mudam nada do que está no ar.** A 4 é sua e é a que pesa.

---

## 5. Onde eu posso estar errado

| O que | Por quê |
|---|---|
| **A divisão de dono por pilar** | li os **nomes** dos 8 pilares, não os 92 indicadores. Pode haver pilar misto que não se divide limpo |
| **O WhatsApp como ponto de medição** | 🔴 **hipótese não verificada.** Não sei se o Evolution do parque toca cliente |
| **"A média geométrica pune a agência"** | depende de qual pilar leva a conversão do site. Se conversão de site estiver no pilar de Conversão junto com a da campanha, o efeito é ainda maior — **mas eu não conferi a composição indicador a indicador** |
| **A ordem comercial (pergunta 6)** | é julgamento de negócio e eu não vendo. Estou opinando sobre a sua área |

---

## 6. ⚠️ Um risco operacional que não é do índice

**O conjunto de documentos desta frente está em duas branches que não se enxergam.**

- `claude/exciting-bardeen-ozheq6` — dicionário, contrato de fontes, réguas, ADR-41, ADR-42, Fase 0
- `claude/consolidacao-2026-08` — o brief de reformulação, o brief do substrato, o `CONTRATO-PHI`, os ADRs 37–40

🔴 **O ADR-41 cita como base factual o `2026-09-25-substrato-estatistico-do-phi-brief.md` — que não existe na branch dele.** Conferi: zero ocorrências.

**Antes de qualquer construção, as duas precisam se encontrar.** Dois conjuntos de documentos canônicos que não se leem é como a doc da Prospecção descrevendo workflows que já não existiam — **e essa lição já custou uma frente inteira parada como "bloqueada" sem estar** (R2).
